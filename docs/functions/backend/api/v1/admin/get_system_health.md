# get_system_health

**File:** `backend\app\api\v1\admin.py`

## Description
Admin health dashboard per Section 58.
Reports indexed counts and external provider availability.

## Signature
```python
def get_system_health(db: AsyncSession) -> Dict[str, Any]:
```
