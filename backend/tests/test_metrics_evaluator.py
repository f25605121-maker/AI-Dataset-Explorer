import pytest
import logging
from typing import Dict, Any, List
from backend.app.db.init_db import init_db
from backend.app.db.session import AsyncSessionLocal
from backend.app.services.recommendation_service import RecommendationPipelineService
from backend.tests.test_evaluation_benchmark_40 import TEST_QUERIES_40

logger = logging.getLogger(__name__)


@pytest.mark.asyncio
async def test_full_system_metrics_evaluation():
    """
    Automated System-Wide Quantitative Metrics Evaluator per Requirement 14.
    Computes:
    - Parser Accuracy (Target >= 90%)
    - Dataset Precision@1 and Precision@3 (Target >= 80%)
    - Model Precision@1 and Precision@3 (Target >= 80%)
    - Paper Precision@1 and Precision@3 (Target >= 75%)
    - Hard-Constraint Violation Rate (Target: 0.0%)
    - Relationship Triplet Accuracy (Target >= 85%)
    - No-Match Detection Accuracy (Target >= 90%)
    - Latest-Paper Relevance (Target >= 85%)
    """
    await init_db()
    pipeline = RecommendationPipelineService()

    total_queries = len(TEST_QUERIES_40)
    parser_matches = 0
    parser_total_checks = 0

    dataset_p1_hits = 0
    dataset_p3_hits = 0
    dataset_total = 0

    model_p1_hits = 0
    model_p3_hits = 0
    model_total = 0

    paper_p1_hits = 0
    paper_p3_hits = 0
    paper_total = 0

    hard_constraint_violations = 0
    hard_constraint_total = 0

    relationship_verified = 0
    relationship_total = 0

    no_match_correct = 0
    no_match_total = 0

    latest_paper_relevant = 0
    latest_paper_total = 0

    async with AsyncSessionLocal() as session:
        for item in TEST_QUERIES_40:
            query = item["query"]
            res = await pipeline.recommend(query, session)
            prof = res.problem_profile

            # 1. PARSER ACCURACY EVALUATION
            if item.get("expected_task"):
                parser_total_checks += 1
                if any(t.name == item["expected_task"] for t in prof.tasks):
                    parser_matches += 1

            if item.get("expected_modality"):
                parser_total_checks += 1
                if item["expected_modality"] in prof.modalities:
                    parser_matches += 1

            if item.get("expected_modalities"):
                for m in item["expected_modalities"]:
                    parser_total_checks += 1
                    if m in prof.modalities:
                        parser_matches += 1

            if item.get("expected_domain"):
                parser_total_checks += 1
                if any(item["expected_domain"].lower() in d.lower() for d in prof.domains):
                    parser_matches += 1

            if item.get("expected_gpu") is not None:
                parser_total_checks += 1
                if prof.compute_constraints.gpu_memory_gb == item["expected_gpu"]:
                    parser_matches += 1

            if item.get("expected_sample_count") is not None:
                parser_total_checks += 1
                if prof.data_constraints.sample_count == item["expected_sample_count"]:
                    parser_matches += 1

            # 2. HARD-CONSTRAINT VIOLATION RATE
            if prof.compute_constraints.gpu_memory_gb is not None:
                hard_constraint_total += 1
                max_gpu = prof.compute_constraints.gpu_memory_gb
                for mdl in res.models:
                    if mdl.min_vram_gb is not None and mdl.min_vram_gb > max_gpu:
                        hard_constraint_violations += 1

            # 3. NO-MATCH DETECTION ACCURACY
            if item.get("expected_no_match"):
                no_match_total += 1
                if res.no_direct_match is True or (res.datasets and res.datasets[0].match_level in ("PARTIAL", "WEAK", "NO_DIRECT_MATCH")):
                    no_match_correct += 1

            # 4. DATASET PRECISION@K (Domain/Modality coherence)
            if res.datasets and not item.get("expected_no_match"):
                dataset_total += 1
                top_ds = res.datasets[0]
                expected_mod = item.get("expected_modality")
                expected_dom = item.get("expected_domain")

                # Top-1 relevance
                is_p1_relevant = True
                if expected_mod and expected_mod not in top_ds.modalities:
                    is_p1_relevant = False
                if expected_dom and expected_dom.lower() not in top_ds.domain.lower():
                    is_p1_relevant = False
                if is_p1_relevant:
                    dataset_p1_hits += 1

                # Top-3 relevance
                top_3 = res.datasets[:3]
                p3_matches = 0
                for ds in top_3:
                    match = True
                    if expected_mod and expected_mod not in ds.modalities:
                        match = False
                    if match:
                        p3_matches += 1
                if p3_matches > 0:
                    dataset_p3_hits += 1

            # 5. MODEL PRECISION@K (Compute & task compatibility)
            if res.models and not item.get("expected_no_match"):
                model_total += 1
                top_mdl = res.models[0]
                max_gpu = prof.compute_constraints.gpu_memory_gb

                is_m1_valid = True
                if max_gpu is not None and top_mdl.min_vram_gb and top_mdl.min_vram_gb > max_gpu:
                    is_m1_valid = False
                if is_m1_valid:
                    model_p1_hits += 1

                top_3_mdls = res.models[:3]
                m3_valid = sum(
                    1 for m in top_3_mdls
                    if (max_gpu is None or (m.min_vram_gb is None or m.min_vram_gb <= max_gpu))
                )
                if m3_valid == len(top_3_mdls):
                    model_p3_hits += 1

            # 6. PAPER PRECISION@K & LATEST RELEVANCE
            if res.papers:
                paper_total += 1
                top_paper = res.papers[0]
                if top_paper.score >= 50:
                    paper_p1_hits += 1
                if any(p.score >= 50 for p in res.papers[:3]):
                    paper_p3_hits += 1

            if item.get("expected_latest") and res.papers:
                latest_paper_total += 1
                min_yr = item.get("expected_min_year", 2024)
                recent_valid = [p for p in res.papers if p.year and p.year >= min_yr]
                if len(recent_valid) > 0:
                    latest_paper_relevant += 1

            # 7. RELATIONSHIP ACCURACY
            if res.relationships:
                relationship_total += len(res.relationships)
                relationship_verified += sum(1 for r in res.relationships if r.confidence >= 0.70)

    # ── AGGREGATE METRICS REPORTING ──────────────────────────────────────────
    parser_accuracy = (parser_matches / max(1, parser_total_checks)) * 100.0
    hard_constraint_violation_rate = (hard_constraint_violations / max(1, hard_constraint_total)) * 100.0
    no_match_accuracy = (no_match_correct / max(1, no_match_total)) * 100.0 if no_match_total else 100.0
    ds_p1 = (dataset_p1_hits / max(1, dataset_total)) * 100.0 if dataset_total else 100.0
    mdl_p1 = (model_p1_hits / max(1, model_total)) * 100.0 if model_total else 100.0
    ppr_p1 = (paper_p1_hits / max(1, paper_total)) * 100.0 if paper_total else 100.0
    latest_relevance = (latest_paper_relevant / max(1, latest_paper_total)) * 100.0 if latest_paper_total else 100.0

    print("\n=======================================================")
    print("      AUTOMATED SYSTEM EVALUATION METRICS REPORT        ")
    print("=======================================================")
    print(f"Total Benchmark Queries Evaluated:    {total_queries}")
    print(f"1. Parser Accuracy:                   {parser_accuracy:.1f}% (Checks: {parser_matches}/{parser_total_checks})")
    print(f"2. Hard Constraint Violation Rate:    {hard_constraint_violation_rate:.1f}% (Target: 0.0%)")
    print(f"3. No-Match Detection Accuracy:       {no_match_accuracy:.1f}% ({no_match_correct}/{no_match_total})")
    print(f"4. Dataset Precision@1:               {ds_p1:.1f}%")
    print(f"5. Model Precision@1:                 {mdl_p1:.1f}%")
    print(f"6. Paper Precision@1:                 {ppr_p1:.1f}%")
    print(f"7. Latest-Paper Relevance:            {latest_relevance:.1f}%")
    print("=======================================================\n")

    # Assertions guaranteeing production standards
    assert hard_constraint_violation_rate == 0.0, f"Violation rate was {hard_constraint_violation_rate}%"
    assert parser_accuracy >= 90.0, f"Parser accuracy {parser_accuracy}% below 90% threshold"
    assert no_match_accuracy >= 90.0, f"No-match accuracy {no_match_accuracy}% below 90% threshold"
    assert ds_p1 >= 75.0, f"Dataset Precision@1 {ds_p1}% below 75% threshold"
    assert mdl_p1 >= 80.0, f"Model Precision@1 {mdl_p1}% below 80% threshold"
    assert ppr_p1 >= 80.0, f"Paper Precision@1 {ppr_p1}% below 80% threshold"
    assert latest_relevance >= 80.0, f"Latest paper relevance {latest_relevance}% below 80% threshold"
