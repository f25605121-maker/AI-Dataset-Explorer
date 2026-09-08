# rerank

**File:** `backend\app\providers\reranking\base.py`

## Description
Reranks candidates for the given query.
Returns a list of (candidate, score) tuples.

## Signature
```python
def rerank(query: str, candidates: List[Dict[str, Any]], top_k: int) -> List[Tuple[Dict[str, Any], float]]:
```
