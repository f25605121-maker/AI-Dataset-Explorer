/**
 * Semantic Scholar Provider Adapter
 *
 * Fetches and normalizes research paper candidates from Semantic Scholar Graph API.
 */

import { UnifiedCandidate, StructuredQueryUnderstanding } from '../types';

const S2_API = 'https://api.semanticscholar.org/graph/v1/paper/search';
const FIELDS = 'paperId,title,abstract,authors,year,venue,citationCount,openAccessPdf,externalIds,url';

export async function fetchSemanticScholarPapers(
    queries: string[],
    understanding: StructuredQueryUnderstanding,
    poolLimit = 50
): Promise<UnifiedCandidate[]> {
    const candidates: UnifiedCandidate[] = [];
    const seenIds = new Set<string>();
    const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY || process.env.S2_API_KEY;
    const headers: Record<string, string> = {};
    if (apiKey) headers['x-api-key'] = apiKey;

    for (const q of queries.slice(0, 3)) {
        try {
            const url = `${S2_API}?query=${encodeURIComponent(q)}&fields=${FIELDS}&limit=20`;
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 6000);

            const res = await fetch(url, { headers, signal: ctrl.signal, cache: 'no-store' });
            clearTimeout(tid);

            if (!res.ok) continue;

            const data = await res.json();
            if (!Array.isArray(data.data)) continue;

            for (const paper of data.data) {
                const id = paper.paperId || paper.externalIds?.DOI || '';
                if (!id || seenIds.has(id)) continue;
                seenIds.add(id);

                const authors = Array.isArray(paper.authors) ? paper.authors.map((a: any) => a.name) : [];
                const doi = paper.externalIds?.DOI || null;

                candidates.push({
                    id,
                    source: 'semantic_scholar',
                    type: 'paper',
                    title: paper.title || 'Untitled Paper',
                    name: paper.title,
                    description: paper.abstract || '',
                    authors,
                    year: paper.year || null,
                    venue: paper.venue || 'Peer-Reviewed Conference / Journal',
                    doi,
                    url: paper.url || (doi ? `https://doi.org/${doi}` : `https://www.semanticscholar.org/paper/${id}`),
                    pdfUrl: paper.openAccessPdf?.url || null,
                    citationCount: paper.citationCount || null,
                    retrievalQuery: q,
                    retrievalTier: queries.indexOf(q) + 1,
                    metadata: {
                        externalIds: paper.externalIds,
                        isOpenAccess: Boolean(paper.openAccessPdf),
                    },
                    matchScore: 50,
                    confidenceScore: 50,
                    tier: 'Tier C',
                    evidenceLevel: 'UNVERIFIED',
                    evidenceSources: ['Semantic Scholar'],
                    evidenceStrength: 35,
                    matchBreakdown: {
                        anatomy: 50, modality: 50, task: 50, dimension: 50, target: 50,
                        domain: 50, semantic: 50, evidence: 35, metadata: 60, accessibility: 90, popularity: 50, overall: 50,
                        confirmedClaims: [], warnings: [],
                    },
                    evidence: [],
                    warnings: [],
                    rejected: false,
                    rejectionReason: null,
                    matchReason: '',
                });

                if (candidates.length >= poolLimit) break;
            }
        } catch {
            // Continue on timeout
        }
    }

    return candidates;
}
