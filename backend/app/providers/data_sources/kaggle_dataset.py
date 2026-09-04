import logging
from typing import List, Dict, Any, Optional
import httpx
from backend.app.providers.data_sources.base import DataSourceAdapter
from backend.app.core.config import settings

logger = logging.getLogger(__name__)


class KaggleDatasetAdapter(DataSourceAdapter):
    """
    Adapter for Kaggle Datasets API.
    """

    @property
    def source_name(self) -> str:
        return "kaggle"

    async def search(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        if not settings.KAGGLE_USERNAME or not settings.KAGGLE_KEY:
            return []

        url = "https://www.kaggle.com/api/v1/datasets/list"
        params = {"search": query, "page": 1}
        auth = (settings.KAGGLE_USERNAME, settings.KAGGLE_KEY)

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(url, params=params, auth=auth)
                if resp.status_code == 200:
                    items = resp.json()
                    return [await self.normalize(item) for item in items[:limit]]
        except Exception as e:
            logger.warning(f"Kaggle search failed: {e}")

        return []

    async def fetch(self, resource_id: str) -> Optional[Dict[str, Any]]:
        return None

    async def normalize(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        ref = raw.get("ref") or raw.get("id") or ""
        title = raw.get("title") or ref
        return {
            "id": f"kg_{ref.replace('/', '_')}",
            "source": "kaggle",
            "source_id": ref,
            "name": title,
            "slug": ref,
            "description": raw.get("description") or f"Kaggle dataset: {title}",
            "canonical_url": f"https://www.kaggle.com/datasets/{ref}",
            "license": raw.get("licenseName") or "Community",
            "domain": "General AI",
            "subdomains": [],
            "tasks": [],
            "modalities": ["Tabular", "Image"],
            "num_samples": raw.get("downloadCount", 0),
            "size_gb": (raw.get("totalBytes") or 0) / (1024 * 1024 * 1024) if raw.get("totalBytes") else None,
            "format": [],
        }

    async def health_check(self) -> bool:
        return bool(settings.KAGGLE_USERNAME and settings.KAGGLE_KEY)
