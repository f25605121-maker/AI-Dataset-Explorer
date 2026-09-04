import { logSecurityEvent } from '../security/securityLogger';

interface LockoutRecord {
    failedAttempts: number;
    lockUntil: number | null;
    lastAttemptAt: number;
}

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const lockoutStore = new Map<string, LockoutRecord>();

/**
 * Checks if an account is currently locked out due to failed attempts.
 */
export function isAccountLocked(email: string): { locked: boolean; remainingMs: number; unlockTime?: Date } {
    if (!email) return { locked: false, remainingMs: 0 };
    const normalizedEmail = email.toLowerCase().trim();
    const record = lockoutStore.get(normalizedEmail);

    if (!record || !record.lockUntil) {
        return { locked: false, remainingMs: 0 };
    }

    const now = Date.now();
    if (now < record.lockUntil) {
        const remainingMs = record.lockUntil - now;
        return {
            locked: true,
            remainingMs,
            unlockTime: new Date(record.lockUntil),
        };
    }

    // Lockout has expired, reset
    record.lockUntil = null;
    record.failedAttempts = 0;
    lockoutStore.set(normalizedEmail, record);
    return { locked: false, remainingMs: 0 };
}

/**
 * Records a failed login attempt for an email and locks the account if threshold is reached.
 */
export function recordFailedAttempt(email: string, ip?: string): { locked: boolean; attemptsLeft: number; remainingMs?: number } {
    if (!email) return { locked: false, attemptsLeft: MAX_FAILED_ATTEMPTS };
    const normalizedEmail = email.toLowerCase().trim();
    const now = Date.now();

    const record = lockoutStore.get(normalizedEmail) || {
        failedAttempts: 0,
        lockUntil: null,
        lastAttemptAt: now,
    };

    // If already locked, return status
    if (record.lockUntil && now < record.lockUntil) {
        return {
            locked: true,
            attemptsLeft: 0,
            remainingMs: record.lockUntil - now,
        };
    }

    // If last attempt was over 15 minutes ago, reset attempt count
    if (now - record.lastAttemptAt > LOCKOUT_DURATION_MS) {
        record.failedAttempts = 0;
    }

    record.failedAttempts += 1;
    record.lastAttemptAt = now;

    if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        record.lockUntil = now + LOCKOUT_DURATION_MS;
        lockoutStore.set(normalizedEmail, record);

        logSecurityEvent({
            eventType: 'AUTH_ACCOUNT_LOCKED',
            severity: 'ALERT',
            email: normalizedEmail,
            ip,
            details: {
                failedAttempts: record.failedAttempts,
                lockDurationMinutes: LOCKOUT_DURATION_MS / 60000,
            },
        });

        return {
            locked: true,
            attemptsLeft: 0,
            remainingMs: LOCKOUT_DURATION_MS,
        };
    }

    lockoutStore.set(normalizedEmail, record);
    return {
        locked: false,
        attemptsLeft: MAX_FAILED_ATTEMPTS - record.failedAttempts,
    };
}

/**
 * Resets failed login attempt counters upon successful authentication.
 */
export function resetFailedAttempts(email: string): void {
    if (!email) return;
    const normalizedEmail = email.toLowerCase().trim();
    lockoutStore.delete(normalizedEmail);
}
