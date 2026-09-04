export type SecurityEventType =
    | 'AUTH_LOGIN_SUCCESS'
    | 'AUTH_LOGIN_FAILED'
    | 'AUTH_ACCOUNT_LOCKED'
    | 'AUTH_REGISTER'
    | 'AUTH_PASSWORD_CHANGE'
    | 'AUTH_PASSWORD_RESET_REQUEST'
    | 'AUTH_PASSWORD_RESET_SUCCESS'
    | 'AUTH_SESSION_INVALIDATED'
    | 'CSRF_VIOLATION'
    | 'PROMPT_INJECTION_DETECTED'
    | 'AI_USAGE_EXCEEDED'
    | 'RATE_LIMIT_EXCEEDED'
    | 'PAYLOAD_TOO_LARGE'
    | 'CORS_VIOLATION'
    | 'DIRECTORY_TRAVERSAL_BLOCKED'
    | 'SENSITIVE_FILE_ACCESS_BLOCKED'
    | 'ADMIN_ACCESS_UNAUTHORIZED'
    | 'UPLOAD_REJECTED'
    | 'UPLOAD_SUCCESS'
    | 'PAYMENT_WEBHOOK_VERIFIED'
    | 'PAYMENT_WEBHOOK_FAILED'
    | 'PRICE_TAMPERING_BLOCKED'
    | 'DB_ACCESS_VIOLATION';

export type SecuritySeverity = 'INFO' | 'WARN' | 'ALERT' | 'CRITICAL';

export interface SecurityEvent {
    id: string;
    timestamp: string;
    eventType: SecurityEventType;
    severity: SecuritySeverity;
    ip?: string;
    userId?: string;
    email?: string;
    endpoint?: string;
    details?: Record<string, any>;
    userAgent?: string;
}

// In-memory buffer for recent security events (circular buffer)
const MAX_LOG_BUFFER = 1000;
const recentSecurityLogs: SecurityEvent[] = [];

/**
 * Generates a unique UUID safe for Edge and Node runtimes.
 */
function generateUuid(): string {
    if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
        return globalThis.crypto.randomUUID();
    }
    return 'sec_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
 * Anonymizes/hashes IP addresses for privacy compliance where appropriate,
 * while retaining auditability (isomorphic).
 */
export function hashIp(ip?: string): string {
    if (!ip || ip === 'unknown') return 'unknown';
    // Simple fast DJB2-based deterministic hash for edge & isomorphic logging
    let hash = 5381;
    for (let i = 0; i < ip.length; i++) {
        hash = (hash * 33) ^ ip.charCodeAt(i);
    }
    return (hash >>> 0).toString(16);
}

/**
 * Logs a structured security event.
 */
export function logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): SecurityEvent {
    const fullEvent: SecurityEvent = {
        id: generateUuid(),
        timestamp: new Date().toISOString(),
        ...event,
    };

    // Store in circular buffer
    recentSecurityLogs.push(fullEvent);
    if (recentSecurityLogs.length > MAX_LOG_BUFFER) {
        recentSecurityLogs.shift();
    }

    // Format output for structured server logs / SIEM
    const logLine = `[SECURITY][${fullEvent.severity}][${fullEvent.eventType}] ${JSON.stringify(fullEvent)}`;
    if (fullEvent.severity === 'CRITICAL' || fullEvent.severity === 'ALERT') {
        console.error(logLine);
    } else if (fullEvent.severity === 'WARN') {
        console.warn(logLine);
    } else {
        console.log(logLine);
    }

    return fullEvent;
}

/**
 * Returns recent security events for admin audit inspection (authorized only).
 */
export function getRecentSecurityLogs(limit = 100): SecurityEvent[] {
    return recentSecurityLogs.slice(-limit).reverse();
}
