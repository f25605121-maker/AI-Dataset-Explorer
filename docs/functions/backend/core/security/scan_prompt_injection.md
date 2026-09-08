# scan_prompt_injection

**File:** `backend\app\core\security.py`

## Description
Scans text for adversarial prompt injection attempts.
Returns (is_safe, reason).

## Signature
```python
def scan_prompt_injection(text: str) -> Tuple[bool, str]:
```
