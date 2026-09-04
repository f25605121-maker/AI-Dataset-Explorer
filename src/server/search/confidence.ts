/**
 * Epistemic Confidence Scoring Engine
 *
 * Computes epistemic confidence scores (0-100) capturing metadata completeness,
 * evidence verification level, and constraint coverage—distinct from relevance.
 */

import { UnifiedCandidate, StructuredQueryUnderstanding, EvidenceLevel } from './types';

export function calculateConfidenceScore(
    candidate: UnifiedCandidate,
    evidenceLevel: EvidenceLevel,
    evidenceStrength: number,
    warningsCount: number
): number {
    let score = 30; // Base baseline

    // 1. Evidence Level Contribution (up to 40 pts)
    if (evidenceLevel === 'VERIFIED') score += 40;
    else if (evidenceLevel === 'SUPPORTED') score += 30;
    else if (evidenceLevel === 'PARTIAL') score += 15;
    else score += 5;

    // 2. Metadata Completeness Contribution (up to 20 pts)
    const hasDesc = (candidate.description?.length || 0) > 60;
    const hasLicense = Boolean(candidate.license && candidate.license !== 'unknown');
    const hasFormats = Boolean(candidate.formats && candidate.formats.length > 0);
    const hasTags = Boolean(candidate.tags && candidate.tags.length > 0);

    if (hasDesc) score += 6;
    if (hasLicense) score += 6;
    if (hasFormats) score += 4;
    if (hasTags) score += 4;

    // 3. Evidence Strength factor (up to 15 pts)
    score += Math.round((evidenceStrength / 100) * 15);

    // 4. Warning penalty (-5 pts per unverified constraint)
    score -= Math.min(25, warningsCount * 5);

    return Math.max(10, Math.min(100, score));
}

export function classifyMatchCategory(
    anatomyScore: number,
    modalityScore: number,
    taskScore: number,
    techniqueScore: number
): 'EXACT_MATCH' | 'PARTIAL_MATCH' | 'RELATED_RESOURCE' {
    if (anatomyScore >= 85 && modalityScore >= 85 && taskScore >= 80 && techniqueScore >= 75) {
        return 'EXACT_MATCH';
    } else if (anatomyScore >= 70 && modalityScore >= 70 && (taskScore >= 60 || techniqueScore >= 60)) {
        return 'PARTIAL_MATCH';
    }
    return 'RELATED_RESOURCE';
}

