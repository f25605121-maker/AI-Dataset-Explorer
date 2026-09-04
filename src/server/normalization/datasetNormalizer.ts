/**
 * Dataset Normalizer
 *
 * Deduplicates and normalizes datasets from multiple sources into a
 * consistent NormalizedDataset shape with evidence tracking.
 */

import type { NormalizedDataset, EvidenceFact } from '@/types/pipeline';

// ── Deduplication helpers ─────────────────────────────────────────────────────

function normalizeId(id: string): string {
    return id.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function similarName(a: string, b: string): boolean {
    const na = normalizeId(a);
    const nb = normalizeId(b);
    if (na === nb) return true;
    // One contains the other (handles "kaggle/user/name" vs "hf/user/name" same dataset)
    if (na.length > 6 && (na.includes(nb) || nb.includes(na))) return true;
    return false;
}

// ── Merge duplicate entries ────────────────────────────────────────────────────

function mergeDatasets(primary: Partial<NormalizedDataset>, secondary: Partial<NormalizedDataset>): Partial<NormalizedDataset> {
    // Merge: prefer primary, fill gaps from secondary
    const merged: Partial<NormalizedDataset> = { ...primary };

    // Fill description if primary is shorter
    if ((secondary.description?.length ?? 0) > (primary.description?.length ?? 0)) {
        merged.description = secondary.description;
    }
    // Merge tags
    const allTags = [...new Set([...(primary.tags ?? []), ...(secondary.tags ?? [])])];
    merged.tags = allTags.slice(0, 50);
    // Fill size if unknown
    if (!primary.sizeBytes && secondary.sizeBytes) merged.sizeBytes = secondary.sizeBytes;
    if (!primary.size || primary.size === 'unknown') merged.size = secondary.size;
    // Fill license if unknown
    if ((!primary.license || primary.license === 'unknown') && secondary.license) merged.license = secondary.license;
    // Merge modalities
    const allModalities = [...new Set([...(primary.modalities ?? []), ...(secondary.modalities ?? [])])];
    merged.modalities = allModalities;
    // Merge evidence
    merged.evidence = [...(primary.evidence ?? []), ...(secondary.evidence ?? [])].slice(0, 20);
    // Note: available on multiple sources
    merged.source = `${primary.source} + ${secondary.source}` as any;

    return merged;
}

// ── Main normalization and deduplication ──────────────────────────────────────

export function normalizeAndDeduplicateDatasets(
    rawDatasets: Partial<NormalizedDataset>[]
): Partial<NormalizedDataset>[] {
    const byId = new Map<string, Partial<NormalizedDataset>>();
    const byName = new Map<string, string>(); // normalized name → id

    for (const ds of rawDatasets) {
        if (!ds.id) continue;

        const normalizedId = normalizeId(ds.id);

        // Check exact id match
        if (byId.has(normalizedId)) {
            const existing = byId.get(normalizedId)!;
            byId.set(normalizedId, mergeDatasets(existing, ds));
            continue;
        }

        // Check name similarity
        const existingIdByName = ds.name ? byName.get(normalizeId(ds.name)) : undefined;
        if (existingIdByName) {
            const existing = byId.get(existingIdByName)!;
            byId.set(existingIdByName, mergeDatasets(existing, ds));
            continue;
        }

        // New entry
        byId.set(normalizedId, ds);
        if (ds.name) byName.set(normalizeId(ds.name), normalizedId);
    }

    return Array.from(byId.values());
}

// ── Metadata quality score ────────────────────────────────────────────────────

export function computeDatasetMetadataQuality(ds: Partial<NormalizedDataset>): number {
    let score = 0;
    if (ds.description && ds.description.length > 50) score += 20;
    if (ds.description && ds.description.length > 300) score += 10;
    if (ds.license && ds.license !== 'unknown') score += 15;
    if (ds.tags && ds.tags.length > 2) score += 10;
    if (ds.sizeBytes != null) score += 10;
    if (ds.creator && ds.creator !== 'unknown') score += 10;
    if (ds.features && ds.features.length > 0) score += 10;
    if (ds.sample_count != null) score += 10;
    if (ds.splits && Object.keys(ds.splits).length > 0) score += 10;
    return Math.min(100, score);
}

// ── Ensure all required fields have defaults ──────────────────────────────────

export function ensureNormalizedDataset(ds: Partial<NormalizedDataset>): NormalizedDataset {
    return {
        id: ds.id ?? '',
        name: ds.name ?? ds.id ?? '',
        title: ds.title ?? ds.name ?? ds.id ?? '',
        subtitle: ds.subtitle ?? '',
        source: ds.source ?? 'unknown',
        url: ds.url ?? '',
        description: ds.description ?? '',
        domain: ds.domain ?? '',
        subdomain: ds.subdomain ?? '',
        task: ds.task ?? 'unknown',
        modality: ds.modality ?? 'unknown',
        modalities: ds.modalities ?? [],
        formats: ds.formats ?? [],
        languages: ds.languages ?? [],
        license: ds.license ?? 'unknown',
        size: ds.size ?? 'unknown',
        sizeBytes: ds.sizeBytes ?? null,
        downloads: ds.downloads ?? null,
        likes: ds.likes ?? null,
        creator: ds.creator ?? 'unknown',
        tags: ds.tags ?? [],
        schema: ds.schema ?? {},
        splits: ds.splits ?? {},
        features: ds.features ?? [],
        sample_count: ds.sample_count ?? null,
        image_resolution: ds.image_resolution ?? null,
        video: ds.video ?? false,
        related_models: ds.related_models ?? [],
        raw_metadata: ds.raw_metadata ?? {},
        evidence: ds.evidence ?? [],
        targetLabels: ds.targetLabels ?? [],
        metadataQuality: ds.metadataQuality ?? computeDatasetMetadataQuality(ds),
        matchScore: ds.matchScore ?? 0,
        scoreBreakdown: ds.scoreBreakdown ?? { task: 0, modality: 0, domain: 0, subdomain: 0, target: 0, metadata: 0 },
        rejected: ds.rejected ?? false,
        rejectionReason: ds.rejectionReason ?? null,
        matchReason: ds.matchReason ?? '',
    };
}
