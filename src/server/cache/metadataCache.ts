/**
 * Metadata Cache — In-process TTL cache for dataset cards and model cards.
 *
 * Prevents repeated API calls for the same dataset/model metadata within a
 * single server process lifecycle. Uses LRU-like eviction when max size is hit.
 *
 * Scope: server-side only. Never exposes this to client bundles.
 */

interface CacheEntry<T> {
    value: T;
    expiresAt: number;
}

class TTLCache<T> {
    private store = new Map<string, CacheEntry<T>>();
    private readonly ttlMs: number;
    private readonly maxSize: number;

    constructor(ttlMs: number, maxSize: number) {
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

    set(key: string, value: T): void {
        // Evict oldest entries if at capacity
        if (this.store.size >= this.maxSize) {
            const firstKey = this.store.keys().next().value;
            if (firstKey !== undefined) this.store.delete(firstKey);
        }
        this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    }

    has(key: string): boolean {
        return this.get(key) !== null;
    }

    size(): number {
        return this.store.size;
    }

    /** Remove all expired entries (call periodically if needed) */
    prune(): void {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.expiresAt) this.store.delete(key);
        }
    }
}

// ── Singleton caches ──────────────────────────────────────────────────────────

/** Dataset card (README content) — 10 min TTL, max 300 entries */
export const datasetCardCache = new TTLCache<string>(10 * 60 * 1000, 300);

/** Dataset metadata (full HF API response) — 10 min TTL, max 300 entries */
export const datasetMetaCache = new TTLCache<Record<string, unknown>>(10 * 60 * 1000, 300);

/** Model card (README content) — 10 min TTL, max 200 entries */
export const modelCardCache = new TTLCache<string>(10 * 60 * 1000, 200);

/** Model config.json — 10 min TTL, max 200 entries */
export const modelConfigCache = new TTLCache<Record<string, unknown>>(10 * 60 * 1000, 200);

/** Search results by query string — 5 min TTL, max 100 entries */
export const searchResultCache = new TTLCache<unknown[]>(5 * 60 * 1000, 100);

// ── Cache key helpers ─────────────────────────────────────────────────────────

export function datasetCardKey(datasetId: string): string {
    return `ds:card:${datasetId}`;
}

export function datasetMetaKey(datasetId: string): string {
    return `ds:meta:${datasetId}`;
}

export function modelCardKey(modelId: string): string {
    return `mdl:card:${modelId}`;
}

export function modelConfigKey(modelId: string): string {
    return `mdl:cfg:${modelId}`;
}

export function searchKey(source: string, query: string): string {
    return `search:${source}:${query.toLowerCase().trim().slice(0, 100)}`;
}
