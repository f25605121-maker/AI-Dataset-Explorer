# Project Functions Index

## Backend Functions

### main.py
- [lifespan](./backend/main/lifespan.md)
- [global_exception_handler](./backend/main/global_exception_handler.md)
- [root](./backend/main/root.md)
- [dispatch](./backend/main/dispatch.md)

### api\v1\admin.py
- [get_system_health](./backend/api/v1/admin/get_system_health.md)
- [trigger_ingest](./backend/api/v1/admin/trigger_ingest.md)

### api\v1\feedback.py
- [record_feedback](./backend/api/v1/feedback/record_feedback.md)

### api\v1\problem.py
- [analyze_problem](./backend/api/v1/problem/analyze_problem.md)

### api\v1\recommend.py
- [recommend_pipeline](./backend/api/v1/recommend/recommend_pipeline.md)

### api\v1\resources.py
- [get_dataset](./backend/api/v1/resources/get_dataset.md)
- [get_model](./backend/api/v1/resources/get_model.md)
- [get_paper](./backend/api/v1/resources/get_paper.md)
- [get_dataset_papers](./backend/api/v1/resources/get_dataset_papers.md)
- [get_dataset_models](./backend/api/v1/resources/get_dataset_models.md)
- [get_model_papers](./backend/api/v1/resources/get_model_papers.md)

### api\v1\search.py
- [search_all](./backend/api/v1/search/search_all.md)
- [search_datasets](./backend/api/v1/search/search_datasets.md)
- [search_models](./backend/api/v1/search/search_models.md)
- [search_papers](./backend/api/v1/search/search_papers.md)
- [verify_compatibility](./backend/api/v1/search/verify_compatibility.md)

### core\security.py
- [validate_url_safe](./backend/core/security/validate_url_safe.md)
- [sanitize_search_query](./backend/core/security/sanitize_search_query.md)
- [scan_prompt_injection](./backend/core/security/scan_prompt_injection.md)

### db\init_db.py
- [init_db](./backend/db/init_db/init_db.md)

### db\session.py
- [get_db](./backend/db/session/get_db.md)

### models\types.py
- [utcnow](./backend/models/types/utcnow.md)
- [process_bind_param](./backend/models/types/process_bind_param.md)
- [process_result_value](./backend/models/types/process_result_value.md)

### providers\data_sources\arxiv_paper.py
- [source_name](./backend/providers/data_sources/arxiv_paper/source_name.md)
- [search](./backend/providers/data_sources/arxiv_paper/search.md)
- [fetch](./backend/providers/data_sources/arxiv_paper/fetch.md)
- [_parse_atom](./backend/providers/data_sources/arxiv_paper/_parse_atom.md)
- [normalize](./backend/providers/data_sources/arxiv_paper/normalize.md)
- [health_check](./backend/providers/data_sources/arxiv_paper/health_check.md)

### providers\data_sources\base.py
- [source_name](./backend/providers/data_sources/base/source_name.md)
- [search](./backend/providers/data_sources/base/search.md)
- [fetch](./backend/providers/data_sources/base/fetch.md)
- [normalize](./backend/providers/data_sources/base/normalize.md)
- [health_check](./backend/providers/data_sources/base/health_check.md)

### providers\data_sources\crossref_paper.py
- [source_name](./backend/providers/data_sources/crossref_paper/source_name.md)
- [search](./backend/providers/data_sources/crossref_paper/search.md)
- [fetch](./backend/providers/data_sources/crossref_paper/fetch.md)
- [normalize](./backend/providers/data_sources/crossref_paper/normalize.md)
- [health_check](./backend/providers/data_sources/crossref_paper/health_check.md)

### providers\data_sources\huggingface_dataset.py
- [source_name](./backend/providers/data_sources/huggingface_dataset/source_name.md)
- [search](./backend/providers/data_sources/huggingface_dataset/search.md)
- [fetch](./backend/providers/data_sources/huggingface_dataset/fetch.md)
- [normalize](./backend/providers/data_sources/huggingface_dataset/normalize.md)
- [health_check](./backend/providers/data_sources/huggingface_dataset/health_check.md)

### providers\data_sources\huggingface_model.py
- [source_name](./backend/providers/data_sources/huggingface_model/source_name.md)
- [search](./backend/providers/data_sources/huggingface_model/search.md)
- [fetch](./backend/providers/data_sources/huggingface_model/fetch.md)
- [normalize](./backend/providers/data_sources/huggingface_model/normalize.md)
- [health_check](./backend/providers/data_sources/huggingface_model/health_check.md)

### providers\data_sources\kaggle_dataset.py
- [source_name](./backend/providers/data_sources/kaggle_dataset/source_name.md)
- [search](./backend/providers/data_sources/kaggle_dataset/search.md)
- [fetch](./backend/providers/data_sources/kaggle_dataset/fetch.md)
- [normalize](./backend/providers/data_sources/kaggle_dataset/normalize.md)
- [health_check](./backend/providers/data_sources/kaggle_dataset/health_check.md)

### providers\data_sources\openalex_paper.py
- [source_name](./backend/providers/data_sources/openalex_paper/source_name.md)
- [search](./backend/providers/data_sources/openalex_paper/search.md)
- [fetch](./backend/providers/data_sources/openalex_paper/fetch.md)
- [normalize](./backend/providers/data_sources/openalex_paper/normalize.md)
- [health_check](./backend/providers/data_sources/openalex_paper/health_check.md)

### providers\data_sources\semantic_scholar_paper.py
- [source_name](./backend/providers/data_sources/semantic_scholar_paper/source_name.md)
- [search](./backend/providers/data_sources/semantic_scholar_paper/search.md)
- [fetch](./backend/providers/data_sources/semantic_scholar_paper/fetch.md)
- [normalize](./backend/providers/data_sources/semantic_scholar_paper/normalize.md)
- [health_check](./backend/providers/data_sources/semantic_scholar_paper/health_check.md)

### providers\embeddings\base.py
- [model_name](./backend/providers/embeddings/base/model_name.md)
- [dimension](./backend/providers/embeddings/base/dimension.md)
- [version](./backend/providers/embeddings/base/version.md)
- [embed_text](./backend/providers/embeddings/base/embed_text.md)
- [embed_batch](./backend/providers/embeddings/base/embed_batch.md)

### providers\embeddings\factory.py
- [get_embedding_provider](./backend/providers/embeddings/factory/get_embedding_provider.md)

### providers\embeddings\local_provider.py
- [__init__](./backend/providers/embeddings/local_provider/__init__.md)
- [model_name](./backend/providers/embeddings/local_provider/model_name.md)
- [dimension](./backend/providers/embeddings/local_provider/dimension.md)
- [version](./backend/providers/embeddings/local_provider/version.md)
- [_hash_token](./backend/providers/embeddings/local_provider/_hash_token.md)
- [_generate_vector](./backend/providers/embeddings/local_provider/_generate_vector.md)
- [embed_text](./backend/providers/embeddings/local_provider/embed_text.md)
- [embed_batch](./backend/providers/embeddings/local_provider/embed_batch.md)

### providers\llm\base.py
- [generate_structured](./backend/providers/llm/base/generate_structured.md)
- [generate_text](./backend/providers/llm/base/generate_text.md)
- [verify_scientific_consistency](./backend/providers/llm/base/verify_scientific_consistency.md)

### providers\llm\factory.py
- [get_llm_provider](./backend/providers/llm/factory/get_llm_provider.md)

### providers\llm\mock_provider.py
- [generate_structured](./backend/providers/llm/mock_provider/generate_structured.md)
- [generate_text](./backend/providers/llm/mock_provider/generate_text.md)
- [verify_scientific_consistency](./backend/providers/llm/mock_provider/verify_scientific_consistency.md)
- [_extract_problem_profile](./backend/providers/llm/mock_provider/_extract_problem_profile.md)

### providers\llm\openai_provider.py
- [__init__](./backend/providers/llm/openai_provider/__init__.md)
- [generate_structured](./backend/providers/llm/openai_provider/generate_structured.md)
- [generate_text](./backend/providers/llm/openai_provider/generate_text.md)
- [verify_scientific_consistency](./backend/providers/llm/openai_provider/verify_scientific_consistency.md)

### providers\reranking\base.py
- [rerank](./backend/providers/reranking/base/rerank.md)

### providers\reranking\cross_encoder.py
- [rerank](./backend/providers/reranking/cross_encoder/rerank.md)

### providers\reranking\factory.py
- [get_reranker_provider](./backend/providers/reranking/factory/get_reranker_provider.md)

### services\recommendation_service.py
- [__init__](./backend/services/recommendation_service/__init__.md)
- [recommend](./backend/services/recommendation_service/recommend.md)
- [_build_rerank_query](./backend/services/recommendation_service/_build_rerank_query.md)
- [_dataset_to_dict](./backend/services/recommendation_service/_dataset_to_dict.md)
- [_model_to_dict](./backend/services/recommendation_service/_model_to_dict.md)
- [_paper_to_dict](./backend/services/recommendation_service/_paper_to_dict.md)

### services\problem_understanding\parser.py
- [__init__](./backend/services/problem_understanding/parser/__init__.md)
- [analyze_problem](./backend/services/problem_understanding/parser/analyze_problem.md)
- [_refine_constraints](./backend/services/problem_understanding/parser/_refine_constraints.md)

### services\query_expansion\expander.py
- [expand](./backend/services/query_expansion/expander/expand.md)

### services\ranking\cross_linker.py
- [link_and_boost](./backend/services/ranking/cross_linker/link_and_boost.md)

### services\ranking\relevance.py
- [_text](./backend/services/ranking/relevance/_text.md)
- [_contains_alias](./backend/services/ranking/relevance/_contains_alias.md)
- [_required_diseases](./backend/services/ranking/relevance/_required_diseases.md)
- [evaluate_alignment](./backend/services/ranking/relevance/evaluate_alignment.md)
- [alignment_score](./backend/services/ranking/relevance/alignment_score.md)

### services\ranking\scorer.py
- [_get_match_level](./backend/services/ranking/scorer/_get_match_level.md)
- [score_datasets](./backend/services/ranking/scorer/score_datasets.md)
- [score_models](./backend/services/ranking/scorer/score_models.md)
- [score_papers](./backend/services/ranking/scorer/score_papers.md)

### services\research\fresh_research.py
- [__init__](./backend/services/research/fresh_research/__init__.md)
- [search_fresh](./backend/services/research/fresh_research/search_fresh.md)

### services\retrieval\bm25_search.py
- [__init__](./backend/services/retrieval/bm25_search/__init__.md)
- [_tokenize](./backend/services/retrieval/bm25_search/_tokenize.md)
- [search](./backend/services/retrieval/bm25_search/search.md)

### services\retrieval\dense_search.py
- [__init__](./backend/services/retrieval/dense_search/__init__.md)
- [search](./backend/services/retrieval/dense_search/search.md)

### services\retrieval\hard_filter.py
- [filter_datasets](./backend/services/retrieval/hard_filter/filter_datasets.md)
- [filter_models](./backend/services/retrieval/hard_filter/filter_models.md)
- [filter_papers](./backend/services/retrieval/hard_filter/filter_papers.md)

### services\retrieval\rrf.py
- [__init__](./backend/services/retrieval/rrf/__init__.md)
- [fuse](./backend/services/retrieval/rrf/fuse.md)

### services\verification\scientific_verifier.py
- [__init__](./backend/services/verification/scientific_verifier/__init__.md)
- [verify](./backend/services/verification/scientific_verifier/verify.md)

## Frontend Functions

### middleware.ts
- [middleware](./frontend/middleware/middleware.md)

### app\api\admin\route.ts
- [GET](./frontend/app/api/admin/route/GET.md)

### app\api\assistant\route.ts
- [POST](./frontend/app/api/assistant/route/POST.md)

### app\api\auth\change-password\route.ts
- [POST](./frontend/app/api/auth/change-password/route/POST.md)

### app\api\auth\forgot-password\route.ts
- [POST](./frontend/app/api/auth/forgot-password/route/POST.md)

### app\api\auth\login\route.ts
- [POST](./frontend/app/api/auth/login/route/POST.md)

### app\api\auth\logout\route.ts
- [POST](./frontend/app/api/auth/logout/route/POST.md)

### app\api\auth\me\route.ts
- [GET](./frontend/app/api/auth/me/route/GET.md)

### app\api\auth\register\route.ts
- [POST](./frontend/app/api/auth/register/route/POST.md)

### app\api\auth\reset-password\route.ts
- [POST](./frontend/app/api/auth/reset-password/route/POST.md)

### app\api\checkout\route.ts
- [POST](./frontend/app/api/checkout/route/POST.md)

### app\api\csrf\route.ts
- [GET](./frontend/app/api/csrf/route/GET.md)

### app\api\datasets\route.ts
- [GET](./frontend/app/api/datasets/route/GET.md)

### app\api\diagnostics\gemini\route.ts
- [GET](./frontend/app/api/diagnostics/gemini/route/GET.md)

### app\api\export\route.ts
- [POST](./frontend/app/api/export/route/POST.md)
- [GET](./frontend/app/api/export/route/GET.md)

### app\api\models\route.ts
- [GET](./frontend/app/api/models/route/GET.md)

### app\api\papers\route.ts
- [GET](./frontend/app/api/papers/route/GET.md)
- [POST](./frontend/app/api/papers/route/POST.md)

### app\api\research\route.ts
- [POST](./frontend/app/api/research/route/POST.md)
- [GET](./frontend/app/api/research/route/GET.md)

### app\api\research\[paperId]\route.ts
- [GET](./frontend/app/api/research/[paperId]/route/GET.md)

### app\api\search\route.ts
- [POST](./frontend/app/api/search/route/POST.md)
- [GET](./frontend/app/api/search/route/GET.md)

### app\api\search\evaluate\route.ts
- [GET](./frontend/app/api/search/evaluate/route/GET.md)

### app\api\search\feedback\route.ts
- [POST](./frontend/app/api/search/feedback/route/POST.md)
- [GET](./frontend/app/api/search/feedback/route/GET.md)

### app\api\upload\route.ts
- [POST](./frontend/app/api/upload/route/POST.md)

### app\api\user\history\route.ts
- [GET](./frontend/app/api/user/history/route/GET.md)
- [POST](./frontend/app/api/user/history/route/POST.md)
- [DELETE](./frontend/app/api/user/history/route/DELETE.md)

### app\api\user\usage\route.ts
- [GET](./frontend/app/api/user/usage/route/GET.md)

### app\api\webhooks\stripe\route.ts
- [POST](./frontend/app/api/webhooks/stripe/route/POST.md)

### components\benchmark\ComparisonMatrix.tsx
- [ComparisonMatrix](./frontend/components/benchmark/ComparisonMatrix/ComparisonMatrix.md)

### components\benchmark\ModelSpecTable.tsx
- [ModelSpecTable](./frontend/components/benchmark/ModelSpecTable/ModelSpecTable.md)

### components\common\Button.tsx
- [Button](./frontend/components/common/Button/Button.md)

### components\common\ConfidenceBadge.tsx
- [ConfidenceBadge](./frontend/components/common/ConfidenceBadge/ConfidenceBadge.md)

### components\common\EvidenceBadge.tsx
- [EvidenceBadge](./frontend/components/common/EvidenceBadge/EvidenceBadge.md)

### components\common\MatchBreakdown.tsx
- [MatchBreakdown](./frontend/components/common/MatchBreakdown/MatchBreakdown.md)

### components\common\Modal.tsx
- [Modal](./frontend/components/common/Modal/Modal.md)

### components\common\StitchEmptyState.tsx
- [StitchEmptyState](./frontend/components/common/StitchEmptyState/StitchEmptyState.md)

### components\explore\DatasetSpotlightCard.tsx
- [DatasetSpotlightCard](./frontend/components/explore/DatasetSpotlightCard/DatasetSpotlightCard.md)

### components\explore\LiteratureList.tsx
- [LiteratureList](./frontend/components/explore/LiteratureList/LiteratureList.md)

### components\explore\ModelSpotlightCard.tsx
- [ModelSpotlightCard](./frontend/components/explore/ModelSpotlightCard/ModelSpotlightCard.md)

### components\explore\QuerySummaryCards.tsx
- [QuerySummaryCards](./frontend/components/explore/QuerySummaryCards/QuerySummaryCards.md)

### components\explore\SearchBar.tsx
- [SearchBar](./frontend/components/explore/SearchBar/SearchBar.md)

### components\layout\AppHeader.tsx
- [AppHeader](./frontend/components/layout/AppHeader/AppHeader.md)

### components\layout\Footer.tsx
- [Footer](./frontend/components/layout/Footer/Footer.md)

### components\layout\GeminiRightSidebar.tsx
- [GeminiSidebar](./frontend/components/layout/GeminiRightSidebar/GeminiSidebar.md)

### components\layout\Navbar.tsx
- [Navbar](./frontend/components/layout/Navbar/Navbar.md)

### components\layout\ThemeToggle.tsx
- [ThemeToggle](./frontend/components/layout/ThemeToggle/ThemeToggle.md)

### components\modals\QuickSettingsModal.tsx
- [QuickSettingsModal](./frontend/components/modals/QuickSettingsModal/QuickSettingsModal.md)

### components\providers\Providers.tsx
- [Providers](./frontend/components/providers/Providers/Providers.md)

### components\roadmap\CodeBlockView.tsx
- [CodeBlockView](./frontend/components/roadmap/CodeBlockView/CodeBlockView.md)

### components\roadmap\PhaseCard.tsx
- [PhaseCard](./frontend/components/roadmap/PhaseCard/PhaseCard.md)

### components\roadmap\RoadmapStepper.tsx
- [RoadmapStepper](./frontend/components/roadmap/RoadmapStepper/RoadmapStepper.md)

### context\SearchSessionContext.tsx
- [SearchSessionProvider](./frontend/context/SearchSessionContext/SearchSessionProvider.md)

### context\ThemeContext.tsx
- [useTheme](./frontend/context/ThemeContext/useTheme.md)
- [ThemeProvider](./frontend/context/ThemeContext/ThemeProvider.md)

### fixtures\trending-templates.ts
- [getTemplateById](./frontend/fixtures/trending-templates/getTemplateById.md)
- [searchTemplateByQuery](./frontend/fixtures/trending-templates/searchTemplateByQuery.md)

### hooks\useAuth.ts
- [useAuth](./frontend/hooks/useAuth/useAuth.md)

### hooks\useAuthGuard.ts
- [useAuthGuard](./frontend/hooks/useAuthGuard/useAuthGuard.md)

### hooks\useRecentSearches.ts
- [broadcastSearchHistory](./frontend/hooks/useRecentSearches/broadcastSearchHistory.md)
- [addSearchToHistory](./frontend/hooks/useRecentSearches/addSearchToHistory.md)
- [useRecentSearches](./frontend/hooks/useRecentSearches/useRecentSearches.md)

### hooks\useSearch.ts
- [useSearch](./frontend/hooks/useSearch/useSearch.md)

### hooks\useSearchProgress.ts
- [useSearchProgress](./frontend/hooks/useSearchProgress/useSearchProgress.md)

### hooks\useSearchSession.ts
- [useSearchSession](./frontend/hooks/useSearchSession/useSearchSession.md)

### lib\algorithms\popularity.ts
- [recordSearchInPopularityAlgorithm](./frontend/lib/algorithms/popularity/recordSearchInPopularityAlgorithm.md)
- [calculateDatasetPopularityScore](./frontend/lib/algorithms/popularity/calculateDatasetPopularityScore.md)
- [getRankedPopularDatasets](./frontend/lib/algorithms/popularity/getRankedPopularDatasets.md)
- [getTopPopularDataset](./frontend/lib/algorithms/popularity/getTopPopularDataset.md)

### server\analysis\datasetAnalyzer.ts
- [analyzeDataset](./frontend/server/analysis/datasetAnalyzer/analyzeDataset.md)

### server\analysis\modelArchitectureAnalyzer.ts
- [analyzeModelArchitecture](./frontend/server/analysis/modelArchitectureAnalyzer/analyzeModelArchitecture.md)

### server\assistant\analyze-project.ts
- [analyzeProjectSemantics](./frontend/server/assistant/analyze-project/analyzeProjectSemantics.md)

### server\assistant\classifyIntent.ts
- [classifyIntent](./frontend/server/assistant/classifyIntent/classifyIntent.md)

### server\assistant\datasetPipeline.ts
- [runDatasetPipeline](./frontend/server/assistant/datasetPipeline/runDatasetPipeline.md)

### server\assistant\generalAIPipeline.ts
- [runGeneralAIPipeline](./frontend/server/assistant/generalAIPipeline/runGeneralAIPipeline.md)

### server\assistant\keywordExtractor.ts
- [isTechnicalOrDataQuery](./frontend/server/assistant/keywordExtractor/isTechnicalOrDataQuery.md)
- [extractCoreSearchKeywords](./frontend/server/assistant/keywordExtractor/extractCoreSearchKeywords.md)

### server\assistant\llmProvider.ts
- [getLlmStatus](./frontend/server/assistant/llmProvider/getLlmStatus.md)
- [callLlm](./frontend/server/assistant/llmProvider/callLlm.md)

### server\assistant\unifiedOrchestrator.ts
- [runUnifiedOrchestrator](./frontend/server/assistant/unifiedOrchestrator/runUnifiedOrchestrator.md)

### server\auth\accountLockout.ts
- [isAccountLocked](./frontend/server/auth/accountLockout/isAccountLocked.md)
- [recordFailedAttempt](./frontend/server/auth/accountLockout/recordFailedAttempt.md)
- [resetFailedAttempts](./frontend/server/auth/accountLockout/resetFailedAttempts.md)

### server\auth\userStore.ts
- [toSafeUser](./frontend/server/auth/userStore/toSafeUser.md)
- [getAllUsers](./frontend/server/auth/userStore/getAllUsers.md)
- [findUserByEmail](./frontend/server/auth/userStore/findUserByEmail.md)
- [findUserById](./frontend/server/auth/userStore/findUserById.md)
- [createUser](./frontend/server/auth/userStore/createUser.md)
- [updateUserPassword](./frontend/server/auth/userStore/updateUserPassword.md)
- [createPasswordResetToken](./frontend/server/auth/userStore/createPasswordResetToken.md)
- [consumePasswordResetToken](./frontend/server/auth/userStore/consumePasswordResetToken.md)
- [findOrCreateOAuthUser](./frontend/server/auth/userStore/findOrCreateOAuthUser.md)

### server\cache\metadataCache.ts
- [datasetCardKey](./frontend/server/cache/metadataCache/datasetCardKey.md)
- [datasetMetaKey](./frontend/server/cache/metadataCache/datasetMetaKey.md)
- [modelCardKey](./frontend/server/cache/metadataCache/modelCardKey.md)
- [modelConfigKey](./frontend/server/cache/metadataCache/modelConfigKey.md)
- [searchKey](./frontend/server/cache/metadataCache/searchKey.md)

### server\evidence\evidenceExtractor.ts
- [calculateDatasetEvidenceConfidence](./frontend/server/evidence/evidenceExtractor/calculateDatasetEvidenceConfidence.md)
- [calculateModelEvidenceConfidence](./frontend/server/evidence/evidenceExtractor/calculateModelEvidenceConfidence.md)
- [extractDatasetFacts](./frontend/server/evidence/evidenceExtractor/extractDatasetFacts.md)
- [extractModelFacts](./frontend/server/evidence/evidenceExtractor/extractModelFacts.md)

### server\feasibility\calculateFeasibility.ts
- [calculateFeasibility](./frontend/server/feasibility/calculateFeasibility/calculateFeasibility.md)

### server\feasibility\estimateHardware.ts
- [estimateHardware](./frontend/server/feasibility/estimateHardware/estimateHardware.md)

### server\history\searchHistoryStore.ts
- [getUserSearchHistory](./frontend/server/history/searchHistoryStore/getUserSearchHistory.md)
- [addUserSearch](./frontend/server/history/searchHistoryStore/addUserSearch.md)
- [removeUserSearch](./frontend/server/history/searchHistoryStore/removeUserSearch.md)
- [clearUserSearchHistory](./frontend/server/history/searchHistoryStore/clearUserSearchHistory.md)

### server\normalization\datasetNormalizer.ts
- [normalizeAndDeduplicateDatasets](./frontend/server/normalization/datasetNormalizer/normalizeAndDeduplicateDatasets.md)
- [computeDatasetMetadataQuality](./frontend/server/normalization/datasetNormalizer/computeDatasetMetadataQuality.md)
- [ensureNormalizedDataset](./frontend/server/normalization/datasetNormalizer/ensureNormalizedDataset.md)

### server\normalization\modelNormalizer.ts
- [normalizeAndDeduplicateModels](./frontend/server/normalization/modelNormalizer/normalizeAndDeduplicateModels.md)
- [ensureNormalizedModel](./frontend/server/normalization/modelNormalizer/ensureNormalizedModel.md)

### server\papers\arxiv.ts
- [searchArxiv](./frontend/server/papers/arxiv/searchArxiv.md)

### server\papers\crossref.ts
- [searchCrossref](./frontend/server/papers/crossref/searchCrossref.md)

### server\papers\openAlex.ts
- [reconstructOpenAlexAbstract](./frontend/server/papers/openAlex/reconstructOpenAlexAbstract.md)
- [searchOpenAlex](./frontend/server/papers/openAlex/searchOpenAlex.md)

### server\papers\paperCache.ts
- [buildPaperSearchKey](./frontend/server/papers/paperCache/buildPaperSearchKey.md)
- [buildPaperDetailKey](./frontend/server/papers/paperCache/buildPaperDetailKey.md)

### server\papers\paperClassifier.ts
- [classifyPaperRelationship](./frontend/server/papers/paperClassifier/classifyPaperRelationship.md)

### server\papers\paperNormalizer.ts
- [normalizeSemanticScholar](./frontend/server/papers/paperNormalizer/normalizeSemanticScholar.md)
- [normalizeOpenAlex](./frontend/server/papers/paperNormalizer/normalizeOpenAlex.md)
- [normalizeArxiv](./frontend/server/papers/paperNormalizer/normalizeArxiv.md)
- [normalizeCrossref](./frontend/server/papers/paperNormalizer/normalizeCrossref.md)
- [normalizePubMed](./frontend/server/papers/paperNormalizer/normalizePubMed.md)
- [deduplicateAndMergePapers](./frontend/server/papers/paperNormalizer/deduplicateAndMergePapers.md)

### server\papers\paperScorer.ts
- [scorePaper](./frontend/server/papers/paperScorer/scorePaper.md)
- [buildResearchLandscape](./frontend/server/papers/paperScorer/buildResearchLandscape.md)

### server\papers\paperSearchAggregator.ts
- [searchResearchPapers](./frontend/server/papers/paperSearchAggregator/searchResearchPapers.md)

### server\papers\pubmed.ts
- [searchPubMed](./frontend/server/papers/pubmed/searchPubMed.md)

### server\papers\semanticScholar.ts
- [searchSemanticScholar](./frontend/server/papers/semanticScholar/searchSemanticScholar.md)

### server\payments\webhookValidator.ts
- [isEventProcessed](./frontend/server/payments/webhookValidator/isEventProcessed.md)
- [markEventProcessed](./frontend/server/payments/webhookValidator/markEventProcessed.md)
- [verifyStripeWebhookSignature](./frontend/server/payments/webhookValidator/verifyStripeWebhookSignature.md)

### server\pricing\catalog.ts
- [calculateOrderAmount](./frontend/server/pricing/catalog/calculateOrderAmount.md)

### server\providers\huggingface.ts
- [getHuggingFaceHeaders](./frontend/server/providers/huggingface/getHuggingFaceHeaders.md)

### server\providers\huggingfaceDatasets.ts
- [searchHuggingFaceDatasets](./frontend/server/providers/huggingfaceDatasets/searchHuggingFaceDatasets.md)

### server\providers\huggingfaceModels.ts
- [searchHuggingFaceModels](./frontend/server/providers/huggingfaceModels/searchHuggingFaceModels.md)

### server\providers\kaggle.ts
- [getKaggleAuthHeaders](./frontend/server/providers/kaggle/getKaggleAuthHeaders.md)

### server\providers\kaggleDatasets.ts
- [searchKaggleDatasets](./frontend/server/providers/kaggleDatasets/searchKaggleDatasets.md)

### server\query-understanding\queryExpander.ts
- [expandQueries](./frontend/server/query-understanding/queryExpander/expandQueries.md)

### server\query-understanding\queryParser.ts
- [parseQuery](./frontend/server/query-understanding/queryParser/parseQuery.md)
- [formatQueryUnderstanding](./frontend/server/query-understanding/queryParser/formatQueryUnderstanding.md)
- [queryUnderstandingToProjectSpec](./frontend/server/query-understanding/queryParser/queryUnderstandingToProjectSpec.md)

### server\ranking\compatibilityRanker.ts
- [calculateCompatibilityScore](./frontend/server/ranking/compatibilityRanker/calculateCompatibilityScore.md)

### server\ranking\confidenceCalculator.ts
- [calculateDeterministicConfidence](./frontend/server/ranking/confidenceCalculator/calculateDeterministicConfidence.md)

### server\ranking\datasetScorer.ts
- [getMatchCategory](./frontend/server/ranking/datasetScorer/getMatchCategory.md)
- [scoreDataset](./frontend/server/ranking/datasetScorer/scoreDataset.md)

### server\ranking\enrichDataset.ts
- [analyzeDatasetRisk](./frontend/server/ranking/enrichDataset/analyzeDatasetRisk.md)
- [analyzeDatasetQuality](./frontend/server/ranking/enrichDataset/analyzeDatasetQuality.md)
- [estimateTrainability](./frontend/server/ranking/enrichDataset/estimateTrainability.md)
- [classifyDifficulty](./frontend/server/ranking/enrichDataset/classifyDifficulty.md)
- [computeAccessibility](./frontend/server/ranking/enrichDataset/computeAccessibility.md)
- [computeSearchCoverage](./frontend/server/ranking/enrichDataset/computeSearchCoverage.md)
- [analyzeDatasetCompatibility](./frontend/server/ranking/enrichDataset/analyzeDatasetCompatibility.md)
- [suggestLabelMapping](./frontend/server/ranking/enrichDataset/suggestLabelMapping.md)
- [generateRecommendationCategories](./frontend/server/ranking/enrichDataset/generateRecommendationCategories.md)
- [generateSmartRecommendation](./frontend/server/ranking/enrichDataset/generateSmartRecommendation.md)
- [enrichDataset](./frontend/server/ranking/enrichDataset/enrichDataset.md)

### server\ranking\hardNegativeFilter.ts
- [applyHardNegativeFilter](./frontend/server/ranking/hardNegativeFilter/applyHardNegativeFilter.md)

### server\ranking\modelScorer.ts
- [getModelMatchCategory](./frontend/server/ranking/modelScorer/getModelMatchCategory.md)
- [scoreModel](./frontend/server/ranking/modelScorer/scoreModel.md)

### server\search\cache.ts
- [computeCacheKey](./frontend/server/search/cache/computeCacheKey.md)
- [getCachedSearch](./frontend/server/search/cache/getCachedSearch.md)
- [setCachedSearch](./frontend/server/search/cache/setCachedSearch.md)
- [clearSearchCache](./frontend/server/search/cache/clearSearchCache.md)

### server\search\confidence.ts
- [calculateConfidenceScore](./frontend/server/search/confidence/calculateConfidenceScore.md)
- [classifyMatchCategory](./frontend/server/search/confidence/classifyMatchCategory.md)

### server\search\confidenceCalibrator.ts
- [calibrateScore](./frontend/server/search/confidenceCalibrator/calibrateScore.md)
- [categorizeRequirements](./frontend/server/search/confidenceCalibrator/categorizeRequirements.md)

### server\search\crossEncoder.ts
- [evaluateCandidateCrossEncoder](./frontend/server/search/crossEncoder/evaluateCandidateCrossEncoder.md)

### server\search\deduplication.ts
- [deduplicateCandidates](./frontend/server/search/deduplication/deduplicateCandidates.md)

### server\search\diversity.ts
- [applyMMR](./frontend/server/search/diversity/applyMMR.md)

### server\search\evaluation.ts
- [runBenchmarkEvaluation](./frontend/server/search/evaluation/runBenchmarkEvaluation.md)

### server\search\evidenceVerifier.ts
- [verifyCandidateEvidence](./frontend/server/search/evidenceVerifier/verifyCandidateEvidence.md)

### server\search\fastapiClient.ts
- [queryFastApiRecommend](./frontend/server/search/fastapiClient/queryFastApiRecommend.md)

### server\search\feedback.ts
- [recordUserFeedback](./frontend/server/search/feedback/recordUserFeedback.md)
- [getAllFeedback](./frontend/server/search/feedback/getAllFeedback.md)
- [getFeedbackSummary](./frontend/server/search/feedback/getFeedbackSummary.md)

### server\search\hardConstraints.ts
- [evaluateCandidateHardConstraints](./frontend/server/search/hardConstraints/evaluateCandidateHardConstraints.md)

### server\search\hardFilter.ts
- [evaluateHardConstraints](./frontend/server/search/hardFilter/evaluateHardConstraints.md)
- [applyHardFiltering](./frontend/server/search/hardFilter/applyHardFiltering.md)

### server\search\modalityCompatibilityMatrix.ts
- [classifyModalityGroup](./frontend/server/search/modalityCompatibilityMatrix/classifyModalityGroup.md)
- [classifyQueryModalityGroup](./frontend/server/search/modalityCompatibilityMatrix/classifyQueryModalityGroup.md)
- [checkModalityCompatibility](./frontend/server/search/modalityCompatibilityMatrix/checkModalityCompatibility.md)
- [pipelineTagToModalityGroup](./frontend/server/search/modalityCompatibilityMatrix/pipelineTagToModalityGroup.md)

### server\search\modalityParser.ts
- [extractExplicitModality](./frontend/server/search/modalityParser/extractExplicitModality.md)

### server\search\modelsFallback.ts
- [getFallbackBaselineModels](./frontend/server/search/modelsFallback/getFallbackBaselineModels.md)

### server\search\ontology.ts
- [getDynamicNegativeConcepts](./frontend/server/search/ontology/getDynamicNegativeConcepts.md)

### server\search\queryExpansion.ts
- [expandQueries](./frontend/server/search/queryExpansion/expandQueries.md)

### server\search\queryUnderstanding.ts
- [parseResearchQuery](./frontend/server/search/queryUnderstanding/parseResearchQuery.md)
- [understandQuery](./frontend/server/search/queryUnderstanding/understandQuery.md)

### server\search\ranking.ts
- [buildResearchGraph](./frontend/server/search/ranking/buildResearchGraph.md)

### server\search\requirementExtractor.ts
- [extractRequirementProfile](./frontend/server/search/requirementExtractor/extractRequirementProfile.md)
- [getRequirementProfile](./frontend/server/search/requirementExtractor/getRequirementProfile.md)

### server\search\requirementMatcher.ts
- [computeRequirementCoverage](./frontend/server/search/requirementMatcher/computeRequirementCoverage.md)
- [computeHardConstraintScore](./frontend/server/search/requirementMatcher/computeHardConstraintScore.md)

### server\search\reranker.ts
- [rerankCandidatesWithConfidence](./frontend/server/search/reranker/rerankCandidatesWithConfidence.md)

### server\search\retrieval.ts
- [advancedSearch](./frontend/server/search/retrieval/advancedSearch.md)

### server\search\scoring.ts
- [evaluateResultSetConfidence](./frontend/server/search/scoring/evaluateResultSetConfidence.md)
- [calculateBM25LexicalScore](./frontend/server/search/scoring/calculateBM25LexicalScore.md)
- [computeAdaptiveWeights](./frontend/server/search/scoring/computeAdaptiveWeights.md)
- [scoreCandidate](./frontend/server/search/scoring/scoreCandidate.md)

### server\search\searchEngine.ts
- [advancedResearchSearch](./frontend/server/search/searchEngine/advancedResearchSearch.md)

### server\search\semanticSearch.ts
- [computeCandidateSemanticScore](./frontend/server/search/semanticSearch/computeCandidateSemanticScore.md)
- [rankBySemanticSimilarity](./frontend/server/search/semanticSearch/rankBySemanticSimilarity.md)

### server\search\taskAlignmentMatrix.ts
- [classifyTask](./frontend/server/search/taskAlignmentMatrix/classifyTask.md)
- [pipelineTagToCanonicalTask](./frontend/server/search/taskAlignmentMatrix/pipelineTagToCanonicalTask.md)
- [canonicalTaskToHFPipelineTag](./frontend/server/search/taskAlignmentMatrix/canonicalTaskToHFPipelineTag.md)
- [getTaskAlignmentScore](./frontend/server/search/taskAlignmentMatrix/getTaskAlignmentScore.md)
- [classifyCandidateTask](./frontend/server/search/taskAlignmentMatrix/classifyCandidateTask.md)

### server\search\providers\arxiv.ts
- [fetchArxivPapers](./frontend/server/search/providers/arxiv/fetchArxivPapers.md)

### server\search\providers\curatedBenchmarks.ts
- [getCuratedBenchmarksForQuery](./frontend/server/search/providers/curatedBenchmarks/getCuratedBenchmarksForQuery.md)

### server\search\providers\huggingface.ts
- [fetchHuggingFaceDatasets](./frontend/server/search/providers/huggingface/fetchHuggingFaceDatasets.md)
- [fetchHuggingFaceModels](./frontend/server/search/providers/huggingface/fetchHuggingFaceModels.md)

### server\search\providers\index.ts
- [retrieveAllCandidates](./frontend/server/search/providers/index/retrieveAllCandidates.md)

### server\search\providers\kaggle.ts
- [fetchKaggleCandidates](./frontend/server/search/providers/kaggle/fetchKaggleCandidates.md)

### server\search\providers\openAlex.ts
- [fetchOpenAlexPapers](./frontend/server/search/providers/openAlex/fetchOpenAlexPapers.md)

### server\search\providers\pubmed.ts
- [fetchPubMedPapers](./frontend/server/search/providers/pubmed/fetchPubMedPapers.md)

### server\search\providers\semanticScholar.ts
- [fetchSemanticScholarPapers](./frontend/server/search/providers/semanticScholar/fetchSemanticScholarPapers.md)

### server\security\csrf.ts
- [generateCsrfToken](./frontend/server/security/csrf/generateCsrfToken.md)
- [verifyCsrfTokenSignature](./frontend/server/security/csrf/verifyCsrfTokenSignature.md)
- [validateCsrf](./frontend/server/security/csrf/validateCsrf.md)
- [setCsrfCookie](./frontend/server/security/csrf/setCsrfCookie.md)

### server\security\promptShield.ts
- [scanAndShieldPrompt](./frontend/server/security/promptShield/scanAndShieldPrompt.md)
- [encapsulateUserQuery](./frontend/server/security/promptShield/encapsulateUserQuery.md)
- [getHardenedSystemInstruction](./frontend/server/security/promptShield/getHardenedSystemInstruction.md)
- [guardrailOutput](./frontend/server/security/promptShield/guardrailOutput.md)

### server\security\rate-limit.ts
- [isRateLimited](./frontend/server/security/rate-limit/isRateLimited.md)
- [extractIp](./frontend/server/security/rate-limit/extractIp.md)

### server\security\sanitize.ts
- [stripHtml](./frontend/server/security/sanitize/stripHtml.md)
- [escapeHtml](./frontend/server/security/sanitize/escapeHtml.md)
- [sanitizeText](./frontend/server/security/sanitize/sanitizeText.md)
- [sanitizeEmail](./frontend/server/security/sanitize/sanitizeEmail.md)

### server\security\securityLogger.ts
- [hashIp](./frontend/server/security/securityLogger/hashIp.md)
- [logSecurityEvent](./frontend/server/security/securityLogger/logSecurityEvent.md)
- [getRecentSecurityLogs](./frontend/server/security/securityLogger/getRecentSecurityLogs.md)

### server\security\uploadValidator.ts
- [verifyMagicBytes](./frontend/server/security/uploadValidator/verifyMagicBytes.md)
- [validateUploadedFile](./frontend/server/security/uploadValidator/validateUploadedFile.md)

### server\security\usageLimiter.ts
- [capOutputTokens](./frontend/server/security/usageLimiter/capOutputTokens.md)
- [checkAiQuota](./frontend/server/security/usageLimiter/checkAiQuota.md)
- [recordAiUsage](./frontend/server/security/usageLimiter/recordAiUsage.md)
- [getUserUsageStats](./frontend/server/security/usageLimiter/getUserUsageStats.md)

### utils\apiClient.ts
- [searchResources](./frontend/utils/apiClient/searchResources.md)
- [getDiagnostics](./frontend/utils/apiClient/getDiagnostics.md)
- [sendChatMessage](./frontend/utils/apiClient/sendChatMessage.md)

### utils\formatting.ts
- [formatFileSize](./frontend/utils/formatting/formatFileSize.md)
- [formatDate](./frontend/utils/formatting/formatDate.md)
- [formatNumber](./frontend/utils/formatting/formatNumber.md)
- [truncateText](./frontend/utils/formatting/truncateText.md)
- [formatConfidence](./frontend/utils/formatting/formatConfidence.md)

### utils\validation.ts
- [isValidEmail](./frontend/utils/validation/isValidEmail.md)
- [isValidQueryLength](./frontend/utils/validation/isValidQueryLength.md)
- [sanitizeInput](./frontend/utils/validation/sanitizeInput.md)
- [validateProjectSpec](./frontend/utils/validation/validateProjectSpec.md)
- [validateDataset](./frontend/utils/validation/validateDataset.md)

