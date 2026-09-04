import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { extractIp } from '@/server/security/rate-limit';
import { getUserUsageStats } from '@/server/security/usageLimiter';

export async function GET(req: NextRequest) {
    try {
        const clientIp = extractIp(req);
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        
        const userIdentifier = token?.email || clientIp || 'anonymous';
        const userTier = ((token as any)?.planTier as string) || ((token as any)?.role === 'SUPER_ADMIN' ? 'enterprise' : 'free');

        const stats = await getUserUsageStats(userIdentifier, userTier);

        return NextResponse.json({
            success: true,
            usage: stats,
            user: {
                name: token?.name || 'Guest User',
                email: token?.email || null,
                role: (token as any)?.role || 'USER',
                isLoggedIn: Boolean(token?.email),
            },
        });
    } catch (e: any) {
        console.error('[API_USER_USAGE][ERROR]', e);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to retrieve usage metrics.',
            },
            { status: 500 }
        );
    }
}
