# recommend_pipeline

**File:** `backend\app\api\v1\recommend.py`

## Description
Master Recommendation Pipeline per Section 41 & 42.
Runs UNDERSTAND -> DECOMPOSE -> EXPAND -> HYBRID RETRIEVE -> FUSE -> CROSS-LINK ->
RERANK -> HARD-CONSTRAINT CHECK -> SCIENTIFIC CONSISTENCY CHECK -> FRESH RESEARCH -> EXPLAIN.

## Signature
```python
def recommend_pipeline(request: RecommendationRequest, db: AsyncSession) -> Any:
```
