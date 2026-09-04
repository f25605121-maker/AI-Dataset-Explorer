import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { IStorageAdapter, StorageRecord } from './storage-adapter';
import { sanitizeText } from '../security/sanitize';
import { logSecurityEvent } from '../security/securityLogger';

const DATA_ROOT = path.resolve(process.cwd(), 'data');

function resolveSafePath(filename: string): string {
    const cleanFilename = sanitizeText(filename, 100).replace(/[^a-zA-Z0-9._-]/g, '');
    if (!cleanFilename || cleanFilename.includes('..')) {
        throw new Error('Invalid or unsafe filename.');
    }

    const resolved = path.resolve(DATA_ROOT, cleanFilename);
    if (!resolved.startsWith(DATA_ROOT)) {
        logSecurityEvent({
            eventType: 'DIRECTORY_TRAVERSAL_BLOCKED',
            severity: 'CRITICAL',
            details: { attemptedPath: filename, resolved },
        });
        throw new Error('Access denied: directory traversal attempt.');
    }

    return resolved;
}

export class FileStorageAdapter<T extends StorageRecord> implements IStorageAdapter<T> {
    private filename: string;

    constructor(filename: string) {
        this.filename = filename;
    }

    async readAll(): Promise<T[]> {
        const filePath = resolveSafePath(this.filename);
        try {
            const raw = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(raw) as T[];
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    async writeAll(items: T[]): Promise<void> {
        const filePath = resolveSafePath(this.filename);
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });

        const tmpFile = `${filePath}.${crypto.randomUUID()}.tmp`;
        const content = JSON.stringify(items, null, 2);

        await fs.writeFile(tmpFile, content, { encoding: 'utf-8', mode: 0o600 });
        await fs.rename(tmpFile, filePath);
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
