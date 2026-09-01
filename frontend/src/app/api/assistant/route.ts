import { NextRequest, NextResponse } from 'next/server';
import { AssistantRequest } from '../../../lib/assistant/types';
import { runUnifiedOrchestrator } from '../../../lib/assistant/unifiedOrchestrator';
import { getLlmStatus } from '../../../lib/assistant/llmProvider';
import { extractIp } from '../../../lib/rateLimit';

// Rate limiting — isolated to dev/single-instance.
const ipRequestLog = new Map<string, number[]>();
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_RPM || '30', 10);
const WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    let requests = ipRequestLog.get(ip) || [];

    // Filter out stale requests in O(N) only for the specific IP
    requests = requests.filter(t => now - t < WINDOW_MS);

    if (requests.length >= RATE_LIMIT) {
        return true;
    }

    requests.push(now);
    ipRequestLog.set(ip, requests);

    // Prevent memory leaks: aggressively clear if map gets dangerously large
    if (ipRequestLog.size > 1000) {
        ipRequestLog.clear();
    }
    return false;
}

export async function POST(req: NextRequest) {
    try {
        const clientIp = extractIp(req);

        if (isRateLimited(clientIp)) {
            return NextResponse.json(
                { success: false, error: { type: 'RATE_LIMITED', status: 429, message: 'Too many requests. Please wait before searching again.' } },
                { status: 429 }
            );
        }

        const body = (await req.json()) as AssistantRequest;

        if (!body?.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
            return NextResponse.json({ success: false, message: 'Invalid request body.' }, { status: 400 });
        }

        const searchId = body.conversationId || crypto.randomUUID();
        const latestMessage = body.messages[body.messages.length - 1].content.trim();

        if (latestMessage.length > 8000) {
            return NextResponse.json({ success: false, message: 'Query too long. Maximum 8000 characters.' }, { status: 400 });
        }

        // Unified orchestrator handles intent classification + routing (with Gemini or OpenRouter)
        const result = await runUnifiedOrchestrator({
            query: latestMessage,
            messages: body.messages,
            context: body.context,
            searchId,
        });

        return NextResponse.json({ success: true, ...result });

    } catch (e: unknown) {
        console.error('[API-ASSISTANT][ERROR]', e);

        return NextResponse.json(
            {
                success: false,
                error: {
                    status: 500,
                    message: 'Something went wrong. Please try again.'
                }
            },
            { status: 500 }
        );
    }
}
