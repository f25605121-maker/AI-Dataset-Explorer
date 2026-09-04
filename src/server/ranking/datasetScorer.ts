/**
 * Dataset Scorer — Adaptive Weighted Ranking with Biomedical Entity Alignment
 *
 * Uses query understanding to compute adaptive weights:
 * - Target Anatomy alignment (+30 bonus for confirmed organ/anatomy)
 * - Sequence Subtype alignment (+15 bonus for DCE/contrast/FLAIR/T1/T2)
 * - Dimensionality alignment (+20 bonus for 3D volumetric formats)
 * - Critical mismatch penalties
 */

import type { NormalizedDataset } from '@/types/pipeline';
import type { QueryUnderstanding } from '@/server/query-understanding/queryParser';
import { applyHardNegativeFilter } from './hardNegativeFilter';

// ── Score thresholds for result categories ────────────────────────────────────
export const SCORE_THRESHOLDS = {
    BEST_MATCH: 75,       // Shown as "Best Match"
    STRONG_MATCH: 55,     // Shown as "Strong Match"
    PARTIAL_MATCH: 35,    // Shown as "Partial Match"
    RELATED: 20,          // Shown as "Related"
    NOT_RECOMMENDED: 0,   // Filtered / not shown
};

export type MatchCategory = 'BEST_MATCH' | 'STRONG_MATCH' | 'PARTIAL_MATCH' | 'RELATED' | 'NOT_RECOMMENDED';

export function getMatchCategory(score: number, rejected: boolean): MatchCategory {
    if (rejected) return 'NOT_RECOMMENDED';
    if (score >= SCORE_THRESHOLDS.BEST_MATCH) return 'BEST_MATCH';
    if (score >= SCORE_THRESHOLDS.STRONG_MATCH) return 'STRONG_MATCH';
    if (score >= SCORE_THRESHOLDS.PARTIAL_MATCH) return 'PARTIAL_MATCH';
    if (score >= SCORE_THRESHOLDS.RELATED) return 'RELATED';
    return 'NOT_RECOMMENDED';
}

// ── Adaptive weight computation ───────────────────────────────────────────────

interface ScoreWeights {
    semantic: number;
    task: number;
    modality: number;
    target: number;
    domain: number;
    subdomain: number;
    metadata: number;
    popularity: number;
}

function computeAdaptiveWeights(qu: QueryUnderstanding): ScoreWeights {
    const explicit = qu.explicitFields;

    // Base weights
    let w = {
        semantic: 25,
        task: 20,
        modality: 15,
        target: 15,
        domain: 10,
        subdomain: 5,
        metadata: 5,
        popularity: 5,
    };

    // Boost task weight if task was explicitly stated
    if (explicit.has('task')) {
        w.task += 10;
        w.domain -= 5;
        w.metadata -= 5;
    }

    // Boost modality weight if modality was explicitly stated
    if (explicit.has('modality')) {
        w.modality += 10;
        w.popularity -= 5;
        w.subdomain -= 5;
    }

    // Boost target weight if target was explicitly stated
    if (explicit.has('target') || (qu.entities?.targetAnatomy && qu.entities.targetAnatomy.length > 0)) {
        w.target += 10;
        w.domain -= 5;
        w.metadata -= 5;
    }

    // Reduce semantic for very specific queries (metadata matching is more reliable)
    if (explicit.size >= 3) {
        w.semantic -= 10;
        w.task += 5;
        w.modality += 5;
    }

    // Ensure all weights are non-negative
    for (const k of Object.keys(w) as (keyof ScoreWeights)[]) {
        w[k] = Math.max(0, w[k]);
    }

    // Normalize to sum to 100
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    if (total !== 100) {
        const scale = 100 / total;
        for (const k of Object.keys(w) as (keyof ScoreWeights)[]) {
            w[k] = Math.round(w[k] * scale);
        }
    }

    return w;
}

// ── Individual scoring components ─────────────────────────────────────────────

function n(s?: string | null): string {
    return (s ?? '').toLowerCase().trim();
}

/**
 * Semantic relevance: does the dataset text blob contain the query's key terms?
 * This is a weighted keyword match across title, description, tags, features.
 */
function scoreSemanticRelevance(ds: Partial<NormalizedDataset>, qu: QueryUnderstanding): number {
    const titleWeight = 3;
    const tagWeight = 2;
    const descWeight = 1;

    const targetWords = qu.target.value ? n(qu.target.value).split(/\s+/) : [];
    const taskWords = qu.task.value ? n(qu.task.value).split(/\s+/) : [];
    const modalityWords = qu.modality.value ? [n(qu.modality.value)] : [];
    const keywords = [...qu.explicitKeywords, ...qu.inferredKeywords];

    const title = n(ds.title ?? ds.name ?? '');
    const desc = n(ds.description ?? '');
    const tags = (ds.tags ?? []).map(n).join(' ');
    const features = (ds.features ?? []).map(n).join(' ');
    const formats = (ds.formats ?? []).map(n).join(' ');
    const allText = `${title} ${tags} ${desc} ${formats}`;

    let score = 0;
    let maxScore = 0;

    // Target match (highest priority)
    for (const word of targetWords) {
        if (word.length < 3) continue;
        maxScore += titleWeight + tagWeight + descWeight;
        if (title.includes(word)) score += titleWeight;
        else if (tags.includes(word)) score += tagWeight;
        else if (desc.includes(word) || features.includes(word)) score += descWeight;
    }

    // Task match
    for (const word of taskWords) {
        if (word.length < 3) continue;
        maxScore += titleWeight + tagWeight;
        if (title.includes(word)) score += titleWeight;
        else if (tags.includes(word) || desc.includes(word)) score += tagWeight;
    }

    // Modality match
    for (const word of modalityWords) {
        if (word.length < 2) continue;
        maxScore += titleWeight + tagWeight;
        if (title.includes(word)) score += titleWeight;
        else if (tags.includes(word) || desc.includes(word)) score += tagWeight;
    }

    // Sequence subtype bonus
    if (qu.entities?.sequenceSubtype) {
        maxScore += 2;
        if (allText.includes(n(qu.entities.sequenceSubtype)) || allText.includes('contrast')) {
            score += 2;
        }
    }

    // Dimensionality bonus
    if (qu.entities?.dimensionality === '3D') {
        maxScore += 2;
        if (allText.includes('3d') || allText.includes('volum') || allText.includes('nii') || allText.includes('mha') || allText.includes('nrrd')) {
            score += 2;
        }
    }

    // Additional keyword matches
    for (const kw of keywords.slice(0, 10)) {
        if (kw.length < 3) continue;
        const w = 1;
        maxScore += w;
        if (allText.includes(n(kw))) score += w;
    }

    if (maxScore === 0) return 50;
    return Math.min(100, Math.round((score / maxScore) * 100));
}

/**
 * Task match: does the dataset's confirmed task align with the query task?
 */
function scoreTaskMatch(ds: Partial<NormalizedDataset>, qu: QueryUnderstanding): number {
    const queryTask = n(qu.task.value ?? '');
    if (!queryTask || queryTask === 'unknown') return 50;

    const dsTask = n(ds.task ?? '');
    const dsBlob = [ds.title, ds.name, ds.description, ...(ds.tags ?? []), dsTask].map(n).join(' ');

    // Exact task match on confirmed field
    if (dsTask && dsTask !== 'unknown') {
        if (dsTask === queryTask) return 100;
        if (dsTask.includes(queryTask) || queryTask.includes(dsTask)) return 85;
        // Related tasks
        if (isRelatedTask(dsTask, queryTask)) return 60;
    }

    // Keyword match in blob
    const taskWords = queryTask.split(/\s+/).filter(w => w.length > 3);
    if (taskWords.length > 0) {
        const matched = taskWords.filter(w => dsBlob.includes(w)).length;
        const ratio = matched / taskWords.length;
        if (ratio >= 0.8) return 80;
        if (ratio >= 0.5) return 60;
        if (ratio >= 0.2) return 30;
    }

    return 0;
}

function isRelatedTask(a: string, b: string): boolean {
    const related: [string, string][] = [
        ['segmentation', 'segmentation'],
        ['reconstruction', 'velocity_estimation'],
        ['reconstruction', 'velocity reconstruction'],
        ['reconstruction', 'super-resolution'],
        ['velocity_estimation', 'regression'],
        ['segmentation', 'detection'],
        ['segmentation', 'instance segmentation'],
        ['segmentation', 'semantic segmentation'],
        ['segmentation', 'multi-organ segmentation'],
        ['classification', 'recognition'],
        ['detection', 'object detection'],
        ['detection', 'localization'],
        ['robotic manipulation', 'imitation learning'],
        ['robotic manipulation', 'pick and place'],
    ];
    for (const [x, y] of related) {
        if ((a.includes(x) && b.includes(y)) || (a.includes(y) && b.includes(x))) return true;
    }
    return false;
}

/**
 * Modality match: compares dataset's evidence-backed modality against query modality.
 */
function scoreModalityMatch(ds: Partial<NormalizedDataset>, qu: QueryUnderstanding): number {
    const queryModality = n(qu.modality.value ?? '');
    if (!queryModality || queryModality === 'unknown') return 50;

    const dsModality = n(ds.modality ?? '');
    const dsModalities = (ds.modalities ?? []).map(n);

    // Exact match
    if (dsModality === queryModality || dsModalities.includes(queryModality)) return 100;

    // Multimodal matching
    if (queryModality.includes('multimodal') || dsModality.includes('multimodal')) {
        return 90;
    }

    // Electrophysiology / EEG matching
    const eegModalities = ['eeg', 'intracranial eeg', 'ieeg', 'ecog', 'ecg', 'time-series', 'sensor'];
    if (eegModalities.some(m => queryModality.includes(m)) && eegModalities.some(m => dsModality.includes(m))) {
        return queryModality === dsModality ? 100 : 80;
    }

    // Partial overlap
    if (dsModality.includes(queryModality) || queryModality.includes(dsModality)) return 75;

    // Medical imaging family matches
    const medicalImageModalities = ['ct', 'mri', 'x-ray', 'ultrasound', 'angiography', 'fundus photography', 'dermoscopy', 'medical imaging'];
    const queryIsMedical = medicalImageModalities.includes(queryModality) || queryModality.includes('medical');
    const dsIsMedical = medicalImageModalities.some(m => dsModality.includes(m)) || dsModalities.some(m => medicalImageModalities.some(mm => m.includes(mm)));

    if (queryIsMedical && dsIsMedical) {
        if (queryModality !== 'medical imaging' && dsModality !== 'medical imaging') return 25;
        return 40;
    }

    // Absolute mismatch: imaging vs tabular/text/audio
    const imagingModalities = ['ct', 'mri', 'x-ray', 'image', 'video', 'dermoscopy', 'medical imaging', 'ultrasound', 'angiography'];
    const nonImagingModalities = ['tabular', 'text', 'audio'];

    const queryIsImaging = imagingModalities.some(m => queryModality.includes(m));
    const dsIsNonImaging = nonImagingModalities.some(m => dsModality.includes(m));

    if (queryIsImaging && dsIsNonImaging) return 0;
    if (nonImagingModalities.some(m => queryModality.includes(m)) && imagingModalities.some(m => dsModality.includes(m))) return 0;

    for (const dm of dsModalities) {
        if (dm.includes(queryModality) || queryModality.includes(dm)) return 60;
    }

    return 15;
}

/**
 * Target / Anatomy match: does the dataset contain the specific target anatomy?
 */
function scoreTargetMatch(ds: Partial<NormalizedDataset>, qu: QueryUnderstanding): number {
    const queryTarget = n(qu.target.value ?? '');
    const entities = qu.entities;
    const dsBlob = [
        ds.title, ds.name, ds.description,
        ...(ds.tags ?? []), ...(ds.features ?? []),
        JSON.stringify(ds.schema ?? {}).slice(0, 200),
    ].map(n).join(' ');

    // Target anatomy matching with biomedical knowledge
    if (entities?.targetAnatomy && entities.targetAnatomy.length > 0) {
        const matches = entities.targetAnatomy.filter(term => dsBlob.includes(n(term)));
        if (matches.length >= 2) return 100;
        if (matches.length === 1) return 85;
    }

    if (!queryTarget || queryTarget === 'unknown') return 50;

    // Exact target phrase
    if (dsBlob.includes(queryTarget)) return 100;

    // Individual target words
    const targetWords = queryTarget.split(/\s+/).filter(w => w.length > 3);
    if (targetWords.length === 0) return 50;

    const matched = targetWords.filter(w => dsBlob.includes(w)).length;
    const ratio = matched / targetWords.length;

    if (ratio === 1.0) return 90;
    if (ratio >= 0.7) return 70;
    if (ratio >= 0.5) return 50;
    if (ratio >= 0.3) return 30;
    if (ratio > 0) return 15;

    return 0;
}

/**
 * Domain/subdomain match
 */
function scoreDomainMatch(ds: Partial<NormalizedDataset>, qu: QueryUnderstanding): { domain: number; subdomain: number } {
    const queryDomain = n(qu.domain.value ?? '');
    const querySubdomain = n(qu.subdomain.value ?? '');

    const dsBlob = [
        ds.domain, ds.subdomain, ds.title, ds.name,
        ds.description?.slice(0, 500), ...(ds.tags ?? [])
    ].map(n).join(' ');

    let domainScore = 50;
    if (queryDomain) {
        const queryDomainWords = queryDomain.split(/\s+/).filter(w => w.length > 3);
        const matched = queryDomainWords.filter(w => dsBlob.includes(w)).length;
        domainScore = queryDomainWords.length > 0
            ? Math.round((matched / queryDomainWords.length) * 100)
            : 50;
    }

    let subdomainScore = 50;
    if (querySubdomain) {
        const querySubWords = querySubdomain.split(/\s+/).filter(w => w.length > 3);
        const matched = querySubWords.filter(w => dsBlob.includes(w)).length;
        subdomainScore = querySubWords.length > 0
            ? Math.round((matched / querySubWords.length) * 100)
            : 50;
    }

    return { domain: domainScore, subdomain: subdomainScore };
}

/**
 * Metadata quality score (0-100)
 */
function scoreMetadataQuality(ds: Partial<NormalizedDataset>): number {
    return ds.metadataQuality ?? 0;
}

/**
 * Popularity score (0-100)
 */
function scorePopularity(ds: Partial<NormalizedDataset>): number {
    const downloads = ds.downloads ?? 0;
    const likes = ds.likes ?? 0;
    if (downloads > 100000 || likes > 1000) return 100;
    if (downloads > 10000 || likes > 500) return 80;
    if (downloads > 1000 || likes > 100) return 60;
    if (downloads > 100 || likes > 10) return 40;
    if (downloads > 0 || likes > 0) return 20;
    return 0;
}

// ── Score explanation builder ─────────────────────────────────────────────────

function buildScoreExplanation(
    scores: Record<string, number>,
    weights: ScoreWeights,
    qu: QueryUnderstanding,
    ds: Partial<NormalizedDataset>
): string {
    const parts: string[] = [];

    const semScore = scores.semantic ?? 0;
    const taskScore = scores.task ?? 0;
    const modScore = scores.modality ?? 0;
    const targetScore = scores.target ?? 0;

    if (qu.entities?.targetAnatomy && qu.entities.targetAnatomy.length > 0 && targetScore >= 80) {
        parts.push(`Anatomy match: target anatomy [${qu.entities.targetAnatomy.slice(0, 3).join(', ')}] confirmed`);
    } else if (targetScore >= 80) {
        parts.push(`Target match: "${qu.target.value}" confirmed in dataset`);
    } else if (targetScore >= 50) {
        parts.push(`Partial target match: some terms of "${qu.target.value}" found`);
    } else if (qu.target.value && targetScore < 20) {
        parts.push(`Target mismatch: "${qu.target.value}" not found in dataset metadata`);
    }

    if (modScore >= 80) parts.push(`Modality match: ${qu.modality.value} confirmed`);
    else if (modScore === 0 && qu.modality.state === 'CONFIRMED') parts.push(`Modality mismatch: query requires ${qu.modality.value} but dataset is ${ds.modality ?? 'unknown'}`);

    if (taskScore >= 80) parts.push(`Task match: ${qu.task.value} confirmed`);
    else if (taskScore === 0 && qu.task.state === 'CONFIRMED') parts.push(`Task mismatch: query requires ${qu.task.value} but dataset task is ${ds.task ?? 'unknown'}`);

    if (qu.entities?.dimensionality === '3D') {
        const formats = (ds.formats ?? []).join(' ');
        if (/nii|mha|nrrd|dicom/i.test(formats)) parts.push('3D volumetric format confirmed');
    }

    if (semScore >= 70) parts.push(`Strong semantic relevance`);
    else if (semScore < 30) parts.push(`Weak semantic match`);

    return parts.join('. ') || 'No specific match explanation available.';
}

// ── Main scoring function ─────────────────────────────────────────────────────

export function scoreDataset(
    ds: Partial<NormalizedDataset>,
    qu: QueryUnderstanding
): Partial<NormalizedDataset> {
    // Step 1: Hard negative filter with full query understanding & entities
    const legacySpec = {
        task: qu.task.value ?? '',
        data_modality: qu.modality.value ?? '',
        domain: qu.domain.value ?? '',
        subdomain: qu.subdomain.value ?? '',
        target: qu.target.value ?? '',
        input_type: qu.modality.value ?? '',
        target_labels: qu.target.value ? [qu.target.value] : [],
        entities: qu.entities,
    };

    const hardFilter = applyHardNegativeFilter(ds as any, legacySpec as any);
    if (hardFilter.rejected) {
        return {
            ...ds,
            rejected: true,
            rejectionReason: hardFilter.rejectionReason ?? 'Hard filter',
            matchScore: 0,
            scoreBreakdown: { task: 0, modality: 0, domain: 0, subdomain: 0, target: 0, metadata: 0, semantic: 0, quality: 0, popularity: 0 },
            matchReason: 'Rejected: ' + (hardFilter.rejectionReason ?? 'incompatible with query'),
        };
    }

    // Step 2: Compute adaptive weights
    const weights = computeAdaptiveWeights(qu);

    // Step 3: Compute individual component scores
    const semScore = scoreSemanticRelevance(ds, qu);
    const taskScore = scoreTaskMatch(ds, qu);
    const modalityScore = scoreModalityMatch(ds, qu);
    const targetScore = scoreTargetMatch(ds, qu);
    const { domain: domainScore, subdomain: subdomainScore } = scoreDomainMatch(ds, qu);
    const metaScore = scoreMetadataQuality(ds);
    const popularityScore = scorePopularity(ds);

    const scores = {
        semantic: semScore,
        task: taskScore,
        modality: modalityScore,
        target: targetScore,
        domain: domainScore,
        subdomain: subdomainScore,
        metadata: metaScore,
        popularity: popularityScore,
    };

    // Step 4: Weighted final score
    const finalScore = Math.min(100, Math.round(
        semScore       * (weights.semantic   / 100) +
        taskScore      * (weights.task       / 100) +
        modalityScore  * (weights.modality   / 100) +
        targetScore    * (weights.target     / 100) +
        domainScore    * (weights.domain     / 100) +
        subdomainScore * (weights.subdomain  / 100) +
        metaScore      * (weights.metadata   / 100) +
        popularityScore * (weights.popularity / 100)
    ));

    // Step 5: Critical mismatch penalty
    const hardModalityMismatch = qu.modality.state === 'CONFIRMED' && modalityScore === 0;
    const hardTaskMismatch = qu.task.state === 'CONFIRMED' && taskScore === 0;
    const penalizedScore = hardModalityMismatch || hardTaskMismatch
        ? Math.min(finalScore, 25)
        : finalScore;

    const scoreBreakdown = {
        semantic: Math.round(semScore * weights.semantic / 100),
        task: Math.round(taskScore * weights.task / 100),
        modality: Math.round(modalityScore * weights.modality / 100),
        target: Math.round(targetScore * weights.target / 100),
        domain: Math.round(domainScore * weights.domain / 100),
        subdomain: Math.round(subdomainScore * weights.subdomain / 100),
        metadata: Math.round(metaScore * weights.metadata / 100),
        quality: Math.round(metaScore * weights.metadata / 100),
        popularity: Math.round(popularityScore * weights.popularity / 100),
    };

    const matchReason = buildScoreExplanation(scores, weights, qu, ds);

    return {
        ...ds,
        rejected: false,
        rejectionReason: null,
        matchScore: penalizedScore,
        scoreBreakdown,
        matchReason,
    };
}
