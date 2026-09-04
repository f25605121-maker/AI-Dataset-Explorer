import type { ConfidenceBreakdown } from '@/server/ranking/confidenceCalculator';

export type FactState = 'CONFIRMED' | 'INFERRED' | 'UNKNOWN';

export interface EvidenceFact<T> {
    value: T;
    state: FactState;
    confidence: number;
    source: string;
    verified: boolean;
    reasoning?: string;
}

export interface ExtractedQueryEntities {
    targetAnatomy: string[];       // e.g., ["abdomen", "abdominal", "liver", "kidney", "pancreas"]
    excludedAnatomy: string[];     // e.g., ["brain", "glioma", "cardiac", "chest", "prostate"]
    targetModality: string;        // e.g., "MRI"
    sequenceSubtype?: string;      // e.g., "DCE", "contrast-enhanced", "T1-weighted"
    taskType: string;              // e.g., "segmentation"
    dimensionality: "2D" | "3D" | "4D" | "any";
    coreSearchKeywords: string[];  // e.g., ["abdominal organ MRI segmentation", "3D abdominal tumor MRI"]
}

export interface ProjectSpec {
    intent: string;
    entity_type: 'dataset' | 'model' | 'architecture' | 'unknown' | string;
    domain: string;
    subdomain: string;
    task: string;
    target: string; // E.g., 'coronary arteries', 'brain tumor'
    modality: string;
    preferred_sources: string[];
    constraints: Record<string, any>;
    keywords: string[];
    entities?: ExtractedQueryEntities;

    // Legacy mapping (to be phased out, but keeping for compatibility during transition)
    problem_statement?: string;
    title?: string;
    data_modality?: string;
    input_type?: string;
    secondary_tasks?: string[];
    target_type?: string;
    target_labels?: string[];
    expected_output?: string;
    primary_architecture?: string;
    alternative_architectures?: string[];
    architecture_reasoning?: string;
    explicit_facts?: string[];
    inferred_facts?: string[];
    unknown_facts?: string[];
    ambiguity_notes?: string[];
    evaluation_metrics?: any;
    dataset_size_requirement?: string;
    deployment_requirement?: string;
    preferred_language?: string;
    interpretability_requirement?: string;
    privacy_sensitivity?: string;

    confidence?: ConfidenceBreakdown;

    // Explicit evidence wrapper if we want to store it per field
    evidence?: Record<string, EvidenceFact<any>>;
}

export interface NormalizedDataset {
    id: string;
    name: string;
    title?: string;
    subtitle?: string;
    source: 'Kaggle' | 'Hugging Face' | string;
    url: string;
    description: string;
    domain: string;
    subdomain: string;
    task: string;
    modality?: string; // Legacy UI uses this
    modalities: string[];
    formats: string[];
    languages: string[];
    license: string;
    size: string; // e.g. "5 GB" or "500MB" or sizeBytes number
    sizeBytes: number | null;
    downloads: number | null;
    likes: number | null;
    creator: string;
    tags: string[];
    schema: Record<string, any>;
    splits: Record<string, any>;
    features: string[];
    sample_count: number | string | null;
    image_resolution: string | null;
    dimensionality?: '2D' | '3D' | '4D' | 'unknown';
    anatomy?: string[];
    sequenceSubtypes?: string[];
    video: boolean;
    related_models: string[]; // Related model IDs
    raw_metadata: Record<string, unknown>;
    evidence: EvidenceFact<any>[];
    targetLabels?: string[]; // Legacy

    // Scoring
    metadataQuality: number;
    matchScore: number;
    scoreBreakdown: {
        semantic?: number;
        task: number;
        modality: number;
        domain: number;
        subdomain?: number;
        target: number;
        metadata: number;
        quality?: number;
        popularity?: number;
    };
    rejected: boolean;
    rejectionReason: string | null;
    matchReason: string;
}

export interface NormalizedModel {
    id: string;
    name: string;
    source: 'Hugging Face' | string;
    url: string;
    task: string;
    architecture: string;
    base_model: string;
    parameters: string | number | null;
    modality?: string;
    modalities: string[];
    languages: string[];
    framework: string;
    license: string;
    training_data: string[];
    datasets_used: string[];
    quantization: string | null;
    context_length: number | null;
    input_types: string[];
    output_types: string[];
    hardware_requirements?: any;
    metrics: Record<string, any>;
    evidence: EvidenceFact<any>[];
    benchmarkEvidence?: string[]; // Legacy

    downloads: number | null;
    likes: number | null;

    // Scoring
    matchScore: number;
    scoreBreakdown: {
        task: number;
        modality: number;
        architecture: number;
        compatibility?: number; // Dataset <-> Model score
        popularity: number;
        benchmark?: number; // Legacy
        efficiency?: number; // Legacy
    };
    rejected: boolean;
    rejectionReason: string | null;
    matchReason: string;
}

export interface ProjectFeasibility {
    datasetAvailability: number;
    modelAvailability: number;
    computationalFeasibility: number;
    documentation: number;
    datasetQuality: number;
    overallScore: number;
    level: string;
}

export * from './papers';
import type { NormalizedPaper, ResearchLandscape, ResearchSynthesis } from './papers';

export interface HardwareEstimate {
    gpu: { recommendedClass: string; vramRequirement: string; };
    ram: { minimum: string; recommended: string; };
    storage: { dataset: string; workingSpace: string; };
    cloudAlternative: string;
}

export interface SearchResponsePayload {
    intent: string;
    analysis: ProjectSpec | null;
    results: {
        kaggle: NormalizedDataset[];
        hfModels: NormalizedModel[];
        hfDatasets: NormalizedDataset[];
        papers?: NormalizedPaper[];
    };
    summary: {
        projectTitle: string;
        domain: string;
        subdomain: string;
        task: string;
        dataType: string;
        datasetsFound: number;
        modelsFound: number;
        papersFound?: number;
        bestDataset: NormalizedDataset | null;
        bestModel: NormalizedModel | null;
        bestPaper?: NormalizedPaper | null;
    };
    feasibility: ProjectFeasibility | null;
    hardware: HardwareEstimate | null;
    papers?: NormalizedPaper[];
    researchLandscape?: ResearchLandscape | null;
    researchSynthesis?: ResearchSynthesis | string | null;
}
