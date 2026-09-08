import re
from typing import Any, Dict, List

from backend.app.schemas.problem_profile import ProblemProfile


_MODALITY_ALIASES = {
    "mri": {"mri", "magnetic resonance", "fmri", "dce-mri"},
    "ct": {"ct", "computed tomography", "cta"},
    "x-ray": {"x-ray", "xray", "radiograph", "radiography"},
    "microscopy": {"microscopy", "fluorescence", "histopathology", "pathology"},
    "tabular": {"tabular", "clinical records", "clinical data", "cognitive scores"},
    "text": {"text", "clinical notes", "nlp", "language"},
    "image": {"image", "images", "imaging", "visual"},
}

_DISEASE_TERMS = {
    "alzheimer": {"alzheimer", "alzheimers", "dementia", "mci"},
    "glioma": {"glioma", "brain tumor", "brain tumour"},
    "melanoma": {"melanoma", "skin lesion", "dermoscopy"},
    "pneumonia": {"pneumonia", "chest infection"},
    "retinopathy": {"retinopathy", "retinal"},
    "nuclei": {"nuclei", "nucleus", "cell"},
}

_TRANSFER_TERMS = ("transfer learning", "transfer", "foundation model", "pretrained", "pre-trained", "adaptable")


def _text(candidate: Dict[str, Any]) -> str:
    fields = [
        candidate.get("name"), candidate.get("title"), candidate.get("description"),
        candidate.get("abstract"), candidate.get("domain"),
        " ".join(candidate.get("domains", []) or []),
        " ".join(candidate.get("subdomains", []) or []),
        " ".join(candidate.get("tasks", []) or []),
        " ".join(candidate.get("modalities", []) or []),
    ]
    return " ".join(str(value) for value in fields if value).lower()


def _contains_alias(text: str, value: str, aliases: Dict[str, set[str]]) -> bool:
    normalized = value.lower()
    options = aliases.get(normalized, {normalized})
    return any(option in text for option in options)


def _required_diseases(profile: ProblemProfile) -> List[str]:
    text = " ".join([
        profile.original_problem, " ".join(profile.subdomains), " ".join(profile.keywords)
    ]).lower()
    return [name for name, terms in _DISEASE_TERMS.items() if any(term in text for term in terms)]


def evaluate_alignment(candidate: Dict[str, Any], profile: ProblemProfile) -> Dict[str, Any]:
    """Return dimension scores and incompatibilities using candidate evidence, not generic vocabulary."""
    text = _text(candidate)
    required_modalities = [value.lower() for value in profile.modalities]
    candidate_modalities = [value.lower() for value in candidate.get("modalities", []) or []]
    modality = 100.0 if not required_modalities else (
        100.0 * sum(any(_contains_alias(" ".join(candidate_modalities + [text]), req, _MODALITY_ALIASES)
                         for _ in [0]) for req in required_modalities) / len(required_modalities)
    )

    required_tasks = [task.name.lower().replace("_", " ") for task in profile.tasks]
    candidate_tasks = " ".join(candidate.get("tasks", []) or []).lower().replace("_", " ")
    task = 100.0 if not required_tasks else (
        100.0 if any(req in candidate_tasks or candidate_tasks in req for req in required_tasks) else 15.0
    )

    required_domains = [value.lower() for value in profile.domains]
    candidate_domains = " ".join([
        str(candidate.get("domain", "")), " ".join(candidate.get("domains", []) or []), text
    ]).lower()
    domain = 100.0 if not required_domains else (
        100.0 if any(req in candidate_domains for req in required_domains) else 10.0
    )

    required_subdomains = [value.lower() for value in profile.subdomains]
    subdomain = 100.0 if not required_subdomains else (
        100.0 if any(req in text for req in required_subdomains) else 25.0
    )

    diseases = _required_diseases(profile)
    candidate_diseases = [name for name, terms in _DISEASE_TERMS.items() if any(term in text for term in terms)]
    disease = 100.0 if not diseases else (
        100.0 if any(item in candidate_diseases for item in diseases)
        else (5.0 if candidate_diseases else 35.0)
    )

    required_population = [value.lower() for value in profile.population]
    population = 100.0 if not required_population else (
        100.0 if any(value in text for value in required_population) else 25.0
    )
    longitudinal_required = profile.longitudinal or any(
        term in profile.original_problem.lower() for term in ("longitudinal", "over time", "follow-up", "trajectory", "progression")
    )
    longitudinal = 100.0 if not longitudinal_required else (
        100.0 if any(term in text for term in ("longitudinal", "follow-up", "trajectory", "time series", "progression", "serial")) else 15.0
    )

    hard_incompatibilities: List[str] = []
    if required_modalities and modality == 0:
        hard_incompatibilities.append("modality")
    if diseases and disease <= 5:
        hard_incompatibilities.append("disease")
    if diseases and candidate_diseases and disease <= 5:
        hard_incompatibilities.append("disease")
    if required_domains and domain <= 10:
        hard_incompatibilities.append("domain")
    if required_subdomains and subdomain <= 25:
        hard_incompatibilities.append("subdomain")
    transfer_learning = any(term in text for term in _TRANSFER_TERMS)
    if longitudinal_required and longitudinal <= 15:
        hard_incompatibilities.append("longitudinal")

    evidence = {
        "task": task, "domain": domain, "subdomain": subdomain, "disease": disease,
        "modality": modality, "population": population, "longitudinal": longitudinal,
    }
    return {
        "dimensions": evidence,
        "incompatibilities": hard_incompatibilities,
        "transfer_learning": transfer_learning,
        "partial": bool(hard_incompatibilities) or any(value < 60 for value in evidence.values()),
    }


def alignment_score(alignment: Dict[str, Any]) -> float:
    dimensions = alignment["dimensions"]
    weighted = (
        dimensions["disease"] * 0.25 + dimensions["domain"] * 0.15 +
        dimensions["modality"] * 0.20 + dimensions["task"] * 0.20 +
        dimensions["population"] * 0.08 + dimensions["longitudinal"] * 0.07 +
        dimensions["subdomain"] * 0.05
    )
    penalty = 45.0 * len(alignment["incompatibilities"])
    if alignment["incompatibilities"] and not alignment["transfer_learning"]:
        penalty += 20.0
    return max(0.0, weighted - penalty)