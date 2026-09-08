# expandQueries

**File:** `src\server\query-understanding\queryExpander.ts`

## Description
Query Expander — Controlled Semantic Expansion
Generates search query variants WITHOUT drifting into unrelated concepts.
Rules:
- Expand into synonyms/variants of explicitly stated concepts
- Prioritize structured coreSearchKeywords from entity extraction
- NEVER expand "coronary arteries" into "heart disease survey" or "heart health indicators"
- Expansions must be topically equivalent or more specific, not broader
- Each expansion variant must share at least one key concept with the original
/

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
Expand a query into related variants, grounded in the query understanding.
The primary search queries from queryParser are always included first.

## Signature
```typescript
function expandQueries(qu: QueryUnderstanding): ExpandedQueries
```
