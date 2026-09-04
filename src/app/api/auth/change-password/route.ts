import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import bcrypt from 'bcryptjs';
import { findUserById, updateUserPassword } from '@/server/auth/userStore';
import { validateCsrf } from '@/server/security/csrf';
import { logSecurityEvent } from '@/server/security/securityLogger';
import { extractIp } from '@/server/security/rate-limit';

export async function POST(req: NextRequest) {
    const ip = extractIp(req);

    // 1. CSRF validation
    const csrfCheck = validateCsrf(req);
    if (!csrfCheck.valid) {
        logSecurityEvent({
            eventType: 'CSRF_VIOLATION',
            severity: 'WARN',
            ip,
            endpoint: '/api/auth/change-password',
            details: { reason: csrfCheck.reason },
        });
        return NextResponse.json({ success: false, error: 'CSRF validation failed.' }, { status: 403 });
    }

    // 2. Authentication check
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.id) {
        return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ success: false, error: 'Current password and new password are required.' }, { status: 400 });
        }

        if (typeof newPassword !== 'string' || newPassword.length < 8) {
            return NextResponse.json({ success: false, error: 'New password must be at least 8 characters long.' }, { status: 400 });
        }

        const user = await findUserById(token.id as string);
        if (!user) {
            return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
        }

        const matches = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!matches) {
            logSecurityEvent({
                eventType: 'AUTH_LOGIN_FAILED',
                severity: 'WARN',
                userId: user.id,
                email: user.email,
                ip,
                details: { action: 'change-password-incorrect-current' },
            });
            return NextResponse.json({ success: false, error: 'Current password is incorrect.' }, { status: 400 });
        }

        // Update password and increment session version (Item 3: Invalidate all active sessions)
        await updateUserPassword(user.id, newPassword);

        return NextResponse.json({
            success: true,
            message: 'Password updated successfully. All active sessions have been invalidated.',
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message || 'Password update failed.' }, { status: 500 });
    }
}
