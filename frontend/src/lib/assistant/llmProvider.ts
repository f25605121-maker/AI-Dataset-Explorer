/**
 * Unified LLM Provider
 *
 * Supports both Google Gemini API (direct) and OpenRouter API (multi-model).
 * Automatically detects configured keys and routes queries to the active provider.
 */

export interface LlmMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface LlmCallOptions {
    systemPrompt?: string;
    userPrompt?: string;
    messages?: LlmMessage[];
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    model?: string;
    timeoutMs?: number;
}

export interface LlmResponse {
    text: string;
    provider: 'gemini' | 'openrouter';
    model: string;
    usage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    };
}

export interface LlmProviderStatus {
    hasGemini: boolean;
    hasOpenRouter: boolean;
    activeProvider: 'gemini' | 'openrouter' | 'none';
    geminiModel: string;
    openRouterModel: string;
}

export function getLlmStatus(): LlmProviderStatus {
    const hasGemini = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY);
    const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
    const preferred = (process.env.LLM_PROVIDER || '').toLowerCase();

    let activeProvider: 'gemini' | 'openrouter' | 'none' = 'none';
    if (preferred === 'gemini' && hasGemini) {
        activeProvider = 'gemini';
    } else if (preferred === 'openrouter' && hasOpenRouter) {
        activeProvider = 'openrouter';
    } else if (hasGemini) {
        activeProvider = 'gemini';
    } else if (hasOpenRouter) {
        activeProvider = 'openrouter';
    }

    return {
        hasGemini,
        hasOpenRouter,
        activeProvider,
        geminiModel: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
        openRouterModel: process.env.OPENROUTER_MODEL || 'openai/gpt-4.1-mini',
    };
}

// ── Google Gemini Direct API ───────────────────────────────────────────────────

async function callGeminiApi(
    options: LlmCallOptions,
    apiKey: string,
    defaultModel: string
): Promise<LlmResponse> {
    let modelName = options.model || defaultModel;
    // Clean model prefix if passed as e.g. "google/gemini-1.5-flash"
    if (modelName.startsWith('google/')) {
        modelName = modelName.replace('google/', '');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const contents: Array<{ role?: string; parts: Array<{ text: string }> }> = [];

    if (options.messages && options.messages.length > 0) {
        for (const m of options.messages) {
            if (m.role === 'system') continue; // system prompt passed in systemInstruction
            contents.push({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            });
        }
    } else if (options.userPrompt) {
        contents.push({
            role: 'user',
            parts: [{ text: options.userPrompt }],
        });
    }

    const payload: Record<string, any> = {
        contents,
        generationConfig: {
            temperature: options.temperature ?? 0.1,
            maxOutputTokens: options.maxTokens ?? 1024,
            ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
    };

    if (options.systemPrompt) {
        payload.systemInstruction = {
            parts: [{ text: options.systemPrompt }],
        };
    }

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), options.timeoutMs ?? 20000);

    try {
        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: ctrl.signal,
            cache: 'no-store',
        });

        clearTimeout(timeout);

        if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(`Gemini API error (${resp.status}): ${errText.slice(0, 200)}`);
        }

        const data = await resp.json();
        const candidate = data?.candidates?.[0];
        const text = candidate?.content?.parts?.[0]?.text ?? '';

        return {
            text,
            provider: 'gemini',
            model: modelName,
            usage: {
                promptTokens: data?.usageMetadata?.promptTokenCount,
                completionTokens: data?.usageMetadata?.candidatesTokenCount,
                totalTokens: data?.usageMetadata?.totalTokenCount,
            },
        };
    } catch (e: any) {
        clearTimeout(timeout);
        throw e;
    }
}

// ── OpenRouter API ────────────────────────────────────────────────────────────

async function callOpenRouterApi(
    options: LlmCallOptions,
    apiKey: string,
    defaultModel: string
): Promise<LlmResponse> {
    const modelName = options.model || defaultModel;
    const endpoint = process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1/chat/completions';

    const messages: Array<{ role: string; content: string }> = [];

    if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
    }

    if (options.messages && options.messages.length > 0) {
        for (const m of options.messages) {
            messages.push({ role: m.role, content: m.content });
        }
    } else if (options.userPrompt) {
        messages.push({ role: 'user', content: options.userPrompt });
    }

    const payload: Record<string, any> = {
        model: modelName,
        messages,
        temperature: options.temperature ?? 0.1,
        max_tokens: options.maxTokens ?? 1024,
        ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    };

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), options.timeoutMs ?? 20000);

    try {
        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
                'HTTP-Referer': 'http://localhost:3000',
                'X-Title': 'AI Dataset Explorer',
            },
            body: JSON.stringify(payload),
            signal: ctrl.signal,
            cache: 'no-store',
        });

        clearTimeout(timeout);

        if (!resp.ok) {
            const errText = await resp.text();
            throw new Error(`OpenRouter API error (${resp.status}): ${errText.slice(0, 200)}`);
        }

        const data = await resp.json();
        const text = data?.choices?.[0]?.message?.content ?? '';

        return {
            text,
            provider: 'openrouter',
            model: modelName,
            usage: {
                promptTokens: data?.usage?.prompt_tokens,
                completionTokens: data?.usage?.completion_tokens,
                totalTokens: data?.usage?.total_tokens,
            },
        };
    } catch (e: any) {
        clearTimeout(timeout);
        throw e;
    }
}

// ── Unified Call Handler ───────────────────────────────────────────────────────

export async function callLlm(options: LlmCallOptions): Promise<LlmResponse> {
    const status = getLlmStatus();
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    if (status.activeProvider === 'gemini' && geminiKey) {
        try {
            return await callGeminiApi(options, geminiKey, status.geminiModel);
        } catch (err: any) {
            // If Gemini fails and OpenRouter is available, try fallback
            if (openRouterKey) {
                console.warn('[LLM-PROVIDER] Gemini failed, falling back to OpenRouter:', err.message);
                return await callOpenRouterApi(options, openRouterKey, status.openRouterModel);
            }
            throw err;
        }
    }

    if (status.activeProvider === 'openrouter' && openRouterKey) {
        try {
            return await callOpenRouterApi(options, openRouterKey, status.openRouterModel);
        } catch (err: any) {
            // If OpenRouter fails and Gemini is available, try fallback
            if (geminiKey) {
                console.warn('[LLM-PROVIDER] OpenRouter failed, falling back to Gemini:', err.message);
                return await callGeminiApi(options, geminiKey, status.geminiModel);
            }
            throw err;
        }
    }

    throw new Error('No AI provider configured. Please set GEMINI_API_KEY or OPENROUTER_API_KEY in .env.local.');
}
