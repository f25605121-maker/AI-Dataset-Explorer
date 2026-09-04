import json
from typing import List, Optional
from sqlalchemy import TypeDecorator, Text
from backend.app.core.config import settings

try:
    if settings.USE_PGVECTOR:
        from pgvector.sqlalchemy import Vector
        VectorType = Vector(settings.EMBEDDING_DIMENSION)
    else:
        raise ImportError()
except Exception:
    class JsonVector(TypeDecorator):
        """Stores vector embeddings as a JSON string when pgvector is not available."""
        impl = Text
        cache_ok = True

        def process_bind_param(self, value: Optional[List[float]], dialect) -> Optional[str]:
            if value is None:
                return None
            return json.dumps(value)

        def process_result_value(self, value: Optional[str], dialect) -> Optional[List[float]]:
            if value is None:
                return None
            return json.loads(value)

    VectorType = JsonVector
