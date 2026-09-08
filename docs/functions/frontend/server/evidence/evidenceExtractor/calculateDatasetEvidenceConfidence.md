# calculateDatasetEvidenceConfidence

**File:** `src\server\evidence\evidenceExtractor.ts`

## Description
Evidence Extractor
Extracts factual fields from dataset/model metadata with evidence tracking.
Every field has a {value, state, confidence, source} object.
NEVER invents or infers values beyond what metadata supports.
Missing = UNKNOWN, not "Not specified" with a fake value.
/

import type { NormalizedDataset, NormalizedModel, EvidenceFact } from '@/types/pipeline';

// ── Evidence confidence calculator ────────────────────────────────────────────

/**
Calculate overall evidence confidence for a dataset's match.
This is SEPARATE from relevance score.
evidence_confidence = how well we can confirm what the dataset is
relevance_score = how relevant it is to the query

## Signature
```typescript
function calculateDatasetEvidenceConfidence(ds: Partial<NormalizedDataset>): number
```
