import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { sanitizeObject, sanitizeText } from '../security/sanitize';
import { logSecurityEvent } from '../security/securityLogger';

const DATA_ROOT = path.resolve(process.cwd(), 'data');

/**
 * Validates and resolves a file path within the allowed DATA_ROOT to prevent directory traversal.
 */
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

/**
 * Secure file-based data store with least privilege operations and atomic writes.
 */
export class SecureDataStore<T extends Record<string, any>> {
    private filename: string;

    constructor(filename: string) {
        this.filename = filename;
    }

    /**
     * Reads all records securely from the store.
     */
    async readAll(): Promise<T[]> {
        const filePath = resolveSafePath(this.filename);
        try {
            const raw = await fs.readFile(filePath, 'utf-8');
            return JSON.parse(raw || '[]');
        } catch {
            return [];
        }
    }

    /**
     * Atomically writes records to the store with sanitization.
     */
    async writeAll(records: T[]): Promise<void> {
        const filePath = resolveSafePath(this.filename);
        const tempPath = `${filePath}.${crypto.randomUUID()}.tmp`;

        const sanitized = sanitizeObject(records);
        const json = JSON.stringify(sanitized, null, 2);

        await fs.writeFile(tempPath, json, 'utf-8');
        await fs.rename(tempPath, filePath);
    }

    /**
     * Queries records matching a predicate.
     */
    async find(predicate: (item: T) => boolean): Promise<T[]> {
        const all = await this.readAll();
        return all.filter(predicate);
    }

    /**
     * Finds a single record matching a predicate.
     */
    async findOne(predicate: (item: T) => boolean): Promise<T | null> {
        const all = await this.readAll();
        return all.find(predicate) || null;
    }
}
