/**
 * Semantic Scholar API Integration
 *
 * Discovers research papers via the Semantic Scholar Academic Graph API.
 * Handles rate limits, timeouts, authentication keys, and unauthenticated fallback.
 */

import { providerRawCache, buildPaperSearchKey } from './paperCache';

export interface SemanticScholarPaperRaw {
    paperId: string;
    title?: string;
    abstract?: string;
    authors?: Array<{ authorId?: string; name: string }>;
    year?: number;
    publicationDate?: string;
    venue?: string;
    publicationTypes?: string[];
    citationCount?: number;
    openAccessPdf?: { url?: string; status?: string };
    externalIds?: {
        DOI?: string;
        ArXiv?: string;
        PubMed?: string;
        CorpusId?: number | string;
    };
    tldr?: { text?: string };
    fieldsOfStudy?: string[];
    url?: string;
}

export interface SemanticScholarSearchResult {
    total?: number;
    offset?: number;
    data?: SemanticScholarPaperRaw[];
}

const TIMEOUT_MS = 7500;

export async function searchSemanticScholar(
    query: string,
    limit: number = 8,
    trace?: Record<string, unknown>
): Promise<SemanticScholarPaperRaw[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const cacheKey = buildPaperSearchKey('s2', `${cleanQuery}:${limit}`);
    const cached = providerRawCache.get(cacheKey);
    if (cached) {
        if (trace) trace.semanticScholar = { success: true, cached: true, count: cached.length };
        return cached;
    }

    const fields = [
        'paperId',
        'title',
        'abstract',
        'authors',
        'year',
        'publicationDate',
        'venue',
        'publicationTypes',
        'citationCount',
        'openAccessPdf',
        'externalIds',
        'tldr',
        'fieldsOfStudy',
        'url',
    ].join(',');

    const endpoint = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(cleanQuery)}&limit=${limit}&fields=${fields}`;
    const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;

    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'AIDatasetExplorer/2.0 (Academic Research Assistant)',
    };
    if (apiKey) {
        headers['x-api-key'] = apiKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const res = await fetch(endpoint, {
            headers,
            signal: controller.signal,
            next: { revalidate: 3600 },
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            const status = res.status;
            if (trace) {
                trace.semanticScholar = {
                    success: false,
                    httpStatus: status,
                    reason: status === 429 ? 'Rate limited by Semantic Scholar' : `HTTP ${status}`,
                };
            }
            console.warn(`[SEMANTIC_SCHOLAR] Search returned status ${status} for query: "${cleanQuery}"`);
            return [];
        }

        const data: SemanticScholarSearchResult = await res.json();
        const papers = Array.isArray(data.data) ? data.data : [];

        providerRawCache.set(cacheKey, papers, 60 * 60 * 1000); // 1 hr cache

        if (trace) {
            trace.semanticScholar = {
                success: true,
                count: papers.length,
                httpStatus: 200,
            };
        }

        return papers;
    } catch (err: any) {
        clearTimeout(timeoutId);
        const isAbort = err.name === 'AbortError';
        if (trace) {
            trace.semanticScholar = {
                success: false,
                reason: isAbort ? 'Request timed out' : err.message,
            };
        }
        console.warn(`[SEMANTIC_SCHOLAR] Fetch failed for query "${cleanQuery}":`, err.message);
        return [];
    }
}
