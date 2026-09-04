from typing import List
from pydantic import BaseModel, Field


class ScientificVerificationResult(BaseModel):
    """
    Schema for Scientific Consistency Check per Section 26.
    """
    valid: bool
    overall_score: float = 0.0
    problems: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    evidence_needed: List[str] = Field(default_factory=list)
    replacement_needed: bool = False
    replacement_targets: List[str] = Field(default_factory=list)
