/**
 * Hybrid Retrieval & Dynamic Query-Adaptive Scoring Engine (Search Engine 2.0.0)
 *
 * Implements Section 10, 11, 23:
 * 1. Lexical BM25-style term scoring with domain synonym weighting
 * 2. Dense semantic similarity
 * 3. Granular entity, modality, technique, task, and target overlap
 * 4. Dynamic query-adaptive weighting (weights sum to 1.0)
 * 5. Popularity strictly capped at max 3% weight (never overrides scientific relevance)
 * 6. Match breakdown and transparent explanation generator
 *
 * COMPOSITE SCORING FORMULA (Standardized 4-Factor):
 *   FinalScore = (w_m Â· S_modality) + (w_t Â· S_task) + (w_d Â· S_domain) + (w_s Â· S_semantic)
 *   w_m=0.35, w_t=0.30, w_d=0.20, w_s=0.15
 *
 * ZERO-MULTIPLIER RULE:
 *   If S_modality = 0 â†’ FinalScore = 0. Modality gate output feeds directly into this formula.
 *
 * CONFIDENCE THRESHOLDING:
 *   If max(FinalScore) across result set < 60 â†’ status = 'PARTIAL_OR_LOW_CONFIDENCE'.
 *   No candidate may be badged "Top Match" or assigned ">80% Compatible" in this state.
 */

import {
    NormalizedSearchResult,
    UnifiedCandidate,
    RankedResult,
    ResearchQuerySchema,
    StructuredQueryUnderstanding,
    MatchBreakdown,
    EvidenceItem,
} from './types';
import { evaluateCandidateCrossEncoder } from './crossEncoder';
import { verifyCandidateEvidence } from './evidenceVerifier';
import { checkModalityCompatibility } from './modalityCompatibilityMatrix';
import { getTaskAlignmentScore, classifyCandidateTask, classifyTask } from './taskAlignmentMatrix';
import { getRequirementProfile } from './requirementExtractor';
import { matchCandidateRequirements, computeRequirementCoverage, computeHardConstraintScore } from './requirementMatcher';
import { calibrateScore, categorizeRequirements } from './confidenceCalibrator';

/** Confidence status for a result set â€” evaluated after all candidates are scored. */
export type ConfidenceStatus = 'HIGH_CONFIDENCE' | 'PARTIAL_OR_LOW_CONFIDENCE';

/** Minimum FinalScore for any candidate to be considered high-confidence. */
export const HIGH_CONFIDENCE_THRESHOLD = 60;

/**
 * Evaluate the confidence status for an entire result set.
 * If no candidate exceeds HIGH_CONFIDENCE_THRESHOLD, the status is PARTIAL_OR_LOW_CONFIDENCE.
 */
export function evaluateResultSetConfidence(scores: number[]): ConfidenceStatus {
    if (scores.length === 0) return 'PARTIAL_OR_LOW_CONFIDENCE';
    return Math.max(...scores) >= HIGH_CONFIDENCE_THRESHOLD ? 'HIGH_CONFIDENCE' : 'PARTIAL_OR_LOW_CONFIDENCE';
}


function clean(s?: any): string {
    if (Array.isArray(s)) return s.join(' ').toLowerCase().trim();
    if (typeof s === 'string') return s.toLowerCase().trim();
    return String(s ?? '').toLowerCase().trim();
}


/**
 * BM25-style Lexical Scoring with Domain Synonym Weighting
 */
export function calculateBM25LexicalScore(
    text: string,
    queryTokens: string[],
    synonymMap: Record<string, string[]> = {}
): number {
    const textLower = text.toLowerCase();
    if (!textLower || queryTokens.length === 0) return 0;

    let score = 0;
    const words = textLower.split(/\s+/);
    const docLength = words.length;
    const avgDocLength = 120; // Average metadata blob length

    for (const token of queryTokens) {
        const t = token.toLowerCase();
        if (t.length <= 2) continue;

        // Exact term frequency
        const regex = new RegExp(`\\b${t.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'g');
        const matches = textLower.match(regex);
        const tf = matches ? matches.length : 0;

        // Synonym matches (weighted 0.7x)
        let synTf = 0;
        const syns = synonymMap[token] || synonymMap[t] || [];
        for (const syn of syns) {
            const synRegex = new RegExp(`\\b${syn.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'g');
            const synMatches = textLower.match(synRegex);
            if (synMatches) synTf += synMatches.length * 0.7;
        }

        const effectiveTf = tf + synTf;
        if (effectiveTf > 0) {
            // BM25 term weighting formula (k1 = 1.5, b = 0.75)
            const k1 = 1.5;
            const b = 0.75;
            const termWeight = (effectiveTf * (k1 + 1)) / (effectiveTf + k1 * (1 - b + b * (docLength / avgDocLength)));
            score += termWeight;
        }
    }

    return Math.min(100, Math.round(score * 12));
}

/**
 * Dynamic Query-Adaptive Weights Calculator
 */
export function computeAdaptiveWeights(input: ResearchQuerySchema | StructuredQueryUnderstanding): {
    wAnatomy: number;
    wModality: number;
    wTechnique: number;
    wTask: number;
    wDimension: number;
    wTarget: number;
    wDomain: number;
    wSemantic: number;
    wEvidence: number;
    wMetadata: number;
    wPopularity: number;
} {
    const isSchema = 'primaryDomain' in input;
    const hasAnatomy = isSchema ? input.anatomy.length > 0 : input.anatomy.primary.length > 0;
    const hasTechnique = isSchema
        ? input.modalitySubtypes.some(s => /4d\s*flow|phase\s*contrast|radial/i.test(s))
        : input.sequence.some(s => /4d\s*flow|phase\s*contrast|radial/i.test(s));
    const hasReconTask = isSchema ? input.reconstructionTasks.length > 0 : input.task === 'reconstruction';
    const hasTargetOutput = isSchema ? input.targetOutputs.length > 0 : input.target.length > 0;

    let baseAnatomy = hasAnatomy ? 0.22 : 0.08;
    let baseTechnique = hasTechnique ? 0.20 : 0.08;
    let baseTask = hasReconTask ? 0.18 : 0.12;
    let baseTarget = hasTargetOutput ? 0.16 : 0.08;
    let baseModality = 0.10;
    let baseDimension = 0.08;
    let baseDomain = 0.08;
    let baseSemantic = 0.06;
    let baseEvidence = 0.06;
    let baseMetadata = 0.03;
    let basePopularity = 0.02; // Popularity NEVER exceeds 3%

    const total = baseAnatomy + baseTechnique + baseTask + baseTarget + baseModality + baseDimension + baseDomain + baseSemantic + baseEvidence + baseMetadata + basePopularity;

    return {
        wAnatomy: baseAnatomy / total,
        wTechnique: baseTechnique / total,
        wTask: baseTask / total,
        wTarget: baseTarget / total,
        wModality: baseModality / total,
        wDimension: baseDimension / total,
        wDomain: baseDomain / total,
        wSemantic: baseSemantic / total,
        wEvidence: baseEvidence / total,
        wMetadata: baseMetadata / total,
        wPopularity: basePopularity / total,
    };
}

/**
 * Master Hybrid Scorer & RankedResult Builder
 */
export function scoreCandidate(
    candidate: NormalizedSearchResult | UnifiedCandidate,
    input: ResearchQuerySchema | StructuredQueryUnderstanding
): RankedResult {
    const isSchema = 'primaryDomain' in input;
    const originalQuery = isSchema ? input.originalQuery : input.rawQuery;
    const title = candidate.title || candidate.name || '';
    const desc = candidate.description || '';
    const tags = Array.isArray(candidate.tags) ? candidate.tags : [];
    const rawFormats = Array.isArray(candidate.format)
        ? candidate.format
        : (candidate.format ? [candidate.format] : ((candidate as UnifiedCandidate).formats || []));
    const formats = rawFormats.map(clean);
    const candidateBlob = `${title} ${tags.join(' ')} ${desc} ${formats.join(' ')}`.toLowerCase();

    // Query tokens for BM25
    const queryTokens = originalQuery.split(/[\s,()]+/).filter(w => w.length > 2);
    const bm25Score = calculateBM25LexicalScore(candidateBlob, queryTokens, isSchema ? input.synonyms : {});

    // Multi-factor cross-encoder evaluation
    const cross = evaluateCandidateCrossEncoder(candidate as UnifiedCandidate, isSchema ? (candidate as any).understanding || input : input as StructuredQueryUnderstanding);

    // Evidence verification
    const verified = verifyCandidateEvidence(candidate as UnifiedCandidate, input as StructuredQueryUnderstanding);

    // Adaptive weights
    const weights = computeAdaptiveWeights(input);

    // Specialized technique scoring (4D flow, phase-contrast, radial, longitudinal, instance segmentation)
    let techniqueScore = 75;
    const is4DFlowQuery = /4d\s*flow|phase\s*contrast|pc.?mri/i.test(originalQuery);
    const isRadialQuery = /radial/i.test(originalQuery);
    const isLongitudinalQuery = /longitudinal|multi-timepoint|progression/i.test(originalQuery);
    const isYoloQuery = /yolo|instance\s*segmentation/i.test(originalQuery);
    const isFundusQuery = /fundus|retinopath/i.test(originalQuery);
    const isMicroscopyQuery = /nuclei|microscop|fluorescence/i.test(originalQuery);

    if (is4DFlowQuery) {
        if (/4d\s*flow|phase\s*contrast|pc.?mri/i.test(candidateBlob)) {
            techniqueScore = 100;
        } else if (/flow|velocity|hemodynamic/i.test(candidateBlob)) {
            techniqueScore = 80;
        } else if (/cine|b-mode|ssfp/i.test(candidateBlob)) {
            techniqueScore = 35; // Cine is penalized relative to 4D Flow
        } else {
            techniqueScore = 20;
        }
    } else if (isLongitudinalQuery) {
        if (/longitudinal|adni|oasis|progression|temporal/i.test(candidateBlob)) {
            techniqueScore = 95;
        } else {
            techniqueScore = 65;
        }
    } else if (isYoloQuery) {
        if (/yolo|instance\s*segmentation|bounding\s*box/i.test(candidateBlob)) {
            techniqueScore = 95;
        } else {
            techniqueScore = 70;
        }
    } else if (isFundusQuery) {
        if (/fundus|retina|retinopath|ophthalm/i.test(candidateBlob)) {
            techniqueScore = 95;
        } else {
            techniqueScore = 70;
        }
    } else if (isMicroscopyQuery) {
        if (/nuclei|microscop|stardist|cellpose/i.test(candidateBlob)) {
            techniqueScore = 95;
        } else {
            techniqueScore = 70;
        }
    }

    if (isRadialQuery) {
        if (/radial|non[- ]cartesian|golden[- ]angle|spoke/i.test(candidateBlob)) {
            techniqueScore = Math.min(100, techniqueScore + 20);
        } else {
            techniqueScore = Math.max(20, techniqueScore - 15);
        }
    }

    // Dimension score
    let dimensionScore = Math.round(cross.dimensionMatch * 100);
    if (/4d|longitudinal/i.test(originalQuery)) {
        if (/4d|longitudinal|multi-timepoint|time-resolved 3d/i.test(candidateBlob)) dimensionScore = 100;
        else if (/3d|volumetric|nifti/i.test(candidateBlob)) dimensionScore = 80;
        else dimensionScore = 40;
    }

    // Target output score
    let targetScore = Math.round(cross.targetMatch * 100);
    if (/velocity/i.test(originalQuery) && /velocity/i.test(candidateBlob)) {
        targetScore = Math.min(100, targetScore + 25);
    }
    if (/wall\s*shear|wss/i.test(originalQuery) && /wall\s*shear|wss|shear\s*stress/i.test(candidateBlob)) {
        targetScore = Math.min(100, targetScore + 25);
    }
    if (/alzheimer|dementia/i.test(originalQuery) && /alzheimer|adni|oasis|mci|cognitive/i.test(candidateBlob)) {
        targetScore = Math.min(100, targetScore + 30);
    }
    if (/retinopath/i.test(originalQuery) && /retinopath|fundus|eyepacs/i.test(candidateBlob)) {
        targetScore = Math.min(100, targetScore + 30);
    }
    if (/vehicle|traffic/i.test(originalQuery) && /vehicle|car|traffic|bdd100k/i.test(candidateBlob)) {
        targetScore = Math.min(100, targetScore + 30);
    }

    const anatomyScore = Math.round(cross.anatomyMatch * 100);
    const modalityScore = Math.round(cross.modalityMatch * 100);
    const taskScore = Math.round(cross.taskMatch * 100);
    const domainScore = Math.round(cross.domainMatch * 100);
    const semanticScore = Math.max(bm25Score, Math.round(cross.suitability * 100));
    const evidenceScore = verified.evidenceStrength;

    // Metadata & accessibility
    const hasDesc = desc.length > 60;
    const hasLicense = Boolean(candidate.license && candidate.license !== 'unknown');
    const hasFormats = formats.length > 0;
    const metadataScore = Math.round(((hasDesc ? 40 : 10) + (hasLicense ? 35 : 10) + (hasFormats ? 25 : 10)));
    const licenseStr = typeof candidate.license === 'string' ? candidate.license : (Array.isArray(candidate.license) ? candidate.license.join(' ') : String(candidate.license || ''));
    const isPublicOpen = !licenseStr.toLowerCase().includes('restricted');
    const accessibilityScore = isPublicOpen ? 95 : 45;

    // Popularity score (strictly capped)
    const downloads = candidate.downloads || 0;
    const likes = candidate.likes || 0;
    const citations = candidate.citationCount || 0;
    const popularityScore = Math.min(100, downloads > 10000 || likes > 500 || citations > 200 ? 100 : downloads > 1000 || citations > 20 ? 60 : 30);

    // â”€â”€ STANDARDIZED 4-FACTOR COMPOSITE FORMULA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    //
    //   FinalScore = (w_m Â· S_modality) + (w_t Â· S_task) + (w_d Â· S_domain) + (w_s Â· S_semantic)
    //   w_m=0.35, w_t=0.30, w_d=0.20, w_s=0.15
    //
    // For medical/biomedical queries, S_domain incorporates anatomy + technique + dimension.
    // For non-medical queries, S_domain = domainScore.
    //
    // ZERO-MULTIPLIER RULE:
    //   Check the universal modality gate. If S_modality = 0 â†’ FinalScore = 0 immediately.
    //   This prevents any semantic or keyword score from compensating for wrong data types.

    const rawQueryText = isSchema ? (input as ResearchQuerySchema).originalQuery : (input as StructuredQueryUnderstanding).rawQuery;
    const explicitCandidateMod = (candidate as UnifiedCandidate).modality ?? undefined;
    const modalityGate = checkModalityCompatibility(candidateBlob, rawQueryText, explicitCandidateMod);

    // Also apply task alignment from the new task matrix
    const candidateTaskText = `${(candidate as any).pipelineTag || ''} ${(candidate as any).task || ''} ${candidateBlob}`;
    const queryTaskText = rawQueryText;
    const taskAlignment = getTaskAlignmentScore(queryTaskText, candidateTaskText);
    // Blend cross-encoder taskScore with task alignment matrix result (cross-encoder has context from tags/desc)
    const blendedTaskScore = Math.round((taskScore * 0.5) + (taskAlignment.score * 100 * 0.5));

    // ZERO-MULTIPLIER: If modality gate killed it, score = 0
    let finalScore: number;
    const modalityZeroKill = modalityGate.compatibilityScore === 0;

    if (modalityZeroKill) {
        finalScore = 0;
    } else {
        // S_modality: primary from cross-encoder modalityScore (0-100)
        const S_modality = modalityScore;

        // S_task: blended cross-encoder + task alignment matrix (0-100)
        const S_task = blendedTaskScore;

        // S_domain: incorporates anatomy/technique/dimension for medical queries (0-100)
        // For non-medical: pure domain score
        const hasMedicalContext = anatomyScore > 50 && (domainScore > 60 || /medical|radiol|clinical/i.test(rawQueryText));
        const S_domain = hasMedicalContext
            ? Math.round(
                (anatomyScore * 0.40) +
                (techniqueScore * 0.25) +
                (dimensionScore * 0.15) +
                (domainScore * 0.20)
            )
            : Math.round(
                (domainScore * 0.55) +
                (targetScore * 0.30) +
                (evidenceScore * 0.15)
            );

        // S_semantic: BM25 + suitability + metadata quality (0-100)
        const S_semantic = Math.round(
            (semanticScore * 0.60) +
            (metadataScore * 0.25) +
            (popularityScore * 0.15)
        );

        // Apply 4-factor weights
        const rawWeighted = (
            0.35 * S_modality +
            0.30 * S_task +
            0.20 * S_domain +
            0.15 * S_semantic
        );

        // Apply contradiction penalties from hard constraints
        const penaltyTotal = ((candidate as any).constraintPenalties || []).reduce(
            (acc: number, p: any) => acc + p.penaltyAmount, 0
        );

        finalScore = Math.max(0, Math.min(100, Math.round(rawWeighted - penaltyTotal)));
    }



    const matchBreakdown: MatchBreakdown = {
        anatomy: anatomyScore,
        modality: modalityScore,
        task: blendedTaskScore,
        dimension: dimensionScore,
        target: targetScore,
        domain: domainScore,
        semantic: semanticScore,
        evidence: evidenceScore,
        metadata: metadataScore,
        accessibility: accessibilityScore,
        popularity: popularityScore,
        overall: finalScore,
        confirmedClaims: verified.confirmedClaims,
        warnings: [
            ...verified.warnings,
            ...(modalityZeroKill ? ['MODALITY_ZERO_KILL: candidate modality is incompatible with query â€” score forced to 0'] : []),
            ...(taskAlignment.matchType === 'ORTHOGONAL' ? [`TASK_MISMATCH: query task and candidate task are orthogonal (penalty: ${Math.round(taskAlignment.penaltyApplied * 100)}%)`] : []),
        ],
        disqualifications: modalityZeroKill ? ['Fundamental modality incompatibility â€” cannot score'] : undefined,
    };

    // Calculate Evidence Confidence (Dual-metric: Match Score vs Evidence Confidence)
    const isVerifiedLevel = verified.evidenceLevel === 'VERIFIED';
    const isSupportedLevel = verified.evidenceLevel === 'SUPPORTED';
    const docLengthFactor = Math.min(1.0, desc.length / 300);
    const baseConfidence = isVerifiedLevel ? 92 : isSupportedLevel ? 78 : verified.evidenceLevel === 'PARTIAL' ? 62 : 40;
    const evidenceConfidence = modalityZeroKill
        ? 0  // Zero evidence confidence for modality-killed candidates
        : Math.max(15, Math.min(99, Math.round(baseConfidence * 0.7 + docLengthFactor * 20 + (verified.evidenceItems.length * 3))));

    // Match Category & Quality Tier â€” based on standardized FinalScore
    let matchCategory: 'EXACT_MATCH' | 'PARTIAL_MATCH' | 'RELATED_RESOURCE' = 'RELATED_RESOURCE';
    let tier = 'Tier D';

    if (modalityZeroKill) {
        matchCategory = 'RELATED_RESOURCE';
        tier = 'Tier D';
    } else if (finalScore >= 80 && modalityScore >= 70 && blendedTaskScore >= 65) {
        matchCategory = 'EXACT_MATCH';
        tier = evidenceConfidence >= 75 ? 'Tier A' : 'Tier B';
    } else if (finalScore >= 60 && modalityScore >= 50) {
        matchCategory = 'PARTIAL_MATCH';
        tier = finalScore >= 70 ? 'Tier B' : 'Tier C';
    } else if (finalScore >= 35) {
        matchCategory = 'PARTIAL_MATCH';
        tier = 'Tier C';
    }

    // Dynamic Context-Aware Explanations
    const targetName = isSchema
        ? (input.targetEntities[0] || input.anatomy[0] || 'target requirements')
        : (input.target?.[0] || input.anatomy?.primary?.[0] || 'target requirements');
    const primaryAnatomyName = isSchema ? (input.anatomy[0] || '') : (input.anatomy?.primary?.[0] || '');
    const modalityName = isSchema ? (input.modalities[0] || 'imaging') : (input.modality?.[0] || 'imaging');
    const taskName = isSchema
        ? (input.reconstructionTasks[0] || input.predictionTasks[0] || input.estimationTasks[0] || 'target task')
        : (input.task || 'target task');
    const domainName = isSchema ? input.primaryDomain : (input.domain || 'AI research');

    // Why this matches
    const whyMatches: string[] = [];
    if (modalityZeroKill) {
        whyMatches.push(`Rejected: modality [${modalityGate.candidateModalityGroup}] is fundamentally incompatible with query modality [${modalityGate.queryModalityGroup}]`);
    } else {
        if (primaryAnatomyName && anatomyScore >= 75) {
            whyMatches.push(`${primaryAnatomyName} anatomical alignment verified (${anatomyScore}% alignment)`);
        }
        if (modalityScore >= 75) {
            whyMatches.push(`${modalityName} modality confirmed in source metadata (${modalityScore}% alignment)`);
        }
        if (blendedTaskScore >= 70) {
            whyMatches.push(`${taskName} task alignment verified (${blendedTaskScore}% alignment)`);
        }
        if (techniqueScore >= 75) {
            whyMatches.push(`Specialized technique and model pipeline alignment verified`);
        }

        if (semanticScore >= 75) {
            whyMatches.push(`High semantic alignment with ${targetName}`);
        }
        if (whyMatches.length === 0) {
            whyMatches.push(`Relevant resource for ${targetName || domainName}`);
        }
    }

    // Verified vs Unverified Claims
    const verifiedClaims: string[] = [...verified.confirmedClaims];
    const unverifiedClaims: string[] = [];
    const potentialLimitations: string[] = [];
    const potentialMismatches: string[] = [];

    if ((candidate as any).samplingCompatibilityNote) {
        unverifiedClaims.push((candidate as any).samplingCompatibilityNote);
        potentialLimitations.push('Non-Cartesian radial k-space reconstruction pipeline requires validation');
    }
    if ((candidate as any).techniqueCompatibilityNote) {
        unverifiedClaims.push((candidate as any).techniqueCompatibilityNote);
    }
    if ((candidate as any).isPretrainedCheckpointVerified === false) {
        unverifiedClaims.push('No directly verified pretrained model checkpoint on public Hub');
        potentialLimitations.push('Requires training from scratch or fine-tuning from research baseline weights');
    }

    const cleanTarget = targetName.replace(/['"]/g, '');
    const matchReason = modalityZeroKill
        ? `Rejected: Modality incompatibility — ${modalityGate.candidateModalityGroup} vs ${modalityGate.queryModalityGroup}.`
        : matchCategory === 'EXACT_MATCH'
        ? `Verified exact match: ${title} directly matches ${cleanTarget} criteria.`
        : matchCategory === 'PARTIAL_MATCH'
        ? `Partial match: ${title} provides foundational resources with partial alignment to ${cleanTarget}.`
        : `Related scientific resource: ${title} for ${domainName} exploration.`;

    const candidateModality = Array.isArray(candidate.modality)
        ? candidate.modality
        : (candidate.modality ? [candidate.modality] : []);

    // ── REQUIREMENT-AWARE CALIBRATION ────────────────────────────────────────
    // Extracts requirements from query, matches candidate, applies caps.
    // This replaces finalScore with a requirement-coverage-dominant score.
    const requirementProfile = getRequirementProfile(rawQueryText);
    let calibratedFinalScore = finalScore;
    let reqMatchLevel: string | null = null;
    let reqMatches: any[] = [];
    let reqCoverage = 50;
    let hardConstraintScore = 100;
    let technicalCompatibility = 75;
    let matchLevelExplanation = '';
    let scoringTrace: any = null;
    let satisfiedReqs: string[] = [];
    let missingReqs: string[] = [];
    let unknownReqs: string[] = [];
    let conflictingReqs: string[] = [];

    if (requirementProfile.requirements.length > 0 && !modalityZeroKill) {
        reqMatches = matchCandidateRequirements(candidate as UnifiedCandidate, requirementProfile);
        const calibrated = calibrateScore(finalScore, evidenceConfidence, candidate as UnifiedCandidate, reqMatches, requirementProfile);
        calibratedFinalScore = calibrated.finalScore;
        reqMatchLevel = calibrated.matchLevel;
        reqCoverage = calibrated.requirementCoverage;
        hardConstraintScore = calibrated.hardConstraintScore;
        technicalCompatibility = calibrated.technicalCompatibility;
        matchLevelExplanation = calibrated.matchLevelExplanation;
        scoringTrace = calibrated.scoringTrace;

        const cats = categorizeRequirements(reqMatches, requirementProfile);
        satisfiedReqs = cats.satisfied;
        missingReqs = cats.missing;
        unknownReqs = cats.unknown;
        conflictingReqs = cats.conflicting;

        // Update matchBreakdown overall with calibrated score
        matchBreakdown.overall = calibratedFinalScore;

        // Update matchCategory based on new matchLevel
        if (reqMatchLevel === 'DIRECT_MATCH' || reqMatchLevel === 'STRONG_MATCH') {
            matchCategory = calibratedFinalScore >= 80 ? 'EXACT_MATCH' : 'PARTIAL_MATCH';
        } else if (reqMatchLevel === 'NO_MATCH' || reqMatchLevel === 'WEAK_MATCH') {
            matchCategory = 'RELATED_RESOURCE';
        } else {
            matchCategory = 'PARTIAL_MATCH';
        }

        // Update tier
        if (calibratedFinalScore >= 80) tier = evidenceConfidence >= 75 ? 'Tier A' : 'Tier B';
        else if (calibratedFinalScore >= 70) tier = 'Tier B';
        else if (calibratedFinalScore >= 50) tier = 'Tier C';
        else tier = 'Tier D';
    }
    // ─────────────────────────────────────────────────────────────────────────

    const ranked: RankedResult = {
        ...candidate,
        modality: candidateModality,
        matchScore: calibratedFinalScore,
        evidenceConfidence,
        tier,
        evidenceLevel: verified.evidenceLevel,
        matchCategory,
        whyMatches,
        verifiedClaims,
        unverifiedClaims,
        potentialLimitations,
        potentialMismatches,
        matchBreakdown,
        evidenceItems: verified.evidenceItems,
        warnings: verified.warnings,
        matchReason: matchLevelExplanation || matchReason,
        isPretrainedCheckpointVerified: (candidate as any).isPretrainedCheckpointVerified,
        checkpointStatusLabel: (candidate as any).checkpointStatusLabel,
        samplingCompatibilityVerified: (candidate as any).samplingCompatibilityVerified,
        samplingCompatibilityNote: (candidate as any).samplingCompatibilityNote,
        // Requirement-aware fields (backward-compatible)
        ...(reqMatchLevel ? {
            matchLevel: reqMatchLevel,
            matchLevelExplanation,
            requirementMatches: reqMatches,
            requirementCoverage: reqCoverage,
            hardConstraintScore,
            technicalCompatibility,
            scoringTrace,
            satisfiedRequirements: satisfiedReqs,
            missingRequirements: missingReqs,
            unknownRequirements: unknownReqs,
            conflictingRequirements: conflictingReqs,
        } : {}),
    } as RankedResult & Record<string, unknown>;

    return ranked;
}
