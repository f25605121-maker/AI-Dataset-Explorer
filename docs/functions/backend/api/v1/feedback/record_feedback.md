# record_feedback

**File:** `backend\app\api\v1\feedback.py`

## Description
Records user feedback (thumbs up/down, click, bookmark) per Section 50.

## Signature
```python
def record_feedback(request: FeedbackRequest, db: AsyncSession) -> Any:
```
