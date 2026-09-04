import pytest
from backend.app.db.init_db import init_db
from backend.app.db.session import AsyncSessionLocal
from backend.app.services.recommendation_service import RecommendationPipelineService


@pytest.mark.asyncio
async def test_end_to_end_complex_constrained_query():
    # Initialize and seed db
    await init_db()

    pipeline = RecommendationPipelineService()
    query = (
        "I have only 800 fluorescence microscopy images, 120 are labeled, "
        "and I need accurate nuclei segmentation. The model should run on a "
        "single 12GB GPU and I want recent research after 2023."
    )

    async with AsyncSessionLocal() as session:
        response = await pipeline.recommend(query, session)

    assert response.problem_profile is not None
    assert "Microscopy" in response.problem_profile.modalities

    # Recommended Dataset
    assert len(response.datasets) > 0
    top_ds = response.datasets[0]
    assert "MoNuSeg" in top_ds.name or "nuclei" in top_ds.name.lower()
    assert top_ds.score >= 80

    # Recommended Model must NOT violate 12GB GPU constraint!
    assert len(response.models) > 0
    top_mdl = response.models[0]
    if top_mdl.min_vram_gb is not None:
        assert top_mdl.min_vram_gb <= 12.0

    # Research literature
    assert len(response.papers) > 0


@pytest.mark.asyncio
async def test_named_dataset_query():
    await init_db()
    pipeline = RecommendationPipelineService()
    query = "I want to use the ISIC dataset for skin lesion classification. What model should I use and what are the latest papers?"

    async with AsyncSessionLocal() as session:
        response = await pipeline.recommend(query, session)

    assert "ISIC" in response.problem_profile.named_entities.datasets
    assert len(response.datasets) > 0
    assert "ISIC" in response.datasets[0].name


@pytest.mark.asyncio
async def test_no_direct_match_query():
    await init_db()
    pipeline = RecommendationPipelineService()
    query = "I want a dataset containing exactly 50,000 labeled 7D microscopy quantum teleportation samples for a new biological phenomenon."

    async with AsyncSessionLocal() as session:
        response = await pipeline.recommend(query, session)

    # Must NOT invent an exact match!
    # Must flag no_direct_match or match_level NOT DIRECT
    assert response.no_direct_match is True or response.datasets[0].match_level in ("PARTIAL", "WEAK", "NO_DIRECT_MATCH")
    assert response.closest_alternatives is not None
