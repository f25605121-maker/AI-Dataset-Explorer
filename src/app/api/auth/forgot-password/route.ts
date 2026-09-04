import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { isRateLimited, extractIp } from '@/server/security/rate-limit';
import { createPasswordResetToken } from '@/server/auth/userStore';
import { sanitizeEmail } from '@/server/security/sanitize';
import { logSecurityEvent } from '@/server/security/securityLogger';

export async function POST(req: NextRequest) {
    const ip = extractIp(req);

    // 1. Rate Limit Password Resets (Item 12: max 3 requests per IP per hour)
    if (isRateLimited('password-reset-request', ip, 3, 60 * 60 * 1000)) {
        logSecurityEvent({
            eventType: 'RATE_LIMIT_EXCEEDED',
            severity: 'WARN',
            ip,
            endpoint: '/api/auth/forgot-password',
        });
        return NextResponse.json(
            { error: 'Too many password reset attempts. Please wait 1 hour before trying again.' },
            { status: 429 }
        );
    }

    try {
        const body = await req.json();
        const rawEmail = body.email;
        const email = sanitizeEmail(rawEmail);

        if (!email) {
            return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
        }

        // Per-email rate limiting (Item 12)
        if (isRateLimited('password-reset-email', email, 3, 60 * 60 * 1000)) {
            return NextResponse.json(
                { error: 'Too many reset requests for this email account. Please try again later.' },
                { status: 429 }
            );
        }

        const resetToken = await createPasswordResetToken(email);

        // Anti-enumeration (Item 5): If user doesn't exist, execute dummy delay to prevent timing side-channels
        if (!resetToken) {
            await bcrypt.compare('dummyPasswordTiming123', '$2b$12$e8Y6l1k9bJqN0lW3r.Z7eu1uL7y0kP1Q7pM9j9nQ2x3v8W9u2t1O2');
        }

        // In development/test mode, expose a simulated resetUrl for verification if configured
        const isDev = process.env.NODE_ENV !== 'production';

        // Generic response to prevent user enumeration (Item 5)
        return NextResponse.json({
            success: true,
            message: 'If an account with that email exists, password reset instructions have been sent.',
            ...(isDev && resetToken ? { devResetToken: resetToken } : {}),
        });
    } catch {
        return NextResponse.json({ error: 'Unable to process password reset request.' }, { status: 500 });
    }
}
