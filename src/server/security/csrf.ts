import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { logSecurityEvent } from './securityLogger';

const CSRF_COOKIE_NAME = process.env.NODE_ENV === 'production' ? '__Host-csrf-token' : 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_SECRET = process.env.CSRF_SECRET || process.env.NEXTAUTH_SECRET || 'csrf-fallback-secret-2026';

/**
 * Generates a signed CSRF token.
 * Format: `<randomHex>.<hmacSignature>`
 */
export function generateCsrfToken(): string {
    const raw = crypto.randomBytes(32).toString('hex');
    const hmac = crypto.createHmac('sha256', CSRF_SECRET).update(raw).digest('hex');
    return `${raw}.${hmac}`;
}

/**
 * Validates the cryptographic signature of a CSRF token.
 */
export function verifyCsrfTokenSignature(token: string): boolean {
    if (!token || typeof token !== 'string') return false;
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [raw, signature] = parts;
    if (!raw || !signature) return false;

    const expectedHmac = crypto.createHmac('sha256', CSRF_SECRET).update(raw).digest('hex');

    try {
        const sigBuf = Buffer.from(signature, 'hex');
        const expBuf = Buffer.from(expectedHmac, 'hex');
        if (sigBuf.length !== expBuf.length) return false;
        return crypto.timingSafeEqual(sigBuf, expBuf);
    } catch {
        return false;
    }
}

/**
 * Validates the CSRF token in an incoming request using the Double Submit Cookie pattern.
 * Compares the token in the `x-csrf-token` header (or request body) against the token in the cookie.
 */
export function validateCsrf(req: Request | NextRequest): { valid: boolean; reason?: string } {
    const method = req.method.toUpperCase();

    // Safe methods do not mutate state
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        return { valid: true };
    }

    // Extract cookie
    let cookieHeader = '';
    if ('cookies' in req && typeof (req as any).cookies?.get === 'function') {
        const c = (req as NextRequest).cookies.get(CSRF_COOKIE_NAME);
        cookieHeader = c?.value || '';
    } else {
        const rawCookies = req.headers.get('cookie') || '';
        const match = rawCookies.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]+)`));
        cookieHeader = match ? decodeURIComponent(match[1]) : '';
    }

    // Extract header
    const tokenHeader = req.headers.get(CSRF_HEADER_NAME) || '';

    if (!tokenHeader) {
        return { valid: false, reason: 'Missing CSRF token header' };
    }

    if (!cookieHeader) {
        return { valid: false, reason: 'Missing CSRF token cookie' };
    }

    // Verify token cryptographic signature
    if (!verifyCsrfTokenSignature(tokenHeader) || !verifyCsrfTokenSignature(cookieHeader)) {
        return { valid: false, reason: 'Invalid CSRF token signature' };
    }

    // Timing-safe comparison between header and cookie
    try {
        const bufA = Buffer.from(tokenHeader, 'utf-8');
        const bufB = Buffer.from(cookieHeader, 'utf-8');
        if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
            return { valid: false, reason: 'CSRF token mismatch between header and cookie' };
        }
    } catch {
        return { valid: false, reason: 'CSRF token comparison failure' };
    }

    return { valid: true };
}

/**
 * Attaches the CSRF cookie to a NextResponse.
 */
export function setCsrfCookie(res: NextResponse, token?: string): NextResponse {
    const csrfToken = token || generateCsrfToken();
    res.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
        httpOnly: false, // Must be readable by client JS to send in x-csrf-token header
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
    });
    return res;
}

export { CSRF_COOKIE_NAME, CSRF_HEADER_NAME };
