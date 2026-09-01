import { IntentClassification, VALID_INTENTS, SEARCH_INTENTS } from './types';
import { callLlm } from './llmProvider';

const GREETING_PATTERNS = /^\s*(hi|hello|hey|howdy|hola|yo|sup|good\s*(morning|afternoon|evening)|greetings|what'?s\s*up)\s*[!?.]*\s*$/i;

function isGreeting(query: string): boolean {
    return GREETING_PATTERNS.test(query) && query.trim().length < 30;
}

const INTENT_SYSTEM_PROMPT = `You are the Intent Classification engine for AI Dataset Explorer.
Classify the user's message into exactly ONE of the following precise categories:

1. GREETING: "hi", "hello".
2. GENERAL_AI: "What is a neural network?".
3. EXPLAIN_CONCEPT: "Explain transfer learning".
4. DATASET_SEARCH: "Find MRI brain tumor datasets".
5. MODEL_SEARCH: "Best model for sentiment analysis".
6. PROJECT_ANALYSIS: "I want to build a system to detect manufacturing defects in steel surfaces. What do I need?".
7. HYBRID: "Explain CNNs and find image classification datasets".
8. COMPARISON: "Compare BERT vs GPT".
9. DATASET_ANALYSIS: "Explain this dataset".
10. MODEL_ANALYSIS: "What architecture is this model?".
11. DATASET_COMPARISON: "Compare these two datasets".
12. MODEL_COMPARISON: "Compare SmolVLA and Pi0.5 for SO-101".
13. DATASET_MODEL_MATCHING: "What model should I use for this dataset?".
14. TRAINING_ADVICE: "How do I train SmolVLA on this dataset?".
15. ARCHITECTURE_ANALYSIS: "What architecture does the best Project-IRA model use?".
16. HARDWARE_RECOMMENDATION: "What GPU do I need for a 7B parameter model?".

Output a strict JSON object (no markdown, no code fences):
{
  "intent": "<one of the 16 intents>",
  "confidence": 0.95,
  "datasetRequired": true,
  "generalAnswerRequired": false,
  "searchQuery": "<clean semantic search query>",
  "reason": "<1-sentence classification reason>",
  "requirements": {
    "entity_type": "<'dataset' | 'model' | 'architecture' | 'unknown'>",
    "domain": "<broad domain e.g. 'medical imaging', 'robotics' or 'unknown'>",
    "subdomain": "<e.g. 'cardiovascular', 'manufacturing' or 'unknown'>",
    "task": "<e.g. 'segmentation', 'imitation learning', 'classification' or 'unknown'>",
    "target": "<e.g. 'coronary arteries', 'brain tumor', 'SO-101' or 'unknown'>",
    "modality": "<e.g. 'CT', 'MRI', 'text', 'tabular', 'video' or 'unknown'>",
    "keywords": ["<keyword1>", "<keyword2>"]
  }
}

CRITICAL RULES:
- If fields are unknown, output the string "unknown". Do NOT guess or hallucinate.
- If the user says "dataset on coronary arteries", target="coronary arteries", task="unknown", modality="unknown".
- If the user says "SO-101 imitation learning", target="SO-101", task="imitation learning", domain="robotics".
`;

export async function classifyIntent(query: string, apiKey?: string, model?: string): Promise<IntentClassification> {
    if (isGreeting(query)) {
        return {
            intent: 'GREETING', confidence: 1.0, datasetRequired: false, generalAnswerRequired: false,
            searchQuery: '', reason: 'Detected as a simple greeting',
        };
    }

    const likelySearch = /\b(dataset|datasets|model|models|find|search|discover|recommend)\b/i.test(query);
    const fallbackIntent: IntentClassification = {
        intent: likelySearch ? 'DATASET_SEARCH' : 'GENERAL_AI',
        confidence: 0.5,
        datasetRequired: likelySearch,
        generalAnswerRequired: !likelySearch,
        searchQuery: likelySearch ? query : '',
        reason: likelySearch
            ? 'Fallback to evidence-based search after classification error'
            : 'Fallback due to classification error',
    };

    try {
        const response = await callLlm({
            systemPrompt: INTENT_SYSTEM_PROMPT,
            userPrompt: query,
            temperature: 0.1,
            maxTokens: 350,
            jsonMode: true,
            model,
        });

        let content = (response.text || '').replace(/```json\s*/gi, '').replace(/```/g, '').trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            content = jsonMatch[0];
        }

        try {
            const parsed = JSON.parse(content);
            if (VALID_INTENTS.includes(parsed.intent) && typeof parsed.confidence === 'number') {
                const result: IntentClassification = {
                    intent: parsed.intent,
                    confidence: Math.max(0, Math.min(1, parsed.confidence)),
                    datasetRequired: SEARCH_INTENTS.includes(parsed.intent),
                    generalAnswerRequired: !SEARCH_INTENTS.includes(parsed.intent) || parsed.intent === 'HYBRID',
                    searchQuery: parsed.searchQuery || '',
                    reason: parsed.reason || '',
                };

                if (parsed.requirements) {
                    result.requirements = {
                        domain: parsed.requirements.domain === 'unknown' ? undefined : parsed.requirements.domain,
                        modality: parsed.requirements.modality === 'unknown' ? undefined : parsed.requirements.modality,
                        task: typeof parsed.requirements.task === 'string' && parsed.requirements.task !== 'unknown' ? parsed.requirements.task : undefined,
                        keywords: Array.isArray(parsed.requirements.keywords) ? parsed.requirements.keywords : [],
                    };
                    const reqs: any = result.requirements;
                    reqs.target = parsed.requirements.target === 'unknown' ? undefined : parsed.requirements.target;
                    reqs.subdomain = parsed.requirements.subdomain === 'unknown' ? undefined : parsed.requirements.subdomain;
                    reqs.entity_type = parsed.requirements.entity_type === 'unknown' ? undefined : parsed.requirements.entity_type;
                }

                if (result.confidence < 0.4 && result.intent !== 'GREETING') {
                    result.intent = 'DATASET_SEARCH';
                    result.datasetRequired = true;
                    result.generalAnswerRequired = false;
                    result.confidence = 0.5;
                }

                console.log(`[INTENT] ${result.intent} (${result.confidence}) -> ${result.reason} [via ${response.provider}]`);
                return result;
            }
        } catch (e) {
            console.error('[INTENT] Parse Failed', e);
        }
        return fallbackIntent;
    } catch (e) {
        console.error('[INTENT] LLM Call Failed, using fallback', e);
        return fallbackIntent;
    }
}
