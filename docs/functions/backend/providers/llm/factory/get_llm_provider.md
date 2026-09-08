# get_llm_provider

**File:** `backend\app\providers\llm\factory.py`

## Description
Factory function returning the configured LLM provider per Section 60.
Falls back to deterministic MockLLMProvider if keys are absent.

## Signature
```python
def get_llm_provider() -> LLMProvider:
```
