import { NextRequest, NextResponse } from 'next/server';
import { paperDetailCache, buildPaperDetailKey } from '@/server/papers/paperCache';
import { searchSemanticScholar } from '@/server/papers/semanticScholar';
import { searchOpenAlex } from '@/server/papers/openAlex';
import { searchArxiv } from '@/server/papers/arxiv';
import {
    normalizeSemanticScholar,
    normalizeOpenAlex,
    normalizeArxiv,
    deduplicateAndMergePapers,
} from '@/server/papers/paperNormalizer';
import { scorePaper } from '@/server/papers/paperScorer';
import { parseQuery } from '@/server/query-understanding/queryParser';

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ paperId: string }> }
) {
    const params = await context.params;
    const rawId = decodeURIComponent(params.paperId || '').trim();

    if (!rawId) {
        return NextResponse.json({ success: false, error: 'paperId is required.' }, { status: 400 });
    }

    const cacheKey = buildPaperDetailKey(rawId);
    const cached = paperDetailCache.get(cacheKey);
    if (cached) {
        return NextResponse.json({ success: true, paper: cached, cached: true });
    }

    try {
        // Determine search strategy based on ID prefix
        let rawQuery = rawId;
        if (rawId.startsWith('doi:')) {
            rawQuery = rawId.replace('doi:', '');
        } else if (rawId.startsWith('arxiv:')) {
            rawQuery = rawId.replace('arxiv:', '');
        } else if (rawId.startsWith('s2:')) {
            rawQuery = rawId.replace('s2:', '');
        }

        const [s2Res, alexRes, arxivRes] = await Promise.allSettled([
            searchSemanticScholar(rawQuery, 3),
            searchOpenAlex(rawQuery, 3),
            searchArxiv(rawQuery, 3),
        ]);

        const rawList = [];
        if (s2Res.status === 'fulfilled') {
            for (const r of s2Res.value) rawList.push(normalizeSemanticScholar(r));
        }
        if (alexRes.status === 'fulfilled') {
            for (const r of alexRes.value) rawList.push(normalizeOpenAlex(r));
        }
        if (arxivRes.status === 'fulfilled') {
            for (const r of arxivRes.value) rawList.push(normalizeArxiv(r));
        }

        if (rawList.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Paper not found in scholarly indexes.' },
                { status: 404 }
            );
        }

        const deduplicated = deduplicateAndMergePapers(rawList);
        const qu = parseQuery(rawQuery, 'RESEARCH_SEARCH');
        const scored = scorePaper(deduplicated[0], { queryUnderstanding: qu, rawQuery });

        paperDetailCache.set(cacheKey, scored);

        return NextResponse.json({
            success: true,
            paper: scored,
            cached: false,
        });
    } catch (err: any) {
        console.error(`[API-RESEARCH-PAPERID] Error fetching paper "${rawId}":`, err);
        return NextResponse.json({ success: false, error: 'Failed to retrieve paper details.' }, { status: 500 });
    }
}
