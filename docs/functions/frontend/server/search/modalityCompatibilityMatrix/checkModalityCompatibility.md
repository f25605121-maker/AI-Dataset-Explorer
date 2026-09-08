# checkModalityCompatibility

**File:** `src\server\search\modalityCompatibilityMatrix.ts`

## Description
Hard modality compatibility check.
@param candidateBlob — full text blob of the candidate (title + tags + desc + modality field)
@param queryText — the raw user query text
@param explicitCandidateModality — the candidate's parsed modality field (if available)
@returns ModalityCompatibilityResult with compatibilityScore = 0 if incompatible

## Signature
```typescript
function checkModalityCompatibility(candidateBlob: string,
    queryText: string,
    explicitCandidateModality?: string | string[]): ModalityCompatibilityResult
```
