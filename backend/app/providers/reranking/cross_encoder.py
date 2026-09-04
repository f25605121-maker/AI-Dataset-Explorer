import re
from typing import List, Dict, Any, Tuple
from backend.app.providers.reranking.base import RerankerProvider


class CrossEncoderReranker(RerankerProvider):
    """
    Evidence-aware deep cross-scoring reranker.
    Computes lexical interaction, task compatibility, and entity alignment.
    """

    async def rerank(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
        top_k: int = 20,
    ) -> List[Tuple[Dict[str, Any], float]]:
        if not candidates:
            return []

        query_terms = set(re.findall(r"\b[a-zA-Z0-9_\-]{3,}\b", query.lower()))
        scored: List[Tuple[Dict[str, Any], float]] = []

        for cand in candidates:
            title = cand.get("title") or cand.get("name") or ""
            desc = cand.get("description") or cand.get("abstract") or ""
            text = f"{title} {desc}".lower()

            cand_terms = set(re.findall(r"\b[a-zA-Z0-9_\-]{3,}\b", text))

            # 1. Jaccard & overlap
            overlap = len(query_terms.intersection(cand_terms))
            overlap_score = (overlap / max(1, len(query_terms))) * 0.40

            # 2. Exact Title & Topic Alignment
            title_score = 0.0
            if any(term in title.lower() for term in query_terms):
                title_score = 0.20

            # Disease / Core entity alignment
            disease_keywords = ["alzheimer", "dementia", "glioma", "melanoma", "pneumonia", "nuclei", "lesion", "covid", "retinopathy"]
            query_diseases = [d for d in disease_keywords if d in query.lower()]
            if query_diseases:
                topic_bonus = 0.35 if any(qd in text for qd in query_diseases) else -0.20
            else:
                topic_bonus = 0.0

            # 3. Base retrieval rank bonus
            base_score = cand.get("initial_score", 0.6) * 0.25

            total_score = round(max(0.1, min(1.0, overlap_score + title_score + topic_bonus + base_score + 0.20)), 4)
            scored.append((cand, total_score))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]
