/**
 * Search Engine Retrieval Adapter
 *
 * Exposes the backwards-compatible `advancedSearch` method by delegating to the
 * master 17-stage Search Engine 2.0.0 pipeline (`advancedResearchSearch`).
 */

import {
    UnifiedCandidate,
    StructuredQueryUnderstanding,
    SearchResult,
    ResearchSearchResponse,
} from './types';
import { advancedResearchSearch } from './searchEngine';
import { queryFastApiRecommend } from './fastapiClient';

export async function advancedSearch(rawQuery: string): Promise<SearchResult> {
    // Run both pipelines concurrently for speed and merge them
    const [fastApiRes, res] = await Promise.all([
        queryFastApiRecommend(rawQuery).catch(() => null),
        advancedResearchSearch(rawQuery).catch(e => { console.error(e); return null; })
    ]);

    const datasets: UnifiedCandidate[] = [];
    const models: UnifiedCandidate[] = [];
    const papers: UnifiedCandidate[] = [];

    let prof = {};
    if (fastApiRes && !fastApiRes.no_direct_match) {
        prof = fastApiRes.problem_profile || {};
        if (fastApiRes.datasets) {
            datasets.push(...fastApiRes.datasets.map((d: any) => ({
                ...d, type: 'dataset', matchScore: d.score, confidenceScore: d.score,
                evidenceLevel: d.score >= 85 ? 'VERIFIED' : 'HIGH_RELEVANCE', evidenceSources: [d.source || 'huggingface'],
                whyMatches: d.why, warnings: d.warnings, matchReason: (d.why && d.why[0]) || 'Aligned with target task and modality.',
            })));
        }
        if (fastApiRes.models) {
            models.push(...fastApiRes.models.map((m: any) => ({
                ...m, type: 'model', matchScore: m.score, confidenceScore: m.score,
                evidenceLevel: 'VERIFIED', whyMatches: m.why, warnings: m.warnings,
                matchReason: (m.why && m.why[0]) || 'Compatible model architecture for problem.',
            })));
        }
        const allPapers = [...(fastApiRes.papers || []), ...(fastApiRes.latest_research || [])];
        papers.push(...allPapers.map((p: any) => ({
            ...p, type: 'paper', matchScore: p.score, confidenceScore: p.score,
            evidenceLevel: 'PEER_REVIEWED', relationship: p.paper_type === 'DATASET_SPECIFIC' ? 'EXACT_DATASET' : p.paper_type === 'MODEL_SPECIFIC' ? 'EXACT_MODEL' : 'DIRECTLY_RELATED',
            matchReason: (p.why && p.why[0]) || 'Scientific literature directly investigating target methodology.',
        })));
    }

    if (res) {
        // Merge TS fallback results, avoiding duplicates by ID
        const existingDatasetIds = new Set(datasets.map(d => d.id));
        const existingModelIds = new Set(models.map(m => m.id));
        const existingPaperIds = new Set(papers.map(p => p.id));

        for (const d of (res.datasets || [])) {
            if (!existingDatasetIds.has(d.id)) datasets.push(d as unknown as UnifiedCandidate);
        }
        for (const m of (res.models || [])) {
            if (!existingModelIds.has(m.id)) models.push(m as unknown as UnifiedCandidate);
        }
        for (const p of (res.papers || [])) {
            if (!existingPaperIds.has(p.id)) papers.push(p as unknown as UnifiedCandidate);
        }
    }

    const exactMatches = [...datasets, ...models, ...papers].filter(c => (c as any).matchScore >= 85 || (c as any).matchCategory === 'EXACT_MATCH');
    const strongMatches = [...datasets, ...models, ...papers].filter(c => ((c as any).matchScore >= 70 && (c as any).matchScore < 85) || (c as any).tier === 'Tier A' || (c as any).tier === 'Tier B');
    const partialMatches = [...datasets, ...models, ...papers].filter(c => (c as any).matchCategory === 'PARTIAL_MATCH');
    const relatedResources = [...datasets, ...models, ...papers].filter(c => (c as any).matchCategory === 'RELATED_RESOURCE');

    const constraints = res?.diagnostics?.parsedQuery || {
        rawQuery,
        domain: (prof as any).domains?.[0] || 'General',
        task: (prof as any).tasks?.[0]?.name || 'machine_learning',
        modality: (prof as any).modalities || ['Image'],
        anatomy: { primary: [], organs: [], excluded: [] },
        target: (prof as any).keywords || [],
        annotation: [],
        pretrainedModelRequired: true,
        datasetRequired: true,
        paperRequired: true,
        constraints: {
            mustMatchAnatomy: false, mustMatchModality: true, mustMatchTask: true, prefer3D: false,
        },
        positiveEntities: (prof as any).keywords || [],
        negativeEntities: [],
        requiredConstraints: (prof as any).hard_constraints || [],
        preferredConstraints: (prof as any).soft_preferences || [],
        softPreferences: (prof as any).soft_preferences || [],
        specificEntityMentioned: null,
        parseConfidence: (prof as any).confidence || 0.9,
        parseLog: [],
    } as any;

    return {
        query: res?.query || rawQuery,
        constraints,
        datasets,
        models,
        papers,
        tiers: { exactMatches, strongMatches, partialMatches, relatedResources },
        researchGraph: res?.researchGraph || { nodes: [], edges: [] },
        diagnostics: res?.diagnostics as any,
        telemetry: res?.telemetry as any,
        hardware: res?.hardware || { gpu_recommendation: '', vram_estimate: '', training_time_estimate: '', cost_estimate: '' },
        feasibility: res?.feasibility || { status: '', gpuTarget: '', feasibility_score: 0, level: '' },
        scientificSynthesis: res?.scientificSynthesis || `Production matching engine profile verified for "${rawQuery}".`,
        aiRationale: res?.scientificSynthesis || `Direct multi-factor ranking matching: ${(prof as any).hard_constraints?.join(', ') || 'verified constraints'}.`,
    };
}
