# trigger_ingest

**File:** `backend\app\api\v1\admin.py`

## Description
Triggers an asynchronous ingestion job per Section 34.

## Signature
```python
def trigger_ingest(source: str, query: str, limit: int, background_tasks: BackgroundTasks, db: AsyncSession) -> Any:
```
