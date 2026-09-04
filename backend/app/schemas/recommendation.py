from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.problem_profile import ProblemProfile
from backend.app.schemas.dataset import DatasetRecommendation
from backend.app.schemas.model import ModelRecommendation
from backend.app.schemas.paper import PaperRecommendation


class RecommendationRequest(BaseModel):
    query: str
    bypass_cache: bool = False
    filters: Optional[Dict[str, Any]] = None


class RecommendationResponse(BaseModel):
    """
    Structured recommendation API response per Section 42.
    """
    problem_profile: ProblemProfile
    datasets: List[DatasetRecommendation] = Field(default_factory=list)
    models: List[ModelRecommendation] = Field(default_factory=list)
    papers: List[PaperRecommendation] = Field(default_factory=list)
    latest_research: List[PaperRecommendation] = Field(default_factory=list)
    relationships: List[Dict[str, Any]] = Field(default_factory=list)
    no_direct_match: bool = False
    confidence: float = 0.85
    closest_alternatives: List[DatasetRecommendation] = Field(default_factory=list)
    difference_explanation: Optional[str] = None
