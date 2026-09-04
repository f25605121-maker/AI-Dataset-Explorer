/**
 * PubMed API Integration (NCBI E-utilities)
 *
 * Discovers peer-reviewed biomedical, clinical, and medical imaging literature.
 * Automatically triggered when queries involve medical imaging, healthcare, biology, or clinical datasets.
 */

import { providerRawCache, buildPaperSearchKey } from './paperCache';

export interface PubMedArticleRaw {
    uid: string;
    title: string;
    authors: string[];
    source: string;
    pubdate: string;
    year?: number;
    doi?: string;
    url: string;
}

const TIMEOUT_MS = 7500;

export async function searchPubMed(
    query: string,
    limit: number = 6,
    trace?: Record<string, unknown>
): Promise<PubMedArticleRaw[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];

    const cacheKey = buildPaperSearchKey('pubmed', `${cleanQuery}:${limit}`);
    const cached = providerRawCache.get(cacheKey);
    if (cached) {
        if (trace) trace.pubmed = { success: true, cached: true, count: cached.length };
        return cached;
    }

    const mailto = process.env.CROSSREF_EMAIL || 'support@datasetexplorer.local';
    const esearchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(cleanQuery)}&retmode=json&retmax=${limit}&email=${encodeURIComponent(mailto)}&tool=AIDatasetExplorer`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
        const searchRes = await fetch(esearchUrl, {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal,
            next: { revalidate: 3600 },
        });

        if (!searchRes.ok) {
            clearTimeout(timeoutId);
            if (trace) trace.pubmed = { success: false, httpStatus: searchRes.status };
            return [];
        }

        const searchData = await searchRes.json();
        const idList: string[] = searchData.esearchresult?.idlist || [];

        if (idList.length === 0) {
            clearTimeout(timeoutId);
            providerRawCache.set(cacheKey, [], 60 * 60 * 1000);
            if (trace) trace.pubmed = { success: true, count: 0 };
            return [];
        }

        const esummaryUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${idList.join(',')}&retmode=json&email=${encodeURIComponent(mailto)}&tool=AIDatasetExplorer`;
        const summaryRes = await fetch(esummaryUrl, {
            headers: { 'Accept': 'application/json' },
            signal: controller.signal,
            next: { revalidate: 3600 },
        });

        clearTimeout(timeoutId);

        if (!summaryRes.ok) {
            if (trace) trace.pubmed = { success: false, httpStatus: summaryRes.status };
            return [];
        }

        const summaryData = await summaryRes.json();
        const resultDict = summaryData.result || {};
        const articles: PubMedArticleRaw[] = [];

        for (const uid of idList) {
            const item = resultDict[uid];
            if (!item) continue;

            const title = (item.title || '').replace(/<[^>]+>/g, '').trim();
            const authors = Array.isArray(item.authors) ? item.authors.map((a: any) => a.name).filter(Boolean) : [];
            const source = item.source || item.fulljournalname || 'PubMed Central';
            const pubdate = item.pubdate || item.sortpubdate || '';
            const yearMatch = pubdate.match(/\b(19\d\d|20\d\d)\b/);
            const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;

            let doi: string | undefined;
            if (Array.isArray(item.articleids)) {
                const doiObj = item.articleids.find((id: any) => id.idtype === 'doi');
                if (doiObj?.value) doi = doiObj.value;
            }

            if (title) {
                articles.push({
                    uid,
                    title,
                    authors,
                    source,
                    pubdate,
                    year,
                    doi,
                    url: `https://pubmed.ncbi.nlm.nih.gov/${uid}/`,
                });
            }
        }

        providerRawCache.set(cacheKey, articles, 60 * 60 * 1000);

        if (trace) {
            trace.pubmed = {
                success: true,
                count: articles.length,
                httpStatus: 200,
            };
        }

        return articles;
    } catch (err: any) {
        clearTimeout(timeoutId);
        const isAbort = err.name === 'AbortError';
        if (trace) trace.pubmed = { success: false, reason: isAbort ? 'Request timed out' : err.message };
        console.warn(`[PUBMED] Fetch failed for query "${cleanQuery}":`, err.message);
        return [];
    }
}
