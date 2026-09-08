# getUserUsageStats

**File:** `src\server\security\usageLimiter.ts`

## Description
Returns detailed user usage analytics for Settings and Dashboard.

## Signature
```typescript
function getUserUsageStats(identifier: string, planTier = 'free'): Promise<UserUsageStats>
```
