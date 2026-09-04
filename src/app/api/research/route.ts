import { NextRequest, NextResponse } from 'next/server';
import { parseQuery } from '@/server/query-understanding/queryParser';
import { searchResearchPapers } from '@/server/papers/paperSearchAggregator';
import { scanAndShieldPrompt } from '@/server/security/promptShield';
import { extractIp } from '@/server/security/rate-limit';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const query = typeof body.query === 'string' ? body.query.trim() : '';

        if (!query) {
            return NextResponse.json({ success: false, error: 'Query is required.' }, { status: 400 });
        }

        const clientIp = extractIp(req);
        const promptShield = scanAndShieldPrompt(query, undefined, clientIp);
        if (!promptShield.safe) {
            return NextResponse.json({ success: false, error: 'Security policy violation.' }, { status: 400 });
        }

        const safeQuery = promptShield.sanitizedInput;
        const qu = parseQuery(safeQuery, 'RESEARCH_SEARCH');

        const result = await searchResearchPapers({
            query: safeQuery,
            queryUnderstanding: qu,
            bestDataset: body.dataset || null,
            bestModel: body.model || null,
            datasets: body.datasets || [],
            models: body.models || [],
            limit: body.limit || 20,
        });

        return NextResponse.json({
            success: true,
            query: safeQuery,
            papers: result.papers,
            researchLandscape: result.researchLandscape,
            researchSynthesis: result.researchSynthesis,
            audit: result.audit,
        });
    } catch (err: any) {
        console.error('[API-RESEARCH] Error:', err);
        return NextResponse.json({ success: false, error: 'Failed to aggregate research.' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';

    if (!query) {
        return NextResponse.json({
            status: 'online',
            service: 'Research Paper Aggregation Service',
            usage: 'POST to /api/research with { query, dataset?, model? }',
        });
    }

    const fakeReq = new NextRequest(req.url, {
        method: 'POST',
        headers: req.headers,
        body: JSON.stringify({ query }),
    });

    return POST(fakeReq);
}
