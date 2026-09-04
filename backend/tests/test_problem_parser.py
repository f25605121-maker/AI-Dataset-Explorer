import pytest
from backend.app.services.problem_understanding.parser import ProblemUnderstandingEngine


@pytest.mark.asyncio
async def test_simple_problem_parsing():
    parser = ProblemUnderstandingEngine()
    q = "Classify cats and dogs."
    profile = await parser.analyze_problem(q)

    assert any(t.name == "classification" for t in profile.tasks)
    assert "Image" in profile.modalities
    assert profile.complexity.level == "simple"


@pytest.mark.asyncio
async def test_moderate_problem_parsing():
    parser = ProblemUnderstandingEngine()
    q = "I need to classify diabetic retinopathy from retinal images."
    profile = await parser.analyze_problem(q)

    assert any(t.name == "classification" for t in profile.tasks)
    assert "Healthcare & Biomedical" in profile.domains
    assert any("Ophthalmology" in s for s in profile.subdomains)


@pytest.mark.asyncio
async def test_complex_constrained_parsing():
    parser = ProblemUnderstandingEngine()
    q = (
        "I have only 800 fluorescence microscopy images, 120 are labeled, "
        "and I need accurate nuclei segmentation. The model should run on a "
        "single 12GB GPU and I want recent research after 2023."
    )
    profile = await parser.analyze_problem(q)

    # Tasks
    assert any(t.name == "segmentation" for t in profile.tasks)
    # Modality
    assert "Microscopy" in profile.modalities
    # Compute constraint
    assert profile.compute_constraints.gpu_memory_gb == 12.0
    assert any("12GB" in c for c in profile.hard_constraints)
    # Data constraints
    assert profile.data_constraints.sample_count == 800
    assert profile.data_constraints.labeled_sample_count == 120
    assert profile.data_constraints.label_availability == "limited_labeled"
    # Research temporal constraint
    assert profile.research_constraints.minimum_year == 2023
    assert profile.research_constraints.latest_required is True


@pytest.mark.asyncio
async def test_complex_multimodal_parsing():
    parser = ProblemUnderstandingEngine()
    q = (
        "I need to predict Alzheimer's disease progression using longitudinal "
        "MRI scans, clinical records, and cognitive scores. I only have 400 "
        "patients, labels are incomplete, the data is highly imbalanced, the "
        "model must be interpretable, and inference should be under 200ms."
    )
    profile = await parser.analyze_problem(q)

    assert "MRI" in profile.modalities
    assert "Tabular" in profile.modalities
    assert profile.compute_constraints.latency_ms == 200.0
    assert profile.data_constraints.sample_count == 400
    assert profile.data_constraints.class_imbalance is True
    assert profile.complexity.level in ("complex", "compound")
