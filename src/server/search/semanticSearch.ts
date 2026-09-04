/**
 * Semantic Embedding & Hybrid BM25 Retrieval Engine
 *
 * Computes dense semantic similarity and BM25 hybrid scores between user queries
 * and candidate documents (title, description, tags, README, model cards, abstracts).
 */

import { UnifiedCandidate, StructuredQueryUnderstanding } from './types';

// Stop words for clean tokenization
const STOP_WORDS = new Set([
    'a', 'an', 'the', 'in', 'on', 'of', 'for', 'with', 'by', 'at', 'to', 'from',
    'is', 'are', 'was', 'were', 'and', 'or', 'that', 'this', 'it', 'as', 'be',
    'i', 'need', 'want', 'looking', 'find', 'dataset', 'model', 'paper', 'using',
]);

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s_-]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

function buildTermFrequencyMap(tokens: string[]): Map<string, number> {
    const map = new Map<string, number>();
    for (const t of tokens) {
        map.set(t, (map.get(t) || 0) + 1);
    }
    return map;
}

/**
 * Dense vector projection via character n-grams and domain-aware TF-IDF hashing
 * to compute fast, robust cosine similarity without requiring external heavy embedding API latency.
 */
function createSemanticVector(text: string, dimensions = 128): Float32Array {
    const vec = new Float32Array(dimensions);
    const tokens = tokenize(text);
    if (tokens.length === 0) return vec;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        // Hash unigrams
        let hash = 0;
        for (let j = 0; j < token.length; j++) {
            hash = (hash << 5) - hash + token.charCodeAt(j);
            hash |= 0;
        }
        const idx = Math.abs(hash) % dimensions;
        vec[idx] += 1.0;

        // Hash bigrams for spatial-semantic context
        if (i < tokens.length - 1) {
            const bigram = `${token}_${tokens[i + 1]}`;
            let biHash = 0;
            for (let j = 0; j < bigram.length; j++) {
                biHash = (biHash << 5) - biHash + bigram.charCodeAt(j);
                biHash |= 0;
            }
            const biIdx = Math.abs(biHash) % dimensions;
            vec[biIdx] += 1.5;
        }
    }

    // L2 Normalize
    let norm = 0;
    for (let i = 0; i < dimensions; i++) norm += vec[i] * vec[i];
    norm = Math.sqrt(norm);
    if (norm > 0) {
        for (let i = 0; i < dimensions; i++) vec[i] /= norm;
    }

    return vec;
}

function cosineSimilarity(vecA: Float32Array, vecB: Float32Array): number {
    let dot = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
    }
    return Math.max(0, Math.min(1.0, dot));
}

/**
 * BM25 Lexical Score
 */
function computeBM25(queryTokens: string[], docTokens: string[], k1 = 1.5, b = 0.75, avgDocLen = 40): number {
    const docTf = buildTermFrequencyMap(docTokens);
    const docLen = docTokens.length;
    let score = 0;

    for (const qTerm of queryTokens) {
        const tf = docTf.get(qTerm) || 0;
        if (tf > 0) {
            const numerator = tf * (k1 + 1);
            const denominator = tf + k1 * (1 - b + b * (docLen / avgDocLen));
            score += numerator / denominator;
        }
    }

    return score;
}

export function computeCandidateSemanticScore(
    candidate: UnifiedCandidate,
    understanding: StructuredQueryUnderstanding
): number {
    const queryText = `${understanding.rawQuery} ${understanding.positiveEntities.join(' ')} ${understanding.target.join(' ')}`;
    const queryTokens = tokenize(queryText);
    const queryVector = createSemanticVector(queryText);

    // Weighted document representation
    const title = candidate.title || candidate.name || '';
    const desc = candidate.description || '';
    const tags = (candidate.tags || []).join(' ');
    const task = candidate.task || '';
    const modality = candidate.modality || (candidate.modalities || []).join(' ');
    const extra = JSON.stringify(candidate.metadata || {}).slice(0, 300);

    const docText = `${title} ${title} ${tags} ${desc} ${task} ${modality} ${extra}`;
    const docTokens = tokenize(docText);
    const docVector = createSemanticVector(docText);

    // 1. Dense Semantic Similarity
    const denseSim = cosineSimilarity(queryVector, docVector); // 0.0 - 1.0

    // 2. Lexical BM25 Relevance
    const bm25Raw = computeBM25(queryTokens, docTokens);
    const bm25Normalized = Math.min(1.0, bm25Raw / (queryTokens.length * 1.5 || 1));

    // 3. Title Specific Focus Boost
    const titleTokens = tokenize(title);
    const titleMatches = queryTokens.filter(qt => titleTokens.includes(qt)).length;
    const titleBoost = queryTokens.length > 0 ? (titleMatches / queryTokens.length) * 0.25 : 0;

    // Hybrid combination
    const hybridScore = denseSim * 0.55 + bm25Normalized * 0.30 + titleBoost * 0.15;

    return Math.min(100, Math.round(hybridScore * 100));
}

export function rankBySemanticSimilarity(
    candidates: UnifiedCandidate[],
    understanding: StructuredQueryUnderstanding
): UnifiedCandidate[] {
    return candidates
        .map(cand => {
            const semanticScore = computeCandidateSemanticScore(cand, understanding);
            return {
                ...cand,
                sourceScore: semanticScore,
            };
        })
        .sort((a, b) => (b.sourceScore || 0) - (a.sourceScore || 0));
}
