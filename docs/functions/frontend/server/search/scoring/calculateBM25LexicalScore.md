# calculateBM25LexicalScore

**File:** `src\server\search\scoring.ts`

## Description
BM25-style Lexical Scoring with Domain Synonym Weighting

## Signature
```typescript
function calculateBM25LexicalScore(text: string,
    queryTokens: string[],
    synonymMap: Record<string, string[]> = {}): number
```
