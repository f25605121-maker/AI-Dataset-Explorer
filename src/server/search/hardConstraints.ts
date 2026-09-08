/**
 * Hard Constraints & Contradiction Evaluation Engine (Search Engine 2.0.0)
 *
 * Implements Section 13, 24, 25, 26:
 * - Anatomy Constraint: If target = cardiac, reject brain, hippocampus, glioma, stroke, lung, abdomen, etc.
 * - Modality Constraint: If MRI required, reject CT-only, audio, tabular, x-ray.
 * - Task Constraint: If reconstruction required, penalize/reject segmentation-only or classification-only.
 * - Dimensionality Constraint: If 4D required, 2D-only cannot be exact matches.
 * - Specialized Technique: Generic cardiac cine MRI is NOT considered equivalent to 4D Flow MRI.
 * - Target Output Constraint: Datasets without velocity information cannot be exact matches for velocity queries.
 * - Sampling Constraint: If radial undersampling required, datasets without non-Cartesian evidence marked "Sampling compatibility not verified".
 * - Non-Medical Conflict: Reject astronomy "flow", atmospheric flow, generic CFD aerodynamics, facial recognition, ImageNet.
 *
 * STAGE 0: Universal Modality Compatibility Gate (domain-agnostic, runs first).
 * If checkModalityCompatibility() returns compatibilityScore = 0, candidate is immediately
 * rejected. No anatomy, semantic, or task score can override this gate.
 */

import {
    NormalizedSearchResult,
    UnifiedCandidate,
    ResearchQuerySchema,
    StructuredQueryUnderstanding,
    RejectedResult,
} from './types';
import {
    ANATOMY_ONTOLOGY,
    MODALITY_ONTOLOGY,
    NON_MEDICAL_CONFLICT_DOMAINS,
    normalizeAnatomy,
} from './ontology';
import { checkModalityCompatibility } from './modalityCompatibilityMatrix';

export interface HardConstraintEvaluation {
    passed: boolean;
    reason: string | null;
    conflictType?: 'anatomy' | 'modality' | 'task' | 'domain' | 'dimensionality' | 'other';
    isPrimaryConflict: boolean;
    contradictionScore: number; // 0 - 100
    penalties: { reason: string; penaltyAmount: number }[];
    samplingCompatibilityVerified: boolean;
    samplingCompatibilityNote?: string;
    techniqueCompatibilityVerified: boolean;
    techniqueCompatibilityNote?: string;
}

function clean(s?: any): string {
    if (Array.isArray(s)) return s.join(' ').toLowerCase().trim();
    if (typeof s === 'string') return s.toLowerCase().trim();
    return String(s ?? '').toLowerCase().trim();
}


/**
 * Checks if a conflict term represents the PRIMARY subject of the candidate
 * rather than a passing comparative mention in the background section.
 */
function isPrimarySubject(term: string, title: string, tags: string[], description: string): boolean {
    const t = clean(title);
    const tagStr = tags.map(clean).join(' ');
    const termClean = clean(term);

    const regex = new RegExp(`\\b${termClean.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (regex.test(t) || regex.test(tagStr)) {
        return true;
    }

    const desc = clean(description);
    const primaryIndicators = [
        new RegExp(`(?:dataset|benchmark|model|collection|consisting|images|scans|volumes)\\s+of\\s+[^.]*\\b${termClean}\\b`, 'i'),
        new RegExp(`\\b${termClean}\\b\\s+(?:segmentation|classification|detection|dataset|mri|ct|scans|images)`, 'i'),
        new RegExp(`we\\s+(?:present|introduce|release|evaluate|train)\\s+[^.]*\\b${termClean}\\b`, 'i'),
    ];

    return primaryIndicators.some(pattern => pattern.test(desc));
}

export function evaluateCandidateHardConstraints(
    candidate: NormalizedSearchResult | UnifiedCandidate,
    input: ResearchQuerySchema | StructuredQueryUnderstanding
): HardConstraintEvaluation {
    const isSchema = 'primaryDomain' in input;
    const title = candidate.title || candidate.name || '';
    const desc = candidate.description || '';
    const tags = Array.isArray(candidate.tags) ? candidate.tags : [];
    const rawFormats = Array.isArray(candidate.format)
        ? candidate.format
        : (candidate.format ? [candidate.format] : ((candidate as UnifiedCandidate).formats || []));
    const formats = rawFormats.map(clean);
    const candidateBlob = `${title} ${tags.join(' ')} ${desc} ${formats.join(' ')} ${JSON.stringify(candidate.rawMetadata || candidate.metadata || {})}`.toLowerCase();

    const targetAnatomy = isSchema ? input.anatomy : input.anatomy.primary;
    const targetModalities = isSchema ? input.modalities : input.modality;
    const isCardiacQuery = targetAnatomy.some(a => /cardiac|heart|myocard|aort|coronary|cardiovascular/i.test(a)) ||
        (isSchema && input.primaryDomain.toLowerCase().includes('cardiovascular'));
    const isMriQuery = targetModalities.some(m => /mri/i.test(m));
    const is4DFlowQuery = isSchema
        ? input.modalitySubtypes.some(s => /4d\s*flow|phase\s*contrast|pc.?mri/i.test(s))
        : input.sequence.some(s => /4d\s*flow|phase\s*contrast|pc.?mri/i.test(s));
    const isRadialQuery = isSchema
        ? input.samplingStrategy.some(s => /radial/i.test(s))
        : /radial/i.test(input.rawQuery);
    const isVelocityReconQuery = isSchema
        ? input.reconstructionTasks.some(t => /velocity/i.test(t))
        : /velocity/i.test(input.task);
    const isWssQuery = isSchema
        ? input.estimationTasks.some(t => /wall\s*shear|wss/i.test(t))
        : /wall\s*shear|wss/i.test(input.rawQuery);

    const penalties: { reason: string; penaltyAmount: number }[] = [];
    let contradictionScore = 0;

    // ── STAGE 0: Universal Modality Compatibility Gate ─────────────────────────
    // Domain-agnostic hard rejection. Fires before ANY domain-specific check.
    // Zero-multiplier rule: if compatibilityScore = 0, FinalScore = 0 for this candidate.
    const rawQuery = isSchema ? input.originalQuery : input.rawQuery;
    const explicitCandidateModality = (candidate as UnifiedCandidate).modality ?? (candidate as any).modalities;
    const modalityGate = checkModalityCompatibility(candidateBlob, rawQuery, explicitCandidateModality);
    if (modalityGate.compatibilityScore === 0) {
        return {
            passed: false,
            reason: modalityGate.rejectionReason || `Universal modality gate: [${modalityGate.queryModalityGroup}] query incompatible with [${modalityGate.candidateModalityGroup}] candidate.`,
            conflictType: 'modality',
            isPrimaryConflict: true,
            contradictionScore: 100,
            penalties: [],
            samplingCompatibilityVerified: false,
            techniqueCompatibilityVerified: false,
        };
    }



    // ── 1. Non-Medical Contradiction Filter (Applied only to Biomedical Queries) ─
    const isMedicalQuery = (isSchema && input.primaryDomain.toLowerCase().includes('biomedical')) ||
        (!isSchema && input.domain === 'medical_imaging');

    if (isMedicalQuery) {
        for (const nonMed of NON_MEDICAL_CONFLICT_DOMAINS) {
            const matches = nonMed.regexPatterns.some(rx => rx.test(candidateBlob));
            if (matches) {
                // Check if there is genuine biomedical grounding
                const hasBiomedical = /patient|clinical|hospital|cardiac|heart|in\s*vivo|scan|dicom|mri|retina|fundus|tumor|cancer|brain|alzheimer|cell|nuclei/i.test(candidateBlob);
                if (!hasBiomedical || isPrimarySubject(nonMed.contradictionTerms[0], title, tags, desc)) {
                    return {
                        passed: false,
                        reason: `Non-medical domain conflict: Query is a biomedical AI problem, but candidate relates to ${nonMed.label} (${title}).`,
                        conflictType: 'domain',
                        isPrimaryConflict: true,
                        contradictionScore: 100,
                        penalties: [],
                        samplingCompatibilityVerified: false,
                        techniqueCompatibilityVerified: false,
                    };
                }
            }
        }
    }

    // ── 2. Anatomical & Pathology Conflict Filter ─────────────────────────────

    // ── 2a. COPD / Pulmonary Disease Specificity Filter ──────────────────────
    // If query is COPD-specific, reject lung cancer / non-COPD pulmonary datasets
    // that would otherwise pass modality checks (CT matches CT).
    const isCOPDQuery = (isSchema && /\bCOPD\b|chronic\s+obstructive\s+pulmonary|emphysema|spirometry|fev1|exacerbation/i.test(input.originalQuery)) ||
        (!isSchema && /\bCOPD\b|chronic\s+obstructive\s+pulmonary|emphysema|spirometry|fev1|exacerbation/i.test(input.rawQuery));

    if (isCOPDQuery) {
        // Reject lung cancer candidates that are NOT COPD
        const isLungCancerPrimary = isPrimarySubject('lung cancer', title, tags, desc) ||
            isPrimarySubject('nsclc', title, tags, desc) ||
            isPrimarySubject('non-small cell', title, tags, desc) ||
            isPrimarySubject('adenocarcinoma', title, tags, desc) ||
            (/lung\s*cancer|lung\s*carcinoma|nsclc/i.test(title) && !/copd|emphysema|spirometry|fev1|obstructive/i.test(candidateBlob));

        if (isLungCancerPrimary && !/copd|emphysema|spirometry|fev1|exacerbation|obstructive/i.test(candidateBlob)) {
            return {
                passed: false,
                reason: `Disease specificity conflict: Query specifies COPD / chronic obstructive pulmonary disease, but candidate is a lung cancer / oncology dataset [${title}]. These require different labels, populations, and predictive targets.`,
                conflictType: 'domain',
                isPrimaryConflict: true,
                contradictionScore: 90,
                penalties: [],
                samplingCompatibilityVerified: false,
                techniqueCompatibilityVerified: false,
            };
        }
    }

    const isAlzheimerQuery = (isSchema && /alzheimer|dementia|mild\s*cognitive|\bmci\b|adni|oasis|apoe|cognitive\s*progression/i.test(input.originalQuery)) ||
        (!isSchema && /alzheimer|dementia|mild\s*cognitive|\bmci\b|adni|oasis|apoe|cognitive\s*progression/i.test(input.rawQuery));
    const isBrainTumorQuery = (isSchema && /brain\s*tumor|brain\s*cancer|glioma|glioblastoma|meningioma|\bbrats\b/i.test(input.originalQuery)) ||
        (!isSchema && /brain\s*tumor|brain\s*cancer|glioma|glioblastoma|meningioma|\bbrats\b/i.test(input.rawQuery));
    const isRetinaQuery = targetAnatomy.some(a => /retina|eye|fundus|ophthalm/i.test(a)) ||
        (isSchema && input.primaryDomain.toLowerCase().includes('ophthalmology')) ||
        /retina|fundus|ophthalm|diabetic\s*retinopathy/i.test(candidateBlob);

    if (isAlzheimerQuery) {
        // Alzheimer's query vs Brain Tumor / Cancer candidate conflict
        const isTumorPrimary = isPrimarySubject('tumor', title, tags, desc) ||
            isPrimarySubject('cancer', title, tags, desc) ||
            isPrimarySubject('glioma', title, tags, desc) ||
            isPrimarySubject('glioblastoma', title, tags, desc) ||
            isPrimarySubject('brats', title, tags, desc) ||
            isPrimarySubject('lgg', title, tags, desc);

        if (isTumorPrimary && !/alzheimer|dementia|\bmci\b|cognitive/i.test(candidateBlob)) {
            return {
                passed: false,
                reason: `Pathology conflict: Query specifies Alzheimer's disease / neurodegenerative progression, but candidate primary subject is oncological brain tumor/cancer [${title}].`,
                conflictType: 'domain',
                isPrimaryConflict: true,
                contradictionScore: 95,
                penalties: [],
                samplingCompatibilityVerified: false,
                techniqueCompatibilityVerified: false,
            };
        }

        // Alzheimer's vs Cardiac
        if (isPrimarySubject('cardiac', title, tags, desc) || isPrimarySubject('heart', title, tags, desc)) {
            return {
                passed: false,
                reason: `Anatomical conflict: Query specifies Alzheimer neuroimaging, but candidate primary subject is cardiac [${title}].`,
                conflictType: 'anatomy',
                isPrimaryConflict: true,
                contradictionScore: 100,
                penalties: [],
                samplingCompatibilityVerified: false,
                techniqueCompatibilityVerified: false,
            };
        }
    } else if (isBrainTumorQuery) {
        // Brain Tumor query vs Alzheimer candidate conflict
        if (/alzheimer|dementia|\bmci\b/i.test(title) && !/tumor|cancer|glioma/i.test(title)) {
            return {
                passed: false,
                reason: `Pathology conflict: Query specifies brain tumors / oncology, but candidate primary subject is Alzheimer's disease [${title}].`,
                conflictType: 'domain',
                isPrimaryConflict: true,
                contradictionScore: 95,
                penalties: [],
                samplingCompatibilityVerified: false,
                techniqueCompatibilityVerified: false,
            };
        }
    } else if (isCardiacQuery) {
        // Brain conflict
        const isBrainPrimary = isPrimarySubject('brain', title, tags, desc) ||
            isPrimarySubject('hippocampus', title, tags, desc) ||
            isPrimarySubject('glioma', title, tags, desc) ||
            isPrimarySubject('stroke', title, tags, desc) ||
            isPrimarySubject('brats', title, tags, desc);

        if (isBrainPrimary && !/cardiac|heart/i.test(title)) {
            return {
                passed: false,
                reason: `Anatomical conflict: Query specifies cardiovascular/cardiac anatomy, but candidate primary subject is neurological/brain [${title}].`,
                conflictType: 'anatomy',
                isPrimaryConflict: true,
                contradictionScore: 100,
                penalties: [],
                samplingCompatibilityVerified: false,
                techniqueCompatibilityVerified: false,
            };
        }

        // Lung / Non-cardiac chest conflict
        const isLungPrimary = isPrimarySubject('lung', title, tags, desc) ||
            isPrimarySubject('pneumonia', title, tags, desc) ||
            isPrimarySubject('cxr', title, tags, desc) ||
            isPrimarySubject('chest x-ray', title, tags, desc);

        if (isLungPrimary && !/cardiac|heart|aorta|cardiovascular/i.test(title)) {
            return {
                passed: false,
                reason: `Anatomical conflict: Query targets cardiovascular anatomy, but candidate is a non-cardiac pulmonary/lung dataset [${title}].`,
                conflictType: 'anatomy',
                isPrimaryConflict: true,
                contradictionScore: 90,
                penalties: [],
                samplingCompatibilityVerified: false,
                techniqueCompatibilityVerified: false,
            };
        }

        // Abdominal / Prostate / Skin / Eye / Face conflict
        const otherConflictingTerms = ['abdomen', 'liver', 'kidney', 'pancreas', 'prostate', 'retina', 'melanoma', 'face'];
        for (const term of otherConflictingTerms) {
            if (isPrimarySubject(term, title, tags, desc) && !/cardiac|heart|aorta/i.test(title)) {
                return {
                    passed: false,
                    reason: `Anatomical conflict: Query targets cardiovascular anatomy, but candidate primary subject is ${term.toUpperCase()} [${title}].`,
                    conflictType: 'anatomy',
                    isPrimaryConflict: true,
                    contradictionScore: 95,
                    penalties: [],
                    samplingCompatibilityVerified: false,
                    techniqueCompatibilityVerified: false,
                };
            }
        }
    } else if (targetAnatomy.some(a => /retina|eye|fundus|ophthalm/i.test(a))) {
        // Eye / Retina query vs Brain / Cardiac / Abdomen / Skin
        const conflictingWithEye = ['cardiac', 'heart', 'brain', 'liver', 'kidney', 'lung', 'melanoma'];
        for (const term of conflictingWithEye) {
            if (isPrimarySubject(term, title, tags, desc) && !/retina|fundus|eye|ophthalm/i.test(title)) {
                return {
                    passed: false,
                    reason: `Anatomical conflict: Query specifies ophthalmic / retinal imaging, but candidate relates to ${term.toUpperCase()} [${title}].`,
                    conflictType: 'anatomy',
                    isPrimaryConflict: true,
                    contradictionScore: 95,
                    penalties: [],
                    samplingCompatibilityVerified: false,
                    techniqueCompatibilityVerified: false,
                };
            }
        }
    } else if (targetAnatomy.some(a => /brain|neuro|cerebral/i.test(a))) {
        // Brain query vs cardiac candidate
        if (isPrimarySubject('cardiac', title, tags, desc) || isPrimarySubject('heart', title, tags, desc)) {
            return {
                passed: false,
                reason: `Anatomical conflict: Query specifies brain neuroimaging, but candidate primary subject is cardiac [${title}].`,
                conflictType: 'anatomy',
                isPrimaryConflict: true,
                contradictionScore: 100,
                penalties: [],
                samplingCompatibilityVerified: false,
                techniqueCompatibilityVerified: false,
            };
        }
    }


    // ── 3. Modality Conflict Filter ───────────────────────────────────────────
    if (isMriQuery) {
        // Strict CT scan only (without MRI)
        const isCtOnly = (/\bct\s*scan\b|\bcomputed\s*tomography\b/i.test(title) || candidate.tags?.includes('ct')) &&
            !/mri|magnetic\s*resonance|mr\s*imaging|multimodal/i.test(candidateBlob);

        if (isCtOnly) {
            return {
                passed: false,
                reason: `Modality conflict: Query requires MRI, but candidate is strictly computed tomography (CT) [${title}].`,
                conflictType: 'modality',
                isPrimaryConflict: true,
                contradictionScore: 90,
                penalties: [],
                samplingCompatibilityVerified: false,
                techniqueCompatibilityVerified: false,
            };
        }

        // Pure tabular or speech audio
        const isAudioOrSpeech = /audio|speech|sound|wav/i.test(title) && !/mri|imaging/i.test(candidateBlob);
        if (isAudioOrSpeech) {
            return {
                passed: false,
                reason: `Modality conflict: MRI imaging query is incompatible with audio/speech resource [${title}].`,
                conflictType: 'modality',
                isPrimaryConflict: true,
                contradictionScore: 100,
                penalties: [],
                samplingCompatibilityVerified: false,
                techniqueCompatibilityVerified: false,
            };
        }
    }

    // ── 4. Task Conflict Penalty / Filter ─────────────────────────────────────
    if (isVelocityReconQuery) {
        // Segmentation-only with no raw data or reconstruction aspect
        const isSegmentationOnly = /segmentation|contour|delineation/i.test(title) &&
            !/reconstruction|k-space|velocity|flow|phase\s*contrast|raw/i.test(candidateBlob);

        if (isSegmentationOnly) {
            penalties.push({
                reason: 'Task mismatch: Query targets velocity reconstruction, but candidate is segmentation-only.',
                penaltyAmount: 35,
            });
            contradictionScore += 40;
        }
    }

    // ── 5. Specialized Technique & Sampling Compatibility ──────────────────────
    let techniqueCompatibilityVerified = true;
    let techniqueCompatibilityNote: string | undefined;

    if (is4DFlowQuery) {
        const has4DFlowEvidence = /4d\s*flow|phase\s*contrast|pc.?mri|velocity\s*field|velocity\s*encod/i.test(candidateBlob);
        const isGenericCine = /cine|short\s*axis|long\s*axis|b-mode|ssfp/i.test(candidateBlob) && !has4DFlowEvidence;

        if (isGenericCine) {
            techniqueCompatibilityVerified = false;
            techniqueCompatibilityNote = 'Generic cardiac cine MRI detected without 4D flow velocity encoding. Marked as partial match.';
            penalties.push({
                reason: 'Technique mismatch: Generic cardiac cine MRI is not equivalent to 4D flow velocity MRI.',
                penaltyAmount: 25,
            });
            contradictionScore += 30;
        } else if (!has4DFlowEvidence) {
            techniqueCompatibilityVerified = false;
            techniqueCompatibilityNote = '4D flow velocity encoding not explicitly verified in public documentation.';
            penalties.push({
                reason: 'Technique unverified: Public metadata does not confirm 4D flow phase-contrast acquisition.',
                penaltyAmount: 15,
            });
        }
    }

    let samplingCompatibilityVerified = true;
    let samplingCompatibilityNote: string | undefined;

    if (isRadialQuery) {
        const hasRadialEvidence = /radial|non[- ]cartesian|golden[- ]angle|spoke|sub[- ]nyquist/i.test(candidateBlob);
        if (!hasRadialEvidence) {
            samplingCompatibilityVerified = false;
            samplingCompatibilityNote = 'Sampling compatibility not verified: Public metadata does not verify raw radial/non-Cartesian k-space.';
            penalties.push({
                reason: 'Sampling unverified: No evidence of non-Cartesian/radial sampling found in metadata.',
                penaltyAmount: 12,
            });
        }
    }

    return {
        passed: true,
        reason: null,
        isPrimaryConflict: false,
        contradictionScore: Math.min(100, contradictionScore),
        penalties,
        samplingCompatibilityVerified,
        samplingCompatibilityNote,
        techniqueCompatibilityVerified,
        techniqueCompatibilityNote,
    };
}

export function applyHardConstraints<T extends NormalizedSearchResult | UnifiedCandidate>(
    candidates: T[],
    querySchema: ResearchQuerySchema | StructuredQueryUnderstanding
): {
    passed: T[];
    rejected: RejectedResult[];
} {
    const passed: T[] = [];
    const rejected: RejectedResult[] = [];

    for (const cand of candidates) {
        const evalResult = evaluateCandidateHardConstraints(cand, querySchema);
        if (!evalResult.passed) {
            (cand as any).rejected = true;
            (cand as any).rejectionReason = evalResult.reason;
            (cand as any).matchScore = 0;
            rejected.push({
                candidate: cand as unknown as NormalizedSearchResult,
                reason: evalResult.reason || 'Hard constraint conflict',
                conflictType: evalResult.conflictType || 'other',
            });
        } else {
            (cand as any).rejected = false;
            (cand as any).rejectionReason = null;
            (cand as any).samplingCompatibilityVerified = evalResult.samplingCompatibilityVerified;
            (cand as any).samplingCompatibilityNote = evalResult.samplingCompatibilityNote;
            (cand as any).techniqueCompatibilityVerified = evalResult.techniqueCompatibilityVerified;
            (cand as any).techniqueCompatibilityNote = evalResult.techniqueCompatibilityNote;
            (cand as any).contradictionScore = evalResult.contradictionScore;
            (cand as any).constraintPenalties = evalResult.penalties;
            passed.push(cand);
        }
    }

    return { passed, rejected };
}
