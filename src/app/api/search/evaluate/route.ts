import { NextRequest, NextResponse } from 'next/server';
import { runBenchmarkEvaluation } from '@/server/search/evaluation';

export async function GET(req: NextRequest) {
    try {
        const evaluationResults = runBenchmarkEvaluation();
        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            ...evaluationResults,
        });
    } catch (e: any) {
        console.error('[API-EVALUATE][ERROR]', e);
        return NextResponse.json(
            { success: false, error: e?.message || 'Failed to run evaluation benchmark' },
            { status: 500 }
        );
    }
}
