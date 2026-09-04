import { IntentClassification, AssistantResponse, Message, SEARCH_INTENTS } from './types';
import { classifyIntent } from './classifyIntent';
import { runDatasetPipeline } from './datasetPipeline';
import { runGeneralAIPipeline } from './generalAIPipeline';

/** Static greeting responses — rotated for variety */
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
 * Unified orchestrator — routes queries to appropriate pipelines.
 *
 * SEARCH intents → runDatasetPipeline (evidence-based, no hallucination)
 * GENERAL intents → runGeneralAIPipeline (conversational)
 * HYBRID → both in parallel
 * COMPARISON/TRAINING/ARCHITECTURE → general AI with search context if available
 */
export async function runUnifiedOrchestrator(options: OrchestratorOptions): Promise<Partial<AssistantResponse>> {
    const { query, messages, context, searchId } = options;

    // Step 1: Classify intent (uses Gemini or OpenRouter via llmProvider)
    const intentClassification = await classifyIntent(query);
    const responseType = intentToResponseType(intentClassification.intent);

    let response: Partial<AssistantResponse> = {
        intentDetails: intentClassification,
        type: responseType,
    };

    console.log(`[ORCHESTRATOR] Intent: ${intentClassification.intent} (${intentClassification.confidence})`);

    // Step 2: Route to pipeline
    switch (intentClassification.intent) {

        // ── Fast path: no LLM, no external APIs ──────────────────────────
        case 'GREETING': {
            response.answer = getGreetingResponse();
            response.message = response.answer;
            break;
        }

        // ── General AI: conversational, no external search ────────────────
        case 'GENERAL_AI':
        case 'EXPLAIN_CONCEPT': {
            const answer = await runGeneralAIPipeline(messages, context);
            response.answer = answer;
            response.message = answer;
            break;
        }

        // ── Dataset search: full evidence-based pipeline ──────────────────
        case 'DATASET_SEARCH':
        case 'DATASET_ANALYSIS': {
            const searchQuery = intentClassification.searchQuery || query;
            const dsResult = await runDatasetPipeline(searchQuery, searchId, intentClassification);
            response = {
                ...response,
                ...dsResult,
                type: responseType,
                message: 'Here are the datasets I found:',
            };
            break;
        }

        // ── Research paper search: full pipeline prioritizing papers ─────
        case 'RESEARCH_SEARCH':
        case 'EXACT_DATASET_RESEARCH': {
            const searchQuery = intentClassification.searchQuery || query;
            const dsResult = await runDatasetPipeline(searchQuery, searchId, intentClassification);
            response = {
                ...response,
                ...dsResult,
                type: 'research',
                message: 'Here are the relevant scientific research papers and project analysis:',
            };
            break;
        }

        // ── Model search: full pipeline, emphasize models ─────────────────
        case 'MODEL_SEARCH':
        case 'MODEL_ANALYSIS':
        case 'ARCHITECTURE_ANALYSIS': {
            const searchQuery = intentClassification.searchQuery || query;
            const dsResult = await runDatasetPipeline(searchQuery, searchId, intentClassification);
            response = {
                ...response,
                ...dsResult,
                type: responseType,
                message: 'Here are the models I found:',
            };
            break;
        }

        // ── Project analysis / dataset-model matching ─────────────────────
        case 'PROJECT_ANALYSIS':
        case 'DATASET_MODEL_MATCHING': {
            const searchQuery = intentClassification.searchQuery || query;
            const dsResult = await runDatasetPipeline(searchQuery, searchId, intentClassification);
            response = {
                ...response,
                ...dsResult,
                type: 'project',
                message: 'Here is your project analysis with matching datasets and models:',
            };
            break;
        }

        // ── Hybrid: search + conversational answer ────────────────────────
        case 'HYBRID': {
            const searchQuery = intentClassification.searchQuery || query;
            const [dsResult, answer] = await Promise.all([
                runDatasetPipeline(searchQuery, searchId, intentClassification),
                runGeneralAIPipeline(messages, context),
            ]);
            response = {
                ...response,
                ...dsResult,
                type: 'hybrid',
                answer: answer || '',
            };
            break;
        }

        // ── Training/hardware advice: general AI with search context ──────
        case 'TRAINING_ADVICE':
        case 'HARDWARE_RECOMMENDATION': {
            // First search for relevant datasets/models, then answer with context
            const searchQuery = intentClassification.searchQuery || query;
            const [dsResult, answer] = await Promise.all([
                runDatasetPipeline(searchQuery, searchId, intentClassification),
                runGeneralAIPipeline(messages, context),
            ]);
            response = {
                ...response,
                ...dsResult,
                type: 'hybrid',
                answer: answer || '',
            };
            break;
        }

        // ── Comparison: general AI, pass context ──────────────────────────
        case 'COMPARISON':
        case 'DATASET_COMPARISON':
        case 'MODEL_COMPARISON': {
            // Try to do a search first to provide grounded context
            const searchQuery = intentClassification.searchQuery || query;
            const shouldSearch = SEARCH_INTENTS.includes('DATASET_SEARCH'); // always true, but typed
            const [dsResult, answer] = await Promise.all([
                runDatasetPipeline(searchQuery, searchId, intentClassification),
                runGeneralAIPipeline(messages, context),
            ]);
            response = {
                ...response,
                ...dsResult,
                type: 'comparison',
                answer: answer || '',
            };
            void shouldSearch; // suppress unused warning
            break;
        }

        default: {
            const answer = await runGeneralAIPipeline(messages, context);
            response.answer = answer;
            response.type = 'general';
            break;
        }
    }

    return response;
}
