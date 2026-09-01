/**
 * Model Scorer — Compatibility-First Ranking
 *
 * Scores models based on task/modality/architecture compatibility with
 * the query understanding. Rejects incompatible models BEFORE scoring.
 */

import type { NormalizedModel } from '../../schemas/types';
import type { QueryUnderstanding } from '../queryUnderstanding/queryParser';

export type ModelMatchCategory = 'BEST_COMPATIBLE' | 'STRONG_ALTERNATIVE' | 'EXPERIMENTAL' | 'RELATED_INCOMPATIBLE';

export function getModelMatchCategory(score: number, rejected: boolean): ModelMatchCategory {
    if (rejected) return 'RELATED_INCOMPATIBLE';
    if (score >= 75) return 'BEST_COMPATIBLE';
    if (score >= 50) return 'STRONG_ALTERNATIVE';
    if (score >= 30) return 'EXPERIMENTAL';
    return 'RELATED_INCOMPATIBLE';
}

// ── Hard rejection rules ──────────────────────────────────────────────────────

function shouldRejectModel(model: Partial<NormalizedModel>, qu: QueryUnderstanding): string | null {
    const modelText = `${model.id ?? ''} ${model.name ?? ''} ${model.task ?? ''} ${model.architecture ?? ''}`.toLowerCase();
    const queryDomain = (qu.domain.value ?? '').toLowerCase();
    const queryTask = (qu.task.value ?? '').toLowerCase();
    const queryModality = (qu.modality.value ?? '').toLowerCase();

    // NLP/text project + vision-only model
    const isTextQuery = /\btext\b|\bnlp\b|\bsentiment\b|\bdocument\b/.test(queryTask + ' ' + queryModality);
    const isVisionOnlyModel = /^(?:yolo|detr|efficientdet|faster.?rcnn|convnext|vit[\s\-]|resnet[\s\d]|unet)/.test(modelText);
    if (isTextQuery && isVisionOnlyModel) {
        return 'Vision-only model incompatible with text/NLP task';
    }

    // Vision/imaging project + irrelevant text/speech model
    const isImagingQuery = /ct|mri|x.ray|image|segmentation|detection|visual/.test(queryTask + ' ' + queryModality);
    const isTextModel = /\bwhisper\b|\bllama\b|\bgemma\b|\bmistral\b|\bgpt\b|\bbert\b|\bt5\b/.test(modelText);
    const isTextTask = /text.generat|text.classif|translation|summariz|question.answer/.test(model.task ?? '');
    if (isImagingQuery && isTextModel && isTextTask) {
        return 'Text/language model incompatible with imaging task';
    }

    // Robotics query + text-only model
    const isRoboticsQuery = /robot|manipulation|lerobot|so.101|teleoperat/.test(queryDomain + ' ' + queryTask);
    const isTextOnlyModel = isTextModel && isTextTask;
    if (isRoboticsQuery && isTextOnlyModel) {
        return 'Text-only model incompatible with robotics task';
    }

    // Audio query + vision-only model
    const isAudioQuery = /audio|speech|sound/.test(queryModality + ' ' + queryTask);
    if (isAudioQuery && isVisionOnlyModel) {
        return 'Vision-only model incompatible with audio task';
    }

    return null;
}

// ── Component scores ──────────────────────────────────────────────────────────

function n(s?: string | null): string {
    return (s ?? '').toLowerCase().trim();
}

function scoreModelTask(model: Partial<NormalizedModel>, qu: QueryUnderstanding): number {
    const queryTask = n(qu.task.value);
    if (!queryTask || queryTask === 'unknown') return 50;

    const modelTask = n(model.task);
    const modelText = `${n(model.id)} ${modelTask} ${n(model.architecture)}`;

    // Exact or high overlap match
    if (modelTask === queryTask) return 100;
    if (modelTask.includes(queryTask) || queryTask.includes(modelTask)) return 85;

    // Task family matches
    const taskFamilies: [string[], string[]][] = [
        [['segmentation', 'segment'], ['image-segmentation', 'semantic-segmentation', 'instance-segmentation']],
        [['detection', 'object detection'], ['object-detection', 'detection']],
        [['classification'], ['image-classification', 'text-classification', 'audio-classification', 'classification']],
        [['imitation learning', 'robotic manipulation'], ['robotics', 'robot-learning']],
        [['speech recognition', 'asr'], ['automatic-speech-recognition']],
        [['generation'], ['text-generation', 'image-generation']],
    ];

    for (const [queryFam, modelFam] of taskFamilies) {
        const queryMatches = queryFam.some(t => queryTask.includes(t));
        const modelMatches = modelFam.some(t => modelTask.includes(t) || modelText.includes(t));
        if (queryMatches && modelMatches) return 75;
    }

    // Partial keyword match
    const taskWords = queryTask.split(/\s+/).filter(w => w.length > 3);
    const matched = taskWords.filter(w => modelText.includes(w)).length;
    if (taskWords.length > 0) return Math.round((matched / taskWords.length) * 60);

    return 10;
}

function scoreModelModality(model: Partial<NormalizedModel>, qu: QueryUnderstanding): number {
    const queryModality = n(qu.modality.value);
    if (!queryModality || queryModality === 'unknown') return 50;

    const modelModality = n(model.modality);
    const modelModalities = (model.modalities ?? []).map(n);
    const modelText = `${n(model.id)} ${n(model.task)} ${n(model.architecture)} ${modelModalities.join(' ')}`;

    // Exact
    if (modelModality === queryModality || modelModalities.includes(queryModality)) return 100;
    // Includes
    if (modelModality.includes(queryModality) || queryModality.includes(modelModality)) return 80;

    // Medical imaging family
    const medModalities = ['ct', 'mri', 'x-ray', 'medical', 'image', 'image-classification', 'image-segmentation'];
    const queryIsMedical = medModalities.some(m => queryModality.includes(m));
    const modelIsMedical = medModalities.some(m => modelModality.includes(m) || modelText.includes(m));
    if (queryIsMedical && modelIsMedical) return 70;

    // Hard cross-modal mismatch
    const imagingMods = ['ct', 'mri', 'x-ray', 'image', 'video', 'medical'];
    const nonImagingMods = ['tabular', 'text', 'audio', 'time-series'];
    if (imagingMods.some(m => queryModality.includes(m)) && nonImagingMods.some(m => modelModality.includes(m))) return 0;

    return 20;
}

function scoreModelArchitecture(model: Partial<NormalizedModel>, qu: QueryUnderstanding): number {
    // Architecture scoring based on task compatibility (since we have real arch now)
    const arch = n(model.architecture);
    const queryTask = n(qu.task.value);
    const queryDomain = n(qu.domain.value);

    if (arch === 'unknown') return 30; // Neutral for unknown architectures

    // Known architecture-task alignments
    const archTaskAlignments: [RegExp, string[]][] = [
        [/yolo|detr|faster.?rcnn|efficientdet|rtdetr/i, ['detection', 'object detection']],
        [/unet|segformer|sam|mask.?rcnn|panoptic/i, ['segmentation', 'instance segmentation', 'semantic segmentation']],
        [/resnet|efficientnet|convnext|vit|swin/i, ['classification', 'image classification']],
        [/bert|roberta|xlm|deberta/i, ['classification', 'text classification', 'ner', 'sentiment']],
        [/gpt|llama|mistral|gemma|t5/i, ['generation', 'text generation', 'question answering']],
        [/wav2vec|hubert|wavlm|whisper/i, ['speech recognition', 'audio classification', 'asr']],
        [/smolvla|pi0|lerobot/i, ['imitation learning', 'robotic manipulation', 'vision-language-action']],
        [/diffusion|stable.?diff|ddpm/i, ['generation', 'image generation']],
    ];

    for (const [archPattern, tasks] of archTaskAlignments) {
        if (archPattern.test(arch)) {
            if (tasks.some(t => queryTask.includes(t) || t.includes(queryTask))) return 90;
            // Architecture exists but for wrong task
            return 20;
        }
    }

    // Generic: arch present and somewhat relevant to domain
    if (arch !== 'unknown' && queryDomain && arch.length > 3) return 50;

    return 35;
}

function scoreModelCompatibilityWithDatasets(
    model: Partial<NormalizedModel>,
    datasetIds: string[]
): number {
    if (datasetIds.length === 0) return 50;
    const trainingData = (model.training_data ?? []).concat(model.datasets_used ?? []).map(n);
    const matches = datasetIds.filter(id => trainingData.some(td => td.includes(n(id)) || n(id).includes(td)));
    if (matches.length > 0) return 100; // Actually trained on one of our datasets
    return 50;
}

function scoreModelPopularity(model: Partial<NormalizedModel>): number {
    const downloads = model.downloads ?? 0;
    if (downloads > 100000) return 100;
    if (downloads > 10000) return 75;
    if (downloads > 1000) return 50;
    if (downloads > 100) return 30;
    return 10;
}

// ── Main scoring function ─────────────────────────────────────────────────────

export function scoreModel(
    model: Partial<NormalizedModel>,
    qu: QueryUnderstanding,
    datasetIds: string[] = []
): NormalizedModel {
    const m = { ...model } as NormalizedModel;
    m.scoreBreakdown = { task: 0, modality: 0, architecture: 0, compatibility: 0, benchmark: 0, efficiency: 0, popularity: 0 };
    m.rejected = false;
    m.rejectionReason = null;

    // Hard rejection check
    const rejectionReason = shouldRejectModel(model, qu);
    if (rejectionReason) {
        m.rejected = true;
        m.rejectionReason = rejectionReason;
        m.matchScore = 0;
        return m;
    }

    // Component scores
    const taskScore = scoreModelTask(model, qu);
    const modalityScore = scoreModelModality(model, qu);
    const archScore = scoreModelArchitecture(model, qu);
    const compatibilityScore = scoreModelCompatibilityWithDatasets(model, datasetIds);
    const popularityScore = scoreModelPopularity(model);

    // Weights: task 30, modality 20, architecture 20, compatibility 15, popularity 15
    const finalScore = Math.min(100, Math.round(
        taskScore       * 0.30 +
        modalityScore   * 0.20 +
        archScore       * 0.20 +
        compatibilityScore * 0.15 +
        popularityScore * 0.15
    ));

    m.scoreBreakdown = {
        task: Math.round(taskScore * 0.30),
        modality: Math.round(modalityScore * 0.20),
        architecture: Math.round(archScore * 0.20),
        compatibility: Math.round(compatibilityScore * 0.15),
        benchmark: 0,
        efficiency: 0,
        popularity: Math.round(popularityScore * 0.15),
    };
    m.matchScore = finalScore;

    const parts = [`Task: ${taskScore}%`, `Modality: ${modalityScore}%`, `Arch: ${archScore}%`];
    if (compatibilityScore >= 80) parts.push('Trained on related dataset');
    m.matchReason = parts.join(', ');

    return m;
}
