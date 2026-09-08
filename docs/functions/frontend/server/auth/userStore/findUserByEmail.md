# findUserByEmail

**File:** `src\server\auth\userStore.ts`

## Description
Atomic write to user store with temporary file and rename to prevent corruption.
/
async function saveAllUsers(users: StoredUser[]): Promise<void> {
    const tempFile = `${USERS_FILE}.${crypto.randomUUID()}.tmp`;
    const data = JSON.stringify(users, null, 2);
    await fs.writeFile(tempFile, data, 'utf-8');
    await fs.rename(tempFile, USERS_FILE);
}

/**
Finds a user by email.

## Signature
```typescript
function findUserByEmail(email: string): Promise<StoredUser | null>
```
