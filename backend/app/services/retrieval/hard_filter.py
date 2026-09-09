from typing import List, Dict, Any, Tuple
from backend.app.schemas.problem_profile import ProblemProfile


class HardConstraintFilter:
    """
    Enforces non-negotiable hard constraints before ranking (Section 14 & Section 65).
    Zero tolerance for compute, modality, or temporal hard constraint violations.
    """

    def filter_datasets(
        self,
        candidates: List[Tuple[Dict[str, Any], float]],
        profile: ProblemProfile,
    ) -> Tuple[List[Tuple[Dict[str, Any], float]], List[Dict[str, Any]]]:
        passed: List[Tuple[Dict[str, Any], float]] = []
        rejected: List[Dict[str, Any]] = []

        req_modalities = [m.lower() for m in profile.modalities]

        for cand, score in candidates:
            c_mods = [m.lower() for m in cand.get("modalities", [])]

            # Hard domain mismatch check
            if profile.domains:
                c_domain = cand.get("domain", "")
                if c_domain and not any(rd.lower() in c_domain.lower() or c_domain.lower() in rd.lower() for rd in profile.domains):
                    cand["rejection_reason"] = f"Domain conflict: requested {profile.domains}, dataset domain is '{c_domain}'"
                    rejected.append(cand)
                    continue

            # Hard modality mismatch check
            if req_modalities and c_mods:
                if not any(rm in c_mods or any(cm in rm for cm in c_mods) for rm in req_modalities):
                    # Check if candidate mentions requested modality in text
                    desc = f"{cand.get('title', '')} {cand.get('name', '')} {cand.get('description', '')}".lower()
                    if not any(rm in desc for rm in req_modalities):
                        cand["rejection_reason"] = f"Modality conflict: requires {req_modalities}, dataset is {c_mods}"
                        rejected.append(cand)
                        continue

            passed.append((cand, score))

        return passed, rejected

    def filter_models(
        self,
        candidates: List[Tuple[Dict[str, Any], float]],
        profile: ProblemProfile,
    ) -> Tuple[List[Tuple[Dict[str, Any], float]], List[Dict[str, Any]]]:
        passed: List[Tuple[Dict[str, Any], float]] = []
        rejected: List[Dict[str, Any]] = []

        max_gpu_vram = profile.compute_constraints.gpu_memory_gb
        max_latency_ms = profile.compute_constraints.latency_ms

        for cand, score in candidates:
            # 1. Hard Compute Check: GPU VRAM Limit
            mem_info = cand.get("memory_requirement") or {}
            min_vram = cand.get("min_vram_gb") or mem_info.get("min_vram_gb")

            if max_gpu_vram is not None and min_vram is not None:
                if float(min_vram) > float(max_gpu_vram):
                    cand["rejection_reason"] = (
                        f"Compute violation: requires {min_vram}GB GPU, exceeding hard limit of {max_gpu_vram}GB"
                    )
                    rejected.append(cand)
                    continue

            # 2. Hard Latency Check
            inf_info = cand.get("inference_information") or {}
            cand_latency = cand.get("latency_ms") or inf_info.get("latency_ms")
            if max_latency_ms is not None and cand_latency is not None:
                if float(cand_latency) > float(max_latency_ms):
                    cand["rejection_reason"] = (
                        f"Latency violation: {cand_latency}ms exceeds hard limit of {max_latency_ms}ms"
                    )
                    rejected.append(cand)
                    continue

            passed.append((cand, score))

        return passed, rejected

    def filter_papers(
        self,
        candidates: List[Tuple[Dict[str, Any], float]],
        profile: ProblemProfile,
    ) -> Tuple[List[Tuple[Dict[str, Any], float]], List[Dict[str, Any]]]:
        passed: List[Tuple[Dict[str, Any], float]] = []
        rejected: List[Dict[str, Any]] = []

        min_year = profile.research_constraints.minimum_year

        for cand, score in candidates:
            cand_year = cand.get("year")
            # If user explicitly specified minimum publication year as a hard constraint
            if min_year is not None and cand_year is not None:
                if int(cand_year) < int(min_year):
                    # Flag as not passing primary hard year constraint (can be shown in foundational if requested)
                    cand["rejection_reason"] = f"Published in {cand_year}, before required minimum year {min_year}"
                    rejected.append(cand)
                    continue

            passed.append((cand, score))

        return passed, rejected
