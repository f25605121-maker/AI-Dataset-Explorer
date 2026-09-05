import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { getRecentSecurityLogs, logSecurityEvent } from '@/server/security/securityLogger';
import { extractIp } from '@/server/security/rate-limit';

/**
 * Hardened Admin API Route (Item 16: Remove default admin route / stealth RBAC).
 *
 * Security Design:
 * - Unauthenticated or non-admin requests return a 404 NOT FOUND (stealth mode)
 *   to avoid leaking the existence of administrative endpoints to scanners.
 * - Requires explicit role: 'SUPER_ADMIN'.
 */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const ip = extractIp(req);
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    const isSuperAdmin = token && (token as any).role === 'SUPER_ADMIN';

    if (!isSuperAdmin) {
        logSecurityEvent({
            eventType: 'ADMIN_ACCESS_UNAUTHORIZED',
            severity: 'WARN',
            ip,
            endpoint: '/api/admin',
            userId: token?.sub || 'anonymous',
            details: { reason: 'Unauthorized access to stealth admin route' },
        });

        // Stealth response: Return 404 instead of 401/403 so attackers cannot enumerate administrative paths
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Super Admin authorized view
    const securityLogs = getRecentSecurityLogs(50);

    return NextResponse.json({
        status: 'authorized',
        user: token.email,
        role: (token as any).role,
        systemStats: {
            uptime: process.uptime(),
            nodeVersion: process.version,
            memoryUsage: process.memoryUsage(),
        },
        recentSecurityLogs: securityLogs,
    });
}
