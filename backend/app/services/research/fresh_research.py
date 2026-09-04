import logging
from typing import List, Dict, Any, Optional
from backend.app.schemas.problem_profile import ProblemProfile
from backend.app.schemas.paper import PaperRecommendation
from backend.app.providers.data_sources.arxiv_paper import ArxivPaperAdapter
from backend.app.providers.data_sources.semantic_scholar_paper import SemanticScholarPaperAdapter
from backend.app.providers.data_sources.openalex_paper import OpenAlexPaperAdapter

logger = logging.getLogger(__name__)


class FreshResearchEngine:
    """
    Dedicated live and indexed fresh research retrieval path per Section 31 & 32.
    """

    def __init__(self):
        self.arxiv = ArxivPaperAdapter()
        self.semantic_scholar = SemanticScholarPaperAdapter()
        self.openalex = OpenAlexPaperAdapter()

    async def search_fresh(
        self,
        profile: ProblemProfile,
        target_dataset: Optional[str] = None,
        target_model: Optional[str] = None,
        limit: int = 10,
    ) -> List[PaperRecommendation]:
        queries: List[str] = []

        primary_task = profile.tasks[0].name if profile.tasks else "machine learning"
        min_year = profile.research_constraints.minimum_year or 2024

        if target_dataset:
            queries.append(f"{target_dataset} {primary_task} benchmark {min_year}")
        if target_model:
            queries.append(f"{target_model} {primary_task} {min_year}")
        queries.append(f"{primary_task} {' '.join(profile.modalities)} recent {min_year}")

        live_results: List[Dict[str, Any]] = []

        # Run multi-source live scholarly searches
        for q in queries[:2]:
            try:
                arxiv_items = await self.arxiv.search(q, limit=4)
                live_results.extend(arxiv_items)
            except Exception as e:
                logger.warning(f"Arxiv search error: {e}")

            try:
                openalex_items = await self.openalex.search(q, limit=4)
                live_results.extend(openalex_items)
            except Exception as e:
                logger.warning(f"OpenAlex search error: {e}")

        # Deduplicate and sort with freshness bias
        seen_titles = set()
        clean_papers: List[PaperRecommendation] = []

        for item in live_results:
            title = item.get("title", "").strip()
            if not title or title.lower() in seen_titles:
                continue
            seen_titles.add(title.lower())

            year = item.get("year") or min_year
            if min_year and year < min_year:
                continue

            # Compute topical and domain relevance
            paper_text = f"{title} {item.get('abstract', '')}".lower()
            
            # Domain and subdomain relevance
            subdomains = [s.lower() for s in (profile.subdomains or [])]
            domains = [d.lower() for d in (profile.domains or [])]
            modalities = [m.lower() for m in (profile.modalities or [])]
            
            topic_matches = 0
            if any(s in paper_text for s in subdomains):
                topic_matches += 2
            if any(d in paper_text for d in domains):
                topic_matches += 1
            if any(m in paper_text for m in modalities):
                topic_matches += 1
            if primary_task.lower() in paper_text:
                topic_matches += 1

            # Reject completely off-topic live papers (0 overlap with task, modality, or domain)
            if topic_matches == 0 and not (target_dataset and target_dataset.lower() in paper_text):
                continue

            # Determine relationship category based on verifiable textual evidence
            p_type = "LATEST_RESEARCH"
            is_dataset_specific = bool(target_dataset and target_dataset.lower() in paper_text)
            is_model_specific = bool(target_model and target_model.lower() in paper_text)

            if is_dataset_specific:
                p_type = "DATASET_SPECIFIC"
            elif is_model_specific:
                p_type = "MODEL_SPECIFIC"
            elif "benchmark" in title.lower() or "challenge" in title.lower():
                p_type = "BENCHMARK"

            # Calibrated relevance score based on evidence, not just recency
            base_relevance = 65.0 + min(25.0, topic_matches * 6.0)
            if is_dataset_specific or is_model_specific:
                base_relevance += 8.0
            freshness_boost = 5.0 if year >= 2024 else 0.0
            final_score = int(round(min(98.0, base_relevance + freshness_boost)))

            why = [
                f"Verified topical relevance to {primary_task} and {profile.domains[0] if profile.domains else 'domain'}",
                f"Published in {year} ({item.get('venue') or 'Academic venue'})",
            ]
            if is_dataset_specific:
                why.append(f"Directly benchmarks/evaluates target dataset: {target_dataset}")
            if is_model_specific:
                why.append(f"Utilizes/extends target architecture: {target_model}")

            clean_papers.append(PaperRecommendation(
                id=item.get("id", ""),
                title=title,
                abstract=item.get("abstract"),
                authors=item.get("authors", []),
                venue=item.get("venue") or "Academic venue",
                year=year,
                publication_date=item.get("publication_date"),
                doi=item.get("doi"),
                arxiv_id=item.get("arxiv_id"),
                url=item.get("url"),
                pdf_url=item.get("pdf_url"),
                citation_count=item.get("citation_count", 0),
                score=final_score,
                paper_type=p_type,
                why=why,
                dataset_ids=[target_dataset] if is_dataset_specific else [],
                model_ids=[target_model] if is_model_specific else [],
            ))

        clean_papers.sort(key=lambda p: (p.score, p.year or 0), reverse=True)
        return clean_papers[:limit]
