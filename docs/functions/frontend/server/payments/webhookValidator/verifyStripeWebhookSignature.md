# verifyStripeWebhookSignature

**File:** `src\server\payments\webhookValidator.ts`

## Description
Verifies the cryptographic signature of a Stripe webhook payload.

## Signature
```typescript
function verifyStripeWebhookSignature(rawPayload: string,
    signatureHeader: string | null,
    webhookSecret: string): WebhookVerificationResult
```
