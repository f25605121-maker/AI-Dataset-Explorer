import re
from typing import Dict, Any
from backend.app.schemas.problem_profile import ProblemProfile, TaskItem
from backend.app.providers.llm.factory import get_llm_provider
from backend.app.core.security import sanitize_search_query, scan_prompt_injection


class ProblemUnderstandingEngine:
    """
    Transforms natural language research problems into structured ProblemProfile.
    Combines LLM structured extraction, deterministic rule overlays, and constraint extraction (Section 6, 7).
    """

    def __init__(self):
        self.llm = get_llm_provider()

    async def analyze_problem(self, raw_query: str) -> ProblemProfile:
        cleaned_query = sanitize_search_query(raw_query)

        # Check prompt injection
        safe, reason = scan_prompt_injection(cleaned_query)
        if not safe:
            profile = await self.llm.generate_structured(cleaned_query, ProblemProfile)
            profile.warnings = [reason]
            return profile

        # Extract structured profile via LLM or deterministic engine
        prompt = (
            f"You are a Principal AI/ML Research Architect and Problem Decomposition Engine.\n"
            f"Analyze the following AI/ML research or engineering problem and extract all structured parameters conforming to ProblemProfile:\n\n"
            f"Problem: \"{cleaned_query}\"\n\n"
            f"Extraction Requirements:\n"
            f"1. tasks: List of primary ML tasks with confidence (e.g. classification, 3d_segmentation, progression_prediction, object_detection).\n"
            f"2. subproblems: Granular technical subproblems (e.g., multimodal data fusion, missing modality imputation, class imbalance mitigation).\n"
            f"3. domains & subdomains: Top-level domain (Healthcare & Biomedical, Finance, Computer Vision) and fine-grained subdomains (Neurology, Oncology, etc.).\n"
            f"4. input & output: Expected input modalities (MRI, Tabular, CT, Text, Audio) and output target type.\n"
            f"5. data_constraints: Sample counts, labeled sample counts, class imbalance (bool), missing data (bool).\n"
            f"6. compute_constraints: GPU VRAM ceiling (GB), inference latency ceiling (ms).\n"
            f"7. research_constraints: Minimum publication year, peer review requirement, latest required (bool).\n"
            f"8. hard_constraints: STRICT, non-negotiable physical/compute/modality limits (e.g. 'Maximum GPU VRAM: 16GB', 'Modality must match: MRI, Tabular').\n"
            f"9. soft_preferences: Desirable but non-disqualifying preferences (e.g. 'Prefers lightweight model', 'Prefers PyTorch').\n"
            f"10. named_entities: Datasets, models, frameworks, and metrics mentioned.\n"
            f"11. complexity: Level (simple, moderate, complex, compound) and clear rationale."
        )

        profile = await self.llm.generate_structured(prompt, ProblemProfile)
        profile.original_problem = cleaned_query

        # Deterministic refinement overlay
        self._refine_constraints(cleaned_query, profile)

        return profile

    def _refine_constraints(self, text: str, profile: ProblemProfile) -> None:
        lower = text.lower()

        # Preserve explicit scientific requirements when structured extraction is uncertain.
        if re.search(r"\b(?:crop|plant|leaf|leaves|agriculture|farming|plant pathology)\b", lower):
            if not any("agriculture" in domain.lower() or "plant" in domain.lower() for domain in profile.domains):
                profile.domains.insert(0, "Agriculture & Plant Pathology")
            if not any("plant" in subdomain.lower() or "crop" in subdomain.lower() for subdomain in profile.subdomains):
                profile.subdomains.insert(0, "Crop Disease Detection")
            if not any("image" in modality.lower() or "photo" in modality.lower() for modality in profile.modalities):
                profile.modalities.insert(0, "Image")
            if not any("classification" in task.name.lower() for task in profile.tasks):
                profile.tasks.insert(0, TaskItem(name="image classification", confidence=1.0))
            profile.input.description = profile.input.description or "Plant leaf photographs"
            if "Image" not in profile.input.modalities:
                profile.input.modalities.insert(0, "Image")
            profile.output.description = profile.output.description or "Healthy versus specific plant disease labels"
            profile.output.type = profile.output.type or "multi-class classification"
            for keyword in ("plant leaf", "crop disease", "healthy", "diseased"):
                if keyword not in [item.lower() for item in profile.keywords]:
                    profile.keywords.append(keyword)
            profile.search_queries = [
                "plant disease leaf image classification",
                "crop disease leaf dataset",
                "healthy diseased plant leaves",
                "plant pathology image dataset",
            ]

        # Hard compute constraints: GPU VRAM
        gpu_match = re.search(r"(\d+)\s*(?:gb|gigabyte)\s*gpu", lower)
        if gpu_match:
            profile.compute_constraints.gpu_memory_gb = float(gpu_match.group(1))
            hard_vram = f"Maximum GPU VRAM: {int(profile.compute_constraints.gpu_memory_gb)}GB"
            if hard_vram not in profile.hard_constraints:
                profile.hard_constraints.append(hard_vram)

        # Hard compute constraints: Latency
        lat_match = re.search(r"(?:under|<)\s*(\d+)\s*ms", lower)
        if lat_match:
            profile.compute_constraints.latency_ms = float(lat_match.group(1))
            hard_lat = f"Inference latency: <{int(profile.compute_constraints.latency_ms)}ms"
            if hard_lat not in profile.hard_constraints:
                profile.hard_constraints.append(hard_lat)

        # Hard data constraints
        sample_match = re.search(r"(?:only\s+have|have\s+only|have|only)?\s*(\d[\d,]*)\s+(?:[a-zA-Z0-9_\-]+\s+)*(?:samples|images|scans|patients|records)", lower)
        if sample_match:
            try:
                profile.data_constraints.sample_count = int(sample_match.group(1).replace(",", ""))
            except ValueError:
                pass

        labeled_match = re.search(r"(\d[\d,]*)\s+(?:are\s+)?labeled", lower)
        if labeled_match:
            try:
                profile.data_constraints.labeled_sample_count = int(labeled_match.group(1).replace(",", ""))
                profile.data_constraints.label_availability = "limited_labeled"
            except ValueError:
                pass

        if "few labeled" in lower or "limited labels" in lower or "incomplete" in lower:
            profile.data_constraints.label_availability = profile.data_constraints.label_availability or "limited_labeled"

        if "imbalanced" in lower or "imbalance" in lower or "unbalanced" in lower:
            profile.data_constraints.class_imbalance = True

        if "missing" in lower or "incomplete" in lower:
            profile.data_constraints.missing_data = True

        # Domain-specific requirements are first-class ranking dimensions.
        profile.longitudinal = any(
            term in lower for term in ("longitudinal", "over time", "follow-up", "trajectory", "progression")
        )
        population_terms = [
            "older adults", "elderly", "pediatric", "children", "adult", "patients", "healthy controls",
            "mci", "mild cognitive impairment", "women", "men",
        ]
        profile.population = [term for term in population_terms if term in lower]

        # Research temporal constraints
        range_match = re.search(r"(202\d)\s*[-–—]\s*(202\d)", lower)
        if range_match:
            profile.research_constraints.minimum_year = int(range_match.group(1))
            profile.research_constraints.latest_required = True
        else:
            year_match = re.search(r"(?:after|since|from|>)\s*(20\d\d)", lower)
            if year_match:
                profile.research_constraints.minimum_year = int(year_match.group(1))
                profile.research_constraints.latest_required = True

        if profile.research_constraints.minimum_year:
            hard_yr = f"Publication year >= {profile.research_constraints.minimum_year}"
            if hard_yr not in profile.hard_constraints:
                profile.hard_constraints.append(hard_yr)

        if any(w in lower for w in ["latest", "recent", "newest", "recent research"]):
            profile.research_constraints.latest_required = True

        # Named entities
        if "adni" in lower and "ADNI" not in profile.named_entities.datasets:
            profile.named_entities.datasets.append("ADNI")
        if "oasis" in lower and "OASIS" not in profile.named_entities.datasets:
            profile.named_entities.datasets.append("OASIS")
        if "isic" in lower and "ISIC" not in profile.named_entities.datasets:
            profile.named_entities.datasets.append("ISIC")
        if "brats" in lower and "BraTS" not in profile.named_entities.datasets:
            profile.named_entities.datasets.append("BraTS")
        if "amos" in lower and "AMOS" not in profile.named_entities.datasets:
            profile.named_entities.datasets.append("AMOS")
        if "yolov8" in lower and "YOLOv8" not in profile.named_entities.models:
            profile.named_entities.models.append("YOLOv8")
        if ("u-net" in lower or "unet" in lower) and "U-Net" not in profile.named_entities.models:
            profile.named_entities.models.append("U-Net")

        # Soft preferences
        if ("prefer" in lower or "lightweight" in lower) and "Prefers lightweight model" not in profile.soft_preferences:
            profile.soft_preferences.append("Prefers lightweight model")
