/**
 * Diversity & Maximum Marginal Relevance (MMR) Engine
 *
 * Prevents repetitive result sets by balancing high candidate relevance with diversity
 * across sub-organs, sequence variations, and repository sources.
 */

import { UnifiedCandidate } from './types';

function computeCandidateSimilarity(candA: UnifiedCandidate, candB: UnifiedCandidate): number {
    const textA = `${candA.title} ${(candA.tags || []).join(' ')} ${candA.task} ${candA.modality}`.toLowerCase();
    const textB = `${candB.title} ${(candB.tags || []).join(' ')} ${candB.task} ${candB.modality}`.toLowerCase();

    const tokensA = new Set(textA.split(/\s+/).filter(w => w.length > 2));
    const tokensB = new Set(textB.split(/\s+/).filter(w => w.length > 2));

    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersection = 0;
    for (const t of tokensA) {
        if (tokensB.has(t)) intersection++;
    }

    const jaccard = intersection / new Set([...tokensA, ...tokensB]).size;

    // Bonus similarity if same source and nearly identical title prefix
    const sameSource = candA.source === candB.source ? 0.15 : 0;
    const sameOrg = (candA.id.split('/')[0] === candB.id.split('/')[0]) ? 0.2 : 0;

    return Math.min(1.0, jaccard + sameSource + sameOrg);
}

/**
 * Apply Maximum Marginal Relevance (MMR)
 * MMR = λ * Relevance - (1 - λ) * max(Sim(d, d_selected))
 *
 * @param candidates Sorted candidates by composite relevance score
 * @param topK Number of diverse items to select
 * @param lambda Trade-off factor (0.75 = high relevance focus with moderate anti-redundancy)
 */
export function applyMMR(
    candidates: UnifiedCandidate[],
    topK = 10,
    lambda = 0.78
): UnifiedCandidate[] {
    if (candidates.length <= 1) return candidates;

    const unselected = [...candidates];
    const selected: UnifiedCandidate[] = [];

    // Always pick the highest-ranked top candidate first
    const first = unselected.shift()!;
    selected.push(first);

    while (selected.length < topK && unselected.length > 0) {
        let bestScore = -Infinity;
        let bestIndex = -1;

        for (let i = 0; i < unselected.length; i++) {
            const cand = unselected[i];
            const normalizedRelevance = (cand.matchScore || 50) / 100;

            // Compute maximum similarity to any already selected candidate
            let maxSim = 0;
            for (const sel of selected) {
                const sim = computeCandidateSimilarity(cand, sel);
                if (sim > maxSim) maxSim = sim;
            }

            // Source diversity soft bonus: slight boost if candidate introduces a new source
            const sourceAlreadySelected = selected.some(s => s.source === cand.source);
            const sourceDiversityBonus = !sourceAlreadySelected ? 0.05 : 0;

            const mmrScore = (lambda * normalizedRelevance) - ((1 - lambda) * maxSim) + sourceDiversityBonus;

            if (mmrScore > bestScore) {
                bestScore = mmrScore;
                bestIndex = i;
            }
        }

        if (bestIndex >= 0) {
            const [chosen] = unselected.splice(bestIndex, 1);
            selected.push(chosen);
        } else {
            break;
        }
    }

    return selected;
}
