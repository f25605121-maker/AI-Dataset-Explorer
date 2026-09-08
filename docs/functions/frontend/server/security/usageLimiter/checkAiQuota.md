# checkAiQuota

**File:** `src\server\security\usageLimiter.ts`

## Description
Checks if user/IP has remaining daily AI query and token quota.

## Signature
```typescript
function checkAiQuota(identifier: string,
    planTier = 'free'): 
```
