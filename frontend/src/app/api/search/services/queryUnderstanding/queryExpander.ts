/**
 * Query Expander — Controlled Semantic Expansion
 *
 * Generates search query variants WITHOUT drifting into unrelated concepts.
 *
 * Rules:
 * - Expand into synonyms/variants of explicitly stated concepts
 * - NEVER expand "coronary arteries" into "heart disease survey" or "heart health indicators"
 * - Expansions must be topically equivalent or more specific, not broader
 * - Each expansion variant must share at least one key concept with the original
 */

import type { QueryUnderstanding } from './queryParser';

export interface ExpandedQueries {
    /** Queries for HuggingFace dataset search */
    hfDatasetQueries: string[];
    /** Queries for Kaggle dataset search */
    kaggleDatasetQueries: string[];
    /** Queries for HuggingFace model search */
    hfModelQueries: string[];
    /** All unique queries combined */
    allQueries: string[];
}

// ── Semantic expansion tables ─────────────────────────────────────────────────

const TARGET_SYNONYMS: Record<string, string[]> = {
    'coronary arteries': [
        'coronary artery',
        'coronary vessel',
        'coronary artery segmentation',
        'coronary vessel segmentation',
        'coronary CTA',
        'coronary artery disease',
        'coronary artery detection',
    ],
    'coronary artery': [
        'coronary arteries',
        'coronary vessel',
        'coronary CTA',
        'coronary artery segmentation',
    ],
    'brain tumor': [
        'brain tumour',
        'glioma',
        'brain MRI tumor',
        'brain lesion',
        'glioblastoma',
        'brain tumor segmentation',
    ],
    'skin lesion': [
        'skin cancer',
        'melanoma',
        'dermoscopy',
        'skin disease',
        'dermatology lesion',
    ],
    'retinal': [
        'retina',
        'fundus',
        'diabetic retinopathy',
        'retinal vessel',
        'optic disc',
    ],
    'lung cancer': [
        'lung nodule',
        'pulmonary nodule',
        'lung tumor',
        'chest CT lung',
    ],
    'SO-101 robot': [
        'SO-101',
        'SO101',
        'Project-IRA SO-101',
        'SO-101 LeRobot',
    ],
    'robotic arm': [
        'robot manipulation',
        'robotic manipulation',
        'robot arm dataset',
    ],
    'manipulation tasks': [
        'robotic manipulation',
        'pick and place',
        'robot grasping',
    ],
};

const MODALITY_SYNONYMS: Record<string, string[]> = {
    'CT': ['computed tomography', 'CTA', 'cardiac CT', 'CCTA'],
    'MRI': ['magnetic resonance', 'brain MRI', 'cardiac MRI'],
    'X-ray': ['chest X-ray', 'radiograph', 'CXR'],
    'angiography': ['angiogram', 'coronary angiography', 'CTA'],
    'robotics': ['LeRobot', 'robot dataset', 'manipulation', 'teleoperation'],
};

const TASK_SYNONYMS: Record<string, string[]> = {
    'segmentation': ['semantic segmentation', 'instance segmentation', 'pixel-wise'],
    'detection': ['object detection', 'localization', 'bounding box'],
    'classification': ['image classification', 'categorization'],
    'imitation learning': ['behavior cloning', 'demonstration learning', 'teleoperation'],
    'robotic manipulation': ['manipulation task', 'robot task', 'pick place', 'grasping'],
    'vision-language-action': ['VLA', 'vision language action', 'language conditioned manipulation'],
    'tracking': ['multi-object tracking', 'MOT', 'trajectory'],
};

const SUBDOMAIN_SYNONYMS: Record<string, string[]> = {
    'cardiovascular': ['cardiac', 'coronary', 'heart'],
    'neuro-oncology': ['brain tumor', 'glioma', 'cranial'],
    'neurology': ['brain MRI', 'neuroimaging'],
    'dermatology': ['skin', 'dermoscopy', 'melanoma'],
};

// ── Expansion logic ───────────────────────────────────────────────────────────

/**
 * Expand a query into related variants, grounded in the query understanding.
 * The primary search queries from queryParser are always included first.
 */
export function expandQueries(qu: QueryUnderstanding): ExpandedQueries {
    const base = [...qu.searchQueries];

    const targetVariants = expandTarget(qu);
    const modalityVariants = expandModality(qu);
    const taskVariants = expandTask(qu);
    const subdomainVariants = expandSubdomain(qu);

    // ── Dataset queries: target-focused, most specific first ──────────────
    const hfDatasetQueries = dedup([
        ...base,
        ...targetVariants,
        ...combinePairs(targetVariants, modalityVariants, 3),
        ...combinePairs(targetVariants, taskVariants, 3),
        ...subdomainVariants,
    ]).slice(0, 8);

    // ── Kaggle queries: slightly broader, task/domain combos ──────────────
    const kaggleDatasetQueries = dedup([
        ...base,
        ...targetVariants,
        ...combinePairs(qu.target.value ? [qu.target.value] : [], taskVariants, 2),
        ...subdomainVariants,
    ]).slice(0, 6);

    // ── Model queries: architecture/task/framework focused ─────────────────
    const hfModelQueries = buildModelQueries(qu);

    return {
        hfDatasetQueries,
        kaggleDatasetQueries,
        hfModelQueries,
        allQueries: dedup([...hfDatasetQueries, ...kaggleDatasetQueries, ...hfModelQueries]),
    };
}

function expandTarget(qu: QueryUnderstanding): string[] {
    const t = qu.target.value;
    if (!t) return [];
    const norm = t.toLowerCase().trim();
    const synonyms = TARGET_SYNONYMS[norm] ?? [];
    return [t, ...synonyms];
}

function expandModality(qu: QueryUnderstanding): string[] {
    const m = qu.modality.value;
    if (!m) return [];
    return [m, ...(MODALITY_SYNONYMS[m] ?? [])];
}

function expandTask(qu: QueryUnderstanding): string[] {
    const t = qu.task.value;
    if (!t) return [];
    return [t, ...(TASK_SYNONYMS[t] ?? [])];
}

function expandSubdomain(qu: QueryUnderstanding): string[] {
    const s = qu.subdomain.value;
    if (!s) return [];
    const synonyms = SUBDOMAIN_SYNONYMS[s] ?? [];
    const task = qu.task.value ?? '';
    const modality = qu.modality.value ?? '';

    const result = [s, ...synonyms];
    if (task) result.push(`${s} ${task}`);
    if (modality && modality !== 'image') result.push(`${s} ${modality}`);
    if (task && modality) result.push(`${s} ${task} ${modality}`);
    return result;
}

function buildModelQueries(qu: QueryUnderstanding): string[] {
    const queries: string[] = [];

    // Specific entity
    if (qu.specificEntityMentioned) {
        queries.push(qu.specificEntityMentioned);
    }

    // Task-based model search
    if (qu.task.value) {
        queries.push(`${qu.task.value} model`);
        if (qu.modality.value && qu.modality.value !== 'image') {
            queries.push(`${qu.modality.value} ${qu.task.value}`);
        }
    }

    // Domain-based model search
    if (qu.domain.value) {
        queries.push(`${qu.domain.value} model`);
    }

    // Framework
    if (qu.framework.value) {
        queries.push(qu.framework.value);
        if (qu.task.value) queries.push(`${qu.framework.value} ${qu.task.value}`);
    }

    // Target-specific
    if (qu.target.value && qu.task.value) {
        queries.push(`${qu.target.value} ${qu.task.value}`);
    }

    return dedup(queries).slice(0, 6);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function combinePairs(aList: string[], bList: string[], maxCombinations: number): string[] {
    const result: string[] = [];
    for (const a of aList.slice(0, 3)) {
        for (const b of bList.slice(0, 3)) {
            if (result.length >= maxCombinations) break;
            if (a && b && a !== b) result.push(`${a} ${b}`);
        }
    }
    return result;
}

function dedup(arr: string[]): string[] {
    const seen = new Set<string>();
    return arr.filter(s => {
        if (!s || s.trim().length < 3) return false;
        const norm = s.toLowerCase().trim();
        if (seen.has(norm)) return false;
        seen.add(norm);
        return true;
    });
}
