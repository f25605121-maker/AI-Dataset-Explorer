import { NormalizedDataset, NormalizedModel } from '@/types/pipeline';

/**
 * Calculates a compatibility score between a Dataset and a Model.
 * Provides a strong heuristic for recommending paired usages of resources (e.g. Model for a specific Dataset).
 */
export function calculateCompatibilityScore(dataset: Partial<NormalizedDataset>, model: Partial<NormalizedModel>): number {
    let score = 50; // Base baseline score for being in the same general ecosystem

    const datasetTask = String(dataset.task || '').toLowerCase();
    const modelTask = String(model.task || '').toLowerCase();

    // 1. Task matching
    if (datasetTask && modelTask) {
        if (datasetTask === modelTask) {
            score += 30;
        } else if (datasetTask.includes(modelTask) || modelTask.includes(datasetTask)) {
            score += 15;
        } else {
            // Task mismatches are heavily penalized
            score -= 20;
        }
    }

    const datasetModality = String(dataset.modality || '').toLowerCase();
    const modelModality = String(model.modality || '').toLowerCase();

    // 2. Modality matching
    if (datasetModality && modelModality) {
        if (datasetModality === modelModality) {
            score += 20;
        } else {
            // Hard Rejection for stark modality contrasts
            const strictVision = /(image|video|vision)/.test(modelModality);
            const strictText = /(text|nlp)/.test(modelModality);
            const strictAudio = /(audio|speech)/.test(modelModality);

            const isDataVision = /(image|video|vision)/.test(datasetModality);
            const isDataText = /(text|nlp)/.test(datasetModality);
            const isDataAudio = /(audio|speech)/.test(datasetModality);

            if ((strictVision && (isDataText || isDataAudio)) ||
                (strictText && (isDataVision || isDataAudio)) ||
                (strictAudio && (isDataVision || isDataText))) {
                return 0; // Absolute incompatibility
            }
            score -= 10;
        }
    }

    // 3. Framework & Format alignment (If available)
    const formats = (dataset.formats || []).join(' ').toLowerCase();
    const framework = String(model.framework || '').toLowerCase();

    if (framework && formats) {
        if (framework.includes('pytorch') && (formats.includes('pt') || formats.includes('tensor') || formats.includes('pth'))) {
            score += 5;
        } else if (framework.includes('tensorflow') && (formats.includes('tfrecord') || formats.includes('pb'))) {
            score += 5;
        }
    }

    return Math.max(0, Math.min(100, score));
}
