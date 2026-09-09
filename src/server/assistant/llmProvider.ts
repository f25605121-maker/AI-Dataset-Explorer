/**
 * Unified LLM Provider
 *
 * Supports Google Gemini API (direct).
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
    provider: 'gemini';
    model: string;
    usage?: {
        promptTokens?: number;
        completionTokens?: number;
        totalTokens?: number;
    };
}

export interface LlmProviderStatus {
    hasGemini: boolean;
    activeProvider: 'gemini' | 'none';
    geminiModel: string;
}

export function getLlmStatus(): LlmProviderStatus {
    const hasGemini = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY);
    
    let activeProvider: 'gemini' | 'none' = 'none';
    if (hasGemini) {
        activeProvider = 'gemini';
    }

    return {
        hasGemini,
        activeProvider,
        geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
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

    if (status.activeProvider === 'gemini' && geminiKey) {
        return await callGeminiApi(options, geminiKey, status.geminiModel);
    }

    throw new Error('No AI provider configured. Please set GEMINI_API_KEY in .env.local.');
}
