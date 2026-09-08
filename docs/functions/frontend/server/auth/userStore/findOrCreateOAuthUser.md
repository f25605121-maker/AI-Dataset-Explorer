# findOrCreateOAuthUser

**File:** `src\server\auth\userStore.ts`

## Description
Finds an existing user by email or creates a new one for OAuth (e.g. Google) sign-in.

## Signature
```typescript
function findOrCreateOAuthUser(data: {
    name?: string | null;
    email?: string | null;
    provider?: string;
}): Promise<StoredUser>
```
