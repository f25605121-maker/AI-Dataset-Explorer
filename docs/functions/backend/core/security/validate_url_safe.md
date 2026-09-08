# validate_url_safe

**File:** `backend\app\core\security.py`

## Description
Validates that a URL is safe to fetch (SSRF Prevention):
- Scheme must be http or https
- Hostname must resolve to a public, non-private IP

## Signature
```python
def validate_url_safe(url: str) -> bool:
```
