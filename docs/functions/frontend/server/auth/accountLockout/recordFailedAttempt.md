# recordFailedAttempt

**File:** `src\server\auth\accountLockout.ts`

## Description
Records a failed login attempt for an email and locks the account if threshold is reached.

## Signature
```typescript
function recordFailedAttempt(email: string, ip?: string): 
```
