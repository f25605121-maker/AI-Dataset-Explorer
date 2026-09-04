/**
 * arXiv API Integration
 *
 * Discovers preprints and recent machine learning/robotics research from arXiv.
 * Safely parses Atom XML feed responses without external binary dependencies.
 */

import { providerRawCache, buildPaperSearchKey } from './paperCache';

export interface ArxivPaperRaw {
    id: string;             // e.g. "http://arxiv.org/abs/2401.12345v1" or "2401.12345"
    arxivId: string;        // e.g. "2401.12345"
    title: string;
    summary: string;
    published: string;      // ISO string e.g. "2026-01-15T12:00:00Z"
    updated?: string;
    authors: string[];
    pdfUrl: string | null;
    landingUrl: string;
    primaryCategory?: string;
    categories: string[];
    comment?: string;
    journalRef?: string;
    doi?: string;
}

const TIMEOUT_MS = 7500;

/**
 * Lightweight XML tag extractor for arXiv Atom feed.
 */
function parseArxivAtomXml(xmlText: string): ArxivPaperRaw[] {
    const papers: ArxivPaperRaw[] = [];
    const entryRegex = /<entry[\s\S]*?<\/entry>/gi;
    const entries = xmlText.match(entryRegex) || [];

    for (const entry of entries) {
        // ID
        const idMatch = entry.match(/<id>(.*?)<\/id>/i);
        const rawId = idMatch ? idMatch[1].trim() : '';
        const arxivIdMatch = rawId.match(/(?:abs\/|arxiv\.org\/abs\/)?([0-9]+\.[0-9]+(?:v[0-9]+)?|[a-z\-]+(?:\.[a-z]+)?\/[0-9]+)/i);
        const arxivId = arxivIdMatch ? arxivIdMatch[1] : rawId;

        // Title
        const titleMatch = entry.match(/<title[\s\S]*?>([\s\S]*?)<\/title>/i);
        let title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : 'Untitled arXiv Paper';

        // Summary
        const summaryMatch = entry.match(/<summary[\s\S]*?>([\s\S]*?)<\/summary>/i);
        let summary = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : '';

        // Published date
        const pubMatch = entry.match(/<published>(.*?)<\/published>/i);
        const published = pubMatch ? pubMatch[1].trim() : '';

        // Authors
        const authors: string[] = [];
        const authorMatches = entry.match(/<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/gi) || [];
        for (const auth of authorMatches) {
            const nameMatch = auth.match(/<name>(.*?)<\/name>/i);
            if (nameMatch) {
                authors.push(nameMatch[1].trim());
            }
        }

        // Links
        let pdfUrl: string | null = null;
        let landingUrl = rawId || `https://arxiv.org/abs/${arxivId}`;

        const pdfLinkMatch = entry.match(/<link[^>]*?title="pdf"[^>]*?href="(.*?)"/i)
            || entry.match(/<link[^>]*?href="(.*?)"[^>]*?title="pdf"/i);
        if (pdfLinkMatch) {
            pdfUrl = pdfLinkMatch[1].trim().replace(/^http:/, 'https:');
        } else if (arxivId) {
            pdfUrl = `https://arxiv.org/pdf/${arxivId}.pdf`;
        }

        // Primary Category
        const catMatch = entry.match(/<arxiv:primary_category[^>]*?term="(.*?)"/i);
        const primaryCategory = catMatch ? catMatch[1].trim() : undefined;

        // All Categories
        const categories: string[] = [];
        const allCatMatches = entry.match(/<category[^>]*?term="(.*?)"/gi) || [];
        for (const cat of allCatMatches) {
            const m = cat.match(/term="(.*?)"/i);
            if (m && !categories.includes(m[1].trim())) {
                categories.push(m[1].trim());
            }
        }

        // DOI if published
        const doiMatch = entry.match(/<arxiv:doi>(.*?)<\/arxiv:doi>/i);
        const doi = doiMatch ? doiMatch[1].trim() : undefined;

        // Journal ref if published
        const jrMatch = entry.match(/<arxiv:journal_ref>(.*?)<\/arxiv:journal_ref>/i);
        const journalRef = jrMatch ? jrMatch[1].trim() : undefined;

        if (title && arxivId) {
            papers.push({
                id: rawId,
                arxivId,
                title,
                summary,
                published,
                authors,
                pdfUrl,
                landingUrl,
                primaryCategory,
                categories,
                doi,
                journalRef,
            });
        }
    }

    return papers;
}

export async function searchArxiv(
    query: string,
    limit: number = 8,
    trace?: Record<string, unknown>
): Promise<ArxivPaperRaw[]> {
    if (process.env.ARXIV_ENABLED === 'false') {
        if (trace) trace.arxiv = { success: false, reason: 'Disabled by ARXIV_ENABLED=false' };
        return [];
    }

    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const cacheKey = buildPaperSearchKey('arxiv', `${cleanQuery}:${limit}`);
    const cached = providerRawCache.get(cacheKey);
    if (cached) {
        if (trace) trace.arxiv = { success: true, cached: true, count: cached.length };
        return cached;
    }

    // Clean query for arXiv search syntax: escape double quotes, strip special boolean chars
    const sanitized = cleanQuery
        .replace(/["'\(\)\+]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 1)
        .slice(0, 6)
        .join(' ');

    const endpoint = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(sanitized)}&start=0&max_results=${limit}&sortBy=relevance&sortOrder=descending`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const res = await fetch(endpoint, {
            headers: {
                'Accept': 'application/atom+xml, application/xml, text/xml',
                'User-Agent': 'AIDatasetExplorer/2.0 (arXiv query client)',
            },
            signal: controller.signal,
            next: { revalidate: 3600 },
        });

        clearTimeout(timeoutId);

        if (!res.ok) {
            const status = res.status;
            if (trace) trace.arxiv = { success: false, httpStatus: status, reason: `HTTP ${status}` };
            console.warn(`[ARXIV] Search returned status ${status} for query: "${cleanQuery}"`);
            return [];
        }

        const xmlText = await res.text();
        const papers = parseArxivAtomXml(xmlText);

        providerRawCache.set(cacheKey, papers, 60 * 60 * 1000);

        if (trace) {
            trace.arxiv = {
                success: true,
                count: papers.length,
                httpStatus: 200,
            };
        }

        return papers;
    } catch (err: any) {
        clearTimeout(timeoutId);
        const isAbort = err.name === 'AbortError';
        if (trace) trace.arxiv = { success: false, reason: isAbort ? 'Request timed out' : err.message };
        console.warn(`[ARXIV] Fetch failed for query "${cleanQuery}":`, err.message);
        return [];
    }
}
