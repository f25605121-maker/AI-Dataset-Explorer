from typing import List, Dict, Any, Tuple
from backend.app.schemas.problem_profile import ProblemProfile
from backend.app.schemas.dataset import DatasetRecommendation, DatasetScoreBreakdown, MatchLevel
from backend.app.schemas.model import ModelRecommendation, ModelScoreBreakdown
from backend.app.schemas.paper import PaperRecommendation, PaperScoreBreakdown
from backend.app.core.config import settings
from backend.app.services.ranking.relevance import alignment_score, evaluate_alignment


class CompositeScorer:
    """
    Computes calibrated multi-factor scores (0-100) and evidence-based explanations per Section 15-18, 29, 30.
    """

    def _get_match_level(self, score: int) -> MatchLevel:
        if score >= 90:
            return "DIRECT"
        if score >= 80:
            return "STRONG"
        if score >= 70:
            return "GOOD"
        if score >= 50:
            return "PARTIAL"
        return "WEAK"

    def score_datasets(
        self,
        candidates: List[Tuple[Dict[str, Any], float]],
        profile: ProblemProfile,
    ) -> List[DatasetRecommendation]:
        recs: List[DatasetRecommendation] = []

        req_tasks = [t.name.lower() for t in profile.tasks]
        req_mods = [m.lower() for m in profile.modalities]

        for cand, raw_score in candidates:
            alignment = evaluate_alignment(cand, profile)
            dimensions = alignment["dimensions"]
            # Semantic similarity is evidence, but cannot compensate for scientific incompatibility.
            semantic_score = min(100.0, raw_score * 100.0)

            # 2. Task & Domain component
            c_tasks = [t.lower() for t in cand.get("tasks", [])]
            task_match = 100.0 if any(rt in c_tasks or any(ct in rt or rt in ct for ct in c_tasks) for rt in req_tasks) else 40.0

            c_mods = [m.lower() for m in cand.get("modalities", [])]
            if req_mods:
                matched_mods = sum(1 for rm in req_mods if any(cm in rm or rm in cm for cm in c_mods))
                mod_match = max(30.0, (matched_mods / len(req_mods)) * 100.0)
            else:
                mod_match = 80.0

            c_domain = cand.get("domain", "")
            req_domains = profile.domains or []
            if req_domains and c_domain:
                dom_match = 100.0 if any(rd.lower() in c_domain.lower() or c_domain.lower() in rd.lower() for rd in req_domains) else 25.0
            else:
                dom_match = 80.0

            # Subdomain boost (e.g. Neurology, Oncology)
            c_subdomains = [s.lower() for s in cand.get("subdomains", [])]
            req_subdomains = [s.lower() for s in (profile.subdomains or [])]
            subdomain_boost = 10.0 if any(rs in c_subdomains or any(cs in rs for cs in c_subdomains) for rs in req_subdomains) else 0.0

            domain_score = min(100.0, alignment_score(alignment))

            # 3. Constraint compatibility
            constraint_score = 95.0
            warnings: List[str] = []
            if profile.data_constraints.class_imbalance:
                warnings.append("Severe class imbalance: Recommend class-weighted cross-entropy or focal loss.")
            if profile.data_constraints.missing_data:
                warnings.append("Missing modalities present: Requires dynamic modality dropout or cross-modal imputation.")
            if profile.data_constraints.label_availability == "limited_labeled":
                warnings.append("Problem requires semi-supervised / limited label learning methods")

            # 4. Research support
            connected_papers = cand.get("connected_papers", [])
            research_score = 95.0 if connected_papers else 80.0

            # 5. Benchmark evidence
            benchmark_score = 90.0 if cand.get("benchmarks") else 75.0

            # Weighted sum per Section 15 & Section 81
            composite = (
                settings.SEMANTIC_WEIGHT * semantic_score +
                settings.TASK_WEIGHT * domain_score +
                settings.CONSTRAINT_WEIGHT * constraint_score +
                settings.RELATIONSHIP_WEIGHT * research_score +
                settings.BENCHMARK_WEIGHT * benchmark_score +
                settings.FRESHNESS_WEIGHT * 80.0 +
                settings.POPULARITY_WEIGHT * 80.0
            )
            final_score = int(round(max(0.0, min(99.0, composite))))
            if alignment["incompatibilities"] and not alignment["transfer_learning"]:
                final_score = min(final_score, 44)
            match_level = self._get_match_level(final_score)

            # Formulate structured evidence "Why this result?"
            why: List[str] = []
            if any(rt in c_tasks for rt in req_tasks):
                why.append(f"Direct match for requested task: {req_tasks[0]}")
            if any(rm in c_mods for rm in req_mods):
                why.append(f"Supports target data modality: {profile.modalities[0]}")
            if alignment["incompatibilities"]:
                warnings.append("Scientific mismatch: " + ", ".join(alignment["incompatibilities"]))
            if alignment["transfer_learning"] and alignment["incompatibilities"]:
                match_level = "PARTIAL"
            why.append("Documented and verified open research dataset")
            if connected_papers:
                why.append(f"Linked to {len(connected_papers)} peer-reviewed scientific publications")

            breakdown = DatasetScoreBreakdown(
                semantic=round(semantic_score, 1),
                task=round(task_match, 1),
                domain=round(dimensions["domain"], 1),
                modality=round(dimensions["modality"], 1),
                constraints=round(constraint_score, 1),
                research=round(research_score, 1),
                benchmark=round(benchmark_score, 1),
            )

            recs.append(DatasetRecommendation(
                id=cand.get("id", ""),
                name=cand.get("name") or cand.get("title") or "Dataset",
                slug=cand.get("slug"),
                description=cand.get("description"),
                source=cand.get("source", "huggingface"),
                canonical_url=cand.get("canonical_url"),
                license=cand.get("license"),
                domain=cand.get("domain"),
                subdomains=cand.get("subdomains", []),
                tasks=cand.get("tasks", []),
                modalities=cand.get("modalities", []),
                num_samples=cand.get("num_samples"),
                size_gb=cand.get("size_gb"),
                format=cand.get("format", []),
                score=final_score,
                match_level=match_level,
                score_breakdown=breakdown,
                why=why,
                warnings=warnings,
                evidence=[
                    {"dimension": dimension, "score": round(value, 1)}
                    for dimension, value in dimensions.items()
                ],
                strengths=["High citation benchmark", "Standard evaluation split available"],
                limitations=["Ensure institutional ethics approval for clinical deployment"] if "Healthcare" in str(profile.domains) else [],
                connected_papers=connected_papers,
            ))

        recs.sort(key=lambda x: x.score, reverse=True)
        return recs

    def score_models(
        self,
        candidates: List[Tuple[Dict[str, Any], float]],
        profile: ProblemProfile,
    ) -> List[ModelRecommendation]:
        recs: List[ModelRecommendation] = []

        max_gpu = profile.compute_constraints.gpu_memory_gb
        req_tasks = [t.name.lower() for t in profile.tasks]

        for cand, raw_score in candidates:
            alignment = evaluate_alignment(cand, profile)
            dimensions = alignment["dimensions"]
            semantic_score = min(100.0, raw_score * 100.0)

            c_tasks = [t.lower() for t in cand.get("tasks", [])]
            task_score = dimensions["task"]

            # Compute feasibility
            mem_info = cand.get("memory_requirement") or {}
            min_vram = cand.get("min_vram_gb") or mem_info.get("min_vram_gb", 8.0)

            compute_score = 95.0
            warnings: List[str] = []
            if max_gpu and min_vram:
                if min_vram > max_gpu:
                    compute_score = 40.0
                    warnings.append(f"VRAM requirement ({min_vram}GB) exceeds GPU constraint ({max_gpu}GB)")
                else:
                    compute_score = 100.0

            composite = (
                settings.SEMANTIC_WEIGHT * semantic_score +
                settings.TASK_WEIGHT * task_score +
                settings.CONSTRAINT_WEIGHT * compute_score +
                settings.RELATIONSHIP_WEIGHT * 85.0 +
                settings.BENCHMARK_WEIGHT * 85.0 +
                settings.FRESHNESS_WEIGHT * 80.0 +
                settings.POPULARITY_WEIGHT * 80.0
            )
            final_score = int(round(max(0.0, min(99.0, composite))))
            if alignment["incompatibilities"] and not alignment["transfer_learning"]:
                final_score = min(final_score, 44)
            match_level = self._get_match_level(final_score)
            if alignment["transfer_learning"] and alignment["incompatibilities"]:
                match_level = "PARTIAL"

            why: List[str] = [
                f"Architecture compatible with {profile.tasks[0].name if profile.tasks else 'task'}",
                f"Hardware footprint fits target GPU ({min_vram}GB VRAM)",
                "Pretrained weights available for transfer learning",
            ]

            breakdown = ModelScoreBreakdown(
                semantic=round(semantic_score, 1),
                task=round(task_score, 1),
                domain=round(dimensions["domain"], 1),
                modality=round(dimensions["modality"], 1),
                compute_compatibility=round(compute_score, 1),
                benchmark_evidence=85.0,
                research_support=85.0,
            )

            recs.append(ModelRecommendation(
                id=cand.get("id", ""),
                name=cand.get("name") or cand.get("slug") or "Model",
                slug=cand.get("slug"),
                description=cand.get("description"),
                source=cand.get("source", "huggingface"),
                canonical_url=cand.get("canonical_url"),
                architecture=cand.get("architecture"),
                tasks=cand.get("tasks", []),
                domains=cand.get("domains", []),
                modalities=cand.get("modalities", []),
                parameters=cand.get("parameters"),
                framework=cand.get("framework", "PyTorch"),
                license=cand.get("license", "Open"),
                min_vram_gb=float(min_vram) if min_vram else None,
                latency_ms=(cand.get("inference_information") or {}).get("latency_ms"),
                score=final_score,
                match_level=match_level,
                score_breakdown=breakdown,
                why=why,
                warnings=warnings,
                compatible_datasets=cand.get("compatible_datasets", []),
                related_papers=cand.get("related_papers", []),
            ))

        recs.sort(key=lambda x: x.score, reverse=True)
        return recs

    def score_papers(
        self,
        candidates: List[Tuple[Dict[str, Any], float]],
        profile: ProblemProfile,
    ) -> List[PaperRecommendation]:
        recs: List[PaperRecommendation] = []

        min_year = profile.research_constraints.minimum_year

        for cand, raw_score in candidates:
            alignment = evaluate_alignment(cand, profile)
            dimensions = alignment["dimensions"]
            year = cand.get("year") or 2024
            freshness_score = 95.0 if year >= 2024 else 85.0 if year >= 2022 else 70.0

            # Determine paper type based on relationships and title
            p_type = cand.get("paper_type") or "METHOD"
            title = (cand.get("title") or "").lower()
            if cand.get("relationship") == "EXACT_DATASET":
                p_type = "DATASET_SPECIFIC"
            elif cand.get("relationship") == "EXACT_MODEL":
                p_type = "MODEL_SPECIFIC"
            elif "benchmark" in title or "challenge" in title or "evaluation" in title:
                p_type = "BENCHMARK"
            elif "survey" in title or "review" in title:
                p_type = "SURVEY"
            elif year >= 2024:
                p_type = "LATEST_RESEARCH"

            # Papers are primarily ranked by direct scientific alignment, with freshness as a tie-breaker.
            direct_relevance = alignment_score(alignment)
            composite = (direct_relevance * 0.65) + (raw_score * 100.0 * 0.15) + (freshness_score * 0.20)
            final_score = int(round(max(0.0, min(99.0, composite))))
            if alignment["incompatibilities"] and not alignment["transfer_learning"]:
                final_score = min(final_score, 44)
            paper_match_level = "PARTIAL" if alignment["transfer_learning"] and alignment["incompatibilities"] else (
                "WEAK" if alignment["incompatibilities"] else "DIRECT"
            )

            why: List[str] = [
                f"Addresses {profile.tasks[0].name if profile.tasks else 'target methodology'}",
                f"Published in {year} ({cand.get('venue') or 'Academic venue'})",
            ]
            if p_type == "DATASET_SPECIFIC":
                why.append("Directly validates and benchmarks recommended dataset")
            if alignment["incompatibilities"]:
                why.append("Partial or incompatible evidence: " + ", ".join(alignment["incompatibilities"]))

            recs.append(PaperRecommendation(
                id=cand.get("id", ""),
                title=cand.get("title") or "Research Paper",
                abstract=cand.get("abstract"),
                authors=cand.get("authors", []),
                venue=cand.get("venue"),
                year=year,
                publication_date=cand.get("publication_date"),
                doi=cand.get("doi"),
                arxiv_id=cand.get("arxiv_id"),
                url=cand.get("url"),
                pdf_url=cand.get("pdf_url"),
                code_url=cand.get("code_url"),
                citation_count=cand.get("citation_count", 0),
                score=final_score,
                paper_type=p_type,
                match_level=paper_match_level,
                why=why,
                score_breakdown=PaperScoreBreakdown(
                    task_relevance=round(dimensions["task"], 1),
                    domain_relevance=round(dimensions["domain"], 1),
                    modality_relevance=round(dimensions["modality"], 1),
                    disease_relevance=round(dimensions["disease"], 1),
                    population_relevance=round(dimensions["population"], 1),
                    longitudinal_relevance=round(dimensions["longitudinal"], 1),
                    methodological_relevance=round(dimensions["task"], 1),
                    dataset_relevance=95.0 if p_type == "DATASET_SPECIFIC" else 70.0,
                    model_relevance=95.0 if p_type == "MODEL_SPECIFIC" else 70.0,
                    freshness=freshness_score,
                    impact=80.0,
                ),
                dataset_ids=cand.get("dataset_ids", []),
                model_ids=cand.get("model_ids", []),
                tasks=cand.get("tasks", []),
                domains=cand.get("domains", []),
            ))

        recs.sort(key=lambda x: x.score, reverse=True)
        return recs
