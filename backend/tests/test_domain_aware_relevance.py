from backend.app.schemas.problem_profile import ProblemProfile, TaskItem
from backend.app.services.ranking.scorer import CompositeScorer


def alzheimer_profile() -> ProblemProfile:
    return ProblemProfile(
        original_problem="Predict longitudinal Alzheimer's disease progression from MRI scans and cognitive records",
        tasks=[TaskItem(name="progression_prediction")],
        domains=["Healthcare & Biomedical"],
        subdomains=["Neurology & Neurodegenerative"],
        modalities=["MRI", "Tabular"],
        population=["older adults", "mci"],
        longitudinal=True,
    )


def test_wrong_disease_and_modality_cannot_beat_direct_dataset_match():
    scorer = CompositeScorer()
    profile = alzheimer_profile()
    candidates = [
        ({
            "id": "wrong",
            "name": "Skin Lesion MRI Multimodal Deep Learning Benchmark",
            "description": "Multimodal MRI and clinical imaging for melanoma and skin lesion classification.",
            "domain": "Healthcare & Biomedical",
            "subdomains": ["Dermatology", "Oncology"],
            "tasks": ["classification"],
            "modalities": ["MRI"],
        }, 0.98),
        ({
            "id": "right",
            "name": "ADNI Longitudinal Alzheimer's Progression",
            "description": "Longitudinal MRI, cognitive records, and MCI follow-up for Alzheimer's progression prediction.",
            "domain": "Healthcare & Biomedical",
            "subdomains": ["Neurology & Neurodegenerative"],
            "tasks": ["progression_prediction"],
            "modalities": ["MRI", "Tabular"],
        }, 0.70),
    ]

    results = scorer.score_datasets(candidates, profile)

    assert results[0].id == "right"
    assert results[1].score <= 44
    assert "disease" in " ".join(results[1].warnings)


def test_papers_prioritize_direct_scientific_relevance_over_generic_similarity():
    scorer = CompositeScorer()
    profile = alzheimer_profile()
    candidates = [
        ({
            "id": "generic",
            "title": "Multimodal Deep Learning for Medical Imaging",
            "abstract": "A highly cited MRI and CT medical imaging foundation model for skin lesions and melanoma.",
            "domains": ["Healthcare & Biomedical"],
            "tasks": ["classification"],
            "modalities": ["MRI", "CT"],
            "year": 2025,
        }, 0.99),
        ({
            "id": "direct",
            "title": "Longitudinal Alzheimer's Progression from MRI and Cognitive Records",
            "abstract": "We predict MCI conversion to Alzheimer's disease using longitudinal MRI and cognitive trajectories.",
            "domains": ["Healthcare & Biomedical"],
            "tasks": ["progression_prediction"],
            "modalities": ["MRI", "Tabular"],
            "year": 2024,
        }, 0.68),
    ]

    results = scorer.score_papers(candidates, profile)

    assert results[0].id == "direct"
    assert results[1].score <= 44
    assert results[0].score_breakdown.disease_relevance == 100.0