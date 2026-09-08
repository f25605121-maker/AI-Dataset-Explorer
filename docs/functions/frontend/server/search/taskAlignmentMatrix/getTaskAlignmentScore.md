# getTaskAlignmentScore

**File:** `src\server\search\taskAlignmentMatrix.ts`

## Description
0.0 – 1.0 alignment score */
    score: number;
    queryTask: CanonicalTask | 'DISCOVERY';
    candidateTask: CanonicalTask | 'DISCOVERY';
    matchType: 'EXACT' | 'SIBLING' | 'PARTIAL_OVERLAP' | 'PARENT_MATCH' | 'ORTHOGONAL' | 'UNKNOWN';
    penaltyApplied: number;
}

/**
Compute task alignment score between the query's requested task and a candidate's task.
Scoring logic:
- EXACT match (same canonical task) → 1.0
- Same parent group (e.g., both VISION) but different sub-task → 0.45 (sibling penalty)
- Partial overlap (defined in TASK_PARTIAL_OVERLAPS) → lookup value
- DISCOVERY on either side → 0.60 (neutral, cannot determine mismatch)
- Orthogonal (different parent groups, no partial overlap) → 0.10

## Signature
```typescript
function getTaskAlignmentScore(queryTaskText: string,
    candidateTaskText: string): TaskAlignmentResult
```
