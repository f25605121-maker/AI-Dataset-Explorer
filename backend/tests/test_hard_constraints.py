import pytest
from backend.app.schemas.problem_profile import ProblemProfile, ComputeConstraints, ResearchConstraints
from backend.app.services.retrieval.hard_filter import HardConstraintFilter


def test_gpu_hard_constraint_rejection():
    filter_svc = HardConstraintFilter()

    # User constraint: 12GB GPU
    profile = ProblemProfile(
        original_problem="Nuclei segmentation on 12GB GPU",
        compute_constraints=ComputeConstraints(gpu_memory_gb=12.0),
    )

    candidates = [
        ({"name": "Model-Small", "min_vram_gb": 4.0}, 0.90),
        ({"name": "Model-Medium", "min_vram_gb": 12.0}, 0.92),
        ({"name": "Model-Huge-Requires-24GB", "min_vram_gb": 24.0}, 0.99),
    ]

    passed, rejected = filter_svc.filter_models(candidates, profile)

    passed_names = [cand.get("name") for cand, _ in passed]
    rejected_names = [cand.get("name") for cand in rejected]

    assert "Model-Small" in passed_names
    assert "Model-Medium" in passed_names
    assert "Model-Huge-Requires-24GB" not in passed_names
    assert "Model-Huge-Requires-24GB" in rejected_names
    assert "Compute violation" in rejected[0]["rejection_reason"]


def test_modality_hard_constraint_rejection():
    filter_svc = HardConstraintFilter()

    # User constraint: MRI
    profile = ProblemProfile(
        original_problem="Brain MRI segmentation",
        modalities=["MRI"],
    )

    candidates = [
        ({"name": "BraTS MRI Dataset", "modalities": ["MRI"]}, 0.95),
        ({"name": "Speech Emotion Audio Dataset", "modalities": ["Audio"]}, 0.85),
    ]

    passed, rejected = filter_svc.filter_datasets(candidates, profile)
    passed_names = [cand.get("name") for cand, _ in passed]

    assert "BraTS MRI Dataset" in passed_names
    assert "Speech Emotion Audio Dataset" not in passed_names


def test_year_hard_constraint_rejection():
    filter_svc = HardConstraintFilter()

    # User constraint: Year >= 2024
    profile = ProblemProfile(
        original_problem="Recent research after 2023",
        research_constraints=ResearchConstraints(minimum_year=2024, latest_required=True),
    )

    candidates = [
        ({"title": "Old Paper 2018", "year": 2018}, 0.95),
        ({"title": "New Paper 2024", "year": 2024}, 0.88),
    ]

    passed, rejected = filter_svc.filter_papers(candidates, profile)
    passed_titles = [cand.get("title") for cand, _ in passed]

    assert "New Paper 2024" in passed_titles
    assert "Old Paper 2018" not in passed_titles
