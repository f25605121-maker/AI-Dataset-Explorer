from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field

PaperCategory = Literal[
    "FOUNDATIONAL",
    "DATASET_SPECIFIC",
    "MODEL_SPECIFIC",
    "BENCHMARK",
    "METHOD",
    "SURVEY",
    "LATEST_RESEARCH",
]


class PaperScoreBreakdown(BaseModel):
    task_relevance: float = 0.0
    methodological_relevance: float = 0.0
    dataset_relevance: float = 0.0
    model_relevance: float = 0.0
    freshness: float = 0.0
    impact: float = 0.0


class PaperRecommendation(BaseModel):
    id: str
    title: str
    abstract: Optional[str] = None
    authors: List[str] = Field(default_factory=list)
    venue: Optional[str] = None
    year: Optional[int] = None
    publication_date: Optional[str] = None
    doi: Optional[str] = None
    arxiv_id: Optional[str] = None
    url: Optional[str] = None
    pdf_url: Optional[str] = None
    code_url: Optional[str] = None
    citation_count: int = 0
    score: int = 0
    paper_type: PaperCategory = "METHOD"
    match_level: Optional[str] = "GOOD"
    why: List[str] = Field(default_factory=list)
    score_breakdown: PaperScoreBreakdown = Field(default_factory=PaperScoreBreakdown)
    dataset_ids: List[str] = Field(default_factory=list)
    model_ids: List[str] = Field(default_factory=list)
    tasks: List[str] = Field(default_factory=list)
    domains: List[str] = Field(default_factory=list)

