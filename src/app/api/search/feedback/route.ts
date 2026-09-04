import { NextRequest, NextResponse } from 'next/server';
import { recordUserFeedback, getAllFeedback, getFeedbackSummary } from '@/server/search/feedback';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        if (!body.query || !body.candidateId || !body.rating) {
            return NextResponse.json(
                { success: false, error: 'Query, candidateId, and rating are required.' },
                { status: 400 }
            );
        }

        const saved = recordUserFeedback({
            searchId: body.searchId || crypto.randomUUID(),
            query: body.query,
            candidateId: body.candidateId,
            candidateType: body.candidateType || 'dataset',
            rating: body.rating,
            reasons: body.reasons || [],
            comment: body.comment,
        });

        return NextResponse.json({ success: true, feedback: saved });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e?.message || 'Internal error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const feedback = getAllFeedback();
        const summary = getFeedbackSummary();
        return NextResponse.json({ success: true, summary, feedback });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e?.message || 'Internal error' }, { status: 500 });
    }
}
