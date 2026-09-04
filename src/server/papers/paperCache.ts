/**
 * Paper Cache — Server-side in-memory TTL cache for scholarly queries and paper metadata.
 *
 * Prevents redundant external academic API calls, respects rate limits, and speeds up UI.
 * Server-side only.
 */

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

class TTLCache<T> {
    private store = new Map<string, CacheEntry<T>>();
    private readonly ttlMs: number;
    private readonly maxSize: number;

    constructor(ttlMs: number, maxSize: number = 300) {
        this.ttlMs = ttlMs;
        this.maxSize = maxSize;
    }

    get(key: string): T | null {
        const entry = this.store.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry.value;
    }

    set(key: string, value: T, customTtlMs?: number): void {
        if (this.store.size >= this.maxSize) {
            const firstKey = this.store.keys().next().value;
            if (firstKey !== undefined) this.store.delete(firstKey);
        }
        const ttl = customTtlMs ?? this.ttlMs;
        this.store.set(key, { value, expiresAt: Date.now() + ttl });
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }

    size(): number {
        return this.store.size;
    }

    clear(): void {
        this.store.clear();
    }
}

// ── Caches ────────────────────────────────────────────────────────────────────

/** Paper search results by query — 2 hours TTL, max 200 queries */
export const paperQueryCache = new TTLCache<any[]>(2 * 60 * 60 * 1000, 200);

/** Single paper metadata by ID / DOI / arXiv — 24 hours TTL, max 500 papers */
export const paperDetailCache = new TTLCache<any>(24 * 60 * 60 * 1000, 500);

/** Provider raw response cache — 1 hour TTL */
export const providerRawCache = new TTLCache<any>(60 * 60 * 1000, 300);

export function buildPaperSearchKey(provider: string, query: string): string {
    return `paper:${provider}:${query.toLowerCase().trim().slice(0, 120)}`;
}

export function buildPaperDetailKey(paperId: string): string {
    return `paper:detail:${paperId.toLowerCase().trim()}`;
}
