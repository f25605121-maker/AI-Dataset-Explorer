/**
 * Multi-Factor Cross-Encoder & Deep Re-Ranking Engine (Search Engine 2.0.0)
 *
 * Implements Section 11:
 * Takes the top 30-50 candidates per entity type and performs in-depth
 * cross-encoder evaluation against:
 * - Anatomy relevance
 * - Modality relevance (with zero-multiplier rule via universal gate)
 * - Task relevance (with task alignment matrix)
 * - Dimensionality compatibility
 * - Technique compatibility (4D flow vs cine)
 * - Sampling compatibility (radial k-space vs Cartesian)
 * - Target output compatibility (velocity field vs standard image)
 *
 * After scoring, evaluates result-set confidence:
 *   If max(FinalScore) < 60 → confidenceStatus = 'PARTIAL_OR_LOW_CONFIDENCE'
 *   In this state, no candidate may be labelled "Top Match" or ">80% Compatible".
 */

import {
    NormalizedSearchResult,
    UnifiedCandidate,
    RankedResult,
    ResearchQuerySchema,
    StructuredQueryUnderstanding,
} from './types';
import { scoreCandidate, evaluateResultSetConfidence, ConfidenceStatus } from './scoring';

export interface RerankResult {
    candidates: RankedResult[];
    confidenceStatus: ConfidenceStatus;
    /** Human-readable notice shown to users when confidence is low */
    lowConfidenceNotice: string | null;
    /** Best FinalScore in this result set */
    topScore: number;
}

export function rerankCandidates(
    candidates: (NormalizedSearchResult | UnifiedCandidate)[],
    querySchema: ResearchQuerySchema | StructuredQueryUnderstanding,
    topK = 50
): RankedResult[] {
    const scoredList: RankedResult[] = [];

    for (const cand of candidates) {
        const ranked = scoreCandidate(cand, querySchema);
        scoredList.push(ranked);
    }

    // Sort by Match Score descending, breaking ties with Evidence Confidence
    scoredList.sort((a, b) => {
        if (b.matchScore !== a.matchScore) {
            return b.matchScore - a.matchScore;
        }
        return b.evidenceConfidence - a.evidenceConfidence;
    });

    return scoredList.slice(0, topK);
}

/**
 * Full rerank with confidence status evaluation.
 * Use this when you need the result-set confidence status for the API response.
 */
export function rerankCandidatesWithConfidence(
    candidates: (NormalizedSearchResult | UnifiedCandidate)[],
    querySchema: ResearchQuerySchema | StructuredQueryUnderstanding,
    topK = 50
): RerankResult {
    const ranked = rerankCandidates(candidates, querySchema, topK);
    const scores = ranked.map(r => r.matchScore);
    const topScore = scores.length > 0 ? Math.max(...scores) : 0;
    const confidenceStatus = evaluateResultSetConfidence(scores);
    const lowConfidenceNotice = confidenceStatus === 'PARTIAL_OR_LOW_CONFIDENCE'
        ? 'No high-confidence matches found for this specific combination. Displaying nearest partial matches.'
        : null;

    return { candidates: ranked, confidenceStatus, lowConfidenceNotice, topScore };
}
