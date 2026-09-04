/**
 * Pluggable Storage Adapter Interface
 * Provides seamless persistence abstraction across local flat-file JSON stores,
 * serverless KV stores (Upstash / Vercel KV), and relational databases.
 */

export interface StorageRecord {
  [key: string]: any;
}

export interface IStorageAdapter<T extends StorageRecord> {
  readAll(): Promise<T[]>;
  writeAll(items: T[]): Promise<void>;
  findById(id: string, idKey?: keyof T): Promise<T | null>;
  upsert(item: T, idKey?: keyof T): Promise<void>;
  delete(id: string, idKey?: keyof T): Promise<boolean>;
}
