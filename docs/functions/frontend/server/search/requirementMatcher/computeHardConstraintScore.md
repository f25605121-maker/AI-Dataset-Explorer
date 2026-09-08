# computeHardConstraintScore

**File:** `src\server\search\requirementMatcher.ts`

## Description
Compute hard constraint satisfaction score (0–100).
Returns 0 if any CRITICAL hard requirement is CONFLICT or NOT_SATISFIED.

## Signature
```typescript
function computeHardConstraintScore(matches: RequirementMatch[],
    profile: RequirementProfile): number
```
