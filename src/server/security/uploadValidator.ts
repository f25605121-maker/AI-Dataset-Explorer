import crypto from 'crypto';
import path from 'path';

export interface FileValidationResult {
    valid: boolean;
    error?: string;
    safeFilename?: string;
    detectedMime?: string;
    sizeBytes?: number;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_MIME_TYPES: Record<string, string[]> = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'application/json': ['.json'],
    'text/csv': ['.csv'],
};

/**
 * Checks header magic bytes for known secure file signatures.
 */
export function verifyMagicBytes(buffer: Buffer): { match: boolean; mime?: string } {
    if (!buffer || buffer.length < 4) {
        return { match: false };
    }

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return { match: true, mime: 'image/jpeg' };
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
    ) {
        return { match: true, mime: 'image/png' };
    }

    // WebP: 'RIFF' .... 'WEBP'
    if (
        buffer.length >= 12 &&
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
        return { match: true, mime: 'image/webp' };
    }

    // JSON: check if starts with { or [ and valid UTF-8
    const textStart = buffer.subarray(0, 32).toString('utf-8').trim();
    if (textStart.startsWith('{') || textStart.startsWith('[')) {
        try {
            JSON.parse(buffer.toString('utf-8'));
            return { match: true, mime: 'application/json' };
        } catch {
            // not valid json
        }
    }

    // CSV: check if text without null bytes or binary characters
    const isAsciiText = !buffer.includes(0x00);
    if (isAsciiText) {
        const sample = buffer.subarray(0, Math.min(buffer.length, 1024)).toString('utf-8');
        // Basic check for text/csv format
        if (sample.includes(',') || sample.includes('\n')) {
            return { match: true, mime: 'text/csv' };
        }
    }

    return { match: false };
}

/**
 * Validates uploaded file against MIME whitelist, extension whitelist, and magic byte signatures.
 */
export function validateUploadedFile(
    buffer: Buffer,
    originalName: string,
    claimedMime?: string
): FileValidationResult {
    if (!buffer || buffer.length === 0) {
        return { valid: false, error: 'File is empty.' };
    }

    if (buffer.length > MAX_FILE_SIZE) {
        return { valid: false, error: `File exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB.` };
    }

    const ext = path.extname(originalName).toLowerCase();
    if (!ext) {
        return { valid: false, error: 'File must have a valid extension.' };
    }

    // Reject dangerous executable extensions explicitly
    const DANGEROUS_EXTS = ['.exe', '.sh', '.bat', '.cmd', '.php', '.phtml', '.js', '.ts', '.html', '.htm', '.svg', '.vbs', '.py', '.rb', '.jsp'];
    if (DANGEROUS_EXTS.includes(ext)) {
        return { valid: false, error: 'Executable and dangerous file extensions are strictly prohibited.' };
    }

    // Verify magic bytes
    const magicCheck = verifyMagicBytes(buffer);
    if (!magicCheck.match || !magicCheck.mime) {
        return { valid: false, error: 'File contents do not match allowed formats (corrupted or disguised file).' };
    }

    const detectedMime = magicCheck.mime;
    const allowedExtensionsForMime = ALLOWED_MIME_TYPES[detectedMime];

    if (!allowedExtensionsForMime || !allowedExtensionsForMime.includes(ext)) {
        return {
            valid: false,
            error: `File extension ${ext} does not match detected MIME type ${detectedMime}.`,
        };
    }

    // Generate sanitized UUID filename
    const safeFilename = `${crypto.randomUUID()}${ext}`;

    return {
        valid: true,
        safeFilename,
        detectedMime,
        sizeBytes: buffer.length,
    };
}
