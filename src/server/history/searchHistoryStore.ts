import crypto from 'crypto';
import { getStorageAdapter } from '../db';
import { sanitizeText } from '../security/sanitize';

export interface SearchHistoryRecord {
    id: string;
    userId: string;
    query: string;
    category?: string;
    timestamp: number;
}

const MAX_USER_HISTORY_ITEMS = 40;
const MAX_QUERY_LENGTH = 300;

function getHistoryAdapter() {
    return getStorageAdapter<SearchHistoryRecord>('search_history.json');
}

/**
 * Retrieves search history strictly scoped to the authenticated user ID.
 */
export async function getUserSearchHistory(userId: string): Promise<SearchHistoryRecord[]> {
    if (!userId || typeof userId !== 'string') return [];
    
    const adapter = getHistoryAdapter();
    const allRecords = await adapter.readAll();
    
    return allRecords
        .filter((record) => record.userId === userId)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, MAX_USER_HISTORY_ITEMS);
}

/**
 * Adds a search query record for a specific user ID.
 */
export async function addUserSearch(
    userId: string,
    rawQuery: string,
    rawCategory?: string
): Promise<SearchHistoryRecord | null> {
    if (!userId || typeof userId !== 'string') return null;

    const query = sanitizeText(rawQuery, MAX_QUERY_LENGTH).trim();
    if (!query) return null;

    const category = rawCategory ? sanitizeText(rawCategory, 50).trim() : undefined;
    const adapter = getHistoryAdapter();
    const allRecords = await adapter.readAll();

    // Deduplicate: filter out identical queries for this user
    const filtered = allRecords.filter(
        (item) => !(item.userId === userId && item.query.toLowerCase() === query.toLowerCase())
    );

    const newRecord: SearchHistoryRecord = {
        id: `sh_${crypto.randomUUID()}`,
        userId,
        query,
        category,
        timestamp: Date.now(),
    };

    // Keep user's records under limit while preserving other users' records
    const userRecords = [newRecord, ...filtered.filter((r) => r.userId === userId)].slice(0, MAX_USER_HISTORY_ITEMS);
    const otherUsersRecords = filtered.filter((r) => r.userId !== userId);

    await adapter.writeAll([...otherUsersRecords, ...userRecords]);
    return newRecord;
}

/**
 * Deletes a single search record, strictly enforcing ownership verification.
 */
export async function removeUserSearch(userId: string, searchId: string): Promise<boolean> {
    if (!userId || !searchId) return false;

    const adapter = getHistoryAdapter();
    const allRecords = await adapter.readAll();

    const record = allRecords.find((r) => r.id === searchId);
    if (!record) return false;

    // Strict ownership verification: resource.owner_id == current_user.id
    if (record.userId !== userId) {
        return false;
    }

    const updated = allRecords.filter((r) => r.id !== searchId);
    await adapter.writeAll(updated);
    return true;
}

/**
 * Clears all search history for a specific user ID.
 */
export async function clearUserSearchHistory(userId: string): Promise<void> {
    if (!userId || typeof userId !== 'string') return;

    const adapter = getHistoryAdapter();
    const allRecords = await adapter.readAll();

    const updated = allRecords.filter((r) => r.userId !== userId);
    await adapter.writeAll(updated);
}
