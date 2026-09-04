/**
 * Sanitization utility for inputs before storing in database/file store or rendering.
 * Protects against XSS, NoSQL/JSON injection, null byte injection, and prototype pollution.
 */

const DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /javascript\s*:/gi,
    /data\s*:\s*text\/html/gi,
    /vbscript\s*:/gi,
    /on\w+\s*=/gi, // onerror=, onclick=, onload=
];

/**
 * Strips HTML tags and script vectors from strings.
 */
export function stripHtml(input: string): string {
    if (!input || typeof input !== 'string') return '';
    let clean = input.replace(/\0/g, ''); // Remove null bytes
    for (const pattern of DANGEROUS_PATTERNS) {
        clean = clean.replace(pattern, '');
    }
    // Strip remaining basic HTML tags
    clean = clean.replace(/<\/?[^>]+(>|$)/g, '');
    return clean;
}

/**
 * Escapes characters that have special meaning in HTML contexts.
 */
export function escapeHtml(input: string): string {
    if (!input || typeof input !== 'string') return '';
    const map: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#x60;',
    };
    return input.replace(/[&<>"'`/]/g, (char) => map[char] || char);
}

/**
 * Normalizes and sanitizes text before storage.
 */
export function sanitizeText(input: unknown, maxLength = 5000): string {
    if (typeof input !== 'string') return '';
    // Unicode normalization + strip null bytes + strip tags + trim
    const sanitized = stripHtml(input.normalize('NFC').replace(/\0/g, '')).trim();
    return sanitized.slice(0, maxLength);
}

/**
 * Sanitizes an email address.
 */
export function sanitizeEmail(email: unknown): string {
    if (typeof email !== 'string') return '';
    const clean = email.toLowerCase().trim().replace(/\0/g, '');
    // Ensure strict email characters only
    const valid = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(clean);
    return valid ? clean : '';
}

/**
 * Deeply sanitizes an object or array to prevent prototype pollution and stored injection.
 */
export function sanitizeObject<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
        if (typeof obj === 'string') {
            return sanitizeText(obj) as unknown as T;
        }
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeObject(item)) as unknown as T;
    }

    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
        // Block prototype pollution keys
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            continue;
        }
        const cleanKey = sanitizeText(key, 100);
        clean[cleanKey] = sanitizeObject(value);
    }

    return clean as T;
}
