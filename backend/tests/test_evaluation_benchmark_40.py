import pytest
from typing import List, Dict, Any
from backend.app.db.init_db import init_db
from backend.app.db.session import AsyncSessionLocal
from backend.app.services.recommendation_service import RecommendationPipelineService

# ==============================================================================
# 40 CANONICAL BENCHMARK QUERIES (COVERING ALL 8 SYSTEM ARCHETYPES)
# ==============================================================================
TEST_QUERIES_40: List[Dict[str, Any]] = [
    # ── Category 1: Simple Tasks (1–5) ─────────────────────────────────────────
    {
        "id": 1,
        "category": "simple",
        "query": "Classify cats and dogs pet photos into binary categories",
        "expected_task": "classification",
        "expected_modality": "Image",
        "expected_domain": "General AI & Computer Vision",
    },
    {
        "id": 2,
        "category": "simple",
        "query": "Predict continuous patient disease progression risk score regression over time",
        "expected_task": "regression",
    },
    {
        "id": 3,
        "category": "simple",
        "query": "Text sentiment classification and clinical notes summarization",
        "expected_modality": "Text",
    },
    {
        "id": 4,
        "category": "simple",
        "query": "Tabular classification of financial credit card transactions",
        "expected_modality": "Tabular",
        "expected_domain": "Finance & Tabular ML",
    },
    {
        "id": 5,
        "category": "simple",
        "query": "Audio speech recognition and voice keyword spotting from WAV recordings",
        "expected_modality": "Audio",
    },

    # ── Category 2: Computer Vision Tasks (6–10) ──────────────────────────────
    {
        "id": 6,
        "category": "computer_vision",
        "query": "Real-time 2D bounding-box object detection for roadway autonomous vehicles",
        "expected_task": "object_detection",
        "expected_modality": "Image",
    },
    {
        "id": 7,
        "category": "computer_vision",
        "query": "Pixel-level semantic segmentation of urban scenes in camera images",
        "expected_task": "segmentation",
        "expected_modality": "Image",
    },
    {
        "id": 8,
        "category": "computer_vision",
        "query": "Instance segmentation of overlapping cell nuclei in microscopy slides",
        "expected_task": "segmentation",
        "expected_modality": "Microscopy",
    },
    {
        "id": 9,
        "category": "computer_vision",
        "query": "3D volumetric segmentation of anatomical organs in CT scans",
        "expected_task": "segmentation",
        "expected_modality": "CT",
    },
    {
        "id": 10,
        "category": "computer_vision",
        "query": "High-resolution dermoscopy skin lesion classification for melanoma detection",
        "expected_task": "classification",
        "expected_domain": "Healthcare & Biomedical",
    },

    # ── Category 3: Biomedical & Healthcare Imaging (11–15) ───────────────────
    {
        "id": 11,
        "category": "biomedical",
        "query": "Adult brain glioma tumor sub-region segmentation in multiparametric 3D MRI scans",
        "expected_domain": "Healthcare & Biomedical",
        "expected_modality": "MRI",
    },
    {
        "id": 12,
        "category": "biomedical",
        "query": "Pneumonia and cardiomegaly detection from frontal chest X-ray radiographs",
        "expected_domain": "Healthcare & Biomedical",
        "expected_modality": "X-Ray",
    },
    {
        "id": 13,
        "category": "biomedical",
        "query": "Diabetic retinopathy grading from retinal fundus eye photographs",
        "expected_domain": "Healthcare & Biomedical",
    },
    {
        "id": 14,
        "category": "biomedical",
        "query": "Whole abdominal multi-organ segmentation across 3D CT and MRI patient volumes",
        "expected_domain": "Healthcare & Biomedical",
        "expected_modality": "MRI",
    },
    {
        "id": 15,
        "category": "biomedical",
        "query": "Histopathology multi-organ nuclei segmentation under optical microscopy",
        "expected_domain": "Healthcare & Biomedical",
        "expected_modality": "Microscopy",
    },

    # ── Category 4: Multimodal Systems (16–20) ────────────────────────────────
    {
        "id": 16,
        "category": "multimodal",
        "query": "Predict Alzheimer's disease progression combining 3D brain MRI and tabular cognitive scores",
        "expected_modalities": ["MRI", "Tabular"],
        "expected_domain": "Healthcare & Biomedical",
    },
    {
        "id": 17,
        "category": "multimodal",
        "query": "Multimodal medical report generation from chest X-ray images and clinical text",
        "expected_modalities": ["X-Ray", "Text"],
    },
    {
        "id": 18,
        "category": "multimodal",
        "query": "Audio-visual speech enhancement aligning speech WAV audio and speaker facial video",
        "expected_modalities": ["Audio", "Image"],
    },
    {
        "id": 19,
        "category": "multimodal",
        "query": "Joint prediction from longitudinal MRI scans, clinical tables, and genetic APOE biomarkers",
        "expected_modalities": ["MRI", "Tabular"],
    },
    {
        "id": 20,
        "category": "multimodal",
        "query": "Cross-modal biomedical retrieval linking microscopy histology with patient clinical data",
        "expected_modalities": ["Microscopy", "Tabular"],
    },

    # ── Category 5: Compute & Hardware Constraints (21–25) ────────────────────
    {
        "id": 21,
        "category": "constrained",
        "query": "Tabular fraud detection model running on 2GB GPU",
        "expected_gpu": 2.0,
    },
    {
        "id": 22,
        "category": "constrained",
        "query": "Image classification model deployable on a lightweight 4GB GPU setup",
        "expected_gpu": 4.0,
    },
    {
        "id": 23,
        "category": "constrained",
        "query": "Biomedical image segmentation strictly constrained to 6GB GPU memory",
        "expected_gpu": 6.0,
    },
    {
        "id": 24,
        "category": "constrained",
        "query": "3D medical volume segmentation executing under a 12GB GPU VRAM limit",
        "expected_gpu": 12.0,
    },
    {
        "id": 25,
        "category": "constrained",
        "query": "Real-time edge detection with strict inference latency under 30ms",
        "expected_latency": 30.0,
    },

    # ── Category 6: Data Scarcity & Quality Constraints (26–30) ───────────────
    {
        "id": 26,
        "category": "data_constraints",
        "query": "Few-shot nuclei segmentation with only 80 labeled microscopy images available",
        "expected_constraint": "limited_labeled",
        "expected_sample_count": 80,
    },
    {
        "id": 27,
        "category": "data_constraints",
        "query": "Credit card fraud detection under severe class imbalance with rare positive cases",
        "expected_imbalance": True,
    },
    {
        "id": 28,
        "category": "data_constraints",
        "query": "Predicting disease conversion where cohort has only 500 patients and substantial missing data",
        "expected_sample_count": 500,
        "expected_missing": True,
    },
    {
        "id": 29,
        "category": "data_constraints",
        "query": "Semi-supervised medical image segmentation using limited labeled training data",
        "expected_constraint": "limited_labeled",
    },
    {
        "id": 30,
        "category": "data_constraints",
        "query": "Clinical longitudinal tracking with 1,200 patients and highly unbalanced outcomes",
        "expected_sample_count": 1200,
        "expected_imbalance": True,
    },

    # ── Category 7: Named Benchmarks & Method Specifics (31–35) ───────────────
    {
        "id": 31,
        "category": "named_entities",
        "query": "I want to train a classifier on the ISIC dataset for skin lesion analysis",
        "expected_named_dataset": "ISIC",
    },
    {
        "id": 32,
        "category": "named_entities",
        "query": "Evaluate cognitive progression on the ADNI neuroimaging benchmark",
        "expected_named_dataset": "ADNI",
    },
    {
        "id": 33,
        "category": "named_entities",
        "query": "Segment brain tumor sub-regions using the BraTS glioma dataset",
        "expected_named_dataset": "BraTS",
    },
    {
        "id": 34,
        "category": "named_entities",
        "query": "Fine-tune YOLOv8 for real-time edge instance segmentation",
        "expected_named_model": "YOLOv8",
    },
    {
        "id": 35,
        "category": "named_entities",
        "query": "Find latest 2024 research papers on Swin UNETR 3D segmentation",
        "expected_named_model": "Swin Transformer",
        "expected_latest": True,
        "expected_min_year": 2024,
    },

    # ── Category 8: Novel Problems & No-Match Fallbacks (36–40) ───────────────
    {
        "id": 36,
        "category": "no_match",
        "query": "I want a dataset containing exactly 50,000 labeled 7D microscopy quantum teleportation samples",
        "expected_no_match": True,
    },
    {
        "id": 37,
        "category": "no_match",
        "query": "Find benchmarks for anti-gravity warp drive propulsion physics telemetry signals",
        "expected_no_match": True,
    },
    {
        "id": 38,
        "category": "no_match",
        "query": "Segmentation dataset for synthetic alien extraterrestrial exobiology tissue cultures",
        "expected_no_match": True,
    },
    {
        "id": 39,
        "category": "contradictory",
        "query": "Train a massive 3D volumetric transformer with 1GB GPU VRAM constraint",
        "expected_gpu": 1.0,
    },
    {
        "id": 40,
        "category": "vague",
        "query": "Need help with AI smart data model optimization",
        "expected_domain": "General AI & Computer Vision",
    },
]


@pytest.mark.asyncio
async def test_all_40_benchmark_queries():
    """
    Executes the comprehensive 40-query benchmark suite across all 8 archetypes.
    Verifies zero hard-constraint violations, correct entity extraction, and no-match gating.
    """
    await init_db()
    pipeline = RecommendationPipelineService()

    hard_constraint_violations = 0
    total_evaluated = 0
    no_match_correct = 0
    no_match_total = 0

    async with AsyncSessionLocal() as session:
        for item in TEST_QUERIES_40:
            total_evaluated += 1
            query = item["query"]
            res = await pipeline.recommend(query, session)
            prof = res.problem_profile

            # 1. Zero hard-constraint violation check
            if item.get("expected_gpu") is not None:
                max_gpu = item["expected_gpu"]
                assert prof.compute_constraints.gpu_memory_gb == max_gpu
                for mdl in res.models:
                    if mdl.min_vram_gb is not None and mdl.min_vram_gb > max_gpu:
                        hard_constraint_violations += 1

            if item.get("expected_latency") is not None:
                assert prof.compute_constraints.latency_ms == item["expected_latency"]

            # 2. No-match correctness check
            if item.get("expected_no_match"):
                no_match_total += 1
                is_flagged = res.no_direct_match is True or res.datasets[0].match_level in ("PARTIAL", "WEAK", "NO_DIRECT_MATCH")
                if is_flagged:
                    no_match_correct += 1
                assert is_flagged, f"Query {item['id']} failed to flag NO_DIRECT_MATCH"

            # 3. Named entities check
            if item.get("expected_named_dataset"):
                assert item["expected_named_dataset"] in prof.named_entities.datasets

            if item.get("expected_named_model"):
                assert item["expected_named_model"] in prof.named_entities.models

            # 4. Data constraints check
            if item.get("expected_imbalance"):
                assert prof.data_constraints.class_imbalance is True

            if item.get("expected_sample_count"):
                assert prof.data_constraints.sample_count == item["expected_sample_count"]

            # 5. Modalities check
            if item.get("expected_modality"):
                assert item["expected_modality"] in prof.modalities

            if item.get("expected_modalities"):
                for m in item["expected_modalities"]:
                    assert m in prof.modalities

    # Absolute policy verification: 0.0% hard constraint violations
    assert hard_constraint_violations == 0, f"Hard constraint violations detected: {hard_constraint_violations}"
    if no_match_total > 0:
        assert no_match_correct == no_match_total
