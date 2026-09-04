from typing import List, Dict, Any, Tuple
import numpy as np
from backend.app.providers.embeddings.factory import get_embedding_provider


class DenseSearchEngine:
    """
    Dense semantic search engine utilizing vector embeddings and cosine similarity (Section 10).
    """

    def __init__(self):
        self.embedder = get_embedding_provider()

    async def search(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
        top_k: int = 50,
    ) -> List[Tuple[Dict[str, Any], float]]:
        if not candidates:
            return []

        query_vec = np.array(await self.embedder.embed_text(query), dtype=np.float32)
        q_norm = np.linalg.norm(query_vec)
        if q_norm > 0:
            query_vec /= q_norm

        scored: List[Tuple[Dict[str, Any], float]] = []

        for cand in candidates:
            emb = cand.get("embedding")
            if emb:
                cand_vec = np.array(emb, dtype=np.float32)
                c_norm = np.linalg.norm(cand_vec)
                if c_norm > 0:
                    cand_vec /= c_norm
                score = float(np.dot(query_vec, cand_vec))
            else:
                # Text-based dynamic embed
                text = f"{cand.get('name', '')} {cand.get('title', '')} {cand.get('description', '')}"
                c_vec = np.array(await self.embedder.embed_text(text), dtype=np.float32)
                c_norm = np.linalg.norm(c_vec)
                if c_norm > 0:
                    c_vec /= c_norm
                score = float(np.dot(query_vec, c_vec))

            # Normalize to 0-1 range
            normalized_score = max(0.0, min(1.0, (score + 1.0) / 2.0))
            scored.append((cand, normalized_score))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]
