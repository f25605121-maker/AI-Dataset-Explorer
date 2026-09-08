# generate_structured

**File:** `backend\app\providers\llm\base.py`

## Description
Generate structured output adhering to a Pydantic schema.

## Signature
```python
def generate_structured(prompt: str, response_model: Type[T], system_prompt: Optional[str]) -> T:
```
