import { IStorageAdapter, StorageRecord } from './storage-adapter';
import { FileStorageAdapter } from './file-store-adapter';
import { KvStorageAdapter } from './kv-store-adapter';

export * from './storage-adapter';
export * from './file-store-adapter';
export * from './kv-store-adapter';
export * from './secureStore';

/**
 * Storage Adapter Factory
 * Dynamically resolves the appropriate storage engine based on runtime environment.
 */
export function getStorageAdapter<T extends StorageRecord>(filename: string): IStorageAdapter<T> {
    const isServerless = Boolean(
        process.env.VERCEL ||
        process.env.AWS_LAMBDA_FUNCTION_NAME ||
        process.env.UPSTASH_REDIS_REST_URL ||
        process.env.KV_REST_API_URL
    );

    if (isServerless && (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL)) {
        return new KvStorageAdapter<T>(filename);
    }

    return new FileStorageAdapter<T>(filename);
}
