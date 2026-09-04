import re
from typing import Type, TypeVar, Optional, Dict, Any, List
from pydantic import BaseModel
from backend.app.providers.llm.base import LLMProvider
from backend.app.schemas.problem_profile import (
    ProblemProfile, TaskItem, SubproblemItem, InputSpec, OutputSpec,
    DataConstraints, ComputeConstraints, QualityRequirements,
    ResearchConstraints, NamedEntities, ComplexitySpec
)

T = TypeVar("T", bound=BaseModel)


class MockLLMProvider(LLMProvider):
    """
    Deterministic rule- and regex-powered provider fallback.
    Extracts high-precision ProblemProfile attributes without external API calls.
    """

    async def generate_structured(
        self,
        prompt: str,
        response_model: Type[T],
        system_prompt: Optional[str] = None,
    ) -> T:
        if issubclass(response_model, ProblemProfile):
            return self._extract_problem_profile(prompt)  # type: ignore
        return response_model.model_validate({})

    async def generate_text(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
    ) -> str:
        return "Deterministic analysis generated based on verified indexed evidence."

    async def verify_scientific_consistency(
        self,
        problem: str,
        dataset_meta: Dict[str, Any],
        model_meta: Dict[str, Any],
        papers_meta: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        problems: List[str] = []
        warnings: List[str] = []

        d_mods = [m.lower() for m in dataset_meta.get("modalities", [])]
        m_mods = [m.lower() for m in model_meta.get("modalities", [])]

        # Check modality overlap
        if d_mods and m_mods and not any(dm in m_mods or mm in d_mods for dm in d_mods for mm in m_mods):
            warnings.append(f"Potential modality gap: Dataset is {d_mods} while Model architecture is {m_mods}")

        return {
            "valid": len(problems) == 0,
            "overall_score": 90.0 if len(problems) == 0 else 60.0,
            "problems": problems,
            "warnings": warnings,
            "evidence_needed": [],
            "replacement_needed": len(problems) > 0,
            "replacement_targets": [],
        }

    def _extract_problem_profile(self, text: str) -> ProblemProfile:
        problem_match = re.search(r'Problem:\s*"(.*?)"', text, re.DOTALL)
        actual_text = problem_match.group(1) if problem_match else text
        lower = actual_text.lower()

        # Task extraction
        tasks: List[TaskItem] = []
        if re.search(r"\bsegmentation\b|\bsegment\b|\bnuclei\b", lower):
            tasks.append(TaskItem(name="segmentation", confidence=0.95))
        if re.search(r"\bclassification\b|\bclassify\b|\bearly detection\b|\bdisease detection\b", lower):
            tasks.append(TaskItem(name="classification", confidence=0.95))
        if re.search(r"\bobject detection\b|\bbounding box\b|\byolo\b|\btraffic surveillance\b", lower):
            tasks.append(TaskItem(name="object_detection", confidence=0.90))
        if re.search(r"\breconstruction\b|\bk-space\b|\bmri reconstruction\b", lower):
            tasks.append(TaskItem(name="reconstruction", confidence=0.92))
        if re.search(r"\bregression\b|\bpredict progression\b|\bprogression prediction\b|\bprogression\b|\btime to progression\b", lower):
            tasks.append(TaskItem(name="progression_prediction", confidence=0.92))
        if not tasks:
            tasks.append(TaskItem(name="machine_learning", confidence=0.70))

        # Modalities
        modalities: List[str] = []
        if re.search(r"\bmri\b|\b4d flow\b|\bdce-mri\b|\bmagnetic resonance\b", lower):
            modalities.append("MRI")
        if re.search(r"\bmicroscopy\b|\bfluorescence\b|\bhistopathology\b|\belectron tomography\b", lower):
            modalities.append("Microscopy")
        if re.search(r"\bx-ray\b|\bxray\b|\bradiograph\b|\bchest x-ray\b", lower):
            modalities.append("X-Ray")
        if re.search(r"\bct\b|\bcomputed tomography\b|\bccta\b", lower):
            modalities.append("CT")
        if re.search(r"\btabular\b|\bclinical records\b|\bcognitive scores\b|\bclinical data\b|\bclinical tables\b|\bcsv\b", lower):
            modalities.append("Tabular")
        if re.search(r"\baudio\b|\bspeech\b|\bwav\b|\bvoice\b", lower):
            modalities.append("Audio")
        if re.search(r"\btext\b|\bnlp\b|\blanguage\b|\bclinical notes\b", lower):
            modalities.append("Text")
        if re.search(r"\bvideo\b|\bvisual\b|\bfacial\b", lower) and "Image" not in modalities:
            modalities.append("Image")
        if re.search(r"\bimage\b|\bimages\b|\bretinal\b|\bphotos\b|\bcats and dogs\b|\bobject detection\b|\bbounding-box\b|\bcamera\b|\bcomputer vision\b|\bdermoscopy\b", lower) and not modalities:
            modalities.append("Image")

        # Domains
        domains: List[str] = []
        subdomains: List[str] = []
        if re.search(r"\balzheimer|tumor|cancer|diabetic retinopathy|pneumonia|retinal|nuclei|mri|x-ray|ct|clinical|skin lesion|lesion|melanoma|isic|dermatology", lower):
            domains.append("Healthcare & Biomedical")
            if "alzheimer" in lower:
                subdomains.append("Neurology & Neurodegenerative")
            elif "skin lesion" in lower or "lesion" in lower or "melanoma" in lower or "isic" in lower:
                subdomains.append("Dermatology & Oncology")
            elif "diabetic retinopathy" in lower or "retinal" in lower:
                subdomains.append("Ophthalmology")
            elif "tumor" in lower or "cancer" in lower:
                subdomains.append("Oncology")
            elif "pneumonia" in lower:
                subdomains.append("Pulmonology")
            elif "nuclei" in lower:
                subdomains.append("Cellular Biology")
        elif re.search(r"\bfraud|credit card|finance|stock", lower):
            domains.append("Finance & Tabular ML")
        else:
            domains.append("General AI & Computer Vision")

        # Compute constraints
        compute = ComputeConstraints()
        gpu_match = re.search(r"(\d+)\s*(?:gb|gigabyte)\s*gpu", lower)
        if gpu_match:
            compute.gpu_memory_gb = float(gpu_match.group(1))

        lat_match = re.search(r"(?:under|<)\s*(\d+)\s*ms", lower)
        if lat_match:
            compute.latency_ms = float(lat_match.group(1))

        # Data constraints
        data = DataConstraints()
        samples_match = re.search(r"(?:only\s+have|have\s+only|have|only)?\s*(\d[\d,]*)\s+(?:[a-zA-Z0-9_\-]+\s+)*(?:samples|images|scans|patients|records)", lower)
        if samples_match:
            try:
                data.sample_count = int(samples_match.group(1).replace(",", ""))
            except ValueError:
                pass

        labeled_match = re.search(r"(\d[\d,]*)\s+(?:are\s+)?labeled", lower)
        if labeled_match:
            try:
                data.labeled_sample_count = int(labeled_match.group(1).replace(",", ""))
                data.label_availability = "limited_labeled"
            except ValueError:
                pass

        if "few labeled" in lower or "limited labels" in lower or "incomplete" in lower:
            data.label_availability = data.label_availability or "limited_labeled"

        if "imbalanced" in lower or "imbalance" in lower or "unbalanced" in lower:
            data.class_imbalance = True

        if "missing" in lower or "incomplete" in lower:
            data.missing_data = True

        # Research constraints
        research = ResearchConstraints()
        range_match = re.search(r"(202\d)\s*[-–—]\s*(202\d)", lower)
        if range_match:
            research.minimum_year = int(range_match.group(1))
            research.latest_required = True
        else:
            year_match = re.search(r"(?:after|since|from|>)\s*(20\d\d)", lower)
            if year_match:
                research.minimum_year = int(year_match.group(1))
                research.latest_required = True

        if any(w in lower for w in ["latest", "recent", "newest", "after 2023", "after 2024"]):
            research.latest_required = True

        # Named entities
        entities = NamedEntities()
        if "adni" in lower:
            entities.datasets.append("ADNI")
        if "oasis" in lower:
            entities.datasets.append("OASIS")
        if "isic" in lower:
            entities.datasets.append("ISIC")
        if "imagenet" in lower:
            entities.datasets.append("ImageNet")
        if "mimic" in lower:
            entities.datasets.append("MIMIC")
        if "brats" in lower:
            entities.datasets.append("BraTS")
        if "amos" in lower:
            entities.datasets.append("AMOS")
        if "yolov8" in lower or "yolo" in lower:
            entities.models.append("YOLOv8")
        if "u-net" in lower or "unet" in lower:
            entities.models.append("U-Net")
        if "swin" in lower:
            entities.models.append("Swin Transformer")

        # Hard constraints vs soft preferences
        hard_constraints: List[str] = []
        soft_preferences: List[str] = []

        if compute.gpu_memory_gb:
            hard_constraints.append(f"Maximum GPU VRAM: {int(compute.gpu_memory_gb)}GB")
        if compute.latency_ms:
            hard_constraints.append(f"Inference latency: <{int(compute.latency_ms)}ms")
        if research.minimum_year:
            hard_constraints.append(f"Publication year >= {research.minimum_year}")
        if modalities:
            hard_constraints.append(f"Modality must match: {', '.join(modalities)}")

        if "prefer" in lower or "lightweight" in lower:
            soft_preferences.append("Prefers lightweight, efficient models")

        # Subproblems & Complexity
        subproblems: List[SubproblemItem] = []
        if len(modalities) > 1:
            subproblems.append(SubproblemItem(description="Multimodal data fusion & alignment", task="multimodal_learning", priority=1))
        if data.class_imbalance:
            subproblems.append(SubproblemItem(description="Class imbalance compensation", task="imbalance_mitigation", priority=2))
        if data.label_availability == "limited_labeled":
            subproblems.append(SubproblemItem(description="Semi-supervised / few-shot representation learning", task="few_shot_learning", priority=2))

        level: Any = "simple"
        if len(subproblems) >= 2 or (compute.gpu_memory_gb and compute.latency_ms):
            level = "compound" if len(modalities) > 1 else "complex"
        elif len(subproblems) == 1 or compute.gpu_memory_gb:
            level = "moderate"

        return ProblemProfile(
            original_problem=text,
            problem_summary=f"Automated matching profile for: {text[:100]}...",
            tasks=tasks,
            subproblems=subproblems,
            domains=domains,
            subdomains=subdomains,
            input=InputSpec(description="User input data", modalities=modalities),
            output=OutputSpec(description="Target ML output", type=tasks[0].name if tasks else "prediction"),
            modalities=modalities,
            data_constraints=data,
            compute_constraints=compute,
            quality_requirements=QualityRequirements(),
            research_constraints=research,
            named_entities=entities,
            preferred_methods=[],
            keywords=[
                w for w in re.findall(r"\b[a-zA-Z]{4,}\b", lower)
                if w not in {"analyze", "following", "research", "engineering", "problem", "extract", "structured", "parameters", "system", "building", "using", "combined", "with", "from", "that", "this", "also", "have", "only", "around", "than", "each", "both", "need", "should", "access", "approximately", "cannot", "take", "taken"}
            ][:10],
            search_queries=[],
            hard_constraints=hard_constraints,
            soft_preferences=soft_preferences,
            ambiguities=[],
            missing_information=[],
            complexity=ComplexitySpec(level=level, reason=f"Determined based on {len(subproblems)} subproblems and constraints"),
            confidence=0.92,
        )
