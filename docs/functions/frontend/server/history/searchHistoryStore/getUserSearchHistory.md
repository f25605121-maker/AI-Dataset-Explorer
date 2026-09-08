# getUserSearchHistory

**File:** `src\server\history\searchHistoryStore.ts`

## Description
Retrieves search history strictly scoped to the authenticated user ID.

## Signature
```typescript
function getUserSearchHistory(userId: string): Promise<SearchHistoryRecord[]>
```
