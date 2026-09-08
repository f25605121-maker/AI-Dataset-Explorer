# addSearchToHistory

**File:** `src\hooks\useRecentSearches.ts`

## Description
Pure synchronous utility to add a search to storage and broadcast to all components.

## Signature
```typescript
function addSearchToHistory(query: string,
    userId?: string | null,
    category?: string,
    currentSearches?: RecentSearchItem[]): RecentSearchItem[]
```
