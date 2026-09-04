import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { AssistantRequest } from '@/server/assistant/types';
import { runUnifiedOrchestrator } from '@/server/assistant/unifiedOrchestrator';
import { extractIp } from '@/server/security/rate-limit';
import { scanAndShieldPrompt } from '@/server/security/promptShield';
import { checkAiQuota, recordAiUsage, HARD_CAP_INPUT_LENGTH } from '@/server/security/usageLimiter';
import { logSecurityEvent } from '@/server/security/securityLogger';

// Rate limiting — sliding window per IP
const ipRequestLog = new Map<string, number[]>();
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT_RPM || '30', 10);
const WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    let requests = ipRequestLog.get(ip) || [];
    requests = requests.filter((t) => now - t < WINDOW_MS);

    if (requests.length >= RATE_LIMIT) {
        return true;
    }

    requests.push(now);
    ipRequestLog.set(ip, requests);

    if (ipRequestLog.size > 1000) {
        ipRequestLog.clear();
    }
    return false;
}

export async function POST(req: NextRequest) {
    try {
        const clientIp = extractIp(req);
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        const userIdentifier = token?.email || clientIp;
        const userTier = ((token as any)?.planTier as string) || 'free';

        // 1. Rate Limiting Check
        if (isRateLimited(clientIp)) {
            logSecurityEvent({
                eventType: 'RATE_LIMIT_EXCEEDED',
                severity: 'WARN',
                ip: clientIp,
                endpoint: '/api/assistant',
            });
            return NextResponse.json(
                { success: false, error: { type: 'RATE_LIMITED', status: 429, message: 'Too many requests. Please wait before searching again.' } },
                { status: 429 }
            );
        }

        // 2. AI Usage Quota Check (Item 10)
        const quota = checkAiQuota(userIdentifier, userTier);
        if (!quota.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        type: 'AI_QUOTA_EXCEEDED',
                        status: 429,
                        message: `Daily AI query limit reached for your plan. Resets in ${quota.resetHours} hours.`,
                        remainingRequests: 0,
                    },
                },
                { status: 429 }
            );
        }

        let body: AssistantRequest;
        try {
            body = (await req.json()) as AssistantRequest;
        } catch {
            return NextResponse.json({ success: false, message: 'Invalid JSON request payload.' }, { status: 400 });
        }

        if (!body?.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
            return NextResponse.json({ success: false, message: 'Invalid request body: messages array required.' }, { status: 400 });
        }

        const latestMessage = (body.messages[body.messages.length - 1]?.content || '').trim();

        if (!latestMessage) {
            return NextResponse.json({ success: false, message: 'Message content cannot be empty.' }, { status: 400 });
        }

        // 3. Request Size / Input Length Bounds (Item 11)
        if (latestMessage.length > HARD_CAP_INPUT_LENGTH) {
            return NextResponse.json(
                { success: false, message: `Query too long. Maximum allowed length is ${HARD_CAP_INPUT_LENGTH} characters.` },
                { status: 400 }
            );
        }

        // 4. Prompt Injection Defense (Item 9)
        const promptShield = scanAndShieldPrompt(latestMessage, token?.sub, clientIp);
        if (!promptShield.safe) {
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        status: 400,
                        message: 'Security policy violation: potentially unsafe prompt or instruction override detected.',
                    },
                },
                { status: 400 }
            );
        }

        const searchId = body.conversationId || crypto.randomUUID();

        // 5. Orchestrate AI Pipeline
        const result = await runUnifiedOrchestrator({
            query: promptShield.sanitizedInput,
            messages: body.messages,
            context: body.context,
            searchId,
        });

        // 6. Record Token & Query Usage
        recordAiUsage(userIdentifier, 150, {
            querySnippet: promptShield.sanitizedInput,
            type: 'assistant',
            status: 'success',
        });

        return NextResponse.json({
            success: true,
            ...result,
            quota: {
                remainingRequests: quota.remainingRequests - 1,
                remainingTokens: quota.remainingTokens - 150,
            },
        });
    } catch (e: unknown) {
        console.error('[API-ASSISTANT][ERROR]', e);

        return NextResponse.json(
            {
                success: false,
                error: {
                    status: 500,
                    message: 'Internal server error processing assistant request.',
                },
            },
            { status: 500 }
        );
    }
}
