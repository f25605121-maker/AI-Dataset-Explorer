from backend.app.providers.reranking.base import RerankerProvider
from backend.app.providers.reranking.cross_encoder import CrossEncoderReranker


def get_reranker_provider() -> RerankerProvider:
    """
    Factory function returning the reranker provider per Section 3.
    """
    return CrossEncoderReranker()
