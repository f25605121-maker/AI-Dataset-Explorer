from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class DataSourceAdapter(ABC):
    """
    Adapter interface for external data sources per Section 4 and Section 59.
    """

    @property
    @abstractmethod
    def source_name(self) -> str:
        pass

    @abstractmethod
    async def search(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Search the external repository for candidates."""
        pass

    @abstractmethod
    async def fetch(self, resource_id: str) -> Optional[Dict[str, Any]]:
        """Fetch a specific resource by external ID."""
        pass

    @abstractmethod
    async def normalize(self, raw_item: Dict[str, Any]) -> Dict[str, Any]:
        """Normalize raw external data into canonical schema attributes."""
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Check if the external data source API is reachable and healthy."""
        pass
