from backend.app.providers.embeddings.base import EmbeddingProvider
from backend.app.providers.embeddings.local_provider import LocalEmbeddingProvider


def get_embedding_provider() -> EmbeddingProvider:
    """
    Factory function returning the embedding provider per Section 61.
    """
    return LocalEmbeddingProvider()
