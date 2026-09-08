# scorePaper

**File:** `src\server\papers\paperScorer.ts`

## Description
Paper Scorer, Landscape Analyzer & Rationale Generator
Computes transparent AI Relevance Scores (0–100), Research Landscape metrics,
Research Maturity classifications, and evidence-grounded "Why is this paper relevant?" points.
/

import type {
    NormalizedPaper,
    PaperScoreBreakdown,
    ResearchLandscape,
    ResearchMaturity,
} from '@/types/papers';
import type { QueryUnderstanding } from '@/server/query-understanding/queryParser';
import type { ClassificationContext } from './paperClassifier';
import { classifyPaperRelationship } from './paperClassifier';

/**
Computes the transparent AI Relevance Score (0-100) for a paper.

## Signature
```typescript
function scorePaper(paper: NormalizedPaper,
    context: ClassificationContext): NormalizedPaper
```
