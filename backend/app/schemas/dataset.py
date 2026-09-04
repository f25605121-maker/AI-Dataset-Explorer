from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

MatchLevel = Literal["DIRECT", "STRONG", "GOOD", "PARTIAL", "WEAK", "NO_DIRECT_MATCH"]


class DatasetScoreBreakdown(BaseModel):
    semantic: float = 0.0
    task: float = 0.0
    domain: float = 0.0
    modality: float = 0.0
    constraints: float = 0.0
    research: float = 0.0
    benchmark: float = 0.0


class DatasetRecommendation(BaseModel):
    id: str
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    source: str = "huggingface"
    canonical_url: Optional[str] = None
    license: Optional[str] = None
    domain: Optional[str] = None
    subdomains: List[str] = Field(default_factory=list)
    tasks: List[str] = Field(default_factory=list)
    modalities: List[str] = Field(default_factory=list)
    num_samples: Optional[int] = None
    size_gb: Optional[float] = None
    format: List[str] = Field(default_factory=list)
    score: int = 0
    match_level: MatchLevel = "GOOD"
    score_breakdown: DatasetScoreBreakdown = Field(default_factory=DatasetScoreBreakdown)
    why: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    strengths: List[str] = Field(default_factory=list)
    limitations: List[str] = Field(default_factory=list)
    connected_papers: List[Dict[str, Any]] = Field(default_factory=list)
