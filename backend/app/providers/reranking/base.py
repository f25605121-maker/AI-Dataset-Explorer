from abc import ABC, abstractmethod
from typing import List, Dict, Any, Tuple


class RerankerProvider(ABC):
    """
    Abstract reranker provider interface per Section 3.
    """

    @abstractmethod
    async def rerank(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
        top_k: int = 20,
    ) -> List[Tuple[Dict[str, Any], float]]:
        """
        Reranks candidates for the given query.
        Returns a list of (candidate, score) tuples.
        """
        pass
