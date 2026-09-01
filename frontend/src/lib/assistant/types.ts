export type Message = {
    role: 'user' | 'assistant';
    content: string;
};

export type IntentType =
    | 'GREETING'
    | 'GENERAL_AI'
    | 'EXPLAIN_CONCEPT'
    | 'DATASET_SEARCH'
    | 'MODEL_SEARCH'
    | 'PROJECT_ANALYSIS'
    | 'HYBRID'
    | 'COMPARISON'
    | 'DATASET_ANALYSIS'
    | 'MODEL_ANALYSIS'
    | 'DATASET_COMPARISON'
    | 'MODEL_COMPARISON'
    | 'DATASET_MODEL_MATCHING'
    | 'TRAINING_ADVICE'
    | 'ARCHITECTURE_ANALYSIS'
    | 'HARDWARE_RECOMMENDATION';

/** All valid intent values for runtime validation */
export const VALID_INTENTS: IntentType[] = [
    'GREETING', 'GENERAL_AI', 'EXPLAIN_CONCEPT',
    'DATASET_SEARCH', 'MODEL_SEARCH', 'PROJECT_ANALYSIS',
    'HYBRID', 'COMPARISON', 'DATASET_ANALYSIS', 'MODEL_ANALYSIS',
    'DATASET_COMPARISON', 'MODEL_COMPARISON', 'DATASET_MODEL_MATCHING',
    'TRAINING_ADVICE', 'ARCHITECTURE_ANALYSIS', 'HARDWARE_RECOMMENDATION'
];

/** Intents that require external dataset/model search API calls */
export const SEARCH_INTENTS: IntentType[] = [
    'DATASET_SEARCH', 'MODEL_SEARCH', 'PROJECT_ANALYSIS', 'HYBRID', 'DATASET_MODEL_MATCHING'
];

/** Intents that require a conversational AI response */
export const AI_RESPONSE_INTENTS: IntentType[] = [
    'GREETING', 'GENERAL_AI', 'EXPLAIN_CONCEPT', 'HYBRID', 'COMPARISON',
    'TRAINING_ADVICE', 'ARCHITECTURE_ANALYSIS', 'HARDWARE_RECOMMENDATION',
    'DATASET_ANALYSIS', 'MODEL_ANALYSIS', 'DATASET_COMPARISON', 'MODEL_COMPARISON'
];

export interface ExtractedRequirements {
    domain?: string;
    subdomain?: string;
    modality?: string;
    task?: string;
    target?: string;
    entity_type?: string;
    keywords?: string[];
}

export interface IntentClassification {
    intent: IntentType;
    confidence: number;
    datasetRequired: boolean;
    generalAnswerRequired: boolean;
    searchQuery: string;
    reason: string;
    requirements?: ExtractedRequirements;
}

export interface AssistantRequest {
    messages: Message[];
    conversationId?: string;
    context?: any;
}

export interface AssistantResponse {
    type: 'general' | 'dataset' | 'hybrid' | 'model' | 'project' | 'comparison' | 'greeting';
    answer?: string;

    // Dataset-related fields
    analysis?: any;
    summary?: any;
    hardware?: any;
    feasibility?: any;
    searchCoverage?: any;
    datasetCompatibility?: any;
    labelMapping?: any;
    recommendationCategories?: any;
    smartRecommendation?: any;
    apiAudit?: any;
    datasets?: any[];
    models?: any[];
    using_fallback_datasets?: boolean;
    ai_mode?: 'LIVE' | 'MOCK';

    intentDetails?: IntentClassification;
    message?: string;
}
