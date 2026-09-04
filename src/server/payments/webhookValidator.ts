import crypto from 'crypto';
import { logSecurityEvent } from '../security/securityLogger';

// Idempotency store for processed webhook events (24-hour TTL)
const processedEvents = new Map<string, number>();
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const TIMESTAMP_TOLERANCE_SEC = 300; // 5 minutes

export interface WebhookVerificationResult {
    valid: boolean;
    error?: string;
    event?: any;
}

/**
 * Checks if a webhook event has already been processed (idempotency check).
 */
export function isEventProcessed(eventId: string): boolean {
    if (!eventId) return false;
    const processedAt = processedEvents.get(eventId);
    if (!processedAt) return false;

    if (Date.now() - processedAt > IDEMPOTENCY_TTL_MS) {
        processedEvents.delete(eventId);
        return false;
    }
    return true;
}

/**
 * Marks an event ID as processed to prevent replay.
 */
export function markEventProcessed(eventId: string): void {
    if (!eventId) return;
    processedEvents.set(eventId, Date.now());

    // Prune stale IDs
    if (processedEvents.size > 10_000) {
        const now = Date.now();
        for (const [k, v] of processedEvents) {
            if (now - v > IDEMPOTENCY_TTL_MS) {
                processedEvents.delete(k);
            }
        }
    }
}

/**
 * Verifies the cryptographic signature of a Stripe webhook payload.
 */
export function verifyStripeWebhookSignature(
    rawPayload: string,
    signatureHeader: string | null,
    webhookSecret: string
): WebhookVerificationResult {
    if (!rawPayload || !signatureHeader || !webhookSecret) {
        return { valid: false, error: 'Missing webhook payload, signature header, or secret.' };
    }

    // Stripe signature header format: t=1614555555,v1=5257a869e7...
    const parts = signatureHeader.split(',');
    let timestamp = '';
    const signatures: string[] = [];

    for (const part of parts) {
        const [key, val] = part.split('=');
        if (key === 't') timestamp = val;
        if (key === 'v1') signatures.push(val);
    }

    if (!timestamp || signatures.length === 0) {
        return { valid: false, error: 'Malformed signature header format.' };
    }

    // Check timestamp tolerance to prevent replay attacks
    const eventTimeSec = parseInt(timestamp, 10);
    const currentTimeSec = Math.floor(Date.now() / 1000);

    if (isNaN(eventTimeSec) || Math.abs(currentTimeSec - eventTimeSec) > TIMESTAMP_TOLERANCE_SEC) {
        return { valid: false, error: 'Webhook timestamp outside of acceptable tolerance (replay attack protection).' };
    }

    // Compute expected HMAC SHA-256
    const signedPayload = `${timestamp}.${rawPayload}`;
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedPayload, 'utf8')
        .digest('hex');

    const expectedBuf = Buffer.from(expectedSignature, 'hex');

    // Constant-time comparison against all v1 signatures in header
    let matched = false;
    for (const sig of signatures) {
        try {
            const sigBuf = Buffer.from(sig, 'hex');
            if (sigBuf.length === expectedBuf.length && crypto.timingSafeEqual(sigBuf, expectedBuf)) {
                matched = true;
                break;
            }
        } catch {
            // ignore invalid hex strings
        }
    }

    if (!matched) {
        return { valid: false, error: 'Webhook HMAC signature mismatch.' };
    }

    try {
        const parsed = JSON.parse(rawPayload);
        return { valid: true, event: parsed };
    } catch {
        return { valid: false, error: 'Invalid JSON payload.' };
    }
}
