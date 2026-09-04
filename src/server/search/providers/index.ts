/**
 * Multi-Source Candidate Retrieval Coordinator
 *
 * Runs parallel queries across all configured candidate providers:
 * - Kaggle
 * - Hugging Face Datasets & Pretrained Models
 * - Semantic Scholar
 * - OpenAlex
 * - arXiv
 * - PubMed
 *
 * Implements Promise.allSettled, provider timeouts, rate limit protection, and error resilience.
 */

import { UnifiedCandidate, StructuredQueryUnderstanding } from '../types';
import { SpecializedQueries } from '../queryExpansion';
import { fetchKaggleCandidates } from './kaggle';
import { fetchHuggingFaceDatasets, fetchHuggingFaceModels } from './huggingface';
import { fetchSemanticScholarPapers } from './semanticScholar';
import { fetchOpenAlexPapers } from './openAlex';
import { fetchArxivPapers } from './arxiv';
import { fetchPubMedPapers } from './pubmed';
import { getCuratedBenchmarksForQuery } from './curatedBenchmarks';

export interface MultiSourceRawCandidates {
    datasets: UnifiedCandidate[];
    models: UnifiedCandidate[];
    papers: UnifiedCandidate[];
    allCandidates: UnifiedCandidate[];
    sourceCounts: Record<string, number>;
}

export async function retrieveAllCandidates(
    queries: SpecializedQueries,
    understanding: StructuredQueryUnderstanding
): Promise<MultiSourceRawCandidates> {
    const sourceCounts: Record<string, number> = {
        kaggle: 0,
        huggingface_datasets: 0,
        huggingface_models: 0,
        semantic_scholar: 0,
        openalex: 0,
        arxiv: 0,
        pubmed: 0,
        curated_benchmarks: 0,
    };

    const curated = getCuratedBenchmarksForQuery(understanding);
    sourceCounts.curated_benchmarks = curated.datasets.length + curated.models.length + curated.papers.length;

    const results = await Promise.allSettled([
        fetchKaggleCandidates(queries.datasetQueries, understanding),
        fetchHuggingFaceDatasets(queries.datasetQueries, understanding),
        fetchHuggingFaceModels(queries.modelQueries, understanding),
        fetchSemanticScholarPapers(queries.paperQueries, understanding),
        fetchOpenAlexPapers(queries.paperQueries, understanding),
        fetchArxivPapers(queries.paperQueries, understanding),
        fetchPubMedPapers(queries.paperQueries, understanding),
    ]);

    const kaggleCandidates = results[0].status === 'fulfilled' ? results[0].value : [];
    const hfDatasetCandidates = results[1].status === 'fulfilled' ? results[1].value : [];
    const hfModelCandidates = results[2].status === 'fulfilled' ? results[2].value : [];
    const s2Candidates = results[3].status === 'fulfilled' ? results[3].value : [];
    const openAlexCandidates = results[4].status === 'fulfilled' ? results[4].value : [];
    const arxivCandidates = results[5].status === 'fulfilled' ? results[5].value : [];
    const pubmedCandidates = results[6].status === 'fulfilled' ? results[6].value : [];

    sourceCounts.kaggle = kaggleCandidates.length;
    sourceCounts.huggingface_datasets = hfDatasetCandidates.length;
    sourceCounts.huggingface_models = hfModelCandidates.length;
    sourceCounts.semantic_scholar = s2Candidates.length;
    sourceCounts.openalex = openAlexCandidates.length;
    sourceCounts.arxiv = arxivCandidates.length;
    sourceCounts.pubmed = pubmedCandidates.length;

    // Merge curated benchmarks at the front of the candidate pools
    const datasets = [...curated.datasets, ...kaggleCandidates, ...hfDatasetCandidates];
    const models = [...curated.models, ...hfModelCandidates];
    const papers = [...curated.papers, ...s2Candidates, ...openAlexCandidates, ...arxivCandidates, ...pubmedCandidates];
    const allCandidates = [...datasets, ...models, ...papers];

    return {
        datasets,
        models,
        papers,
        allCandidates,
        sourceCounts,
    };
}

