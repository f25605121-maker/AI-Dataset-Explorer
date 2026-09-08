# updateUserPassword

**File:** `src\server\auth\userStore.ts`

## Description
Updates a user's password and increments sessionVersion, invalidating all existing active sessions.

## Signature
```typescript
function updateUserPassword(userId: string, newPassword: string): Promise<void>
```
