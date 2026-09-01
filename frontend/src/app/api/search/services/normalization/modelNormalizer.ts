/**
 * Model Normalizer
 *
 * Deduplicates and normalizes models from multiple sources into a
 * consistent NormalizedModel shape with evidence tracking.
 */

import type { NormalizedModel } from '../../schemas/types';

function normalizeId(id: string): string {
    return id.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function normalizeAndDeduplicateModels(
    rawModels: Partial<NormalizedModel>[]
): Partial<NormalizedModel>[] {
    const byId = new Map<string, Partial<NormalizedModel>>();

    for (const m of rawModels) {
        if (!m.id) continue;
        const nid = normalizeId(m.id);
        if (!byId.has(nid)) {
            byId.set(nid, m);
        } else {
            // Prefer the one with architecture info
            const existing = byId.get(nid)!;
            if (m.architecture && m.architecture !== 'Unknown' && (existing.architecture === 'Unknown' || !existing.architecture)) {
                byId.set(nid, { ...existing, ...m });
            }
        }
    }

    return Array.from(byId.values());
}

export function ensureNormalizedModel(m: Partial<NormalizedModel>): NormalizedModel {
    return {
        id: m.id ?? '',
        name: m.name ?? m.id ?? '',
        source: m.source ?? 'unknown',
        url: m.url ?? '',
        task: m.task ?? 'unknown',
        architecture: m.architecture ?? 'Unknown',
        base_model: m.base_model ?? 'Unknown',
        parameters: m.parameters ?? null,
        modality: m.modality ?? 'unknown',
        modalities: m.modalities ?? [],
        languages: m.languages ?? [],
        framework: m.framework ?? 'Unknown',
        license: m.license ?? 'unknown',
        training_data: m.training_data ?? [],
        datasets_used: m.datasets_used ?? [],
        quantization: m.quantization ?? null,
        context_length: m.context_length ?? null,
        input_types: m.input_types ?? [],
        output_types: m.output_types ?? [],
        metrics: m.metrics ?? {},
        evidence: m.evidence ?? [],
        benchmarkEvidence: m.benchmarkEvidence ?? [],
        downloads: m.downloads ?? null,
        likes: m.likes ?? null,
        matchScore: m.matchScore ?? 0,
        scoreBreakdown: m.scoreBreakdown ?? { task: 0, modality: 0, architecture: 0, compatibility: 0, benchmark: 0, efficiency: 0, popularity: 0 },
        rejected: m.rejected ?? false,
        rejectionReason: m.rejectionReason ?? null,
        matchReason: m.matchReason ?? '',
    };
}
