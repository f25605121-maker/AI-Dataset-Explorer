import { NextResponse } from 'next/server';
import { generateCsrfToken, setCsrfCookie } from '@/server/security/csrf';

/**
 * GET /api/csrf
 * Returns a fresh CSRF token and sets the CSRF cookie on the client.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
    const token = generateCsrfToken();
    const response = NextResponse.json({
        success: true,
        csrfToken: token,
    });
    return setCsrfCookie(response, token);
}
