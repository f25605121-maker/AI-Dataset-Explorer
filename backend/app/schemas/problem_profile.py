from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field


class TaskItem(BaseModel):
    name: str
    confidence: float = 1.0


class SubproblemItem(BaseModel):
    description: str
    task: str
    priority: int = 1


class InputSpec(BaseModel):
    description: str = ""
    modalities: List[str] = Field(default_factory=list)


class OutputSpec(BaseModel):
    description: str = ""
    type: str = ""


class DataConstraints(BaseModel):
    sample_count: Optional[int] = None
    labeled_sample_count: Optional[int] = None
    data_size_gb: Optional[float] = None
    label_availability: Optional[str] = None  # e.g., "limited", "semi-supervised", "unlabeled", "complete"
    class_imbalance: Optional[bool] = None
    missing_data: Optional[bool] = None
    other: List[str] = Field(default_factory=list)


class ComputeConstraints(BaseModel):
    gpu_memory_gb: Optional[float] = None  # e.g., 12.0 for 12GB GPU
    cpu: Optional[str] = None
    ram_gb: Optional[float] = None
    latency_ms: Optional[float] = None  # e.g., 200.0 for <200ms
    training_time: Optional[str] = None
    other: List[str] = Field(default_factory=list)


class QualityRequirements(BaseModel):
    metrics: List[str] = Field(default_factory=list)  # e.g., "Dice", "mAP", "AUC"
    accuracy_requirement: Optional[str] = None
    other: List[str] = Field(default_factory=list)


class ResearchConstraints(BaseModel):
    latest_required: bool = False
    minimum_year: Optional[int] = None  # e.g., 2023 or 2024
    maximum_year: Optional[int] = None
    peer_review_required: Optional[bool] = None


class NamedEntities(BaseModel):
    datasets: List[str] = Field(default_factory=list)  # e.g., "ISIC", "ImageNet"
    models: List[str] = Field(default_factory=list)    # e.g., "YOLOv8", "U-Net"
    algorithms: List[str] = Field(default_factory=list)
    frameworks: List[str] = Field(default_factory=list) # e.g., "PyTorch"
    metrics: List[str] = Field(default_factory=list)
    papers: List[str] = Field(default_factory=list)


class ComplexitySpec(BaseModel):
    level: Literal["simple", "moderate", "complex", "compound"] = "simple"
    reason: str = ""


class ProblemProfile(BaseModel):
    """
    Structured Problem Profile schema adhering strictly to Section 7 & 67.
    """
    original_problem: str
    problem_summary: str = ""
    tasks: List[TaskItem] = Field(default_factory=list)
    subproblems: List[SubproblemItem] = Field(default_factory=list)
    domains: List[str] = Field(default_factory=list)
    subdomains: List[str] = Field(default_factory=list)
    input: InputSpec = Field(default_factory=InputSpec)
    output: OutputSpec = Field(default_factory=OutputSpec)
    modalities: List[str] = Field(default_factory=list)
    data_constraints: DataConstraints = Field(default_factory=DataConstraints)
    compute_constraints: ComputeConstraints = Field(default_factory=ComputeConstraints)
    quality_requirements: QualityRequirements = Field(default_factory=QualityRequirements)
    research_constraints: ResearchConstraints = Field(default_factory=ResearchConstraints)
    named_entities: NamedEntities = Field(default_factory=NamedEntities)
    preferred_methods: List[str] = Field(default_factory=list)
    keywords: List[str] = Field(default_factory=list)
    search_queries: List[str] = Field(default_factory=list)
    hard_constraints: List[str] = Field(default_factory=list)
    soft_preferences: List[str] = Field(default_factory=list)
    ambiguities: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    complexity: ComplexitySpec = Field(default_factory=ComplexitySpec)
    confidence: float = 0.85
