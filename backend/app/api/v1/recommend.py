from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import get_db
from backend.app.schemas.recommendation import RecommendationRequest, RecommendationResponse
from backend.app.services.recommendation_service import RecommendationPipelineService

router = APIRouter()
pipeline = RecommendationPipelineService()


@router.post("/recommend", response_model=RecommendationResponse)
async def recommend_pipeline(
    request: RecommendationRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Master Recommendation Pipeline per Section 41 & 42.
    Runs UNDERSTAND -> DECOMPOSE -> EXPAND -> HYBRID RETRIEVE -> FUSE -> CROSS-LINK ->
    RERANK -> HARD-CONSTRAINT CHECK -> SCIENTIFIC CONSISTENCY CHECK -> FRESH RESEARCH -> EXPLAIN.
    """
    return await pipeline.recommend(request.query, db, bypass_cache=request.bypass_cache)
