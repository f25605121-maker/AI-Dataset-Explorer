import { NextRequest, NextResponse } from 'next/server';
import { runDatasetPipeline } from '@/server/assistant/datasetPipeline';
import { parseQuery } from '@/server/query-understanding/queryParser';
import { scanAndShieldPrompt } from '@/server/security/promptShield';
import { extractIp } from '@/server/security/rate-limit';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || searchParams.get('query') || '';

    if (!query.trim()) {
        return NextResponse.json({
            status: 'online',
            service: 'Model Search Service with Research Discovery',
            usage: 'GET /api/models?q=your+model+query',
        });
    }

    const clientIp = extractIp(req);
    const promptShield = scanAndShieldPrompt(query, undefined, clientIp);
    if (!promptShield.safe) {
        return NextResponse.json({ success: false, error: 'Security policy violation.' }, { status: 400 });
    }

    const safeQuery = promptShield.sanitizedInput;
    const qu = parseQuery(safeQuery, 'MODEL_SEARCH');

    try {
        const pipelineResult = await runDatasetPipeline(safeQuery, crypto.randomUUID(), {
            intent: 'MODEL_SEARCH',
            confidence: 0.9,
            datasetRequired: true,
            generalAnswerRequired: false,
            searchQuery: safeQuery,
            reason: 'Model search query',
        });

        return NextResponse.json({
            success: true,
            query: safeQuery,
            models: pipelineResult.models || [],
            datasets: pipelineResult.datasets || [],
            papers: pipelineResult.papers || [],
            researchLandscape: pipelineResult.researchLandscape,
            summary: pipelineResult.summary,
            analysis: pipelineResult.analysis,
        });
    } catch (err: any) {
        console.error('[API-MODELS] Error:', err);
        return NextResponse.json({ success: false, error: 'Model search failed.' }, { status: 500 });
    }
}
