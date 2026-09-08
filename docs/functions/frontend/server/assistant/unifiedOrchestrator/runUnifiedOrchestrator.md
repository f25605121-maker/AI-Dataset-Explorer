# runUnifiedOrchestrator

**File:** `src\server\assistant\unifiedOrchestrator.ts`

## Description
Static greeting responses — rotated for variety */
const GREETING_RESPONSES = [
    "Hello! I'm your AI Dataset Explorer assistant. I can help you find datasets, discover models, analyze architectures, or answer ML questions. What would you like to explore?",
    "Hey there! Ready to help you find the perfect dataset or model for your ML project. What are you working on?",
    "Hi! Tell me about your project and I'll help you discover relevant datasets, models, and get a detailed analysis.",
];

function getGreetingResponse(): string {
    return GREETING_RESPONSES[Math.floor(Math.random() * GREETING_RESPONSES.length)];
}

function intentToResponseType(intent: IntentClassification['intent']): AssistantResponse['type'] {
    switch (intent) {
        case 'GREETING': return 'greeting';
        case 'GENERAL_AI': return 'general';
        case 'EXPLAIN_CONCEPT': return 'general';
        case 'DATASET_SEARCH': return 'dataset';
        case 'MODEL_SEARCH': return 'model';
        case 'MODEL_ANALYSIS': return 'model';
        case 'ARCHITECTURE_ANALYSIS': return 'model';
        case 'DATASET_ANALYSIS': return 'dataset';
        case 'RESEARCH_SEARCH': return 'research';
        case 'EXACT_DATASET_RESEARCH': return 'research';
        case 'PROJECT_ANALYSIS': return 'project';
        case 'DATASET_MODEL_MATCHING': return 'project';
        case 'TRAINING_ADVICE': return 'hybrid';
        case 'HARDWARE_RECOMMENDATION': return 'hybrid';
        case 'HYBRID': return 'hybrid';
        case 'COMPARISON':
        case 'DATASET_COMPARISON':
        case 'MODEL_COMPARISON': return 'comparison';
        default: return 'general';
    }
}

export interface OrchestratorOptions {
    query: string;
    messages: Message[];
    context?: any;
    searchId: string;
}

/**
Unified orchestrator — routes queries to appropriate pipelines.
SEARCH intents → runDatasetPipeline (evidence-based, no hallucination)
GENERAL intents → runGeneralAIPipeline (conversational)
HYBRID → both in parallel
COMPARISON/TRAINING/ARCHITECTURE → general AI with search context if available

## Signature
```typescript
function runUnifiedOrchestrator(options: OrchestratorOptions): Promise<Partial<AssistantResponse>>
```
