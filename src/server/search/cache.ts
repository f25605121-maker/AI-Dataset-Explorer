/**
 * Deterministic Caching Engine (Search Engine 2.0.0)
 *
 * Implements Section 15:
 * Caches normalized search responses based on SHA-256 hash of:
 * - normalizedQuery
 * - searchEngineVersion ('2.0.0')
 *
 * Configurable TTL:
 * - 1 hour for live API research discoveries
 * - 24 hours for benchmarks
 * - Explicit bypass support
 */

import { ResearchSearchResponse } from './types';
import { getRequirementProfile } from './requirementExtractor';

export const SEARCH_ENGINE_VERSION = '2.0.0';

interface CacheEntry {
    response: ResearchSearchResponse;
    timestamp: number;
    ttlMs: number;
}

// In-memory cache store
const searchCache = new Map<string, CacheEntry>();

function normalizeQueryKey(query: string): string {
    return query
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, ' ');
}

export function computeCacheKey(query: string, version = SEARCH_ENGINE_VERSION): string {
    const norm = normalizeQueryKey(query);
    const profile = getRequirementProfile(query);
    const requirements = profile.requirements
        .map(requirement => `${requirement.id}:${requirement.detectedValue}:${requirement.isHard ? 'hard' : 'soft'}`)
        .sort()
        .join('|');
    return `aide:v${version}:${norm}:req:${normalizeQueryKey(requirements)}`;
}

export function getCachedSearch(
    query: string,
    options?: { bypassCache?: boolean; version?: string }
): ResearchSearchResponse | null {
    if (options?.bypassCache) return null;

    const key = computeCacheKey(query, options?.version);
    const entry = searchCache.get(key);

    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttlMs) {
        searchCache.delete(key);
        return null;
    }

    return entry.response;
}

export function setCachedSearch(
    query: string,
    response: ResearchSearchResponse,
    ttlMinutes = 60,
    version = SEARCH_ENGINE_VERSION
): void {
    const key = computeCacheKey(query, version);
    searchCache.set(key, {
        response,
        timestamp: Date.now(),
        ttlMs: ttlMinutes * 60 * 1000,
    });
}

export function clearSearchCache(): void {
    searchCache.clear();
}
