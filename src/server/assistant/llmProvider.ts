/**
 * Unified LLM Provider
 *
 * Supports both Google Gemini API (direct) and OpenRouter API (multi-model).
 * Automatically detects configured keys and routes queries to the active provider.
 * Hardened with prompt injection shielding, token limits, and output guardrails.
 */

import { scanAndShieldPrompt, getHardenedSystemInstruction, guardrailOutput } from '../security/promptShield';
import { capOutputTokens } from '../security/usageLimiter';

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
    if (modelName.startsWith('google/')) {
        modelName = modelName.replace('google/', '');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const contents: Array<{ role?: string; parts: Array<{ text: string }> }> = [];

    if (options.messages && options.messages.length > 0) {
        for (const m of options.messages) {
            if (m.role === 'system') continue;
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
            maxOutputTokens: capOutputTokens(options.maxTokens),
            ...(options.jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
    };

    if (options.systemPrompt) {
        payload.systemInstruction = {
            parts: [{ text: getHardenedSystemInstruction(options.systemPrompt) }],
        };
    }

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), options.timeoutMs ?? 20000);

    console.log(`[Gemini API] Requesting analysis with model: "${modelName}"`);

    try {
        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            signal: ctrl.signal,
            cache: 'no-store',
        });

        clearTimeout(timeout);
        console.log(`[Gemini API] Status: ${resp.status}`);

        if (!resp.ok) {
            const errText = await resp.text();
            if (resp.status === 429) {
                console.warn(`[Gemini API] Rate limit (429) hit for model ${modelName}.`);
            } else {
                console.error(`[Gemini API] Error (${resp.status}):`, errText.slice(0, 300));
            }
            throw new Error(`Gemini API error (${resp.status}): ${errText.slice(0, 200)}`);
        }

        const data = await resp.json();
        const candidate = data?.candidates?.[0];
        const rawText = candidate?.content?.parts?.[0]?.text ?? '';
        const text = guardrailOutput(rawText);

        const promptTokens = data?.usageMetadata?.promptTokenCount;
        const completionTokens = data?.usageMetadata?.candidatesTokenCount;
        console.log(`[Gemini API] Success: generated response (${completionTokens || 'N/A'} completion tokens)`);

        return {
            text,
            provider: 'gemini',
            model: modelName,
            usage: {
                promptTokens,
                completionTokens,
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
        messages.push({ role: 'system', content: getHardenedSystemInstruction(options.systemPrompt) });
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
        max_tokens: capOutputTokens(options.maxTokens),
        ...(options.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    };

    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), options.timeoutMs ?? 20000);

    console.log(`[OpenRouter API] Requesting with model: "${modelName}"`);

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
        console.log(`[OpenRouter API] Status: ${resp.status}`);

        if (!resp.ok) {
            const errText = await resp.text();
            console.error(`[OpenRouter API] Error (${resp.status}):`, errText.slice(0, 300));
            throw new Error(`OpenRouter API error (${resp.status}): ${errText.slice(0, 200)}`);
        }

        const data = await resp.json();
        const rawText = data?.choices?.[0]?.message?.content ?? '';
        const text = guardrailOutput(rawText);

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
    // Sanitize user inputs in options
    if (options.userPrompt) {
        const shield = scanAndShieldPrompt(options.userPrompt);
        if (!shield.safe) {
            throw new Error('Request blocked by AI Safety Shield: prompt injection or unsafe content detected.');
        }
        options.userPrompt = shield.sanitizedInput;
    }

    if (options.messages && options.messages.length > 0) {
        for (const m of options.messages) {
            if (m.role === 'user') {
                const shield = scanAndShieldPrompt(m.content);
                if (!shield.safe) {
                    throw new Error('Request blocked by AI Safety Shield: prompt injection or unsafe content detected.');
                }
                m.content = shield.sanitizedInput;
            }
        }
    }

    const status = getLlmStatus();
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    if (status.activeProvider === 'gemini' && geminiKey) {
        try {
            return await callGeminiApi(options, geminiKey, status.geminiModel);
        } catch (err: any) {
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
            if (geminiKey) {
                console.warn('[LLM-PROVIDER] OpenRouter failed, falling back to Gemini:', err.message);
                return await callGeminiApi(options, geminiKey, status.geminiModel);
            }
            throw err;
        }
    }

    throw new Error('No AI provider configured. Please set GEMINI_API_KEY or OPENROUTER_API_KEY in .env.local.');
}
