import logging
from typing import List, Dict, Any, Optional
import httpx
from backend.app.providers.data_sources.base import DataSourceAdapter
from backend.app.core.config import settings

logger = logging.getLogger(__name__)


class HuggingFaceModelAdapter(DataSourceAdapter):
    """
    Adapter for Hugging Face Models API.
    """

    @property
    def source_name(self) -> str:
        return "huggingface"

    async def search(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        headers = {}
        if settings.HUGGINGFACE_TOKEN:
            headers["Authorization"] = f"Bearer {settings.HUGGINGFACE_TOKEN}"

        url = "https://huggingface.co/api/models"
        params = {"search": query, "limit": limit, "full": "true"}

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(url, params=params, headers=headers)
                if resp.status_code == 200:
                    items = resp.json()
                    return [await self.normalize(item) for item in items]
        except Exception as e:
            logger.warning(f"HuggingFace model search failed: {e}")

        return []

    async def fetch(self, resource_id: str) -> Optional[Dict[str, Any]]:
        url = f"https://huggingface.co/api/models/{resource_id}"
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    return await self.normalize(resp.json())
        except Exception as e:
            logger.warning(f"HuggingFace model fetch failed: {e}")
        return None

    async def normalize(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        model_id = raw.get("id") or raw.get("modelId") or ""
        pipeline = raw.get("pipeline_tag") or "machine-learning"
        tags = raw.get("tags") or []
        card_data = raw.get("cardData") or {}

        # Architecture and modality inference
        arch = "Transformer / Neural Network"
        for t in tags:
            if "bert" in t:
                arch = "BERT"
            elif "swin" in t:
                arch = "Swin Transformer"
            elif "unet" in t:
                arch = "U-Net"
            elif "yolo" in t:
                arch = "YOLO"
            elif "llama" in t:
                arch = "Llama"
            elif "resnet" in t:
                arch = "ResNet"

        modalities = []
        if any(t in tags for t in ("image-classification", "image-segmentation", "object-detection", "computer-vision")):
            modalities.append("Image")
        if any(t in tags for t in ("text-classification", "translation", "question-answering", "nlp")):
            modalities.append("Text")
        if any(t in tags for t in ("audio-classification", "automatic-speech-recognition", "audio")):
            modalities.append("Audio")

        return {
            "id": f"hfm_{model_id.replace('/', '_')}",
            "source": "huggingface",
            "source_id": model_id,
            "name": model_id.split("/")[-1] if "/" in model_id else model_id,
            "slug": model_id,
            "canonical_url": f"https://huggingface.co/{model_id}",
            "description": f"Pretrained checkpoint for {pipeline}. Tags: {', '.join(tags[:6])}",
            "architecture": arch,
            "tasks": [pipeline],
            "domains": ["General AI"],
            "modalities": modalities or ["Text"],
            "parameters": "Unknown",
            "framework": "PyTorch" if "pytorch" in tags else "TensorFlow" if "tf" in tags else "PyTorch",
            "license": card_data.get("license") or "open",
            "memory_requirement": {"min_vram_gb": 8.0},
            "inference_information": {"latency_ms": 100.0},
        }

    async def health_check(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                resp = await client.get("https://huggingface.co/api/models?limit=1")
                return resp.status_code == 200
        except Exception:
            return False
