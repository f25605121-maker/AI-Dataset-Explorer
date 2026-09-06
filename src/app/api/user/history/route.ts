import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import {
    getUserSearchHistory,
    addUserSearch,
    removeUserSearch,
    clearUserSearchHistory,
} from '@/server/history/searchHistoryStore';

export const dynamic = 'force-dynamic';

async function getAuthenticatedUserId(req: NextRequest): Promise<string | null> {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token || (!token.id && !token.email)) {
        return null;
    }
    return (token.id as string) || (token.email as string);
}

/**
 * GET: Retrieve search history for the authenticated user only.
 */
export async function GET(req: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId(req);
        if (!userId) {
            return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
        }

        const history = await getUserSearchHistory(userId);
        return NextResponse.json({ success: true, history });
    } catch {
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
}

/**
 * POST: Add a new search query to the authenticated user's history.
 */
export async function POST(req: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId(req);
        if (!userId) {
            return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
        }

        const body = await req.json().catch(() => null);
        if (!body || typeof body.query !== 'string') {
            return NextResponse.json({ error: 'Invalid search query.' }, { status: 400 });
        }

        const trimmed = body.query.trim();
        if (!trimmed || trimmed.length > 300) {
            return NextResponse.json({ error: 'Search query must be between 1 and 300 characters.' }, { status: 400 });
        }

        const category = typeof body.category === 'string' ? body.category : undefined;
        const item = await addUserSearch(userId, trimmed, category);

        if (!item) {
            return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
        }

        return NextResponse.json({ success: true, item });
    } catch {
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
}

/**
 * DELETE: Remove a specific search item or clear entire history for authenticated user.
 */
export async function DELETE(req: NextRequest) {
    try {
        const userId = await getAuthenticatedUserId(req);
        if (!userId) {
            return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const searchId = searchParams.get('id');
        const clearAll = searchParams.get('all') === 'true';

        if (clearAll) {
            await clearUserSearchHistory(userId);
            return NextResponse.json({ success: true, message: 'Search history cleared.' });
        }

        if (!searchId) {
            return NextResponse.json({ error: 'Missing search item ID.' }, { status: 400 });
        }

        const removed = await removeUserSearch(userId, searchId);
        if (!removed) {
            return NextResponse.json({ error: 'Search item not found or unauthorized.' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Search item removed.' });
    } catch {
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
}
