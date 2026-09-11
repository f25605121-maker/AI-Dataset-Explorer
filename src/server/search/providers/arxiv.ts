/**
 * arXiv Provider Adapter
 *
 * Fetches and normalizes preprints from the arXiv API.
 */

import { UnifiedCandidate, StructuredQueryUnderstanding } from '../types';

const ARXIV_API = 'https://export.arxiv.org/api/query';

function parseArxivXml(xml: string): any[] {
    const entries: any[] = [];
    const entryMatches = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];

    for (const entryStr of entryMatches) {
        const idMatch = entryStr.match(/<id>(.*?)<\/id>/);
        const titleMatch = entryStr.match(/<title>(.*?)<\/title>/);
        const summaryMatch = entryStr.match(/<summary>(.*?)<\/summary>/);
        const publishedMatch = entryStr.match(/<published>(.*?)<\/published>/);
        const doiMatch = entryStr.match(/<arxiv:doi.*?>(.*?)<\/arxiv:doi>/);

        const authors: string[] = [];
        const authorMatches = entryStr.match(/<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/g) || [];
        for (const authStr of authorMatches) {
            const nameMatch = authStr.match(/<name>(.*?)<\/name>/);
            if (nameMatch) authors.push(nameMatch[1].trim());
        }

        const id = idMatch ? idMatch[1].trim() : '';
        const rawTitle = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';
        const summary = summaryMatch ? summaryMatch[1].replace(/\s+/g, ' ').trim() : '';
        const published = publishedMatch ? publishedMatch[1].trim() : '';
        const year = published ? parseInt(published.slice(0, 4), 10) : null;
        const doi = doiMatch ? doiMatch[1].trim() : null;

        if (id && rawTitle) {
            entries.push({ id, title: rawTitle, summary, authors, year, doi });
        }
    }

    return entries;
}

export async function fetchArxivPapers(
    queries: string[],
    understanding: StructuredQueryUnderstanding,
    poolLimit = 40
): Promise<UnifiedCandidate[]> {
    const candidates: UnifiedCandidate[] = [];
    const seenIds = new Set<string>();

    for (const q of queries.slice(0, 2)) {
        try {
            const searchQuery = `all:${encodeURIComponent(q)}`;
            const url = `${ARXIV_API}?search_query=${searchQuery}&start=0&max_results=15&sortBy=relevance&sortOrder=descending`;
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 6000);

            const res = await fetch(url, { signal: ctrl.signal, cache: 'no-store' });
            clearTimeout(tid);

            if (!res.ok) continue;

            const xmlText = await res.text();
            const entries = parseArxivXml(xmlText);

            for (const entry of entries) {
                if (seenIds.has(entry.id)) continue;
                seenIds.add(entry.id);

                const arxivId = entry.id.split('/abs/').pop() || entry.id;

                candidates.push({
                    id: entry.id,
                    source: 'arxiv',
                    type: 'paper',
                    title: entry.title,
                    name: entry.title,
                    description: entry.summary,
                    authors: entry.authors,
                    year: entry.year,
                    venue: 'arXiv Preprint',
                    doi: entry.doi,
                    url: entry.id,
                    pdfUrl: `https://arxiv.org/pdf/${arxivId}.pdf`,
                    retrievalQuery: q,
                    retrievalTier: queries.indexOf(q) + 1,
                    metadata: {
                        isPreprint: true,
                        arxivId,
                    },
                    matchScore: 50,
                    
                    tier: 'Tier C',
                    evidenceLevel: 'UNVERIFIED',
                    evidenceSources: ['arXiv'],
                    evidenceStrength: 35,
                    matchBreakdown: {
                        anatomy: 50, modality: 50, task: 50, dimension: 50, target: 50,
                        domain: 50, semantic: 50, evidence: 35, metadata: 60, accessibility: 95, popularity: 50, overall: 50,
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
