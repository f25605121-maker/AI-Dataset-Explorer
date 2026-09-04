import { NextResponse } from 'next/server';
import { isRateLimited, extractIp } from '@/server/security/rate-limit';
import { createUser, findUserByEmail } from '@/server/auth/userStore';
import { sanitizeEmail, sanitizeText } from '@/server/security/sanitize';
import { logSecurityEvent } from '@/server/security/securityLogger';

export async function POST(req: Request) {
    const ip = extractIp(req);

    // Rate limit: max 5 registrations per IP per hour
    if (isRateLimited('register', ip, 5, 60 * 60 * 1000)) {
        logSecurityEvent({
            eventType: 'RATE_LIMIT_EXCEEDED',
            severity: 'WARN',
            ip,
            endpoint: '/api/auth/register',
        });
        return NextResponse.json(
            { message: 'Too many registration attempts. Please try again later.' },
            { status: 429 }
        );
    }

    try {
        let body: any = {};
        try {
            body = await req.json();
        } catch {
            return NextResponse.json({ message: 'Invalid JSON request format.' }, { status: 400 });
        }

        const rawEmail = body.email;
        const rawPassword = body.password;
        const rawName = body.name;

        const email = sanitizeEmail(rawEmail);
        const name = sanitizeText(rawName, 60);

        if (!email || !rawPassword) {
            return NextResponse.json({ message: 'A valid email and password are required.' }, { status: 400 });
        }

        if (typeof rawPassword !== 'string' || rawPassword.length < 8) {
            return NextResponse.json({ message: 'Password must be at least 8 characters long.' }, { status: 400 });
        }

        const existing = await findUserByEmail(email);
        if (existing) {
            // Anti-enumeration: Return generic error or consistent status
            return NextResponse.json({ message: 'An account with that email already exists or is unavailable.' }, { status: 409 });
        }

        const newUser = await createUser({
            name,
            email,
            password: rawPassword,
            role: 'USER',
        });

        return NextResponse.json({
            ok: true,
            user: { id: newUser.id, name: newUser.name, email: newUser.email },
        });
    } catch (e: any) {
        return NextResponse.json({ message: e.message || 'Registration failed.' }, { status: 500 });
    }
}
