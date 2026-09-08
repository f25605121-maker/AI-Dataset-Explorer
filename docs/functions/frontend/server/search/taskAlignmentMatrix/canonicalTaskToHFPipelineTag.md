# canonicalTaskToHFPipelineTag

**File:** `src\server\search\taskAlignmentMatrix.ts`

## Description
Map a CanonicalTask to the appropriate HuggingFace pipeline_tag for API filtering.
Returns null if no exact mapping exists (caller should skip filter).

## Signature
```typescript
function canonicalTaskToHFPipelineTag(task: CanonicalTask): string | null
```
