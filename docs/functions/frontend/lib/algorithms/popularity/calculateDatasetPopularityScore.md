# calculateDatasetPopularityScore

**File:** `src\lib\algorithms\popularity.ts`

## Description
Get local user search boosts
/
function getLocalSearchBoosts(): Record<string, number> {
    if (typeof window === "undefined") return {};
    try {
        const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SEARCHES);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

/**
Core Algorithm: Calculate the composite popularity score (0 - 100) for a dataset

## Signature
```typescript
function calculateDatasetPopularityScore(dataset: PopularDatasetItem,
    localBoost: number = 0): 
```
