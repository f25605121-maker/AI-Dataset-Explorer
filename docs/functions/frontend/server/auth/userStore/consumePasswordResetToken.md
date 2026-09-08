# consumePasswordResetToken

**File:** `src\server\auth\userStore.ts`

## Description
Verifies a reset token and consumes it, updating password and invalidating active sessions.

## Signature
```typescript
function consumePasswordResetToken(rawToken: string, newPassword: string): Promise<
```
