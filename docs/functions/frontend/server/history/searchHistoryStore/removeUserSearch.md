# removeUserSearch

**File:** `src\server\history\searchHistoryStore.ts`

## Description
Deletes a single search record, strictly enforcing ownership verification.

## Signature
```typescript
function removeUserSearch(userId: string, searchId: string): Promise<boolean>
```
