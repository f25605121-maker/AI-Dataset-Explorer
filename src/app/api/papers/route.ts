import { NextRequest, NextResponse } from 'next/server';
import { extractIp } from '@/server/security/rate-limit';
import { parseQuery } from '@/server/query-understanding/queryParser';
import { searchResearchPapers } from '@/server/papers/paperSearchAggregator';
import { scanAndShieldPrompt } from '@/server/security/promptShield';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Math.min(50, Math.max(1, parseInt(limitParam, 10))) : 16;
    const filter = searchParams.get('filter') || 'all';

    if (!query.trim()) {
        return NextResponse.json({
            success: true,
            papers: [],
            message: 'Provide a query parameter ?q=your+topic to search research papers.',
        });
    }

    const clientIp = extractIp(req);
    const promptShield = scanAndShieldPrompt(query, undefined, clientIp);
    if (!promptShield.safe) {
        return NextResponse.json(
            { success: false, error: 'Security policy violation: query rejected.' },
            { status: 400 }
        );
    }

    const safeQuery = promptShield.sanitizedInput;
    const qu = parseQuery(safeQuery, 'RESEARCH_SEARCH');

    try {
        const result = await searchResearchPapers({
            query: safeQuery,
            queryUnderstanding: qu,
            limit: 30,
        });

        let filtered = result.papers;
        if (filter === 'latest') {
            filtered = [...filtered].sort((a, b) => (b.year || 0) - (a.year || 0));
        } else if (filter === 'most_cited') {
            filtered = [...filtered].sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
        } else if (filter === 'exact_dataset') {
            filtered = filtered.filter((p) => p.relationship === 'EXACT_DATASET');
        } else if (filter === 'exact_model') {
            filtered = filtered.filter((p) => p.relationship === 'EXACT_MODEL');
        } else if (filter === 'directly_related') {
            filtered = filtered.filter((p) => p.relationship === 'DIRECTLY_RELATED');
        } else if (filter === 'open_access') {
            filtered = filtered.filter((p) => p.openAccess);
        } else if (filter === 'preprint') {
            filtered = filtered.filter((p) => p.isPreprint);
        }

        return NextResponse.json({
            success: true,
            query: safeQuery,
            totalFound: filtered.length,
            papers: filtered.slice(0, limit),
            researchLandscape: result.researchLandscape,
            researchSynthesis: result.researchSynthesis,
            audit: result.audit,
        });
    } catch (err: any) {
        console.error('[API-PAPERS] Error:', err);
        return NextResponse.json(
            { success: false, error: 'Failed to search research papers. Academic providers may be temporarily unavailable.' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const query = typeof body.query === 'string' ? body.query.trim() : '';
        const limit = typeof body.limit === 'number' ? Math.min(50, Math.max(1, body.limit)) : 16;
        const dataset = body.dataset || null;
        const model = body.model || null;

        if (!query) {
            return NextResponse.json({ success: false, error: 'Query is required in request body.' }, { status: 400 });
        }

        const clientIp = extractIp(req);
        const promptShield = scanAndShieldPrompt(query, undefined, clientIp);
        if (!promptShield.safe) {
            return NextResponse.json(
                { success: false, error: 'Security policy violation: query rejected.' },
                { status: 400 }
            );
        }

        const safeQuery = promptShield.sanitizedInput;
        const qu = parseQuery(safeQuery, 'RESEARCH_SEARCH');

        const result = await searchResearchPapers({
            query: safeQuery,
            queryUnderstanding: qu,
            bestDataset: dataset,
            bestModel: model,
            limit,
        });

        return NextResponse.json({
            success: true,
            query: safeQuery,
            totalFound: result.papers.length,
            papers: result.papers,
            researchLandscape: result.researchLandscape,
            researchSynthesis: result.researchSynthesis,
            audit: result.audit,
        });
    } catch (err: any) {
        console.error('[API-PAPERS-POST] Error:', err);
        return NextResponse.json({ success: false, error: 'Internal paper discovery error.' }, { status: 500 });
    }
}
