# evaluateCandidateCrossEncoder

**File:** `src\server\search\crossEncoder.ts`

## Description
Multi-Factor Cross-Encoder & Deep Relevance Evaluator
Performs granular multi-dimensional cross-scoring for top candidate pools across:
1. Anatomy Match
2. Modality Match
3. Task Match
4. Dimensionality Match
5. Target / Label Match
6. Domain Match
7. Dataset / Model Suitability
8. Evidence Quality
9. Overall Composite Relevance
/

import { UnifiedCandidate, StructuredQueryUnderstanding, ResearchQuerySchema, CrossEncoderEvaluation } from './types';
import { ANATOMY_ONTOLOGY, normalizeAnatomy, normalizeModality, normalizeTask } from './ontology';

function clean(s?: any): string {
    if (Array.isArray(s)) return s.join(' ').toLowerCase().trim();
    if (typeof s === 'string') return s.toLowerCase().trim();
    return String(s ?? '').toLowerCase().trim();
}


/**
Deterministic Cross-Evaluation Engine
Computes exact normalized dimension scores based on domain knowledge and primary metadata.

## Signature
```typescript
function evaluateCandidateCrossEncoder(candidate: UnifiedCandidate,
    understanding: StructuredQueryUnderstanding | ResearchQuerySchema): CrossEncoderEvaluation
```
