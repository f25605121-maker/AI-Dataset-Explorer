import { IStorageAdapter, StorageRecord } from './storage-adapter';

/**
 * Serverless KV Storage Adapter
 * Compatible with Upstash Redis, Vercel KV, or cloud Redis endpoints.
 * Automatically falls back to high-performance in-memory cache when running in testing/preview.
 */
export class KvStorageAdapter<T extends StorageRecord> implements IStorageAdapter<T> {
    private key: string;
    private memoryFallback: Map<string, T> = new Map();
    private restUrl?: string;
    private restToken?: string;

    constructor(storeName: string) {
        this.key = `app:store:${storeName.replace(/\.json$/i, '')}`;
        this.restUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
        this.restToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
    }

    private hasKvConfigured(): boolean {
        return Boolean(this.restUrl && this.restToken);
    }

    async readAll(): Promise<T[]> {
        if (!this.hasKvConfigured()) {
            return Array.from(this.memoryFallback.values());
        }

        try {
            const res = await fetch(`${this.restUrl}/get/${encodeURIComponent(this.key)}`, {
                headers: { Authorization: `Bearer ${this.restToken}` },
                cache: 'no-store',
            });
            if (!res.ok) return [];
            const data = await res.json();
            if (!data.result) return [];
            return JSON.parse(data.result) as T[];
        } catch {
            return Array.from(this.memoryFallback.values());
        }
    }

    async writeAll(items: T[]): Promise<void> {
        if (!this.hasKvConfigured()) {
            this.memoryFallback.clear();
            for (const item of items) {
                const id = String(item.id || item.email || crypto.randomUUID());
                this.memoryFallback.set(id, item);
            }
            return;
        }

        try {
            await fetch(`${this.restUrl}/set/${encodeURIComponent(this.key)}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.restToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(items),
            });
        } catch (err) {
            console.error('[KvStorageAdapter] Write failure:', err);
        }
    }

    async findById(id: string, idKey: keyof T = 'id' as keyof T): Promise<T | null> {
        const items = await this.readAll();
        return items.find((item) => String(item[idKey]) === id) || null;
    }

    async upsert(item: T, idKey: keyof T = 'id' as keyof T): Promise<void> {
        const items = await this.readAll();
        const index = items.findIndex((existing) => existing[idKey] === item[idKey]);
        if (index >= 0) {
            items[index] = item;
        } else {
            items.push(item);
        }
        await this.writeAll(items);
    }

    async delete(id: string, idKey: keyof T = 'id' as keyof T): Promise<boolean> {
        const items = await this.readAll();
        const next = items.filter((item) => String(item[idKey]) !== id);
        if (next.length !== items.length) {
            await this.writeAll(next);
            return true;
        }
        return false;
    }
}
