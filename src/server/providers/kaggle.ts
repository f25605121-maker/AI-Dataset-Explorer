/**
 * Unified Kaggle REST API (v1) Client & Authentication Builder
 */

export function getKaggleAuthHeaders(): Record<string, string> {
    const username = process.env.KAGGLE_USERNAME?.trim();
    const key = process.env.KAGGLE_KEY?.trim();

    const headers: Record<string, string> = {
        'Accept': 'application/json',
        'User-Agent': 'AI-Dataset-Explorer/1.0 (Node.js)',
    };

    if (username && key) {
        if (key.startsWith('KGAT_') || key.startsWith('kgat_')) {
            headers['Authorization'] = `Bearer ${key}`;
        } else {
            const credentials = Buffer.from(`${username}:${key}`).toString('base64');
            headers['Authorization'] = `Basic ${credentials}`;
        }
    }
    return headers;
}

export * from './kaggleDatasets';
