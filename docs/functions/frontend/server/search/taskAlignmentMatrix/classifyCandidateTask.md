# classifyCandidateTask

**File:** `src\server\search\taskAlignmentMatrix.ts`

## Description
Classify a candidate's task from all available metadata fields.

## Signature
```typescript
function classifyCandidateTask(title: string,
    description: string,
    tags: string[],
    pipelineTag?: string,
    taskField?: string): CanonicalTask | 'DISCOVERY'
```
