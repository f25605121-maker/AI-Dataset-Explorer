from backend.app.providers.llm.base import LLMProvider
from backend.app.providers.llm.mock_provider import MockLLMProvider
from backend.app.providers.llm.openai_provider import OpenAICompatibleLLMProvider
from backend.app.core.config import settings


def get_llm_provider() -> LLMProvider:
    """
    Factory function returning the configured LLM provider per Section 60.
    Falls back to deterministic MockLLMProvider if keys are absent.
    """
    has_key = bool(settings.OPENROUTER_API_KEY or settings.OPENAI_API_KEY)
    
    if has_key and settings.LLM_PROVIDER in ("openrouter", "openai"):
        return OpenAICompatibleLLMProvider()
    
    # Default graceful fallback
    return MockLLMProvider()
