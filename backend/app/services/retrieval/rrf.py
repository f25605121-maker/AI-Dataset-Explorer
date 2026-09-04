from typing import List, Dict, Any, Tuple
from backend.app.core.config import settings


class ReciprocalRankFusion:
    """
    Combines dense, sparse, and metadata rankings using Reciprocal Rank Fusion (Section 13).
    Formula: RRF(d) = sum(1 / (k + rank + 1))
    """

    def __init__(self, k: int = 60):
        self.k = k or settings.RRF_K

    def fuse(
        self,
        ranking_lists: List[List[Tuple[Dict[str, Any], float]]],
        top_k: int = 50,
    ) -> List[Tuple[Dict[str, Any], float]]:
        rrf_scores: Dict[str, float] = {}
        candidate_map: Dict[str, Dict[str, Any]] = {}

        for rank_list in ranking_lists:
            for rank, (cand, _) in enumerate(rank_list):
                cand_id = cand.get("id") or cand.get("name") or cand.get("title") or ""
                if not cand_id:
                    continue

                candidate_map[cand_id] = cand
                score_contribution = 1.0 / (self.k + rank + 1)
                rrf_scores[cand_id] = rrf_scores.get(cand_id, 0.0) + score_contribution

        max_possible = max(0.0001, len(ranking_lists) / (self.k + 1.0))
        fused: List[Tuple[Dict[str, Any], float]] = [
            (candidate_map[c_id], round(min(1.0, score / max_possible), 6))
            for c_id, score in rrf_scores.items()
        ]

        fused.sort(key=lambda x: x[1], reverse=True)
        return fused[:top_k]
