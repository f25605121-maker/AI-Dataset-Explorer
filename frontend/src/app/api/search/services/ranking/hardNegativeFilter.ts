/**
 * Hard-Negative Filter
 *
 * Rejects datasets that are FUNDAMENTALLY incompatible with the query.
 * Called before scoring — no keyword similarity can override these rules.
 *
 * KEY ADDITIONS over previous version:
 * - Tabular health survey datasets are rejected for CT/MRI/imaging queries
 * - "Heart Disease Health Indicators Dataset" type datasets rejected for imaging queries
 * - More precise medical imaging sub-modality exclusions
 */

export interface HardNegativeResult {
    rejected: boolean;
    rejectionReason?: string;
}

function n(s: string): string {
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
    'segmentation',  // segmentation almost always implies imaging
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
    ['image', 'audio'], ['image', 'time-series'],
    ['video', 'tabular'], ['video', 'text'], ['video', 'audio'],
    ['text', 'image'], ['text', 'video'], ['text', 'audio'],
    ['tabular', 'image'], ['tabular', 'video'], ['tabular', 'audio'],
    ['audio', 'image'], ['audio', 'video'], ['audio', 'tabular'],
    ['time-series', 'image'], ['time-series', 'video'],
    ['robotics', 'text'], ['robotics', 'tabular'], ['robotics', 'audio'],
];

// ── Import types ──────────────────────────────────────────────────────────────
import type { NormalizedDataset, ProjectSpec } from '../../schemas/types';

// ── Main filter ───────────────────────────────────────────────────────────────

export function applyHardNegativeFilter(
    dataset: Partial<NormalizedDataset>,
    project: Partial<ProjectSpec>
): HardNegativeResult {
    // Build searchable blobs
    const dsBlob = [
        dataset.name, dataset.title, dataset.description?.slice(0, 500),
        ...(dataset.tags ?? []), dataset.task, dataset.modality, dataset.domain,
    ].filter(Boolean).join(' ');

    const projectTasks = Array.isArray(project.task) ? project.task : [project.task ?? ''];
    const projectBlob = [
        ...projectTasks,
        project.data_modality, project.domain, project.subdomain,
        project.input_type, project.target,
    ].filter(Boolean).join(' ');

    // ── Whitelist checks (pass through without rejection) ─────────────────

    // Manufacturing project + manufacturing dataset → allow
    const isManufacturingProject = contains(projectBlob, ['manufacturing', 'industrial', 'defect', 'quality control', 'inspection']);
    const isManufacturingDataset = contains(dsBlob, ['mvtec', 'dagm', 'kolektor', 'industrial', 'manufacturing', 'defect']);
    if (isManufacturingProject && isManufacturingDataset) return { rejected: false };

    // Medical imaging project + medical imaging dataset → allow
    const isMedicalProject = contains(projectBlob, ['medical', 'mri', 'ct', 'x-ray', 'radiology', 'tumor', 'lesion', 'diagnosis', 'coronary', 'cardiac', 'brain', 'patholog']);
    const isMedicalImageDataset = contains(dsBlob, ['medical', 'mri', 'ct scan', 'x-ray', 'radiology', 'tumor', 'patholog', 'dicom', 'coronary', 'cardiac', 'echocardiograph', 'ultrasound', 'fundus', 'dermoscop']);
    if (isMedicalProject && isMedicalImageDataset) return { rejected: false };

    // Robotics project + robotics dataset → allow
    const isRoboticsProject = contains(projectBlob, ['robot', 'manipulation', 'teleoperat', 'so-101', 'lerobot', 'grasping']);
    const isRoboticsDataset = contains(dsBlob, ['robot', 'manipulation', 'teleoperat', 'so-101', 'lerobot', 'grasping', 'pick', 'place']);
    if (isRoboticsProject && isRoboticsDataset) return { rejected: false };

    // ── KEY FIX: Tabular health survey rejection for imaging queries ───────
    //
    // This catches the "Heart Disease Health Indicators Dataset" problem.
    // If the query asks for imaging (CT/MRI/segmentation/etc.) but the dataset
    // is a tabular health survey, reject it.
    //
    const queryAsksForImaging = contains(projectBlob, IMAGING_QUERY_SIGNALS);
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
    if (queryAsksForImaging && dsIsTabular) {
        return {
            rejected: true,
            rejectionReason: `Modality mismatch: imaging query requires imaging data but dataset is tabular.`,
        };
    }

    // ── Domain exclusion pairs ─────────────────────────────────────────────
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

    // ── Modality exclusion pairs ───────────────────────────────────────────
    const projectModality = n(project.data_modality ?? '');
    const datasetModality = n(dataset.modality ?? '');

    if (projectModality && datasetModality && projectModality !== 'unknown' && datasetModality !== 'unknown') {
        for (const [projMod, dataMod] of MODALITY_EXCLUSION_PAIRS) {
            if (projectModality.includes(projMod) && datasetModality.includes(dataMod)) {
                return {
                    rejected: true,
                    rejectionReason: `Modality mismatch: project uses '${projectModality}' but dataset is '${datasetModality}'.`,
                };
            }
        }
    }

    return { rejected: false };
}
