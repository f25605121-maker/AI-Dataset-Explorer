# recordAiUsage

**File:** `src\server\security\usageLimiter.ts`

## Description
Records AI token and query usage both daily and overall lifetime.

## Signature
```typescript
function recordAiUsage(identifier: string,
    tokensUsed = 100,
    metadata?: {
        querySnippet?: string;
        type?: 'dataset' | 'general' | 'hybrid' | 'assistant' | 'other';
        status?: 'success' | 'rate_limited' | 'quota_exceeded';
    }): void
```
