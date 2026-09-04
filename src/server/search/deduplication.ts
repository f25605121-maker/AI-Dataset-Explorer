/**
 * Candidate Deduplication & Normalization Merger
 *
 * Merges duplicate candidate entries across multiple queries and providers using:
 * - Exact ID matching
 * - Canonical repository ID matching (e.g., HF org/repo, Kaggle owner/slug)
 * - DOI matching (primary scholarly identifier)
 * - Canonical URL matching
 * - Normalized title & fuzzy token overlap similarity
 */

import { UnifiedCandidate } from './types';

function normalizeString(s: string): string {
    return s.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

function computeTokenJaccard(a: string, b: string): number {
    const tokensA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const tokensB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    if (tokensA.size === 0 || tokensB.size === 0) return 0;

    let intersection = 0;
    for (const t of tokensA) {
        if (tokensB.has(t)) intersection++;
    }
    const union = new Set([...tokensA, ...tokensB]).size;
    return union > 0 ? intersection / union : 0;
}

function extractCanonicalKey(candidate: UnifiedCandidate): string {
    // 1. DOI takes top precedence for literature
    if (candidate.doi) {
        const cleanDoi = candidate.doi.toLowerCase().replace(/^https?:\/\/doi\.org\//, '').trim();
        if (cleanDoi) return `doi:${cleanDoi}`;
    }

    // 2. Canonical Repo ID for HF / Kaggle
    const id = candidate.id.toLowerCase().trim();
    if (candidate.source === 'huggingface' || candidate.source?.includes('hugging')) {
        const repo = id.replace(/^datasets\//, '').replace(/^models\//, '');
        return `hf:${repo}`;
    }

    if (candidate.source === 'kaggle') {
        const parts = id.split('/');
        if (parts.length >= 2) {
            return `kaggle:${parts[parts.length - 2]}/${parts[parts.length - 1]}`;
        }
        return `kaggle:${id}`;
    }

    // 3. Canonical URL
    if (candidate.url) {
        const cleanUrl = candidate.url.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
        return `url:${cleanUrl}`;
    }

    // 4. Normalized Title
    return `title:${normalizeString(candidate.title || candidate.name || candidate.id)}`;
}

function mergeCandidates(primary: UnifiedCandidate, secondary: UnifiedCandidate): UnifiedCandidate {
    // Prefer longer description
    const description = (primary.description?.length || 0) >= (secondary.description?.length || 0)
        ? primary.description
        : secondary.description;

    // Merge tags
    const tags = [...new Set([...(primary.tags || []), ...(secondary.tags || [])])];

    // Merge modalities & formats
    const modalities = [...new Set([...(primary.modalities || []), ...(secondary.modalities || [])])];
    const formats = [...new Set([...(primary.formats || []), ...(secondary.formats || [])])];
    const sequenceSubtypes = [...new Set([...(primary.sequenceSubtypes || []), ...(secondary.sequenceSubtypes || [])])];

    // Maximize stats
    const downloads = Math.max(primary.downloads || 0, secondary.downloads || 0) || null;
    const likes = Math.max(primary.likes || 0, secondary.likes || 0) || null;
    const citationCount = Math.max(primary.citationCount || 0, secondary.citationCount || 0) || null;

    // Merge evidence items
    const evidence = [...(primary.evidence || []), ...(secondary.evidence || [])];

    return {
        ...primary,
        description,
        tags,
        modalities: modalities.length > 0 ? modalities : primary.modalities,
        formats: formats.length > 0 ? formats : primary.formats,
        sequenceSubtypes: sequenceSubtypes.length > 0 ? sequenceSubtypes : primary.sequenceSubtypes,
        downloads,
        likes,
        citationCount,
        evidence,
        license: primary.license || secondary.license,
        size: primary.size || secondary.size,
        sizeBytes: primary.sizeBytes || secondary.sizeBytes,
        doi: primary.doi || secondary.doi,
        pdfUrl: primary.pdfUrl || secondary.pdfUrl,
        paperUrl: primary.paperUrl || secondary.paperUrl,
        architecture: primary.architecture || secondary.architecture,
        metadata: { ...secondary.metadata, ...primary.metadata },
    };
}

export function deduplicateCandidates(candidates: UnifiedCandidate[]): UnifiedCandidate[] {
    const keyMap = new Map<string, UnifiedCandidate>();
    const deduplicated: UnifiedCandidate[] = [];

    for (const cand of candidates) {
        const canonicalKey = extractCanonicalKey(cand);

        if (keyMap.has(canonicalKey)) {
            const existing = keyMap.get(canonicalKey)!;
            const merged = mergeCandidates(existing, cand);
            keyMap.set(canonicalKey, merged);
            continue;
        }

        // Secondary pass: Fuzzy title similarity check for papers and datasets with slight name variations
        let fuzzyMatchFound = false;
        const candNormTitle = normalizeString(cand.title || cand.name || '');

        if (candNormTitle.length > 10) {
            for (const [key, existing] of keyMap.entries()) {
                if (existing.type !== cand.type) continue;
                const existingNormTitle = normalizeString(existing.title || existing.name || '');

                if (existingNormTitle === candNormTitle || computeTokenJaccard(existing.title, cand.title) >= 0.85) {
                    const merged = mergeCandidates(existing, cand);
                    keyMap.set(key, merged);
                    fuzzyMatchFound = true;
                    break;
                }
            }
        }

        if (!fuzzyMatchFound) {
            keyMap.set(canonicalKey, cand);
        }
    }

    return Array.from(keyMap.values());
}
