import pytest
from backend.app.db.init_db import init_db
from backend.app.db.session import AsyncSessionLocal
from backend.app.services.recommendation_service import RecommendationPipelineService

TEST_QUERIES_23 = [
    # 1. Simple classification
    {"id": 1, "query": "Classify cats and dogs images", "expected_task": "classification", "expected_modality": "Image"},
    # 2. Regression
    {"id": 2, "query": "Predict patient disease progression score regression over time", "expected_task": "regression"},
    # 3. NLP
    {"id": 3, "query": "Clinical text classification from medical notes", "expected_modality": "Text"},
    # 4. Computer Vision
    {"id": 4, "query": "Dermoscopy skin lesion classification in computer vision", "expected_modality": "Image"},
    # 5. Segmentation
    {"id": 5, "query": "Cell nuclei segmentation in microscopy images", "expected_task": "segmentation", "expected_modality": "Microscopy"},
    # 6. Object detection
    {"id": 6, "query": "Real-time object detection for traffic surveillance", "expected_task": "object_detection"},
    # 7. Audio
    {"id": 7, "query": "Speech emotion recognition audio WAV dataset", "expected_modality": "Audio"},
    # 8. Time series / tabular
    {"id": 8, "query": "Predict transaction fraud from tabular time series records", "expected_modality": "Tabular"},
    # 9. Multimodal
    {"id": 9, "query": "Multimodal prediction from MRI scans and clinical tabular data", "expected_modalities": ["MRI", "Tabular"]},
    # 10. Medical imaging
    {"id": 10, "query": "Chest X-ray radiograph pneumonia classification", "expected_domain": "Healthcare & Biomedical", "expected_modality": "X-Ray"},
    # 11. Few-shot learning
    {"id": 11, "query": "Few-shot nuclei segmentation with only 120 labeled samples", "expected_constraint": "limited_labeled"},
    # 12. Class imbalance
    {"id": 12, "query": "Fraud detection under severe class imbalance", "expected_imbalance": True},
    # 13. Limited labels
    {"id": 13, "query": "Semi-supervised medical image segmentation with limited labels", "expected_constraint": "limited_labeled"},
    # 14. Real-time inference
    {"id": 14, "query": "Real-time image detection with inference latency under 20ms", "expected_latency": 20.0},
    # 15. GPU constraints
    {"id": 15, "query": "3D segmentation running on single 12GB GPU", "expected_gpu": 12.0},
    # 16. License constraints
    {"id": 16, "query": "Open commercial-friendly dataset for computer vision", "expected_modality": "Image"},
    # 17. Latest research
    {"id": 17, "query": "Latest nuclei segmentation research papers after 2023", "expected_latest": True, "expected_min_year": 2023},
    # 18. Named dataset
    {"id": 18, "query": "I want to use the ISIC dataset for skin lesion classification", "expected_named_dataset": "ISIC"},
    # 19. Named model
    {"id": 19, "query": "Fine-tune YOLOv8 for instance segmentation", "expected_named_model": "YOLOv8"},
    # 20. Compound research problem
    {
        "id": 20,
        "query": "Predict Alzheimer's disease progression using longitudinal MRI scans, clinical records, and cognitive scores with 16GB GPU constraint",
        "expected_modalities": ["MRI", "Tabular"],
        "expected_gpu": 16.0,
    },
    # 21. Vague query
    {"id": 21, "query": "Need help with AI project for smart data", "expected_fallback": True},
    # 22. Contradictory query
    {"id": 22, "query": "Brain MRI glioma segmentation with 4GB GPU constraint", "expected_gpu": 4.0},
    # 23. Novel problem with no direct dataset
    {
        "id": 23,
        "query": "I want a dataset containing exactly 50,000 labeled 7D microscopy samples for a new biological phenomenon",
        "expected_no_match": True,
    },
]


@pytest.mark.asyncio
async def test_full_23_query_evaluation_benchmark():
    await init_db()
    pipeline = RecommendationPipelineService()

    hard_constraint_violations = 0
    total_evaluated = 0

    async with AsyncSessionLocal() as session:
        for item in TEST_QUERIES_23:
            total_evaluated += 1
            query = item["query"]
            res = await pipeline.recommend(query, session)
            prof = res.problem_profile

            # Check 1: Zero hard constraint violations
            if item.get("expected_gpu") is not None:
                max_gpu = item["expected_gpu"]
                assert prof.compute_constraints.gpu_memory_gb == max_gpu
                for mdl in res.models:
                    if mdl.min_vram_gb is not None and mdl.min_vram_gb > max_gpu:
                        hard_constraint_violations += 1

            if item.get("expected_no_match"):
                assert res.no_direct_match is True or res.datasets[0].match_level in ("PARTIAL", "WEAK", "NO_DIRECT_MATCH")

            if item.get("expected_named_dataset"):
                assert item["expected_named_dataset"] in prof.named_entities.datasets

            if item.get("expected_named_model"):
                assert item["expected_named_model"] in prof.named_entities.models

            if item.get("expected_latest"):
                assert prof.research_constraints.latest_required is True

            if item.get("expected_imbalance"):
                assert prof.data_constraints.class_imbalance is True

    # Section 65 Requirement: HARD CONSTRAINT VIOLATION RATE MUST BE AS CLOSE TO ZERO AS POSSIBLE (0.0%)
    violation_rate = hard_constraint_violations / total_evaluated
    assert violation_rate == 0.0, f"Hard constraint violation rate was {violation_rate}, expected 0.0%"
