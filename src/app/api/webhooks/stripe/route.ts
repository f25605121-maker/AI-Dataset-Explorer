import { NextRequest, NextResponse } from 'next/server';
import { verifyStripeWebhookSignature, isEventProcessed, markEventProcessed } from '@/server/payments/webhookValidator';
import { logSecurityEvent } from '@/server/security/securityLogger';
import { extractIp } from '@/server/security/rate-limit';

export async function POST(req: NextRequest) {
    const ip = extractIp(req);
    const signatureHeader = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret_placeholder_for_verification';

    let rawBody = '';
    try {
        rawBody = await req.text();
    } catch {
        return NextResponse.json({ error: 'Unable to read request payload.' }, { status: 400 });
    }

    const verification = verifyStripeWebhookSignature(rawBody, signatureHeader, webhookSecret);

    if (!verification.valid || !verification.event) {
        logSecurityEvent({
            eventType: 'PAYMENT_WEBHOOK_FAILED',
            severity: 'ALERT',
            ip,
            endpoint: '/api/webhooks/stripe',
            details: { error: verification.error },
        });
        return NextResponse.json({ error: verification.error || 'Invalid webhook signature.' }, { status: 400 });
    }

    const event = verification.event;
    const eventId = event.id;

    // Replay protection / Idempotency check
    if (isEventProcessed(eventId)) {
        logSecurityEvent({
            eventType: 'PAYMENT_WEBHOOK_VERIFIED',
            severity: 'INFO',
            ip,
            endpoint: '/api/webhooks/stripe',
            details: { eventId, status: 'SKIPPED_ALREADY_PROCESSED' },
        });
        return NextResponse.json({ received: true, status: 'already_processed' }, { status: 200 });
    }

    // Process payment events
    switch (event.type) {
        case 'payment_intent.succeeded':
            console.log(`[PAYMENT] Payment succeeded: ${event.data?.object?.id}`);
            break;
        case 'invoice.payment_failed':
            console.warn(`[PAYMENT] Invoice payment failed: ${event.data?.object?.id}`);
            break;
        case 'customer.subscription.deleted':
            console.log(`[PAYMENT] Subscription cancelled: ${event.data?.object?.id}`);
            break;
        default:
            console.log(`[PAYMENT] Unhandled event type: ${event.type}`);
    }

    // Mark event as processed
    markEventProcessed(eventId);

    logSecurityEvent({
        eventType: 'PAYMENT_WEBHOOK_VERIFIED',
        severity: 'INFO',
        ip,
        endpoint: '/api/webhooks/stripe',
        details: { eventId, type: event.type },
    });

    return NextResponse.json({ received: true });
}
