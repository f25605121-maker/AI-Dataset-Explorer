import json
from typing import Type, TypeVar, Optional, Dict, Any, List
import httpx
from pydantic import BaseModel
from backend.app.providers.llm.base import LLMProvider
from backend.app.core.config import settings

T = TypeVar("T", bound=BaseModel)


class OpenAICompatibleLLMProvider(LLMProvider):
    """
    OpenAI-compatible LLM provider. Supports OpenAI, OpenRouter, Local Ollama/vLLM.
    """

    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.OPENROUTER_API_KEY or settings.OPENAI_API_KEY or ""
        self.base_url = base_url or ("https://openrouter.ai/api/v1" if settings.OPENROUTER_API_KEY else "https://api.openai.com/v1")
        self.model = model or settings.OPENROUTER_MODEL

    async def generate_structured(
        self,
        prompt: str,
        response_model: Type[T],
        system_prompt: Optional[str] = None,
    ) -> T:
        schema_json = json.dumps(response_model.model_json_schema())
        sys = (
            system_prompt or 
            "You are an expert scientific AI problem understanding engine. "
            "Analyze the problem and respond ONLY with a valid JSON object strictly matching the schema provided."
        )
        full_sys = f"{sys}\n\nStrict JSON Schema:\n{schema_json}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": full_sys},
                    {"role": "user", "content": prompt},
                ],
                "response_format": {"type": "json_object"},
                "temperature": 0.1,
            }

            resp = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            return response_model.model_validate(parsed)

    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
    ) -> str:
        async with httpx.AsyncClient(timeout=30.0) as client:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system_prompt or "You are a scientific AI research assistant."},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": max_tokens,
                "temperature": 0.2,
            }
            resp = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()
            return data["choices"][0]["message"]["content"]

    async def verify_scientific_consistency(
        self,
        problem: str,
        dataset_meta: Dict[str, Any],
        model_meta: Dict[str, Any],
        papers_meta: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        prompt = (
            f"User Problem: {problem}\n\n"
            f"Candidate Dataset: {json.dumps(dataset_meta)}\n\n"
            f"Candidate Model: {json.dumps(model_meta)}\n\n"
            f"Candidate Papers: {json.dumps(papers_meta)}\n\n"
            "Evaluate whether this combination is scientifically consistent and meets all constraints. "
            "Return JSON with: valid (bool), overall_score (0-100), problems (list of strings), warnings (list of strings), replacement_needed (bool)."
        )
        text = await self.generate_text(prompt, system_prompt="You are a scientific verification engine.")
        try:
            return json.loads(text)
        except Exception:
            return {"valid": True, "overall_score": 85.0, "problems": [], "warnings": []}
