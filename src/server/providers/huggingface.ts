/**
 * Unified Hugging Face Client & Header Builder
 */

export function getHuggingFaceHeaders(): Record<string, string> {
    const token = (
        process.env.HF_TOKEN ||
        process.env.HUGGING_FACE_HUB_TOKEN ||
        process.env.HUGGINGFACE_TOKEN ||
        ''
    ).trim();

    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'AI-Dataset-Explorer/1.0 (Node.js)',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
}

export * from './huggingfaceDatasets';
export * from './huggingfaceModels';
