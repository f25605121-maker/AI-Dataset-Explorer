/**
 * Context-Aware Hard Constraint Filter
 *
 * Eliminates fundamentally incompatible candidates before expensive semantic & cross-encoder ranking.
 * Distinguishes Primary Subject from Contextually Mentioned Subject to avoid naive keyword false rejections.
 *
 * STAGE 0: Universal Modality Compatibility Gate fires first (domain-agnostic).
 */

import { UnifiedCandidate, StructuredQueryUnderstanding } from './types';
import { isAnatomicalConflict, ANATOMY_ONTOLOGY } from './ontology';
import { checkModalityCompatibility } from './modalityCompatibilityMatrix';

export interface FilterDecision {
    rejected: boolean;
    reason?: string;
    isPrimarySubjectConflict?: boolean;
}

function cleanText(s?: any): string {
    if (Array.isArray(s)) return s.join(' ').toLowerCase().trim();
    if (typeof s === 'string') return s.toLowerCase().trim();
    return String(s ?? '').toLowerCase().trim();
}


/**
 * Checks if an anatomy mention is the PRIMARY subject of the candidate
 * rather than a passing comparative mention (e.g., "Unlike prior work on brain segmentation...").
 */
function isPrimarySubject(conflictTerm: string, title: string, tags: string[], description: string): boolean {
    const term = cleanText(conflictTerm);
    const t = cleanText(title);
    const tagStr = tags.map(cleanText).join(' ');

    // If conflict term appears directly in Title or Tags, it is almost certainly the primary subject
    const titleRegex = new RegExp(`\\b${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (titleRegex.test(t) || titleRegex.test(tagStr)) {
        return true;
    }

    // In description, check for primary phrasing vs comparative phrasing
    const desc = cleanText(description);
    const primaryIndicators = [
        new RegExp(`(?:dataset|benchmark|model|collection|consisting|images|scans|volumes)\\s+of\\s+[^.]*\\b${term}\\b`, 'i'),
        new RegExp(`\\b${term}\\b\\s+(?:segmentation|classification|detection|dataset|mri|ct|scans|images)`, 'i'),
        new RegExp(`we\\s+(?:present|introduce|release|evaluate|train)\\s+[^.]*\\b${term}\\b`, 'i'),
    ];

    return primaryIndicators.some(pattern => pattern.test(desc));
}

export function evaluateHardConstraints(
    candidate: UnifiedCandidate,
    understanding: StructuredQueryUnderstanding
): FilterDecision {
    const title = candidate.title || candidate.name || '';
    const desc = candidate.description || '';
    const tags = candidate.tags || [];
    const blob = `${title} ${tags.join(' ')} ${desc} ${candidate.task || ''} ${candidate.modality || ''} ${JSON.stringify(candidate.metadata)}`.toLowerCase();

    // ── STAGE 0: Universal Modality Compatibility Gate ────────────────────────
    // Runs before ANY domain-specific logic. If the query's physical data type is
    // fundamentally incompatible with the candidate's physical data type, reject immediately.
    const modalityGate = checkModalityCompatibility(
        blob,
        understanding.rawQuery,
        candidate.modality
    );
    if (modalityGate.compatibilityScore === 0) {
        return {
            rejected: true,
            reason: modalityGate.rejectionReason || `Modality gate: [${modalityGate.queryModalityGroup}] incompatible with [${modalityGate.candidateModalityGroup}]`,
            isPrimarySubjectConflict: true,
        };
    }

    // ── 1. Anatomical Conflict Guard ──────────────────────────────────────────

    if (understanding.anatomy.primary.length > 0 && understanding.constraints.mustMatchAnatomy) {
        // Check if candidate matches target anatomy
        const matchesTarget = understanding.anatomy.primary.some(term => {
            const regex = new RegExp(`\\b${term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
            return regex.test(blob);
        }) || understanding.anatomy.organs.some(organ => {
            const regex = new RegExp(`\\b${organ.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
            return regex.test(blob);
        });

        // Check if candidate matches any explicitly conflicting anatomy as its primary subject
        const conflictingPrimaryMatches: string[] = [];
        for (const exTerm of understanding.anatomy.excluded) {
            if (isPrimarySubject(exTerm, title, tags, desc)) {
                conflictingPrimaryMatches.push(exTerm);
            }
        }

        // Special guard: Abdominal query vs Brain/Glioma/Cardiac/Chest/Lung dataset
        const isAbdomenQuery = understanding.anatomy.primary.some(a => /abdomen|abdominal|liver|kidney|pancreas|spleen/i.test(a));
        const isConflictingChestOrBrain = /brain|glioma|lgg|hgg|brats|cerebral|hippocampus|cardiac|heart|myocardium|lung|chest|thorax|pneumonia/i.test(`${title} ${tags.join(' ')}`);
        const hasAbdomenInTitleOrTags = /abdomen|abdominal|liver|kidney|pancreas|spleen|stomach|gallbladder|visceral|peritoneal/i.test(`${title} ${tags.join(' ')}`);

        if (isAbdomenQuery && isConflictingChestOrBrain && !hasAbdomenInTitleOrTags) {
            return {
                rejected: true,
                reason: `Anatomical conflict: Query specifies abdominal anatomy (${understanding.anatomy.primary.join(', ')}), but resource primary subject is [${title}].`,
                isPrimarySubjectConflict: true,
            };
        }

        if (!matchesTarget && conflictingPrimaryMatches.length > 0) {
            return {
                rejected: true,
                reason: `Anatomical conflict: Query targets ${understanding.anatomy.primary.join('/')}, but resource primary subject is [${conflictingPrimaryMatches.slice(0, 3).join(', ')}].`,
                isPrimarySubjectConflict: true,
            };
        }
    }

    // ── 2. Modality Conflict Guard ────────────────────────────────────────────
    const reqModality = understanding.modality[0]?.toLowerCase();
    if (reqModality && understanding.constraints.mustMatchModality && reqModality !== 'multimodal_or_general') {
        const candModality = cleanText(candidate.modality || candidate.modalities?.join(' ') || '');

        // Medical / microscopic imaging query vs non-imaging tabular survey / audio / NLP
        const isMedicalImagingQuery = /mri|ct|x.?ray|ultrasound|pet|cryo|electron\s*tomograph|microscop|fluorescen/i.test(reqModality);
        let isTabularResource = candModality === 'tabular' || /health indicator|nhanes|cdc survey|tabular|questionnaire|lifestyle survey/i.test(blob) || (candidate.formats && candidate.formats.length > 0 && candidate.formats.every(f => /csv|tsv|xlsx/i.test(f)) && !/mri|ct|dicom|nii|nifti|scan|image|cryo|mrc|tomogram/i.test(blob));
        if (/mrc|\.mrc|\.em|tomogram|tilt.?series|subtomogram|macromolecule/i.test(blob)) {
            isTabularResource = false;
        }
        const isAudioResource = /audio|speech|wav|sound/i.test(`${title} ${candModality}`) && !isMedicalImagingQuery;
        const isTextOnlyResource = candModality === 'text' && !/mri|ct|scan|imaging|image/i.test(blob);

        if (isMedicalImagingQuery && isTabularResource) {
            return {
                rejected: true,
                reason: 'Modality conflict: Medical imaging query requires volumetric/image data, but candidate is a tabular/CSV dataset.',
            };
        }

        if (isMedicalImagingQuery && isAudioResource) {
            return {
                rejected: true,
                reason: `Modality conflict: Medical imaging query (${reqModality}) incompatible with audio/speech resource (${title}).`,
            };
        }

        if (isMedicalImagingQuery && isTextOnlyResource) {
            return {
                rejected: true,
                reason: `Modality conflict: Medical imaging query (${reqModality}) incompatible with pure text resource.`,
            };
        }

        // Cross-imaging explicit contradiction (e.g. strictly requested MRI, but title is CT scan only without MRI)
        if (reqModality === 'mri' && /\bct\s*scan\b|\bcomputed\s*tomography\b/i.test(title) && !/mri|mr|multimodal/i.test(blob)) {
            return {
                rejected: true,
                reason: `Modality conflict: Query requires MRI, but resource is strictly CT (${title}).`,
            };
        }

        if (reqModality === 'audio' && (/mri|ct|image|vision|x.?ray|radiograph|chest/i.test(title) || candidate.modality === 'X-ray') && !/audio|speech|sound|acoustic|wav/i.test(blob)) {
            return {
                rejected: true,
                reason: `Modality conflict: Query requires audio/speech, but resource is image/vision/X-ray (${title}).`,
            };
        }

        if (reqModality === 'tabular' && (/mri|ct\b|x.?ray|radiograph|dicom/i.test(title) || candidate.modality === 'MRI' || candidate.modality === 'CT' || candidate.modality === 'X-ray') && !/tabular|csv|dataframe/i.test(blob)) {
            return {
                rejected: true,
                reason: `Modality conflict: Query requires tabular data, but candidate is an imaging scan (${title}).`,
            };
        }
    }

    // ── 3. Domain Conflict Guard ──────────────────────────────────────────────
    if (understanding.domain === 'finance_tabular') {
        if (/diabetes|abdomen|chest|brain|pneumonia|tumor|cancer|mri|x.?ray|organ/i.test(blob) && !/fraud|credit|finan|bank|transaction/i.test(blob)) {
            return {
                rejected: true,
                reason: 'Domain conflict: Financial fraud query incompatible with clinical medical dataset.',
            };
        }
    }

    // ── 4. Task Conflict Guard ────────────────────────────────────────────────
    const reqTask = understanding.task;
    if (reqTask && reqTask !== 'discovery' && understanding.constraints.mustMatchTask) {
        if (reqTask === 'segmentation') {
            // If candidate is strictly tabular classification without images
            if (candidate.modality === 'tabular' && !/segmentation|mask|voxel/i.test(blob)) {
                return {
                    rejected: true,
                    reason: 'Task conflict: Segmentation query incompatible with tabular classification resource.',
                };
            }
        }
    }

    return { rejected: false };
}

export function applyHardFiltering(
    candidates: UnifiedCandidate[],
    understanding: StructuredQueryUnderstanding
): { passed: UnifiedCandidate[]; rejected: { candidate: UnifiedCandidate; reason: string }[] } {
    const passed: UnifiedCandidate[] = [];
    const rejected: { candidate: UnifiedCandidate; reason: string }[] = [];

    for (const cand of candidates) {
        const decision = evaluateHardConstraints(cand, understanding);
        if (decision.rejected) {
            cand.rejected = true;
            cand.rejectionReason = decision.reason || 'Hard constraint filter';
            cand.matchScore = 0;
            rejected.push({ candidate: cand, reason: decision.reason || 'Incompatible' });
        } else {
            cand.rejected = false;
            cand.rejectionReason = null;
            passed.push(cand);
        }
    }

    return { passed, rejected };
}
