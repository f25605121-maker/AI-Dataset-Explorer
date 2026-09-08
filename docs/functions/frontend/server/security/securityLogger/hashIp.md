# hashIp

**File:** `src\server\security\securityLogger.ts`

## Description
Generates a unique UUID safe for Edge and Node runtimes.
/
function generateUuid(): string {
    if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
        return globalThis.crypto.randomUUID();
    }
    return 'sec_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

/**
Anonymizes/hashes IP addresses for privacy compliance where appropriate,
while retaining auditability (isomorphic).

## Signature
```typescript
function hashIp(ip?: string): string
```
