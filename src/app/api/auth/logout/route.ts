import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/logout
 * 
 * Clears the active browser session cookie and invalidates client credentials.
 */
export async function POST(req: NextRequest) {
    const headers = new Headers();
    headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');

    const response = NextResponse.json(
        {
            success: true,
            message: 'Logged out successfully.',
        },
        { status: 200, headers }
    );

    const useSecureCookies = Boolean(process.env.NEXTAUTH_URL?.startsWith('https://'));
    const cookieNames = [
        'next-auth.session-token',
        '__Secure-next-auth.session-token',
        'next-auth.callback-url',
        '__Secure-next-auth.callback-url',
        'next-auth.csrf-token',
        '__Host-next-auth.csrf-token',
    ];

    for (const name of cookieNames) {
        response.cookies.set({
            name,
            value: '',
            httpOnly: true,
            secure: useSecureCookies,
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
            expires: new Date(0),
        });
    }

    return response;
}
