/**
 * FastAPI Client Adapter
 * Queries the Python FastAPI Recommendation Pipeline at /api/v1/recommend
 * when available, with transparent fallback.
 */

export interface FastApiRecommendResponse {
    problem_profile: any;
    datasets: any[];
    models: any[];
    papers: any[];
    latest_research: any[];
    relationships: any[];
    no_direct_match: boolean;
    confidence: number;
    closest_alternatives: any[];
    difference_explanation?: string | null;
}

const FASTAPI_URL = process.env.FASTAPI_BACKEND_URL || 'http://127.0.0.1:8000';

export async function queryFastApiRecommend(
    query: string,
    timeoutMs: number = 4000
): Promise<FastApiRecommendResponse | null> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const resp = await fetch(`${FASTAPI_URL}/api/v1/recommend`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (resp.ok) {
            return await resp.json();
        }
    } catch {
        // Return null for graceful fallback
    }
    return null;
}
