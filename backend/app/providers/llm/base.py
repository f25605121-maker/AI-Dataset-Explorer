from abc import ABC, abstractmethod
from typing import Type, TypeVar, Optional, Dict, Any, List
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class LLMProvider(ABC):
    """
    Abstract LLM provider interface per Section 60.
    Supports OpenAI, Anthropic, Google Gemini, OpenRouter, and Mock/Local.
    """

    @abstractmethod
    async def generate_structured(
        self,
        prompt: str,
        response_model: Type[T],
        system_prompt: Optional[str] = None,
    ) -> T:
        """Generate structured output adhering to a Pydantic schema."""
        pass

    @abstractmethod
    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
    ) -> str:
        """Generate plain text or markdown response."""
        pass

    @abstractmethod
    async def verify_scientific_consistency(
        self,
        problem: str,
        dataset_meta: Dict[str, Any],
        model_meta: Dict[str, Any],
        papers_meta: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Verify candidate combination for scientific consistency."""
        pass
