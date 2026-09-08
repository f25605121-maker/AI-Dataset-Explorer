# verify_compatibility

**File:** `backend\app\api\v1\search.py`

## Description
Explicit scientific consistency check for a problem-dataset-model-paper triple.

## Signature
```python
def verify_compatibility(problem: str, dataset: Dict[str, Any], model: Dict[str, Any], papers: List[Dict[str, Any]], db: AsyncSession) -> Any:
```
