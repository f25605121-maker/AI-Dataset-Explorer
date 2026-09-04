from typing import List
from backend.app.schemas.problem_profile import ProblemProfile


class QueryExpansionEngine:
    """
    Generates 3 to 6 targeted search queries per Section 8.
    """

    def expand(self, profile: ProblemProfile) -> List[str]:
        queries: List[str] = []

        primary_task = profile.tasks[0].name if profile.tasks else "machine learning"
        primary_domain = profile.domains[0] if profile.domains else "computer vision"
        modalities_str = " ".join(profile.modalities) if profile.modalities else ""
        named_dataset = profile.named_entities.datasets[0] if profile.named_entities.datasets else ""
        named_model = profile.named_entities.models[0] if profile.named_entities.models else ""

        subdomains_str = " ".join(profile.subdomains) if profile.subdomains else ""
        keywords_str = " ".join(profile.keywords[:3]) if profile.keywords else ""

        # QUERY 1: Complete problem core (Task + Modality + Subdomain/Disease + Domain)
        q1 = f"{modalities_str} {subdomains_str} {keywords_str} {primary_task} {primary_domain}".strip()
        queries.append(q1)

        # QUERY 2: Task + Domain + Entity
        if named_dataset or named_model:
            q2 = f"{named_dataset} {named_model} {primary_task}".strip()
            queries.append(q2)
        else:
            q2 = f"{subdomains_str} {primary_task} {primary_domain}".strip()
            queries.append(q2)

        # QUERY 3: Technical methods & constraints
        methods_str = " ".join(profile.preferred_methods) if profile.preferred_methods else ""
        if profile.data_constraints.label_availability == "limited_labeled":
            q3 = f"semi-supervised few-shot {primary_task} {modalities_str}".strip()
        elif profile.data_constraints.class_imbalance:
            q3 = f"imbalanced data learning {primary_task} {primary_domain}".strip()
        else:
            q3 = f"deep learning {primary_task} {methods_str}".strip()
        queries.append(q3)

        # QUERY 4: Dataset characteristics
        q4 = f"{modalities_str} dataset benchmark {primary_task}".strip()
        queries.append(q4)

        # QUERY 5: Recent research-oriented query
        min_year = profile.research_constraints.minimum_year or 2024
        q5 = f"recent research {primary_task} {modalities_str} {min_year}".strip()
        queries.append(q5)

        # QUERY 6: Broad fallback query
        q6 = f"{primary_task} {modalities_str}".strip()
        queries.append(q6)

        # Deduplicate and return clean queries
        seen = set()
        clean_queries = []
        for q in queries:
            normalized = " ".join(q.split())
            if normalized and normalized not in seen:
                seen.add(normalized)
                clean_queries.append(normalized)

        profile.search_queries = clean_queries
        return clean_queries
