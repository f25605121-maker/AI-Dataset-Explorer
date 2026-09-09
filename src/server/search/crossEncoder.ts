/**
 * Multi-Factor Cross-Encoder & Deep Relevance Evaluator
 *
 * Performs granular multi-dimensional cross-scoring for top candidate pools across:
 * 1. Anatomy Match
 * 2. Modality Match
 * 3. Task Match
 * 4. Dimensionality Match
 * 5. Target / Label Match
 * 6. Domain Match
 * 7. Dataset / Model Suitability
 * 8. Evidence Quality
 * 9. Overall Composite Relevance
 */

import { UnifiedCandidate, StructuredQueryUnderstanding, ResearchQuerySchema, CrossEncoderEvaluation } from './types';
import { ANATOMY_ONTOLOGY, normalizeAnatomy, normalizeModality, normalizeTask } from './ontology';

function clean(s?: any): string {
    if (Array.isArray(s)) return s.join(' ').toLowerCase().trim();
    if (typeof s === 'string') return s.toLowerCase().trim();
    return String(s ?? '').toLowerCase().trim();
}


/**
 * Deterministic Cross-Evaluation Engine
 * Computes exact normalized dimension scores based on domain knowledge and primary metadata.
 */
export function evaluateCandidateCrossEncoder(
    candidate: UnifiedCandidate,
    understanding: StructuredQueryUnderstanding | ResearchQuerySchema
): CrossEncoderEvaluation {
    const isSchema = 'primaryDomain' in understanding;

    const primaryAnatomy: string[] = isSchema
        ? (Array.isArray(understanding.anatomy) ? understanding.anatomy : [])
        : (Array.isArray(understanding.anatomy?.primary) ? understanding.anatomy.primary : (Array.isArray(understanding.anatomy) ? understanding.anatomy : []));

    const organsAnatomy: string[] = isSchema
        ? (Array.isArray(understanding.anatomy) ? understanding.anatomy : [])
        : (Array.isArray(understanding.anatomy?.organs) ? understanding.anatomy.organs : []);

    const rawDomain = isSchema ? (understanding.primaryDomain || '') : (understanding.domain || '');
    const isMedicalImaging = rawDomain.toLowerCase().includes('medical') || rawDomain.toLowerCase().includes('cardiac') || rawDomain.toLowerCase().includes('neuro') || rawDomain === 'medical_imaging';
    const isAgriculture = /agriculture|plant|crop|botany|plant pathology/i.test(rawDomain);

    const modalities: string[] = isSchema
        ? (Array.isArray(understanding.modalities) ? understanding.modalities : [])
        : (Array.isArray(understanding.modality) ? understanding.modality : []);
    const reqModality = clean(modalities[0]);

    const sequences: string[] = isSchema
        ? (Array.isArray(understanding.modalitySubtypes) ? understanding.modalitySubtypes : [])
        : (Array.isArray(understanding.sequence) ? understanding.sequence : []);

    const task = isSchema
        ? (understanding.reconstructionTasks?.[0] || understanding.predictionTasks?.[0] || understanding.estimationTasks?.[0] || 'discovery')
        : (understanding.task || 'discovery');

    const rawDim = isSchema
        ? (understanding.dimensionality?.[0] || 'any')
        : (understanding.dimensionality || 'any');
    const is3D = rawDim.includes('3D') || rawDim.includes('4D');
    const is2D = rawDim.includes('2D');

    const targets: string[] = isSchema
        ? (Array.isArray(understanding.targetEntities) ? understanding.targetEntities : (Array.isArray(understanding.targetOutputs) ? understanding.targetOutputs : []))
        : (Array.isArray(understanding.target) ? understanding.target : []);

    const title = clean(candidate.title || candidate.name);
    const desc = clean(candidate.description);
    const tags = (candidate.tags || []).map(clean).join(' ');
    const formats = (candidate.formats || []).map(clean).join(' ');
    const candidateBlob = `${title} ${tags} ${desc} ${formats} ${clean(candidate.modality)} ${clean(candidate.task)}`;
    const hasPlantSubject = /plant|crop|leaf|leaves|agricultur|botan|phytopath/i.test(candidateBlob);
    const hasIncompatibleSubject = /skin lesion|melanoma|face recognition|facial|chest x.?ray|cxr|ultrasound|mri|brain|retina|fundus|patient|clinical|medical|biomedical|isic/i.test(candidateBlob);

    // ── 1. Anatomy Match (0.0 - 1.0) ─────────────────────────────────────────
    let anatomyMatch = 0.5; // Neutral default if anatomy not in query
    if (primaryAnatomy.length > 0) {
        const queryPrimary = primaryAnatomy.map(clean);
        const queryOrgans = organsAnatomy.map(clean);

        const hasExactPrimary = queryPrimary.some(p => {
            const r = new RegExp(`\\b${p}\\b`, 'i');
            return r.test(title) || r.test(tags);
        });

        const hasDescPrimary = queryPrimary.some(p => candidateBlob.includes(p));
        const matchedOrgans = queryOrgans.filter(o => candidateBlob.includes(o));

        if (hasExactPrimary && matchedOrgans.length >= 2) {
            anatomyMatch = 1.0;
        } else if (hasExactPrimary || matchedOrgans.length >= 2) {
            anatomyMatch = 0.95;
        } else if (hasDescPrimary || matchedOrgans.length === 1) {
            anatomyMatch = 0.80;
        } else if (isMedicalImaging && /medical|patient|scan|clinical/i.test(candidateBlob)) {
            anatomyMatch = 0.35; // Generic medical without specific anatomy
        } else {
            anatomyMatch = 0.0; // Unrelated anatomy
        }
    }

    // ── 2. Modality Match (0.0 - 1.0) ────────────────────────────────────────
    let modalityMatch = 0.5;
    if (reqModality && reqModality !== 'multimodal_or_general' && reqModality !== 'multimodal / general') {
        const candModality = clean(candidate.modality || (candidate.modalities || []).join(' '));
        const isDceQuery = sequences.some(s => /dce|contrast/i.test(s));

        if (isDceQuery && /dce|dynamic\s*contrast|contrast.?enhanced/i.test(candidateBlob)) {
            modalityMatch = 1.0;
        } else if (isDceQuery && /mri|magnetic\s*resonance/i.test(candidateBlob)) {
            modalityMatch = 0.85; // Standard MRI partial match for DCE query
        } else if (candModality.includes(reqModality) || title.includes(reqModality)) {
            modalityMatch = 1.0;
        } else if (candidateBlob.includes(reqModality)) {
            modalityMatch = 0.85;
        } else if (candidate.modalities && candidate.modalities.some(m => clean(m).includes(reqModality))) {
            modalityMatch = 0.80;
        } else if (/mri|ct|x.?ray|image|scan/i.test(candidateBlob) && /mri|ct|x.?ray/i.test(reqModality)) {
            modalityMatch = 0.25;
        } else {
            modalityMatch = 0.0;
        }
    }

    // ── 3. Task Match (0.0 - 1.0) ────────────────────────────────────────────
    let taskMatch = 0.5;
    const reqTask = clean(task);
    if (reqTask && reqTask !== 'discovery') {
        const candTask = clean(candidate.task || candidate.pipelineTag || '');
        const normReq = normalizeTask(reqTask);
        const normCand = normalizeTask(candTask);

        if (normReq.canonical === normCand.canonical && normReq.canonical !== 'DISCOVERY') {
            taskMatch = 1.0;
        } else if (candidateBlob.includes(reqTask)) {
            taskMatch = 0.90;
        } else if (normReq.parentTask && normCand.canonical === normReq.parentTask.toUpperCase()) {
            taskMatch = 0.75;
        } else if (normReq.canonical === 'SEGMENTATION' && /detection|bounding\s*box|localization/i.test(candidateBlob)) {
            taskMatch = 0.50; // Related spatial vision task
        } else if (normReq.canonical === 'SEGMENTATION' && /mask|contour|voxel|pixel/i.test(candidateBlob)) {
            taskMatch = 0.85;
        } else {
            taskMatch = 0.15;
        }
    }

    // ── 4. Dimensionality Match (0.0 - 1.0) ──────────────────────────────────
    let dimensionMatch = 0.7; // Default neutral
    if (is3D) {
        const has3DFormat = formats.includes('nii') || formats.includes('mha') || formats.includes('nrrd') ||
            /\.nii|\.mha|\.nrrd|3d volume|volumetric|voxel|ct volume|mri volume/i.test(candidateBlob);
        const is2DSlices = /2d slice|slice-level|patch|png slices|tif slices/i.test(candidateBlob);

        if (has3DFormat) {
            dimensionMatch = 1.0;
        } else if (/3d\b/i.test(title)) {
            dimensionMatch = 0.95;
        } else if (/3d\b/i.test(candidateBlob)) {
            dimensionMatch = 0.80;
        } else if (is2DSlices) {
            dimensionMatch = 0.40; // 2D slices penalty
        } else {
            dimensionMatch = 0.50;
        }
    } else if (is2D) {
        dimensionMatch = /2d|slice|image|photo/i.test(candidateBlob) ? 1.0 : 0.6;
    }

    // ── 5. Target / Label Match (0.0 - 1.0) ──────────────────────────────────
    let targetMatch = 0.6;
    if (targets.length > 0) {
        let matchedCount = 0;
        for (const tgt of targets) {
            if (candidateBlob.includes(clean(tgt))) matchedCount++;
        }
        if (isAgriculture && hasPlantSubject) matchedCount = Math.max(matchedCount, 1);
        targetMatch = Math.min(1.0, (matchedCount / targets.length) * 0.9 + 0.1);
    }

    // ── 6. Domain Match (0.0 - 1.0) ──────────────────────────────────────────
    let domainMatch = 0.8;
    if (isAgriculture) {
        domainMatch = hasPlantSubject ? 1.0 : hasIncompatibleSubject ? 0.0 : 0.15;
    } else if (isMedicalImaging) {
        domainMatch = /medical|radiology|clinical|hospital|scan|mri|ct|lesion|tumor/i.test(candidateBlob) ? 1.0 : 0.2;
    } else if (/audio|speech/i.test(rawDomain)) {
        domainMatch = /audio|speech|voice|sound|acoustic|wav/i.test(candidateBlob) ? 1.0 : 0.2;
    } else if (/financ|fraud|bank|tabular/i.test(rawDomain)) {
        domainMatch = /finance|fraud|bank|transaction|credit|tabular/i.test(candidateBlob) ? 1.0 : 0.2;
    }

    // ── 7. Dataset / Model Suitability (0.0 - 1.0) ───────────────────────────
    let suitability = 0.75;
    if (candidate.type === 'dataset') {
        const hasLicense = Boolean(candidate.license && candidate.license !== 'unknown');
        const hasDescription = (candidate.description?.length || 0) > 40;
        const hasFormats = (candidate.formats?.length || 0) > 0;
        suitability = (hasLicense ? 0.35 : 0.15) + (hasDescription ? 0.35 : 0.15) + (hasFormats ? 0.30 : 0.15);
    } else if (candidate.type === 'model') {
        const isPretrained = /pretrained|weights|checkpoint|transformer|unet|backbone/i.test(candidateBlob);
        const hasArch = Boolean(candidate.architecture && candidate.architecture !== 'Unknown');
        suitability = (isPretrained ? 0.5 : 0.2) + (hasArch ? 0.5 : 0.2);
    } else if (candidate.type === 'paper') {
        const hasDoi = Boolean(candidate.doi);
        const hasAbstract = (candidate.description?.length || 0) > 80;
        suitability = (hasDoi ? 0.5 : 0.2) + (hasAbstract ? 0.5 : 0.2);
    }

    // ── 8. Evidence Quality (0.0 - 1.0) ──────────────────────────────────────
    const evidenceQuality = Math.min(1.0, (
        (candidate.evidence?.length || 0) * 0.25 +
        ((candidate.description?.length || 0) > 100 ? 0.35 : 0.15) +
        (candidate.license ? 0.20 : 0.05) +
        (candidate.tags && candidate.tags.length > 2 ? 0.20 : 0.05)
    ));

    // ── 9. Overall Relevance ─────────────────────────────────────────────────
    const relevance = (
        anatomyMatch * 0.28 +
        taskMatch * 0.20 +
        modalityMatch * 0.18 +
        targetMatch * 0.12 +
        dimensionMatch * 0.08 +
        domainMatch * 0.06 +
        evidenceQuality * 0.05 +
        suitability * 0.03
    );

    // Build rationale
    const confirmed: string[] = [];
    if (anatomyMatch >= 0.9 && primaryAnatomy[0]) confirmed.push(`Anatomy: ${primaryAnatomy[0]}`);
    if (modalityMatch >= 0.9 && modalities[0]) confirmed.push(`Modality: ${modalities[0]}`);
    if (taskMatch >= 0.85 && task !== 'discovery') confirmed.push(`Task: ${task}`);
    if (dimensionMatch >= 0.9 && is3D) confirmed.push('3D Volume');
    if (targetMatch >= 0.8 && targets.length > 0) confirmed.push('Target labels');

    const reason = confirmed.length > 0
        ? `Verified alignment on ${confirmed.join(', ')}.`
        : 'Partial semantic alignment with query requirements.';

    return {
        relevance: Math.max(0, Math.min(1.0, relevance)),
        anatomyMatch,
        modalityMatch,
        taskMatch,
        dimensionMatch,
        targetMatch,
        domainMatch,
        suitability,
        evidenceQuality,
        reason,
    };
}
