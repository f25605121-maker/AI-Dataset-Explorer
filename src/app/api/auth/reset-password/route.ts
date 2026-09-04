import { NextRequest, NextResponse } from 'next/server';
import { consumePasswordResetToken } from '@/server/auth/userStore';
import { extractIp, isRateLimited } from '@/server/security/rate-limit';
import { logSecurityEvent } from '@/server/security/securityLogger';

export async function POST(req: NextRequest) {
    const ip = extractIp(req);

    // Rate limit reset token verification attempts (prevent brute force of tokens)
    if (isRateLimited('reset-password-attempt', ip, 10, 15 * 60 * 1000)) {
        logSecurityEvent({
            eventType: 'RATE_LIMIT_EXCEEDED',
            severity: 'WARN',
            ip,
            endpoint: '/api/auth/reset-password',
        });
        return NextResponse.json(
            { error: 'Too many password reset verification attempts. Please wait.' },
            { status: 429 }
        );
    }

    try {
        const body = await req.json();
        const { token, newPassword } = body;

        if (!token || !newPassword) {
            return NextResponse.json(
                { error: 'Reset token and new password are required.' },
                { status: 400 }
            );
        }

        if (typeof newPassword !== 'string' || newPassword.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters long.' },
                { status: 400 }
            );
        }

        const result = await consumePasswordResetToken(token, newPassword);

        if (!result.success) {
            return NextResponse.json(
                { error: result.message },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: result.message,
        });
    } catch {
        return NextResponse.json(
            { error: 'An unexpected error occurred while resetting your password.' },
            { status: 500 }
        );
    }
}
