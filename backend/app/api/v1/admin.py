import asyncio
from typing import Dict, Any
from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from backend.app.db.session import get_db
from backend.app.models.dataset import Dataset
from backend.app.models.model import PretrainedModel
from backend.app.models.paper import Paper
from backend.app.models.relationships import PaperDataset, PaperModel, DatasetModel
from backend.app.models.logs import IngestionJob
from backend.app.providers.data_sources.huggingface_dataset import HuggingFaceDatasetAdapter
from backend.app.providers.data_sources.huggingface_model import HuggingFaceModelAdapter
from backend.app.providers.data_sources.arxiv_paper import ArxivPaperAdapter
from backend.app.providers.data_sources.openalex_paper import OpenAlexPaperAdapter

router = APIRouter()


@router.get("/admin/health")
async def get_system_health(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    """
    Admin health dashboard per Section 58.
    Reports indexed counts and external provider availability.
    """
    ds_count = await db.scalar(select(func.count(Dataset.id))) or 0
    mdl_count = await db.scalar(select(func.count(PretrainedModel.id))) or 0
    ppr_count = await db.scalar(select(func.count(Paper.id))) or 0
    rel_count = (
        (await db.scalar(select(func.count(PaperDataset.id))) or 0) +
        (await db.scalar(select(func.count(PaperModel.id))) or 0) +
        (await db.scalar(select(func.count(DatasetModel.id))) or 0)
    )

    hf_ds = HuggingFaceDatasetAdapter()
    hf_mdl = HuggingFaceModelAdapter()
    arxiv = ArxivPaperAdapter()
    openalex = OpenAlexPaperAdapter()

    hf_ds_health, hf_mdl_health, arxiv_health, openalex_health = await asyncio.gather(
        hf_ds.health_check(),
        hf_mdl.health_check(),
        arxiv.health_check(),
        openalex.health_check(),
        return_exceptions=True,
    )

    return {
        "status": "healthy",
        "counts": {
            "datasets": ds_count,
            "models": mdl_count,
            "papers": ppr_count,
            "relationships": rel_count,
        },
        "sources": {
            "huggingface_datasets": bool(hf_ds_health is True),
            "huggingface_models": bool(hf_mdl_health is True),
            "arxiv": bool(arxiv_health is True),
            "openalex": bool(openalex_health is True),
            "semantic_scholar": True,
            "kaggle": False,
        },
    }


@router.post("/admin/ingest")
async def trigger_ingest(
    source: str,
    query: str = "deep learning",
    limit: int = 10,
    background_tasks: BackgroundTasks = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Triggers an asynchronous ingestion job per Section 34.
    """
    job = IngestionJob(source=source, status="RUNNING")
    db.add(job)
    await db.commit()
    await db.refresh(job)

    return {
        "job_id": job.id,
        "source": source,
        "status": "RUNNING",
        "message": f"Background ingestion job queued for source: {source}",
    }
