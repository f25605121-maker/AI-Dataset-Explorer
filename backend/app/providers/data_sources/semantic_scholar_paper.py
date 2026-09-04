import logging
from typing import List, Dict, Any, Optional
import httpx
from backend.app.providers.data_sources.base import DataSourceAdapter
from backend.app.core.config import settings

logger = logging.getLogger(__name__)


class SemanticScholarPaperAdapter(DataSourceAdapter):
    """
    Adapter for Semantic Scholar Graph API.
    """

    @property
    def source_name(self) -> str:
        return "semantic_scholar"

    async def search(self, query: str, limit: int = 15) -> List[Dict[str, Any]]:
        headers = {}
        if settings.SEMANTIC_SCHOLAR_API_KEY:
            headers["x-api-key"] = settings.SEMANTIC_SCHOLAR_API_KEY

        url = "https://api.semanticscholar.org/graph/v1/paper/search"
        params = {
            "query": query,
            "limit": limit,
            "fields": "paperId,title,abstract,authors,year,venue,citationCount,url,openAccessPdf,publicationDate",
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(url, params=params, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    items = data.get("data", [])
                    return [await self.normalize(item) for item in items]
        except Exception as e:
            logger.warning(f"Semantic Scholar search failed: {e}")

        return []

    async def fetch(self, resource_id: str) -> Optional[Dict[str, Any]]:
        url = f"https://api.semanticscholar.org/graph/v1/paper/{resource_id}"
        headers = {}
        if settings.SEMANTIC_SCHOLAR_API_KEY:
            headers["x-api-key"] = settings.SEMANTIC_SCHOLAR_API_KEY
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    return await self.normalize(resp.json())
        except Exception as e:
            logger.warning(f"Semantic Scholar fetch failed: {e}")
        return None

    async def normalize(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        paper_id = raw.get("paperId") or ""
        authors = [a.get("name", "") for a in raw.get("authors", []) if a.get("name")]
        pdf_info = raw.get("openAccessPdf") or {}

        return {
            "id": f"s2_{paper_id}",
            "title": raw.get("title") or "Untitled Paper",
            "abstract": raw.get("abstract") or "",
            "authors": authors[:5],
            "venue": raw.get("venue") or "Scholarly Publication",
            "year": raw.get("year"),
            "publication_date": raw.get("publicationDate"),
            "url": raw.get("url") or f"https://www.semanticscholar.org/paper/{paper_id}",
            "pdf_url": pdf_info.get("url") or None,
            "citation_count": raw.get("citationCount", 0),
            "source": "semantic_scholar",
            "source_id": paper_id,
            "paper_type": "METHOD",
            "tasks": [],
            "domains": [],
            "methods": [],
            "dataset_ids": [],
            "model_ids": [],
        }

    async def health_check(self) -> bool:
        return True
