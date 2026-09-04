from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from backend.app.schemas.dataset import DatasetRecommendation
from backend.app.schemas.model import ModelRecommendation
from backend.app.schemas.paper import PaperRecommendation
from backend.app.schemas.verification import ScientificVerificationResult
from backend.app.services.recommendation_service import RecommendationPipelineService

router = APIRouter()
pipeline = RecommendationPipelineService()


@router.post("/search", response_model=RecommendationResponse)
async def search_all(
    request: RecommendationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Unified search endpoint."""
    return await pipeline.recommend(request.query, db, bypass_cache=request.bypass_cache)


@router.post("/search/datasets", response_model=List[DatasetRecommendation])
async def search_datasets(
    request: RecommendationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Direct search for matching datasets."""
    res = await pipeline.recommend(request.query, db, bypass_cache=request.bypass_cache)
    return res.datasets


@router.post("/search/models", response_model=List[ModelRecommendation])
async def search_models(
    request: RecommendationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Direct search for compatible models."""
    res = await pipeline.recommend(request.query, db, bypass_cache=request.bypass_cache)
    return res.models


@router.post("/search/papers", response_model=List[PaperRecommendation])
async def search_papers(
    request: RecommendationRequest,
    db: AsyncSession = Depends(get_db),
):
    """Direct search for relevant scientific research papers."""
    res = await pipeline.recommend(request.query, db, bypass_cache=request.bypass_cache)
    return res.papers


@router.post("/verify", response_model=ScientificVerificationResult)
async def verify_compatibility(
    problem: str = Body(..., embed=True),
    dataset: Dict[str, Any] = Body(None, embed=True),
    model: Dict[str, Any] = Body(None, embed=True),
    papers: List[Dict[str, Any]] = Body([], embed=True),
    db: AsyncSession = Depends(get_db),
):
    """Explicit scientific consistency check for a problem-dataset-model-paper triple."""
    profile = await pipeline.parser.analyze_problem(problem)
    ds_rec = DatasetRecommendation(**dataset) if dataset else None
    mdl_rec = ModelRecommendation(**model) if model else None
    ppr_recs = [PaperRecommendation(**p) for p in papers]
    return await pipeline.verifier.verify(problem, profile, ds_rec, mdl_rec, ppr_recs)
