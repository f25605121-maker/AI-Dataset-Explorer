/**
 * Query Expander — Controlled Semantic Expansion
 *
 * Generates search query variants WITHOUT drifting into unrelated concepts.
 *
 * Rules:
 * - Expand into synonyms/variants of explicitly stated concepts
 * - Prioritize structured coreSearchKeywords from entity extraction
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
    '4d flow cardiac': [
        '4D flow MRI',
        'cardiac 4D flow',
        'phase-contrast MRI',
        'cardiac MRI velocity',
        'flow reconstruction',
    ],
    'velocity field': [
        'velocity field reconstruction',
        'cardiac velocity field',
        '4D flow velocity',
        'vector field MRI',
    ],
    'wall shear stress': [
        'hemodynamic wall shear stress',
        'cardiac wall shear stress',
        'WSS estimation',
        'aortic wall shear stress',
    ],
    'cardiac': [
        'cardiac MRI',
        '4D flow MRI',
        'cardiac flow',
        'cardiovascular MRI',
    ],
    'seizure': [
        'seizure detection',
        'epilepsy',
        'seizure onset',
        'epileptic EEG',
        'intracranial EEG',
    ],
    'seizure onset zone': [
        'onset zone localization',
        'seizure localization',
        'soz localization',
        'epileptogenic zone',
    ],
    'intracranial EEG': [
        'iEEG',
        'ECoG',
        'intracranial EEG seizure',
        'EEG seizure detection',
    ],
    'abdominal organs': [
        'abdominal MRI',
        'multi-organ segmentation',
        'abdominal tumor',
        'liver segmentation',
        'kidney segmentation',
        'pancreas segmentation',
        '3D abdominal MRI',
    ],
    'abdomen': [
        'abdominal MRI',
        'multi-organ segmentation',
        'abdominal tumor',
        'liver tumor',
        'kidney tumor',
        'pancreas tumor',
    ],
    'abdominal': [
        'abdominal MRI',
        'multi-organ segmentation',
        'abdominal tumor',
        'liver segmentation',
        'kidney segmentation',
    ],
    'liver': [
        'liver tumor',
        'liver segmentation',
        'hepatic lesion',
        'LiTS',
    ],
    'kidney': [
        'kidney tumor',
        'kidney segmentation',
        'KiTS',
    ],
    'pancreas': [
        'pancreatic tumor',
        'pancreas segmentation',
    ],
    'spleen': [
        'spleen segmentation',
        'splenic lesion',
    ],
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
    'macromolecule structural': [
        'cryo-et',
        'cryo-em',
        'electron tomography',
        'macromolecule',
        'subtomogram',
        'structural biology',
    ],
    'macromolecules': [
        'cryo-et',
        'cryo-em',
        'macromolecule structural',
        'subtomogram',
    ],
    'cryo-et structures': [
        'cryo-et',
        'cryo-em',
        'electron tomography',
        'subtomogram',
        'macromolecule structural',
    ],
};

const MODALITY_SYNONYMS: Record<string, string[]> = {
    'Cryo-EM/ET': ['cryo-et', 'cryo-em', 'electron tomography', 'macromolecule structural', 'subtomogram', 'cryo-electron microscopy'],
    'Fluorescence': ['fluorescence microscopy', 'confocal microscopy', 'immunofluorescence'],
    'Genomics/Tabular': ['genomics', 'transcriptomics', 'RNA-seq', 'tabular omics'],
    'EEG': ['electroencephalography', 'EEG dataset', 'scalp EEG', 'intracranial EEG', 'iEEG'],
    'intracranial EEG': ['iEEG', 'ECoG', 'intracranial EEG', 'stereotaxic EEG', 'sEEG'],
    'ECG': ['electrocardiography', 'ECG dataset', 'EKG'],
    'infrared video': ['thermal video', 'infrared', 'video EEG', 'multimodal video'],
    'multimodal': ['multimodal EEG', 'video EEG', 'multimodal fusion', 'cross-modal'],
    'CT': ['computed tomography', 'CTA', 'cardiac CT', 'CCTA'],
    'MRI': ['magnetic resonance', 'abdominal MRI', 'cardiac MRI'],
    'X-ray': ['chest X-ray', 'radiograph', 'CXR'],
    'angiography': ['angiogram', 'coronary angiography', 'CTA'],
    'robotics': ['LeRobot', 'robot dataset', 'manipulation', 'teleoperation'],
};

const TASK_SYNONYMS: Record<string, string[]> = {
    'reconstruction': ['MRI reconstruction', 'k-space reconstruction', 'image reconstruction', 'sparse reconstruction', 'compressed sensing'],
    'velocity reconstruction': ['velocity field reconstruction', '4D flow reconstruction', 'flow reconstruction'],
    'velocity_estimation': ['velocity estimation', 'wall shear stress estimation', 'hemodynamic estimation', 'WSS estimation', 'vector field regression'],
    'registration': ['image registration', 'spatial alignment', 'deformable registration', 'motion correction'],
    'seizure detection': ['epilepsy detection', 'seizure prediction', 'seizure classification', 'EEG seizure'],
    'onset zone localization': ['seizure onset localization', 'zone localization', 'SOZ detection', 'localization'],
    'localization': ['spatial localization', 'onset zone localization', 'detection'],
    'segmentation': ['semantic segmentation', 'instance segmentation', 'multi-organ segmentation', 'pixel-wise'],
    'multi-organ segmentation': ['multi organ segmentation', 'abdominal organ segmentation', 'organ segmentation'],
    'detection': ['object detection', 'localization', 'bounding box'],
    'classification': ['image classification', 'categorization', 'pattern classification'],
    'imitation learning': ['behavior cloning', 'demonstration learning', 'teleoperation'],
    'robotic manipulation': ['manipulation task', 'robot task', 'pick place', 'grasping'],
    'vision-language-action': ['VLA', 'vision language action', 'language conditioned manipulation'],
    'tracking': ['multi-object tracking', 'MOT', 'trajectory'],
    'multimodal fusion': ['multimodal detection', 'cross-modal fusion', 'multimodal learning'],
};

const SUBDOMAIN_SYNONYMS: Record<string, string[]> = {
    'epileptology': ['epilepsy', 'seizure', 'clinical neurophysiology', 'EEG'],
    'cardiovascular': ['cardiac', 'coronary', 'heart'],
    'neuro-oncology': ['brain tumor', 'glioma', 'cranial'],
    'neurology': ['brain MRI', 'neuroimaging', 'EEG'],
    'abdominal radiology': ['abdominal MRI', 'multi-organ', 'abdomen CT'],
    'dermatology': ['skin', 'dermoscopy', 'melanoma'],
};

// ── Expansion logic ───────────────────────────────────────────────────────────

/**
 * Expand a query into related variants, grounded in the query understanding.
 * The primary search queries from queryParser are always included first.
 */
export function expandQueries(qu: QueryUnderstanding): ExpandedQueries {
    const base = [...(qu.entities?.coreSearchKeywords ?? []), ...qu.searchQueries];

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

    // In query generation logic: generate relaxed, high-recall Kaggle queries for Cryo-EM / Cryo-ET
    let relaxedKaggle: string[] = [];
    if (qu.rawQuery.toLowerCase().includes('cryo') || qu.rawQuery.toLowerCase().includes('tomography') || qu.modality.value === 'Cryo-EM/ET') {
        relaxedKaggle = [
            'cryo-et',
            'cryo-em',
            'electron tomography',
            'macromolecule structural',
            'subtomogram'
        ];
    }

    // ── Kaggle queries: slightly broader, task/domain combos ──────────────
    const kaggleDatasetQueries = dedup([
        ...relaxedKaggle,
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

    // Specific entity (e.g., "SO-101", "ImageCAS")
    if (qu.specificEntityMentioned) {
        queries.push(qu.specificEntityMentioned);
    }

    const task = qu.task.value?.trim();
    const mod = qu.modality.value?.trim();
    const target = qu.target.value?.trim();
    const domain = qu.domain.value?.trim();
    const sub = qu.subdomain.value?.trim();

    // 1. Core search keywords from entities (already domain-qualified)
    if (qu.entities?.coreSearchKeywords && qu.entities.coreSearchKeywords.length > 0) {
        queries.push(...qu.entities.coreSearchKeywords);
    }

    // 2. Combined target + modality + task (most specific)
    const specificTrio = [target, mod !== 'image' ? mod : '', task].filter(Boolean).join(' ');
    if (specificTrio && specificTrio.split(' ').length >= 2) {
        queries.push(specificTrio);
    }

    // 3. Target + task (e.g. "brain tumor segmentation", "coronary artery detection")
    if (target && target !== 'unknown' && task && task !== 'unknown') {
        if (!target.toLowerCase().includes(task.toLowerCase())) {
            queries.push(`${target} ${task}`);
        }
    }

    // 4. Modality + task (e.g. "MRI segmentation", "CT segmentation", "EEG detection")
    if (mod && mod !== 'image' && mod !== 'unknown' && task && task !== 'unknown') {
        if (!task.toLowerCase().includes(mod.toLowerCase())) {
            queries.push(`${mod} ${task}`);
        }
    }

    // 5. Target + modality (e.g. "brain tumor MRI", "coronary CTA")
    if (target && target !== 'unknown' && mod && mod !== 'image' && mod !== 'unknown') {
        if (!target.toLowerCase().includes(mod.toLowerCase())) {
            queries.push(`${target} ${mod}`);
        }
    }

    // 6. Direct target keywords
    if (target && target !== 'unknown' && target.length > 3) {
        queries.push(target);
    }

    // 7. Target synonyms
    if (target) {
        const syns = TARGET_SYNONYMS[target.toLowerCase()] ?? [];
        for (const s of syns.slice(0, 3)) {
            queries.push(s);
        }
    }

    // 7b. Architecture queries for physics/reconstruction tasks
    if (task && /reconstruction|velocity/i.test(task)) {
        queries.push('4dflow net', 'mri reconstruction unet', 'variational network mri');
    }

    // 8. Framework
    if (qu.framework.value && qu.framework.value !== 'unknown') {
        if (target && target !== 'unknown') queries.push(`${qu.framework.value} ${target}`);
        else if (task && task !== 'unknown') queries.push(`${qu.framework.value} ${task}`);
    }

    // 9. Subdomain / Domain qualified with task
    if (sub && sub !== 'unknown') {
        if (task && task !== 'unknown' && !sub.toLowerCase().includes(task.toLowerCase())) {
            queries.push(`${sub} ${task}`);
        } else {
            queries.push(sub);
        }
    } else if (domain && domain !== 'unknown' && domain !== 'General' && domain !== 'General / AI Concepts') {
        const cleanDomain = domain.replace(/imaging/i, '').trim();
        if (cleanDomain && task && task !== 'unknown') {
            queries.push(`${cleanDomain} ${task}`);
        }
    }

    // ONLY fallback to bare task if absolutely no domain, target, or modality is known
    const hasContext = !!(target || (mod && mod !== 'image' && mod !== 'unknown') || (domain && domain !== 'General') || sub);
    if (!hasContext && task && task !== 'unknown') {
        queries.push(task);
    }

    return dedup(queries).slice(0, 8);
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
        // Limit query word count to <= 6 words to avoid upstream API rejections
        if (norm.split(/\s+/).length > 6) return false;
        if (seen.has(norm)) return false;
        seen.add(norm);
        return true;
    });
}
