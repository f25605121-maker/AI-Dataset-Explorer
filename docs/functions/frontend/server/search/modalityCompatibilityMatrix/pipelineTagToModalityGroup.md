# pipelineTagToModalityGroup

**File:** `src\server\search\modalityCompatibilityMatrix.ts`

## Description
Map an HF pipeline_tag string to a ModalityGroup.
Used for explicit compatibility gating on structured metadata.

## Signature
```typescript
function pipelineTagToModalityGroup(pipelineTag: string): ModalityGroup
```
