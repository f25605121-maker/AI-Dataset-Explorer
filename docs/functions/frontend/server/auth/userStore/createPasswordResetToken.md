# createPasswordResetToken

**File:** `src\server\auth\userStore.ts`

## Description
Creates a cryptographically secure, time-limited (15-min) password reset token.
Stores only the SHA-256 hash of the token.

## Signature
```typescript
function createPasswordResetToken(email: string): Promise<string | null>
```
