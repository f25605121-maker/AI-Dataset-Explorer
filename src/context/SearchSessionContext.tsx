"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import {
  SearchResultPayload,
  SearchIntent,
  HardwareProfile,
  FeasibilitySummary,
  ResearchLandscapeSummary,
  ResearchSynthesisSummary,
  ExtractedConstraints,
} from '@/types/search';
import {
  Dataset,
  PretrainedModel,
  Paper,
  DiscoveredAsset,
  PinnedAsset,
} from '@/types/assets';
import { DomainTemplate } from '@/types/roadmap';
import { TRENDING_TEMPLATES } from '@/fixtures/trending-templates';
import { useSearchProgress } from '@/hooks/useSearchProgress';

export interface SearchSessionState {
  query: string;
  searchResult: SearchResultPayload | null;
  isLoading: boolean;
  searchProgress: number;
  searchStage: string;
  error: string | null;
  pinnedAssets: PinnedAsset[];
  selectedDataset: Dataset | null;
  selectedModel: PretrainedModel | null;
  activeTemplate: DomainTemplate;
  activeTab: 'all' | 'datasets' | 'models' | 'papers';

  // State Mutators
  setQuery: (query: string) => void;
  setSearchResult: (results: SearchResultPayload | null) => void;
  setSearchSession: (query: string, results: any) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveTab: (tab: 'all' | 'datasets' | 'models' | 'papers') => void;

  // Pinned Asset Actions (Max 4)
  pinAsset: (asset: DiscoveredAsset) => boolean;
  unpinAsset: (id: string) => void;
  togglePinAsset: (asset: DiscoveredAsset) => void;
  clearPinnedAssets: () => void;
  isAssetPinned: (id: string) => boolean;

  // Selected Focus Asset Actions
  setSelectedDataset: (dataset: Dataset | null) => void;
  setSelectedModel: (model: PretrainedModel | null) => void;

  // Orchestrators
  performSearch: (searchQuery: string) => Promise<SearchResultPayload | null>;
  loadTemplate: (templateId: string) => void;
  resetSession: () => void;
}

function getStorageKeys(userKey: string) {
  const prefix = `aide_session_u_${encodeURIComponent(userKey)}`;
  return {
    QUERY: `${prefix}_query_v3`,
    RESULTS: `${prefix}_results_v3`,
    PINNED: `${prefix}_pinned_v3`,
    TEMPLATE_ID: `${prefix}_template_id_v3`,
  };
}

const defaultTemplate: DomainTemplate = TRENDING_TEMPLATES[0] as any as DomainTemplate;

const SearchSessionContext = createContext<SearchSessionState | undefined>(undefined);

function normalizePayload(raw: any): SearchResultPayload {
  const datasets: Dataset[] = raw.datasets || raw.results?.kaggle || [];
  const models: PretrainedModel[] = raw.models || raw.results?.hfModels || [];
  const papers: Paper[] = raw.papers || raw.results?.papers || [];

  return {
    ...raw,
    datasets,
    models,
    papers,
    discoveredAssets: {
      datasets,
      models,
      papers,
    },
    intent: (raw.intent as SearchIntent) || (raw.isGeneralQuery ? 'GENERAL_AI' : 'DATASET_SEARCH'),
  };
}

export function SearchSessionProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const userKey = session?.user
    ? ((session.user as any).id || session.user.email || 'authenticated')
    : 'guest';

  const userKeyRef = useRef(userKey);
  userKeyRef.current = userKey;

  const storageKeys = getStorageKeys(userKey);
  const storageKeysRef = useRef(storageKeys);
  storageKeysRef.current = storageKeys;

  const [query, setQueryState] = useState<string>('');
  const [searchResult, setSearchResultState] = useState<SearchResultPayload | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const {
    progress: searchProgress,
    stage: searchStage,
    startProgress,
    completeProgress,
    resetProgress,
  } = useSearchProgress();
  const [error, setError] = useState<string | null>(null);
  const [pinnedAssets, setPinnedAssets] = useState<PinnedAsset[]>([]);
  const [selectedDataset, setSelectedDatasetState] = useState<Dataset | null>(null);
  const [selectedModel, setSelectedModelState] = useState<PretrainedModel | null>(null);
  const [activeTemplate, setActiveTemplateState] = useState<DomainTemplate>(defaultTemplate);
  const [activeTab, setActiveTab] = useState<'all' | 'datasets' | 'models' | 'papers'>('all');
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Hydrate from user-scoped localStorage whenever userKey changes (login, logout, switch account)
  useEffect(() => {
    // Clean up legacy unscoped keys
    try {
      localStorage.removeItem('aide_session_query_v2');
      localStorage.removeItem('aide_session_results_v2');
      localStorage.removeItem('aide_session_pinned_v2');
      localStorage.removeItem('aide_session_template_id_v2');
    } catch {}

    const keys = getStorageKeys(userKey);
    try {
      const savedQuery = localStorage.getItem(keys.QUERY);
      const savedResults = localStorage.getItem(keys.RESULTS);
      const savedPinned = localStorage.getItem(keys.PINNED);
      const savedTemplateId = localStorage.getItem(keys.TEMPLATE_ID);

      setQueryState(savedQuery || '');

      if (savedResults) {
        try {
          const parsed = JSON.parse(savedResults);
          const normalized = normalizePayload(parsed);
          setSearchResultState(normalized);
          if (normalized.datasets?.[0]) setSelectedDatasetState(normalized.datasets[0]);
          else setSelectedDatasetState(null);
          if (normalized.models?.[0]) setSelectedModelState(normalized.models[0]);
          else setSelectedModelState(null);
        } catch {
          setSearchResultState(null);
          setSelectedDatasetState(null);
          setSelectedModelState(null);
        }
      } else {
        setSearchResultState(null);
        setSelectedDatasetState(null);
        setSelectedModelState(null);
      }

      if (savedPinned) {
        try {
          const parsed = JSON.parse(savedPinned);
          if (Array.isArray(parsed)) setPinnedAssets(parsed);
          else setPinnedAssets([]);
        } catch {
          setPinnedAssets([]);
        }
      } else {
        setPinnedAssets([]);
      }

      if (savedTemplateId) {
        const found = TRENDING_TEMPLATES.find((t) => t.id === savedTemplateId);
        if (found) setActiveTemplateState(found as any as DomainTemplate);
        else setActiveTemplateState(defaultTemplate);
      } else {
        setActiveTemplateState(defaultTemplate);
      }
    } catch {}
    setIsHydrated(true);
  }, [userKey]);

  const setQuery = useCallback((newQuery: string) => {
    setQueryState(newQuery);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKeysRef.current.QUERY, newQuery);
      } catch {}
    }
  }, []);

  const setSearchResult = useCallback((results: SearchResultPayload | null) => {
    const normalized = results ? normalizePayload(results) : null;
    setSearchResultState(normalized);

    if (typeof window !== 'undefined') {
      if (normalized) {
        try {
          localStorage.setItem(storageKeysRef.current.RESULTS, JSON.stringify(normalized));
        } catch {}
      } else {
        localStorage.removeItem(storageKeysRef.current.RESULTS);
      }
    }

    const datasetsCount = normalized?.discoveredAssets?.datasets?.length ?? normalized?.datasets?.length ?? 0;
    const modelsCount = normalized?.discoveredAssets?.models?.length ?? normalized?.models?.length ?? 0;
    const isConversational = Boolean(
      normalized?.isGeneralQuery ||
      normalized?.intent === 'CONVERSATIONAL' ||
      normalized?.intent === 'GENERAL' ||
      normalized?.intent === 'GREETING'
    );

    if (normalized && ((datasetsCount === 0 && modelsCount === 0) || isConversational)) {
      setPinnedAssets([]);
      setSelectedDatasetState(null);
      setSelectedModelState(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem(storageKeysRef.current.PINNED);
      }
    } else {
      if (normalized?.datasets?.[0]) {
        setSelectedDatasetState(normalized.datasets[0]);
      } else {
        setSelectedDatasetState(null);
      }
      if (normalized?.models?.[0]) {
        setSelectedModelState(normalized.models[0]);
      } else {
        setSelectedModelState(null);
      }
    }
  }, []);

  const setSearchSession = useCallback((newQuery: string, results: any) => {
    setQuery(newQuery);
    setSearchResult(results);
  }, [setQuery, setSearchResult]);

  // Pinned Asset Management
  const isAssetPinned = useCallback(
    (id: string) => {
      return pinnedAssets.some((item) => item.id === id);
    },
    [pinnedAssets]
  );

  const pinAsset = useCallback(
    (asset: DiscoveredAsset): boolean => {
      if (pinnedAssets.length >= 4) return false;
      if (pinnedAssets.some((item) => item.id === asset.id)) return true;

      const updated = [...pinnedAssets, { ...asset, pinnedAt: asset.pinnedAt || Date.now() }];
      setPinnedAssets(updated);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKeysRef.current.PINNED, JSON.stringify(updated));
        } catch {}
      }
      return true;
    },
    [pinnedAssets]
  );

  const unpinAsset = useCallback(
    (id: string) => {
      const updated = pinnedAssets.filter((item) => item.id !== id);
      setPinnedAssets(updated);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKeysRef.current.PINNED, JSON.stringify(updated));
        } catch {}
      }
    },
    [pinnedAssets]
  );

  const togglePinAsset = useCallback(
    (asset: DiscoveredAsset) => {
      if (isAssetPinned(asset.id)) {
        unpinAsset(asset.id);
      } else {
        pinAsset(asset);
      }
    },
    [isAssetPinned, pinAsset, unpinAsset]
  );

  const clearPinnedAssets = useCallback(() => {
    setPinnedAssets([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKeysRef.current.PINNED);
      } catch {}
    }
  }, []);

  const setSelectedDataset = useCallback((dataset: Dataset | null) => {
    setSelectedDatasetState(dataset);
  }, []);

  const setSelectedModel = useCallback((model: PretrainedModel | null) => {
    setSelectedModelState(model);
  }, []);

  // Search Engine Orchestration
  const performSearch = useCallback(
    async (searchQuery: string): Promise<SearchResultPayload | null> => {
      const trimmed = searchQuery.trim();
      if (!trimmed) return null;

      setIsLoading(true);
      setError(null);
      setQuery(trimmed);
      startProgress();

      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmed }),
        });

        if (!response.ok) {
          resetProgress();
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData?.error?.message || errData?.message || `Search request failed with status ${response.status}`);
        }

        const data = await response.json();
        await completeProgress();
        const normalized = normalizePayload(data);
        setSearchResult(normalized);
        return normalized;
      } catch (err: any) {
        resetProgress();
        const message = err?.message || 'An unexpected error occurred while searching.';
        setError(message);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [setQuery, setSearchResult, startProgress, completeProgress, resetProgress]
  );

  // Template Blueprint Loader
  const loadTemplate = useCallback(
    (templateId: string) => {
      const tpl = TRENDING_TEMPLATES.find((t) => t.id === templateId) || TRENDING_TEMPLATES[0];
      const typedTpl = tpl as any as DomainTemplate;
      setActiveTemplateState(typedTpl);
      setQueryState(tpl.query);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(storageKeysRef.current.TEMPLATE_ID, tpl.id);
          localStorage.setItem(storageKeysRef.current.QUERY, tpl.query);
        } catch {}
      }

      const mockPayload: SearchResultPayload = {
        success: true,
        searchId: `template-${tpl.id}`,
        isGeneralQuery: false,
        intent: 'DATASET_SEARCH',
        domainAndTask: `${tpl.domain} · ${tpl.category}`,
        modality: tpl.targetModality,
        summary: {
          projectTitle: tpl.title,
          domain: tpl.domain,
          task: tpl.category,
          dataType: tpl.targetModality,
          datasetsFound: tpl.datasets.length,
          modelsFound: tpl.models.length,
          papersFound: tpl.papers.length,
          bestDataset: tpl.datasets[0] as any,
          bestModel: tpl.models[0] as any,
        },
        datasets: tpl.datasets as any,
        models: tpl.models as any,
        papers: tpl.papers as any,
        discoveredAssets: {
          datasets: tpl.datasets as any,
          models: tpl.models as any,
          papers: tpl.papers as any,
        },
        researchLandscape: {
          totalPapers: tpl.papers.length + 12,
          exactDatasetPapers: tpl.papers.length,
          directlyRelatedPapers: 8,
          latestPaperYear: 2024,
          researchMaturity: 'Established',
          maturityReason: 'Active peer-reviewed literature with benchmark challenges and standardized evaluation metrics.',
        },
        researchSynthesis: {
          summary: `Curated evidence for ${tpl.title}. High clinical and technical feasibility with open-source pretrained transformers and validation protocols.`,
          factsFromSource: [
            { fact: `${tpl.datasets[0]?.name} is the reference benchmark with verified annotations.`, source: 'MICCAI / IEEE' },
            { fact: `Pretrained ${tpl.models[0]?.name} reduces convergence time by 65%.`, source: 'Hugging Face Hub' },
          ],
          aiInterpretation: [
            'Suitable for immediate rapid prototyping and benchmark comparison.',
            'Modality requires domain preprocessing and class-weighted loss configuration.',
          ],
        },
        hardware: {
          gpu_recommendation: tpl.hardwareProfile.recommendedGpu,
          vram_estimate: tpl.hardwareProfile.trainingVram,
          training_time_estimate: `${tpl.hardwareProfile.estimatedTrainingHours} hours`,
          cost_estimate: tpl.hardwareProfile.costPerRun,
        },
        feasibility: {
          status: 'High Feasibility',
          gpuTarget: tpl.hardwareProfile.recommendedGpu,
          feasibility_score: 95,
          level: 'High Feasibility',
        },
      };

      setSearchResult(mockPayload);
      setSelectedDatasetState(tpl.datasets[0] as any);
      setSelectedModelState(tpl.models[0] as any);

      setPinnedAssets((prev) => {
        if (prev.length === 0) {
          const autoPins: DiscoveredAsset[] = [
            {
              id: tpl.datasets[0].id,
              name: tpl.datasets[0].title || tpl.datasets[0].name,
              title: tpl.datasets[0].title || tpl.datasets[0].name,
              type: 'dataset',
              modality: tpl.targetModality,
              subtitle: tpl.datasets[0].subtitle,
              source: tpl.datasets[0].source || 'Kaggle',
              score: tpl.datasets[0].matchScore,
              badge: 'Dataset',
              url: tpl.datasets[0].url,
              data: tpl.datasets[0],
              pinnedAt: Date.now(),
            },
            {
              id: tpl.models[0].id,
              name: tpl.models[0].name || tpl.models[0].id,
              title: tpl.models[0].name || tpl.models[0].id,
              type: 'model',
              subtitle: tpl.models[0].architecture,
              source: 'Hugging Face',
              score: tpl.models[0].matchScore,
              badge: 'Model',
              url: tpl.models[0].url,
              data: tpl.models[0],
              pinnedAt: Date.now() + 1,
            },
          ];
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem(storageKeysRef.current.PINNED, JSON.stringify(autoPins));
            } catch {}
          }
          return autoPins;
        }
        return prev;
      });
    },
    [setSearchResult]
  );

  const resetSession = useCallback(() => {
    setQueryState('');
    setSearchResultState(null);
    setError(null);
    setPinnedAssets([]);
    setSelectedDatasetState(null);
    setSelectedModelState(null);
    setActiveTemplateState(defaultTemplate);
    setActiveTab('all');

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKeysRef.current.QUERY);
        localStorage.removeItem(storageKeysRef.current.RESULTS);
        localStorage.removeItem(storageKeysRef.current.PINNED);
        localStorage.removeItem(storageKeysRef.current.TEMPLATE_ID);
      } catch {}
    }
  }, []);

  const value: SearchSessionState = {
    query,
    searchResult,
    isLoading,
    searchProgress,
    searchStage,
    error,
    pinnedAssets,
    selectedDataset,
    selectedModel,
    activeTemplate,
    activeTab,
    setQuery,
    setSearchResult,
    setSearchSession,
    setIsLoading,
    setError,
    setActiveTab,
    pinAsset,
    unpinAsset,
    togglePinAsset,
    clearPinnedAssets,
    isAssetPinned,
    setSelectedDataset,
    setSelectedModel,
    performSearch,
    loadTemplate,
    resetSession,
  };

  return <SearchSessionContext.Provider value={value}>{children}</SearchSessionContext.Provider>;
}

export { useSearchSession } from '@/hooks/useSearchSession';
export type { PinnedAsset } from '@/types/assets';
export default SearchSessionContext;
