from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.db.session import get_db
from backend.app.models.dataset import Dataset
from backend.app.models.model import PretrainedModel
from backend.app.models.paper import Paper
from backend.app.models.relationships import PaperDataset, PaperModel, DatasetModel

router = APIRouter()


@router.get("/datasets/{id}")
async def get_dataset(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dataset).where(Dataset.id == id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return item


@router.get("/models/{id}")
async def get_model(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(PretrainedModel).where(PretrainedModel.id == id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Model not found")
    return item


@router.get("/papers/{id}")
async def get_paper(id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Paper).where(Paper.id == id))
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Paper not found")
    return item


@router.get("/datasets/{id}/papers")
async def get_dataset_papers(id: str, db: AsyncSession = Depends(get_db)):
    rel_res = await db.execute(select(PaperDataset).where(PaperDataset.dataset_id == id))
    rels = rel_res.scalars().all()
    paper_ids = [r.paper_id for r in rels]
    if not paper_ids:
        return []
    p_res = await db.execute(select(Paper).where(Paper.id.in_(paper_ids)))
    return p_res.scalars().all()


@router.get("/datasets/{id}/models")
async def get_dataset_models(id: str, db: AsyncSession = Depends(get_db)):
    rel_res = await db.execute(select(DatasetModel).where(DatasetModel.dataset_id == id))
    rels = rel_res.scalars().all()
    model_ids = [r.model_id for r in rels]
    if not model_ids:
        return []
    m_res = await db.execute(select(PretrainedModel).where(PretrainedModel.id.in_(model_ids)))
    return m_res.scalars().all()


@router.get("/models/{id}/papers")
async def get_model_papers(id: str, db: AsyncSession = Depends(get_db)):
    rel_res = await db.execute(select(PaperModel).where(PaperModel.model_id == id))
    rels = rel_res.scalars().all()
    paper_ids = [r.paper_id for r in rels]
    if not paper_ids:
        return []
    p_res = await db.execute(select(Paper).where(Paper.id.in_(paper_ids)))
    return p_res.scalars().all()
