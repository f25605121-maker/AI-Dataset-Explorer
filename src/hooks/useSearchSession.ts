'use client';

import { useContext } from 'react';
import SearchSessionContext, { SearchSessionState } from '@/context/SearchSessionContext';
import { TRENDING_TEMPLATES } from '@/fixtures/trending-templates';

export type SearchSessionContextType = SearchSessionState;

const defaultTemplate = TRENDING_TEMPLATES[0] as any;

const fallbackState: SearchSessionState = {
  query: '',
  searchResult: null,
  isLoading: false,
  searchProgress: 0,
  searchStage: '',
  error: null,
  pinnedAssets: [],
  selectedDataset: null,
  selectedModel: null,
  activeTemplate: defaultTemplate,
  activeTab: 'all',
  setQuery: () => {},
  setSearchResult: () => {},
  setSearchSession: () => {},
  setIsLoading: () => {},
  setError: () => {},
  setActiveTab: () => {},
  pinAsset: () => false,
  unpinAsset: () => {},
  togglePinAsset: () => {},
  clearPinnedAssets: () => {},
  isAssetPinned: () => false,
  setSelectedDataset: () => {},
  setSelectedModel: () => {},
  performSearch: async () => null,
  loadTemplate: () => {},
  resetSession: () => {},
};

export function useSearchSession(): SearchSessionState {
  const context = useContext(SearchSessionContext);
  if (!context) {
    return fallbackState;
  }
  return context;
}

export default useSearchSession;
