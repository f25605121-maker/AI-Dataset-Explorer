/**
 * Kaggle Provider Adapter
 *
 * Fetches and normalizes dataset candidates from the Kaggle API into standard UnifiedCandidate format.
 */

import { UnifiedCandidate, StructuredQueryUnderstanding } from '../types';
import { getKaggleAuthHeaders } from '@/server/providers/kaggle';
import { extractExplicitModality } from '../modalityParser';

const KAGGLE_API = 'https://www.kaggle.com/api/v1/datasets/list';

export async function fetchKaggleCandidates(
    queries: string[],
    understanding: StructuredQueryUnderstanding,
    poolLimit = 80
): Promise<UnifiedCandidate[]> {
    const headers = getKaggleAuthHeaders();
    if (!headers['Authorization']) {
        return [];
    }

    const candidates: UnifiedCandidate[] = [];
    const seenIds = new Set<string>();

    const relaxedQueries: string[] = [];

    const effectiveQueries = Array.from(new Set([...relaxedQueries, ...queries]));

    for (const q of effectiveQueries.slice(0, 5)) {
        try {
            const url = `${KAGGLE_API}?search=${encodeURIComponent(q)}&pageSize=30`;
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 6000);

            const res = await fetch(url, { headers, signal: ctrl.signal, cache: 'no-store' });
            clearTimeout(tid);

            if (!res.ok) continue;

            const items = await res.json();
            if (!Array.isArray(items)) continue;

            for (const item of items) {
                const id = item.ref || `${item.ownerRef}/${item.datasetSlug}` || item.id || '';
                if (!id || seenIds.has(id)) continue;
                seenIds.add(id);

                const title = item.title || item.datasetTitle || id.split('/').pop() || 'Untitled Kaggle Dataset';
                const desc = item.description || item.subtitle || '';
                const tags = Array.isArray(item.tags)
                    ? item.tags.map((t: any) => (typeof t === 'string' ? t : t.name || t.description || ''))
                    : [];

                // Infer format signals from title and tags
                const formats: string[] = [];
                const blob = `${title} ${desc} ${tags.join(' ')}`.toLowerCase();
                if (/mrc|\.mrc/i.test(blob)) formats.push('mrc');
                if (/\bem\b|\.em\b/i.test(blob)) formats.push('em');
                if (/nii|\.nii\.gz/i.test(blob)) formats.push('nii.gz');
                if (/mha/i.test(blob)) formats.push('mha');
                if (/dicom|\.dcm/i.test(blob)) formats.push('dicom');
                if (/csv/i.test(blob)) formats.push('csv');
                if (/png/i.test(blob)) formats.push('png');
                const explicitModality = extractExplicitModality(title, desc, tags, formats);

                const candidate: UnifiedCandidate = {
                    id,
                    source: 'kaggle',
                    type: 'dataset',
                    title,
                    name: title,
                    description: desc,
                    tags,
                    modality: explicitModality,
                    url: item.url || `https://www.kaggle.com/datasets/${id}`,
                    license: item.licenseName || 'Other / See Page',
                    formats,
                    sizeBytes: item.totalBytes || null,
                    downloads: item.downloadCount || null,
                    likes: item.voteCount || null,
                    metadata: {
                        owner: item.ownerRef || item.ownerName,
                        lastUpdated: item.lastUpdated,
                        isFeatured: item.isFeatured,
                    },
                    matchScore: 50,
                    
                    tier: 'Tier C',
                    evidenceLevel: 'UNVERIFIED',
                    evidenceSources: ['Kaggle API'],
                    evidenceStrength: 30,
                    matchBreakdown: {
                        anatomy: 50, modality: 50, task: 50, dimension: 50, target: 50,
                        domain: 50, semantic: 50, evidence: 30, metadata: 50, accessibility: 80, popularity: 50, overall: 50,
                        confirmedClaims: [], warnings: [],
                    },
                    evidence: [],
                    warnings: [],
                    rejected: false,
                    rejectionReason: null,
                    matchReason: '',
                };

                candidates.push(candidate);
                if (candidates.length >= poolLimit) break;
            }
        } catch {
            // Graceful continue on provider timeout
        }
    }

    return candidates;
}
