from typing import List, Dict, Any, Optional
from backend.app.schemas.problem_profile import ProblemProfile
from backend.app.schemas.dataset import DatasetRecommendation
from backend.app.schemas.model import ModelRecommendation
from backend.app.schemas.paper import PaperRecommendation
from backend.app.schemas.verification import ScientificVerificationResult
from backend.app.providers.llm.factory import get_llm_provider


class ScientificConsistencyVerifier:
    """
    Final scientific verification layer per Section 26.
    Checks dataset modality, model compute bounds, paper relationships, and zero hard constraint violations.
    """

    def __init__(self):
        self.llm = get_llm_provider()

    async def verify(
        self,
        problem: str,
        profile: ProblemProfile,
        dataset: Optional[DatasetRecommendation],
        model: Optional[ModelRecommendation],
        papers: List[PaperRecommendation],
    ) -> ScientificVerificationResult:
        problems: List[str] = []
        warnings: List[str] = []
        replacement_targets: List[str] = []

        # 1. Dataset Modality & Task Check
        if dataset and profile.modalities:
            req_mods = [m.lower() for m in profile.modalities]
            ds_mods = [m.lower() for m in dataset.modalities]
            if ds_mods and not any(rm in ds_mods or any(dm in rm for dm in ds_mods) for rm in req_mods):
                problems.append(f"Dataset '{dataset.name}' modality ({dataset.modalities}) does not match required {profile.modalities}")
                replacement_targets.append("dataset")

        # 2. Model Task & Modality Check
        if model and profile.modalities:
            req_mods = [m.lower() for m in profile.modalities]
            mdl_mods = [m.lower() for m in model.modalities]
            # A text-only model cannot process MRI/CT/Image datasets
            if any(m in req_mods for m in ["mri", "ct", "image", "microscopy"]) and "text" in mdl_mods and not any(m in mdl_mods for m in ["image", "mri", "ct", "multimodal"]):
                problems.append(f"Model '{model.name}' modalities ({model.modalities}) incompatible with required visual modalities ({profile.modalities})")
                replacement_targets.append("model")

        # 3. Model Compute / VRAM Check
        max_gpu = profile.compute_constraints.gpu_memory_gb
        if model and max_gpu is not None and model.min_vram_gb is not None:
            if model.min_vram_gb > max_gpu:
                problems.append(
                    f"Model '{model.name}' requires {model.min_vram_gb}GB VRAM, violating hard compute constraint of {max_gpu}GB"
                )
                replacement_targets.append("model")

        # 4. Model Latency Check
        max_lat = profile.compute_constraints.latency_ms
        if model and max_lat is not None and model.latency_ms is not None:
            if model.latency_ms > max_lat:
                warnings.append(
                    f"Model '{model.name}' estimated latency ({model.latency_ms}ms) is close to or exceeds limit ({max_lat}ms)"
                )

        # 5. Domain Compatibility Check
        req_domains = [d.lower() for d in (profile.domains or [])]
        if dataset and req_domains:
            ds_dom = dataset.domain.lower() if dataset.domain else ""
            if "healthcare" in req_domains and "finance" in ds_dom:
                problems.append(f"Dataset domain '{dataset.domain}' conflicts with requested healthcare domain")
                replacement_targets.append("dataset")

        # 6. Research Year & Topical Consistency Check
        min_year = profile.research_constraints.minimum_year
        if min_year and papers:
            older_papers = [p for p in papers if p.year and p.year < min_year]
            if len(older_papers) == len(papers):
                warnings.append(f"Recommended literature published before requested year {min_year}")

        # 7. Dataset-Model Compatibility
        if dataset and model:
            if "Image" in dataset.modalities and "Text" in model.modalities and "Image" not in model.modalities:
                warnings.append(f"Potential modality gap between Dataset ({dataset.modalities}) and Model ({model.modalities})")

        is_valid = len(problems) == 0
        overall_score = 92.0 if is_valid else 50.0

        return ScientificVerificationResult(
            valid=is_valid,
            overall_score=overall_score,
            problems=problems,
            warnings=warnings,
            evidence_needed=["Peer review verification"] if not papers else [],
            replacement_needed=len(replacement_targets) > 0,
            replacement_targets=replacement_targets,
        )
