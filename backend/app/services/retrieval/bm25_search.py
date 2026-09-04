import math
import re
from typing import List, Dict, Any, Tuple


class BM25SearchEngine:
    """
    Sparse keyword and exact terminology retrieval engine per Section 11.
    Preserves exact technical names: YOLOv8, ISIC, BraTS, nnU-Net, Dice, mAP, etc.
    """

    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b

    def _tokenize(self, text: str) -> List[str]:
        return [w for w in re.findall(r"\b[a-zA-Z0-9_\-\.]+\b", text.lower()) if len(w) > 1]

    def search(
        self,
        query: str,
        candidates: List[Dict[str, Any]],
        top_k: int = 50,
    ) -> List[Tuple[Dict[str, Any], float]]:
        if not candidates:
            return []

        q_tokens = self._tokenize(query)
        if not q_tokens:
            return [(c, 0.0) for c in candidates[:top_k]]

        # Precompute doc lengths and term frequencies
        doc_tokens_list: List[List[str]] = []
        doc_lengths: List[int] = []

        for cand in candidates:
            title = cand.get("title") or cand.get("name") or ""
            desc = cand.get("description") or cand.get("abstract") or ""
            text = f"{title} {title} {desc} {' '.join(cand.get('tasks', []))} {' '.join(cand.get('modalities', []))}"
            toks = self._tokenize(text)
            doc_tokens_list.append(toks)
            doc_lengths.append(len(toks))

        N = len(candidates)
        avgdl = sum(doc_lengths) / max(1, N)

        # Document frequencies
        df: Dict[str, int] = {}
        for toks in doc_tokens_list:
            unique_toks = set(toks)
            for t in q_tokens:
                if t in unique_toks:
                    df[t] = df.get(t, 0) + 1

        # Calculate BM25 scores
        scored: List[Tuple[Dict[str, Any], float]] = []

        for idx, cand in enumerate(candidates):
            toks = doc_tokens_list[idx]
            d_len = doc_lengths[idx]
            score = 0.0

            tf_dict: Dict[str, int] = {}
            for t in toks:
                tf_dict[t] = tf_dict.get(t, 0) + 1

            for q_term in q_tokens:
                if q_term in tf_dict:
                    freq = tf_dict[q_term]
                    n_q = df.get(q_term, 0)
                    idf = math.log(1 + (N - n_q + 0.5) / (n_q + 0.5))
                    num = freq * (self.k1 + 1)
                    denom = freq + self.k1 * (1 - self.b + self.b * (d_len / avgdl))
                    score += idf * (num / denom)

            # Exact title match bonus
            title_lower = (cand.get("title") or cand.get("name") or "").lower()
            if any(q in title_lower for q in q_tokens):
                score += 2.0

            scored.append((cand, max(0.0, round(score, 4))))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[:top_k]
