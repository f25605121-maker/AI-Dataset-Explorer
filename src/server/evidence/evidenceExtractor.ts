/**
 * Evidence Extractor
 *
 * Extracts factual fields from dataset/model metadata with evidence tracking.
 * Every field has a {value, state, confidence, source} object.
 *
 * NEVER invents or infers values beyond what metadata supports.
 * Missing = UNKNOWN, not "Not specified" with a fake value.
 */

import type { NormalizedDataset, NormalizedModel, EvidenceFact } from '@/types/pipeline';

// ── Evidence confidence calculator ────────────────────────────────────────────

/**
 * Calculate overall evidence confidence for a dataset's match.
 * This is SEPARATE from relevance score.
 *
 * evidence_confidence = how well we can confirm what the dataset is
 * relevance_score = how relevant it is to the query
 */
export function calculateDatasetEvidenceConfidence(ds: Partial<NormalizedDataset>): number {
    let score = 0;
    let factors = 0;

    // Dataset card / README available
    if (ds.raw_metadata && Object.keys(ds.raw_metadata).length > 5) { score += 20; factors++; }
    // Task confirmed from metadata
    if (ds.task && ds.task !== 'unknown') { score += 20; factors++; }
    // Modality confirmed
    if (ds.modality && ds.modality !== 'unknown') { score += 20; factors++; }
    // License confirmed
    if (ds.license && ds.license !== 'unknown') { score += 15; factors++; }
    // Size/sample count known
    if (ds.sizeBytes != null || ds.sample_count != null) { score += 10; factors++; }
    // Features/schema available
    if (ds.features && ds.features.length > 0) { score += 10; factors++; }
    // Splits available
    if (ds.splits && Object.keys(ds.splits).length > 0) { score += 5; factors++; }

    return factors > 0 ? Math.min(100, score) : 30;
}

export function calculateModelEvidenceConfidence(m: Partial<NormalizedModel>): number {
    let score = 0;

    if (m.architecture && m.architecture !== 'Unknown') score += 25;
    if (m.task && m.task !== 'unknown') score += 20;
    if (m.modality && m.modality !== 'unknown') score += 15;
    if (m.parameters != null) score += 15;
    if (m.framework && m.framework !== 'Unknown') score += 10;
    if (m.training_data && m.training_data.length > 0) score += 15;

    return Math.min(100, score);
}

// ── Dataset facts extraction ───────────────────────────────────────────────────

export interface DatasetFacts {
    what: EvidenceFact<string>;          // What is this dataset?
    task: EvidenceFact<string>;          // Primary task
    modality: EvidenceFact<string>;      // Data modality
    domain: EvidenceFact<string>;        // Domain
    inputs: EvidenceFact<string>;        // Input description
    outputs: EvidenceFact<string>;       // Output/labels
    sampleCount: EvidenceFact<number | string | null>;
    splits: EvidenceFact<Record<string, unknown>>;
    features: EvidenceFact<string[]>;
    license: EvidenceFact<string>;
    size: EvidenceFact<string>;
    limitations: EvidenceFact<string[]>;
    relatedModels: EvidenceFact<string[]>;
    evidenceConfidence: number;
}

export function extractDatasetFacts(ds: Partial<NormalizedDataset>): DatasetFacts {
    function fact<T>(
        value: T,
        state: 'CONFIRMED' | 'INFERRED' | 'UNKNOWN',
        confidence: number,
        source: string
    ): EvidenceFact<T> {
        return { value, state, confidence, source, verified: state === 'CONFIRMED' };
    }

    const cardAvailable = ds.evidence?.some(e => e.source?.includes('README') || e.source?.includes('dataset card'));

    // What
    const whatValue = ds.title ?? ds.name ?? ds.id ?? '';
    const what = fact(whatValue, 'CONFIRMED', 1.0, 'HuggingFace/Kaggle metadata');

    // Task
    const taskVal = ds.task ?? '';
    const taskEvidence = ds.evidence?.find(e => e.source?.includes('task'));
    const task = taskVal && taskVal !== 'unknown'
        ? fact(taskVal, 'CONFIRMED', taskEvidence?.confidence ?? 0.8, taskEvidence?.source ?? 'metadata tags')
        : fact('unknown', 'UNKNOWN', 0, 'not available from retrieved metadata');

    // Modality
    const modVal = ds.modality ?? '';
    const modEvidence = ds.evidence?.find(e => e.source?.includes('tag') || e.source?.includes('card'));
    const modality = modVal && modVal !== 'unknown'
        ? fact(modVal, cardAvailable ? 'CONFIRMED' : 'INFERRED', modEvidence?.confidence ?? 0.7, modEvidence?.source ?? 'inferred from tags')
        : fact('unknown', 'UNKNOWN', 0, 'not available from retrieved metadata');

    // Domain
    const domVal = ds.domain ?? '';
    const domain = domVal
        ? fact(domVal, 'INFERRED', 0.7, 'inferred from query context + metadata')
        : fact('unknown', 'UNKNOWN', 0, 'not available');

    // Inputs / Outputs
    const featuresArr = ds.features ?? [];
    const inputs = featuresArr.length > 0
        ? fact(featuresArr.join(', '), 'CONFIRMED', 0.9, 'dataset schema/features')
        : fact('not available from retrieved metadata', 'UNKNOWN', 0, 'schema not retrieved');

    const outputs = fact('not available from retrieved metadata', 'UNKNOWN', 0, 'labels not in retrieved metadata');

    // Sample count
    const sc = ds.sample_count;
    const sampleCount = sc != null
        ? fact(sc, 'CONFIRMED', 0.9, cardAvailable ? 'dataset card' : 'metadata')
        : fact(null, 'UNKNOWN', 0, 'not available from retrieved metadata');

    // Splits
    const splitsObj = ds.splits ?? {};
    const splits = Object.keys(splitsObj).length > 0
        ? fact(splitsObj, 'CONFIRMED', 0.9, 'dataset metadata')
        : fact({}, 'UNKNOWN', 0, 'splits not available');

    // Features
    const features = featuresArr.length > 0
        ? fact(featuresArr, 'CONFIRMED', 0.9, 'dataset schema')
        : fact([], 'UNKNOWN', 0, 'schema not retrieved');

    // License
    const licVal = ds.license ?? '';
    const license = licVal && licVal !== 'unknown'
        ? fact(licVal, 'CONFIRMED', 0.95, 'metadata license field')
        : fact('unknown', 'UNKNOWN', 0, 'license not specified in metadata');

    // Size
    const sizeVal = ds.size ?? '';
    const size = sizeVal && sizeVal !== 'unknown'
        ? fact(sizeVal, 'CONFIRMED', 0.9, 'metadata size field')
        : fact('unknown', 'UNKNOWN', 0, 'size not available');

    // Limitations — extract from card text if available
    const rawMeta = ds.raw_metadata ?? {};
    const limitationsArr: string[] = [];
    const cardContent = typeof (rawMeta as any).cardContent === 'string' ? (rawMeta as any).cardContent : '';
    if (cardContent) {
        const limSection = cardContent.match(/##\s*(?:limitations?|bias(?:es)?|risks?|warnings?)([\s\S]*?)(?=##|$)/i);
        if (limSection) {
            limitationsArr.push(limSection[1].replace(/\n+/g, ' ').trim().slice(0, 500));
        }
    }
    const limitations = limitationsArr.length > 0
        ? fact(limitationsArr, 'CONFIRMED', 0.8, 'dataset card')
        : fact([], 'UNKNOWN', 0, 'limitations not available in retrieved metadata');

    // Related models
    const relatedModels = (ds.related_models ?? []).length > 0
        ? fact(ds.related_models ?? [], 'CONFIRMED', 0.85, 'dataset metadata')
        : fact([], 'UNKNOWN', 0, 'related models not available');

    return {
        what,
        task,
        modality,
        domain,
        inputs,
        outputs,
        sampleCount,
        splits,
        features,
        license,
        size,
        limitations,
        relatedModels,
        evidenceConfidence: calculateDatasetEvidenceConfidence(ds),
    };
}

// ── Model facts extraction ────────────────────────────────────────────────────

export interface ModelFacts {
    architecture: EvidenceFact<string>;
    architectureSource: string;
    baseModel: EvidenceFact<string>;
    task: EvidenceFact<string>;
    modality: EvidenceFact<string>;
    parameters: EvidenceFact<number | string | null>;
    framework: EvidenceFact<string>;
    trainingDatasets: EvidenceFact<string[]>;
    license: EvidenceFact<string>;
    inputTypes: EvidenceFact<string[]>;
    outputTypes: EvidenceFact<string[]>;
    evidenceConfidence: number;
}

export function extractModelFacts(m: Partial<NormalizedModel>): ModelFacts {
    function fact<T>(
        value: T,
        state: 'CONFIRMED' | 'INFERRED' | 'UNKNOWN',
        confidence: number,
        source: string
    ): EvidenceFact<T> {
        return { value, state, confidence, source, verified: state === 'CONFIRMED' };
    }

    // Architecture — check evidence for source
    const archEvidence = m.evidence?.find(e => e.source?.includes('config') || e.source?.includes('model card') || e.source?.includes('tag'));
    const archVal = m.architecture ?? 'Unknown';
    const archState: 'CONFIRMED' | 'INFERRED' | 'UNKNOWN' =
        archEvidence?.state ?? (archVal !== 'Unknown' ? 'INFERRED' : 'UNKNOWN');
    const architecture = fact(archVal, archState, archEvidence?.confidence ?? 0, archEvidence?.source ?? 'not available');

    const baseModel = m.base_model && m.base_model !== 'Unknown'
        ? fact(m.base_model, 'CONFIRMED', 0.9, 'HF model tags')
        : fact('Unknown', 'UNKNOWN', 0, 'base model not specified');

    const taskVal = m.task ?? '';
    const task = taskVal && taskVal !== 'unknown'
        ? fact(taskVal, 'CONFIRMED', 0.9, 'HF pipeline_tag')
        : fact('unknown', 'UNKNOWN', 0, 'task not specified');

    const modVal = m.modality ?? '';
    const modality = modVal && modVal !== 'unknown'
        ? fact(modVal, 'INFERRED', 0.7, 'inferred from pipeline_tag and architecture')
        : fact('unknown', 'UNKNOWN', 0, 'not available');

    const params = m.parameters;
    const parameters = params != null
        ? fact(params, 'CONFIRMED', 0.95, 'config.json or model metadata')
        : fact(null, 'UNKNOWN', 0, 'parameter count not available in retrieved metadata');

    const fw = m.framework ?? 'Unknown';
    const framework = fw !== 'Unknown'
        ? fact(fw, 'CONFIRMED', 0.9, 'HF model tags')
        : fact('Unknown', 'UNKNOWN', 0, 'framework not specified');

    const td = m.training_data ?? [];
    const trainingDatasets = td.length > 0
        ? fact(td, 'CONFIRMED', 0.85, 'model card / HF dataset tags')
        : fact([], 'UNKNOWN', 0, 'training datasets not specified');

    const lic = m.license ?? 'unknown';
    const license = lic !== 'unknown'
        ? fact(lic, 'CONFIRMED', 0.9, 'HF license tag')
        : fact('unknown', 'UNKNOWN', 0, 'license not specified');

    const it = m.input_types ?? [];
    const inputTypes = it.length > 0
        ? fact(it, 'CONFIRMED', 0.85, 'pipeline tag + architecture')
        : fact([], 'UNKNOWN', 0, 'input types not available');

    const ot = m.output_types ?? [];
    const outputTypes = ot.length > 0
        ? fact(ot, 'CONFIRMED', 0.85, 'pipeline tag + architecture')
        : fact([], 'UNKNOWN', 0, 'output types not available');

    return {
        architecture,
        architectureSource: archEvidence?.source ?? 'not available',
        baseModel,
        task,
        modality,
        parameters,
        framework,
        trainingDatasets,
        license,
        inputTypes,
        outputTypes,
        evidenceConfidence: calculateModelEvidenceConfidence(m),
    };
}
