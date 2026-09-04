/**
 * Hard-Negative Filter & Biomedical Guardrails
 *
 * Rejects datasets that are FUNDAMENTALLY incompatible with the query:
 * 1. Anatomical Entity Guard (prevents matching brain/glioma to abdominal queries, etc.)
 * 2. Dimensionality Constraints (guards 3D volumetric requirements against 2D planar slices)
 * 3. Tabular Health Survey Filter (rejects CDC/NHANES survey CSVs for imaging queries)
 * 4. Cross-Modality & Domain Exclusion Guards
 *
 * Called before scoring — no keyword similarity can override these rules.
 */

import type { NormalizedDataset, ProjectSpec, ExtractedQueryEntities } from '@/types/pipeline';
import { ANATOMY_GROUPS, extractQueryEntities } from '@/server/query-understanding/queryParser';

export interface HardNegativeResult {
    rejected: boolean;
    rejectionReason?: string;
}

function n(s?: string | null): string {
    return (s ?? '').toLowerCase().trim();
}

function contains(text: string, keywords: string[]): boolean {
    const t = n(text);
    return keywords.some(k => t.includes(n(k)));
}

// ── Tabular health survey detection ──────────────────────────────────────────

const TABULAR_HEALTH_SURVEY_SIGNALS = [
    'health indicator',
    'health survey',
    'cdc',
    'nhanes',
    'brfss',
    'clinical trial data',
    'patient survey',
    'questionnaire',
    'health risk',
    'risk factor',
    'lifestyle',
    'bmi',
    'cholesterol',
    'blood pressure',
    'blood glucose',
    'metabolic',
    'tabular health',
    'health record',
    'ehr',
    'electronic health',
    'structured health',
];

const IMAGING_QUERY_SIGNALS = [
    'ct',
    'cta',
    'computed tomography',
    'mri',
    'magnetic resonance',
    'x-ray',
    'radiograph',
    'ultrasound',
    'angiograph',
    'fundus',
    'dermoscop',
    'medical imaging',
    'scan',
    'dicom',
    'radiology',
    'imaging',
    'coronary ct',
    'cardiac ct',
    'brain mri',
    'chest x-ray',
    'segmentation',
];

// ── Domain exclusion pairs ────────────────────────────────────────────────────
const DOMAIN_EXCLUSION_PAIRS: [string, string][] = [
    // Industrial / manufacturing vs medical
    ['industrial defect', 'mri'], ['industrial defect', 'ct'], ['industrial defect', 'radiology'],
    ['manufacturing', 'mri'], ['manufacturing', 'ct'], ['manufacturing', 'radiology'],
    ['quality inspection', 'mri'], ['quality inspection', 'medical imaging'],
    ['surface defect', 'mri'], ['surface defect', 'medical imaging'],
    ['defect detection', 'mri'], ['defect detection', 'ct'], ['defect detection', 'x-ray'],
    // Medical vs automotive/traffic
    ['mri', 'cctv'], ['mri', 'traffic'], ['mri', 'vehicle'],
    ['brain tumor', 'vehicle'], ['brain tumor', 'traffic'],
    ['chest x-ray', 'vehicle'], ['chest x-ray', 'traffic'],
    ['coronary', 'vehicle'], ['coronary', 'traffic'], ['coronary', 'autonomous'],
    // Medical imaging vs text/nlp
    ['mri', 'sentiment'], ['mri', 'text classification'], ['mri', 'review'],
    ['ct scan', 'sentiment'], ['ct scan', 'text'], ['ct scan', 'review'],
    ['coronary', 'sentiment'], ['coronary', 'review'], ['coronary', 'nlp'],
    // Vision vs tabular (direct)
    ['segmentation', 'tabular'], ['object detection', 'tabular'],
    ['image classification', 'csv only'],
    // Speech/audio vs vision
    ['speech recognition', 'image classification'], ['speech recognition', 'mri'],
    ['audio classification', 'mri'], ['audio classification', 'vehicle detection'],
    // Satellite/remote sensing vs medical
    ['remote sensing', 'mri'], ['satellite', 'mri'], ['satellite', 'sentiment'],
    // Finance vs medical/vision
    ['credit', 'mri'], ['fraud detection', 'mri'], ['stock market', 'mri'],
    // Agriculture vs finance/medical
    ['agriculture', 'stock market'], ['agriculture', 'mri'], ['crop', 'banking'],
    // Robotics vs text/sentiment
    ['robotics', 'sentiment'], ['robotics', 'text classification'],
    ['robot', 'sentiment'], ['robot', 'text classification'],
    // Autonomous driving vs sentiment
    ['autonomous driving', 'sentiment'], ['self-driving', 'sentiment'],
    ['autonomous driving', 'nlp'], ['self-driving', 'text classification'],
];

// ── Modality exclusion pairs ──────────────────────────────────────────────────
const MODALITY_EXCLUSION_PAIRS: [string, string][] = [
    ['ct', 'tabular'], ['ct', 'text'], ['ct', 'audio'],
    ['mri', 'tabular'], ['mri', 'text'], ['mri', 'audio'],
    ['x-ray', 'tabular'], ['x-ray', 'text'], ['x-ray', 'audio'],
    ['video', 'tabular'], ['video', 'text'], ['video', 'audio'],
    ['text', 'image'], ['text', 'video'], ['text', 'audio'],
    ['tabular', 'image'], ['tabular', 'video'], ['tabular', 'audio'],
    ['audio', 'image'], ['audio', 'video'], ['audio', 'tabular'],
    ['robotics', 'text'], ['robotics', 'tabular'], ['robotics', 'audio'],
];

// ── Anatomical Entity Guard ───────────────────────────────────────────────────

function detectDatasetAnatomies(dsBlob: string, dsId: string): string[] {
    const text = `${n(dsId)} ${n(dsBlob)}`;
    const detected: string[] = [];

    for (const [groupKey, group] of Object.entries(ANATOMY_GROUPS)) {
        const hasMatch = group.terms.some(term => {
            const regex = new RegExp(`\\b${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
            return regex.test(text);
        });
        if (hasMatch) {
            detected.push(groupKey);
        }
    }
    return detected;
}

function checkAnatomicalConflict(
    dataset: Partial<NormalizedDataset>,
    entities: ExtractedQueryEntities,
    dsBlob: string
): HardNegativeResult | null {
    if (!entities.targetAnatomy || entities.targetAnatomy.length === 0) {
        return null;
    }

    const dsId = n(dataset.id ?? dataset.name ?? '');
    const fullDsText = `${dsId} ${n(dsBlob)}`;

    // Check if dataset matches any of the target anatomy terms
    const matchesTarget = entities.targetAnatomy.some(term => {
        const regex = new RegExp(`\\b${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        return regex.test(fullDsText);
    });

    // Check if dataset matches any of the explicitly excluded anatomy terms
    const conflictingTermsFound: string[] = [];
    for (const exTerm of entities.excludedAnatomy) {
        const regex = new RegExp(`\\b${exTerm.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        if (regex.test(fullDsText)) {
            conflictingTermsFound.push(exTerm);
        }
    }

    // Special case check for notorious cross-anatomical benchmarks
    const isBrainGliomaDataset = /lgg|glioma|brats|brain.?mri|mateuszbuda/i.test(fullDsText);
    const isAbdominalQuery = entities.targetAnatomy.some(t => /abdomen|abdominal|liver|kidney|pancreas|spleen|multi.?organ/i.test(t));

    if (isAbdominalQuery && isBrainGliomaDataset && !matchesTarget) {
        return {
            rejected: true,
            rejectionReason: `Anatomical conflict: Query specifies abdominal anatomy (${entities.targetAnatomy.slice(0, 4).join(', ')}), but dataset is a brain/glioma dataset (${dataset.name || dataset.id}).`,
        };
    }

    // General anatomical conflict: matches excluded anatomy and does NOT match target anatomy
    if (!matchesTarget && conflictingTermsFound.length > 0) {
        return {
            rejected: true,
            rejectionReason: `Anatomical conflict: Query targets ${entities.targetAnatomy.slice(0, 3).join('/')} anatomy, but dataset is for conflicting anatomy [${conflictingTermsFound.slice(0, 3).join(', ')}].`,
        };
    }

    return null;
}

// ── Dimensionality Constraint Guard ───────────────────────────────────────────

function checkDimensionalityConflict(
    dataset: Partial<NormalizedDataset>,
    entities: ExtractedQueryEntities,
    dsBlob: string
): HardNegativeResult | null {
    if (entities.dimensionality !== '3D' && entities.dimensionality !== '4D') {
        return null;
    }

    const dsId = n(dataset.id ?? dataset.name ?? '');
    const formats = (dataset.formats ?? []).map(n);
    const fullText = `${dsId} ${formats.join(' ')} ${n(dsBlob)}`;

    // Known 3D volumetric formats & markers
    const has3DFormat = formats.some(f => /nii|nifti|mha|mhd|nrrd|dicom|dcm|vol/i.test(f)) ||
        /\.nii|\.nii\.gz|\.mha|\.nrrd|\.mhd|3d volume|volumetric|voxel|ct scan|mri volume/i.test(fullText);

    // Strictly 2D image slice datasets without 3D volumes
    const isStrict2DSliceDataset = (
        (formats.includes('tif') || formats.includes('tiff') || formats.includes('png') || formats.includes('jpg')) &&
        !has3DFormat &&
        /2d slice|slice-level|2d image|tif slice|patch|axial slice/i.test(fullText)
    );

    // If query strictly demands 3D multi-organ and dataset is only 2D slice images with no volumetric data
    if (entities.dimensionality === '3D' && isStrict2DSliceDataset && !has3DFormat) {
        return {
            rejected: true,
            rejectionReason: `Dimensionality mismatch: Query requires 3D volumetric data, but dataset consists of 2D planar image slices (${formats.join(', ') || '2D slices'}).`,
        };
    }

    return null;
}

// ── Main filter ───────────────────────────────────────────────────────────────

export function applyHardNegativeFilter(
    dataset: Partial<NormalizedDataset>,
    project: Partial<ProjectSpec>
): HardNegativeResult {
    // Build searchable blobs
    const dsBlob = [
        dataset.name, dataset.title, dataset.description?.slice(0, 800),
        ...(dataset.tags ?? []), dataset.task, dataset.modality, dataset.domain,
        ...(dataset.features ?? []),
        ...(dataset.formats ?? []),
    ].filter(Boolean).join(' ');

    const projectTasks = Array.isArray(project.task) ? project.task : [project.task ?? ''];
    const projectBlob = [
        ...projectTasks,
        project.data_modality, project.domain, project.subdomain,
        project.input_type, project.target,
        ...(project.keywords ?? []),
    ].filter(Boolean).join(' ');

    // Extract or use query entities
    const entities = project.entities || extractQueryEntities(projectBlob);

    // ── 1. Anatomical Entity Guard (Highest Priority for Medical) ──────────
    const anatomyConflict = checkAnatomicalConflict(dataset, entities, dsBlob);
    if (anatomyConflict) return anatomyConflict;

    // ── 2. Dimensionality Constraint Guard ────────────────────────────────
    const dimConflict = checkDimensionalityConflict(dataset, entities, dsBlob);
    if (dimConflict) return dimConflict;

    // ── 3. Tabular health survey rejection for imaging queries ────────────
    const queryAsksForImaging = contains(projectBlob, IMAGING_QUERY_SIGNALS) || entities.targetModality === 'MRI' || entities.targetModality === 'CT';
    const datasetIsTabularHealthSurvey = contains(dsBlob, TABULAR_HEALTH_SURVEY_SIGNALS);

    if (queryAsksForImaging && datasetIsTabularHealthSurvey) {
        return {
            rejected: true,
            rejectionReason: 'Tabular health survey dataset rejected for imaging/segmentation query. ' +
                'Dataset appears to be a structured health-indicator survey, not an imaging dataset.',
        };
    }

    // Additionally reject tabular-modality datasets for imaging queries
    const dsModality = n(dataset.modality ?? '');
    const dsIsTabular = dsModality === 'tabular' || contains(dsBlob, ['csv file', 'spreadsheet', 'structured data', 'tabular data']);
    if (queryAsksForImaging && dsIsTabular && !contains(dsBlob, ['mri', 'ct', 'image', 'dicom', 'nifti', 'scan'])) {
        return {
            rejected: true,
            rejectionReason: `Modality mismatch: imaging query requires imaging data but dataset is tabular.`,
        };
    }

    // ── 4. Whitelist domain-aligned passes ─────────────────────────────────

    // Manufacturing project + manufacturing dataset → allow
    const isManufacturingProject = contains(projectBlob, ['manufacturing', 'industrial', 'defect', 'quality control', 'inspection']);
    const isManufacturingDataset = contains(dsBlob, ['mvtec', 'dagm', 'kolektor', 'industrial', 'manufacturing', 'defect']);
    if (isManufacturingProject && isManufacturingDataset) return { rejected: false };

    // Robotics project + robotics dataset → allow
    const isRoboticsProject = contains(projectBlob, ['robot', 'manipulation', 'teleoperat', 'so-101', 'lerobot', 'grasping']);
    const isRoboticsDataset = contains(dsBlob, ['robot', 'manipulation', 'teleoperat', 'so-101', 'lerobot', 'grasping', 'pick', 'place']);
    if (isRoboticsProject && isRoboticsDataset) return { rejected: false };

    // Multimodal / EEG / Seizure project + matching dataset → allow
    const isMultimodalOrEegProject = contains(projectBlob, ['eeg', 'ieeg', 'ecog', 'multimodal', 'seizure', 'epilepsy', 'infrared', 'video', 'time-series', 'sensor', 'signal']);
    const isMultimodalOrEegDataset = contains(dsBlob, ['eeg', 'ieeg', 'ecog', 'multimodal', 'seizure', 'epilepsy', 'infrared', 'video', 'time-series', 'sensor', 'signal', 'electrophysiology']);
    if (isMultimodalOrEegProject && isMultimodalOrEegDataset) return { rejected: false };

    // ── 5. Domain exclusion pairs ──────────────────────────────────────────
    for (const [projKeyword, dataKeyword] of DOMAIN_EXCLUSION_PAIRS) {
        if (
            contains(projectBlob, [projKeyword]) &&
            contains(dsBlob, [dataKeyword])
        ) {
            return {
                rejected: true,
                rejectionReason: `Domain mismatch: project involves '${projKeyword}' but dataset relates to '${dataKeyword}'.`,
            };
        }
    }

    // ── 6. Modality exclusion pairs ────────────────────────────────────────
    const projectModality = n(project.data_modality ?? entities.targetModality);
    const dsMod = n(dataset.modality ?? '');

    // Skip pairwise modality exclusion if either is multimodal
    if (projectModality.includes('multimodal') || dsMod.includes('multimodal')) {
        return { rejected: false };
    }

    if (projectModality && dsMod && projectModality !== 'unknown' && dsMod !== 'unknown' && projectModality !== 'any') {
        for (const [projMod, dataMod] of MODALITY_EXCLUSION_PAIRS) {
            if (projectModality.includes(projMod) && dsMod.includes(dataMod)) {
                return {
                    rejected: true,
                    rejectionReason: `Modality mismatch: project uses '${projectModality}' but dataset is '${dsMod}'.`,
                };
            }
        }
    }

    return { rejected: false };
}
