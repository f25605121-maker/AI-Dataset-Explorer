/**
 * Asset Domain Types for AI Dataset Explorer
 * Centralized interfaces for Datasets, Models, Papers, and polymorphic asset wrappers.
 */

export interface Dataset {
  id: string;
  name: string;
  title?: string;
  subtitle?: string;
  description?: string;
  url: string;
  creator?: string;
  creatorUrl?: string;
  creatorName?: string;
  ref?: string;
  source?: 'kaggle' | 'huggingface' | 'open_source' | 'academic' | string;
  matchScore: number;
  relevanceScore?: number;
  confidenceScore?: number;
  modality?: string;
  sizeBytes?: number | null;
  datasetSize?: number | null;
  sizeFormatted?: string;
  size?: string;
  license?: string;
  downloads?: number | null;
  likes?: number | null;
  usabilityRating?: number | string;
  tags?: string[];
  formats?: string[];
  patientCount?: string;
  slicesCount?: string;
  classBalance?: string;
  annotationStandard?: string;
  commercialLicenseBadge?: 'COMMERCIAL' | 'ACADEMIC' | 'RESTRICTED' | string;
  badge?: string;
  tier?: string;
  matchReason?: string;
  rejectionReason?: string | null;
  rejected?: boolean;
  evidenceLevel?: 'VERIFIED' | 'HIGH_RELEVANCE' | 'PEER_REVIEWED' | 'PROVISIONAL' | 'SUPPORTED' | 'PARTIAL' | 'UNVERIFIED' | string;
  evidenceSources?: string[];
  evidenceStrength?: number;
  evidence?: Array<{
    claim: string;
    evidenceText: string;
    sourceField?: string;
    confidence?: number;
  }>;
  warnings?: string[];
  scoreBreakdown?: {
    semantic?: number;
    lexical?: number;
    domain?: number;
    modality?: number;
    usability?: number;
    recency?: number;
    [key: string]: any;
  };
  matchBreakdown?: any;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface PretrainedModel {
  id: string;
  name?: string;
  architecture?: string;
  task?: string;
  pipeline?: string;
  pipelineTag?: string;
  url: string;
  author?: string;
  downloads?: number | null;
  likes?: number | null;
  matchScore: number;
  relevanceScore?: number;
  confidenceScore?: number;
  description?: string;
  paramsCount?: string;
  parameters?: string | number | null;
  architectureFamily?: string;
  contextResolution?: string;
  vramFp32?: string;
  vramFp16?: string;
  vramInt8?: string;
  recommendedBatchSize?: number;
  latencyT4?: string;
  latencyA10G?: string;
  latencyA100?: string;
  commercialLicenseBadge?: 'COMMERCIAL' | 'ACADEMIC' | 'RESTRICTED' | string;
  accuracyBenchmark?: string;
  badge?: string;
  tier?: string;
  framework?: string;
  matchReason?: string;
  rejectionReason?: string | null;
  rejected?: boolean;
  isArchitecturalBaseline?: boolean;
  helperSubtitle?: string;
  evidenceLevel?: 'VERIFIED' | 'HIGH_RELEVANCE' | 'PEER_REVIEWED' | 'PROVISIONAL' | 'SUPPORTED' | 'PARTIAL' | 'UNVERIFIED' | string;
  evidenceSources?: string[];
  evidenceStrength?: number;
  evidence?: Array<{
    claim: string;
    evidenceText: string;
    sourceField?: string;
    confidence?: number;
  }>;
  warnings?: string[];
  matchBreakdown?: any;
  scoreBreakdown?: any;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export interface Paper {
  id: string;
  title: string;
  authors?: string[];
  year?: number | null;
  publicationDate?: string | null;
  venue?: string | null;
  citationCount?: number | null;
  relevanceScore?: number;
  matchScore?: number;
  confidenceScore?: number;
  paperUrl?: string | null;
  pdfUrl?: string | null;
  doi?: string | null;
  url?: string;
  abstract?: string | null;
  tldr?: string | null;
  description?: string | null;
  isPreprint?: boolean;
  openAccess?: boolean;
  relationship?: 'EXACT_DATASET' | 'EXACT_MODEL' | 'DIRECTLY_RELATED' | 'BACKGROUND' | 'RELATED_RESEARCH' | string;
  relationshipEvidence?: string | null;
  tier?: string;
  evidenceLevel?: string;
  topics?: string[];
  whyRelevant?: string | string[] | null;
  sources?: string[];
  lastChecked?: string;
  scoreBreakdown?: any;
  matchBreakdown?: any;
  warnings?: string[];
  matchReason?: string;
  citationSource?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export type AssetType = 'dataset' | 'model' | 'paper';

export interface DiscoveredAsset {
  id: string;
  name?: string;
  title?: string;
  type: AssetType;
  modality?: string;
  subtitle?: string;
  size?: string;
  params?: string;
  sourceUrl?: string;
  url?: string;
  source?: string;
  license?: string;
  score?: number;
  badge?: string;
  data?: any;
  metadata?: Record<string, any>;
  pinnedAt?: number;
}

export type PinnedAsset = DiscoveredAsset;

// Aliases for component backwards compatibility
export type DatasetItem = Dataset;
export type ModelItem = PretrainedModel;
export type NormalizedPaper = Paper;
