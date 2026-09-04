/**
 * Search & Telemetry Domain Types for AI Dataset Explorer
 */

import { Dataset, PretrainedModel, Paper } from './assets';

export type SearchIntent =
  | 'DATASET_SEARCH'
  | 'MODEL_SEARCH'
  | 'RESEARCH_SEARCH'
  | 'EXACT_DATASET_RESEARCH'
  | 'CONVERSATIONAL'
  | 'GENERAL_AI'
  | 'EXPLAIN_CONCEPT'
  | 'GREETING'
  | 'PROJECT_ANALYSIS'
  | 'HYBRID'
  | 'COMPARISON'
  | 'GENERAL'
  | 'UNKNOWN'
  | string;

export interface UserQuery {
  raw: string;
  normalized: string;
  intent: SearchIntent;
  searchId?: string;
  timestamp?: number;
}

export interface ExtractedConstraints {
  domain: string;
  subdomain?: string;
  task: string;
  subtask?: string;
  modality: string[];
  anatomy: {
    primary: string[];
    secondary?: string[];
  };
  target: string[];
  formats: string[];
  explicitExclusions?: string[];
  commercialOnly?: boolean;
  minUsability?: number;
  maxSizeGb?: number;
  prefer3D?: boolean;
  [key: string]: any;
}

export interface QueryEntities {
  keywords: string[];
  expandedTerms?: string[];
  kaggleQueries?: string[];
  hfDatasetQueries?: string[];
  hfModelQueries?: string[];
  literatureQueries?: string[];
  [key: string]: any;
}

export interface IntentClassificationResult {
  intent: SearchIntent;
  confidence: number;
  datasetRequired: boolean;
  modelRequired?: boolean;
  papersRequired?: boolean;
  reasoning?: string;
  extractedTask?: string;
  extractedDomain?: string;
  [key: string]: any;
}

export interface SearchTiers {
  exactMatches: Dataset[];
  strongMatches: Dataset[];
  partialMatches: Dataset[];
  relatedResources: Dataset[];
}

export interface HardwareProfile {
  gpu_recommendation?: string;
  recommendedGpu?: string;
  vram_estimate?: string;
  trainingVram?: string;
  inferenceVram?: string;
  training_time_estimate?: string;
  estimatedTrainingHours?: number;
  cost_estimate?: string;
  costPerRun?: string;
  min_ram_gb?: number;
  cpu_cores?: number;
  [key: string]: any;
}

export interface FeasibilitySummary {
  status?: string;
  feasibility_score: number;
  level?: 'High Feasibility' | 'Moderate Feasibility' | 'Challenging' | 'Experimental' | string;
  gpuTarget?: string;
  bottlenecks?: string[];
  recommendations?: string[];
  rationale?: string;
  [key: string]: any;
}

export interface ResearchLandscapeSummary {
  totalPapers: number;
  exactDatasetPapers: number;
  directlyRelatedPapers: number;
  latestPaperYear: number;
  researchMaturity: 'Established' | 'Developing' | 'Emerging' | 'Emerging Discovery' | 'High / Established' | string;
  maturityReason: string;
}

export interface ResearchSynthesisSummary {
  summary: string;
  factsFromSource: Array<{ fact: string; source: string }>;
  aiInterpretation: string[];
}

export interface SearchDiagnosticsSummary {
  funnel?: {
    rawRetrieved: number;
    hardFiltered: number;
    crossEncoderScored: number;
    finalRanked: number;
    rejectionBreakdown?: Record<string, number>;
  };
  timingsMs?: {
    parsing: number;
    retrieval: number;
    ranking: number;
    total: number;
  };
  apiAudit?: {
    kaggle: { status: string; count: number; error?: string };
    huggingface: { status: string; count: number; error?: string };
    literature: { status: string; count: number; error?: string };
  };
  [key: string]: any;
}

export interface SearchResultPayload {
  success: boolean;
  searchId: string;
  type?: 'dataset' | 'general' | 'greeting' | string;
  isGeneralQuery?: boolean;
  intent: SearchIntent;
  intentDetails?: IntentClassificationResult;
  answer?: string | null;
  message?: string | null;
  summary?: {
    projectTitle: string;
    domain: string;
    subdomain?: string;
    task: string;
    dataType: string;
    datasetsFound: number;
    modelsFound: number;
    papersFound: number;
    bestDataset?: Dataset | null;
    bestModel?: PretrainedModel | null;
    bestPaper?: Paper | null;
    noBestMatch?: boolean;
    closestAlternatives?: Dataset[];
  };
  discoveredAssets?: {
    datasets: Dataset[];
    models: PretrainedModel[];
    papers: Paper[];
  };
  datasets: Dataset[];
  models: PretrainedModel[];
  papers: Paper[];
  tiers?: SearchTiers;
  researchLandscape?: ResearchLandscapeSummary | null;
  researchSynthesis?: ResearchSynthesisSummary | null;
  feasibility?: FeasibilitySummary | null;
  hardware?: HardwareProfile | null;
  analysis?: {
    title?: string;
    domain?: string;
    task?: string;
    target?: string;
    modality?: string;
    data_modality?: string;
    ai_analysis?: string;
    confidence?: { score: number; reason: string };
  };
  diagnostics?: SearchDiagnosticsSummary;
  searchDiagnostics?: any;
  telemetry?: any;
  researchGraph?: any;
  constraints?: ExtractedConstraints;
  datasetCompatibility?: any[];
  labelMapping?: any[];
  recommendationCategories?: any[];
  quota?: {
    remainingRequests: number;
    totalDaily: number;
    planTier: string;
  };
  [key: string]: any;
}
