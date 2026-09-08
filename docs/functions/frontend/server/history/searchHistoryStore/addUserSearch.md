# addUserSearch

**File:** `src\server\history\searchHistoryStore.ts`

## Description
Adds a search query record for a specific user ID.

## Signature
```typescript
function addUserSearch(userId: string,
    rawQuery: string,
    rawCategory?: string): Promise<SearchHistoryRecord | null>
```
