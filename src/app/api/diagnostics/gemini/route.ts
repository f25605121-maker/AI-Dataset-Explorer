import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Diagnostics endpoint — DISABLED in production.
// Requires: NODE_ENV=development AND DEBUG_API_TRACE=true AND valid auth session.
export async function GET(req: Request) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }

    if (process.env.DEBUG_API_TRACE !== 'true') {
        return NextResponse.json({ error: 'Not available.' }, { status: 404 });
    }

    const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
        gemini:       { configured: !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY), model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' },

        kaggle:       { configured: !!(process.env.KAGGLE_USERNAME && process.env.KAGGLE_KEY) },
        huggingface:  { configured: !!process.env.HUGGING_FACE_TOKEN },
    });
}
