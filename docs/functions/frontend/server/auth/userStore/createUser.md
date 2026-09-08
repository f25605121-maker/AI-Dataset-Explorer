# createUser

**File:** `src\server\auth\userStore.ts`

## Description
Creates a new user with bcrypt-hashed password (cost 12) and initialized session version.

## Signature
```typescript
function createUser(data: {
    name: string;
    email: string;
    password: string;
    role?: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
}): Promise<SafeUser>
```
