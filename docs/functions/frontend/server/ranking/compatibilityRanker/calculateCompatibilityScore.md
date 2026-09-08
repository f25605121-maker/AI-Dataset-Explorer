# calculateCompatibilityScore

**File:** `src\server\ranking\compatibilityRanker.ts`

## Description
Calculates a compatibility score between a Dataset and a Model.
Provides a strong heuristic for recommending paired usages of resources (e.g. Model for a specific Dataset).

## Signature
```typescript
function calculateCompatibilityScore(dataset: Partial<NormalizedDataset>, model: Partial<NormalizedModel>): number
```
