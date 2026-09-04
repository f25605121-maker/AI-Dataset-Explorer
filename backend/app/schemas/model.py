from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
from backend.app.schemas.dataset import MatchLevel


class ModelScoreBreakdown(BaseModel):
    semantic: float = 0.0
    task: float = 0.0
    domain: float = 0.0
    modality: float = 0.0
    compute_compatibility: float = 0.0
    benchmark_evidence: float = 0.0
    research_support: float = 0.0


class ModelRecommendation(BaseModel):
    id: str
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    source: str = "huggingface"
    canonical_url: Optional[str] = None
    architecture: Optional[str] = None
    tasks: List[str] = Field(default_factory=list)
    domains: List[str] = Field(default_factory=list)
    modalities: List[str] = Field(default_factory=list)
    parameters: Optional[str] = None
    framework: Optional[str] = None
    license: Optional[str] = None
    min_vram_gb: Optional[float] = None
    latency_ms: Optional[float] = None
    score: int = 0
    match_level: MatchLevel = "GOOD"
    score_breakdown: ModelScoreBreakdown = Field(default_factory=ModelScoreBreakdown)
    why: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    benchmark_data: Dict[str, Any] = Field(default_factory=dict)
    compatible_datasets: List[str] = Field(default_factory=list)
    related_papers: List[Dict[str, Any]] = Field(default_factory=list)
