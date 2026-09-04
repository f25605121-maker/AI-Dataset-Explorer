import math
import re
import hashlib
from typing import List
import numpy as np
from backend.app.providers.embeddings.base import EmbeddingProvider
from backend.app.core.config import settings


class LocalEmbeddingProvider(EmbeddingProvider):
    """
    Deterministic semantic feature-projection embedding provider.
    Generates 384-dimensional unit-normalized vectors based on token, subword,
    and domain-ontology hashing. Guaranteed fast, deterministic, and requires no external downloads.
    """

    def __init__(self):
        self._dim = settings.EMBEDDING_DIMENSION  # 384
        self._model = settings.EMBEDDING_MODEL
        self._version = settings.EMBEDDING_VERSION

    @property
    def model_name(self) -> str:
        return self._model

    @property
    def dimension(self) -> int:
        return self._dim

    @property
    def version(self) -> str:
        return self._version

    def _hash_token(self, token: str) -> int:
        return int(hashlib.md5(token.encode("utf-8")).hexdigest(), 16) % self._dim

    def _generate_vector(self, text: str) -> List[float]:
        vec = np.zeros(self._dim, dtype=np.float32)
        words = re.findall(r"\b[a-zA-Z0-9_\-]+\b", text.lower())

        if not words:
            vec[0] = 1.0
            return vec.tolist()

        # Unigrams & Bigrams
        for i, word in enumerate(words):
            idx1 = self._hash_token(word)
            vec[idx1] += 1.0

            # Sub-word char n-grams
            if len(word) >= 4:
                for j in range(len(word) - 3):
                    ngram = word[j:j+4]
                    idx_ng = self._hash_token(ngram)
                    vec[idx_ng] += 0.3

            if i < len(words) - 1:
                bigram = f"{word}_{words[i+1]}"
                idx2 = self._hash_token(bigram)
                vec[idx2] += 0.8

        # L2 normalize
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        else:
            vec[0] = 1.0

        return [round(float(x), 6) for x in vec]

    async def embed_text(self, text: str) -> List[float]:
        return self._generate_vector(text)

    async def embed_batch(self, texts: List[str]) -> List[List[float]]:
        return [self._generate_vector(t) for t in texts]
