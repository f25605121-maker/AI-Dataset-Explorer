# evaluateResultSetConfidence

**File:** `src\server\search\scoring.ts`

## Description
Hybrid Retrieval & Dynamic Query-Adaptive Scoring Engine (Search Engine 2.0.0)
Implements Section 10, 11, 23:
1. Lexical BM25-style term scoring with domain synonym weighting
2. Dense semantic similarity
3. Granular entity, modality, technique, task, and target overlap
4. Dynamic query-adaptive weighting (weights sum to 1.0)
5. Popularity strictly capped at max 3% weight (never overrides scientific relevance)
6. Match breakdown and transparent explanation generator
COMPOSITE SCORING FORMULA (Standardized 4-Factor):
  FinalScore = (w_m Â· S_modality) + (w_t Â· S_task) + (w_d Â· S_domain) + (w_s Â· S_semantic)
  w_m=0.35, w_t=0.30, w_d=0.20, w_s=0.15
ZERO-MULTIPLIER RULE:
  If S_modality = 0 â†’ FinalScore = 0. Modality gate output feeds directly into this formula.
CONFIDENCE THRESHOLDING:
  If max(FinalScore) across result set < 60 â†’ status = 'PARTIAL_OR_LOW_CONFIDENCE'.
  No candidate may be badged "Top Match" or assigned ">80% Compatible" in this state.
/

import {
    NormalizedSearchResult,
    UnifiedCandidate,
    RankedResult,
    ResearchQuerySchema,
    StructuredQueryUnderstanding,
    MatchBreakdown,
    EvidenceItem,
} from './types';
import { evaluateCandidateCrossEncoder } from './crossEncoder';
import { verifyCandidateEvidence } from './evidenceVerifier';
import { checkModalityCompatibility } from './modalityCompatibilityMatrix';
import { getTaskAlignmentScore, classifyCandidateTask, classifyTask } from './taskAlignmentMatrix';
import { getRequirementProfile } from './requirementExtractor';
import { matchCandidateRequirements, computeRequirementCoverage, computeHardConstraintScore } from './requirementMatcher';
import { calibrateScore, categorizeRequirements } from './confidenceCalibrator';

/** Confidence status for a result set â€” evaluated after all candidates are scored. */
export type ConfidenceStatus = 'HIGH_CONFIDENCE' | 'PARTIAL_OR_LOW_CONFIDENCE';

/** Minimum FinalScore for any candidate to be considered high-confidence. */
export const HIGH_CONFIDENCE_THRESHOLD = 60;

/**
Evaluate the confidence status for an entire result set.
If no candidate exceeds HIGH_CONFIDENCE_THRESHOLD, the status is PARTIAL_OR_LOW_CONFIDENCE.

## Signature
```typescript
function evaluateResultSetConfidence(scores: number[]): ConfidenceStatus
```
