# isRateLimited

**File:** `src\server\security\rate-limit.ts`

## Description
In-process sliding-window rate limiter.
PRODUCTION NOTE: This uses a module-level Map and resets on each deployment.
Replace with Redis/Upstash for multi-instance production deployments.
Not vulnerable to X-Forwarded-For spoofing when the extractIp helper
is used — callers must decide whether to trust proxy headers.
/

interface RateLimitStore {
    timestamps: number[];
}

const stores = new Map<string, Map<string, RateLimitStore>>();

/**
Returns true if the key has exceeded maxRequests within windowMs.
Automatically records the current request.

## Signature
```typescript
function isRateLimited(namespace: string,
    key: string,
    maxRequests: number,
    windowMs: number,): boolean
```
