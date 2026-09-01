/**
 * Kaggle Dataset Search — Query-Understanding-Driven
 *
 * Uses structured QueryUnderstanding to build targeted search queries
 * instead of relying on LLM-generated ProjectSpec fields.
 */

import type { NormalizedDataset } from '../../schemas/types';
import type { QueryUnderstanding } from '../queryUnderstanding/queryParser';
import type { ExpandedQueries } from '../queryUnderstanding/queryExpander';
import { searchResultCache, searchKey } from '../cache/metadataCache';

const KAGGLE_API = 'https://www.kaggle.com/api/v1/datasets/list';

interface FetchDiagnostics {
    networkFailures: number;
}

async function kaggleFetch(url: string, auth: string, timeoutMs: number, diagnostics?: FetchDiagnostics): Promise<Response | null> {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            headers: { Authorization: `Basic ${auth}` },
            signal: ctrl.signal,
            cache: 'no-store',
        });
        clearTimeout(tid);
        return res;
    } catch (e: any) {
        clearTimeout(tid);
        if (diagnostics) diagnostics.networkFailures += 1;
        if (process.env.DEBUG_API_TRACE === 'true') {
            console.warn('[KAGGLE] fetch error', e?.message?.slice(0, 60));
        }
        return null;
    }
}

// ── Modality inference from Kaggle tags/title ─────────────────────────────────

function inferKaggleModality(title: string, desc: string, tags: string[]): string {
    const blob = [title, desc, ...tags].join(' ').toLowerCase();
    if (/\bct\b|computed.?tomograph|\bcta\b|cardiac.?ct/i.test(blob)) return 'CT';
    if (/\bmri\b|magnetic.?resonance/i.test(blob)) return 'MRI';
    if (/x.?ray|radiograph/i.test(blob)) return 'X-ray';
    if (/ultrasound/i.test(blob)) return 'ultrasound';
    if (/dermoscop/i.test(blob)) return 'dermoscopy';
    if (/fundus|retinal/i.test(blob)) return 'fundus photography';
    if (/angiograph/i.test(blob)) return 'angiography';
    if (/\bvideo\b|\bmp4\b|\bavi\b/i.test(blob)) return 'video';
    if (/\baudio\b|\bwav\b|\bmp3\b|speech/i.test(blob)) return 'audio';
    if (/\btabular\b|\bcsv\b|\bspreadsheet\b/i.test(blob)) return 'tabular';
    // Survey / health indicator datasets = tabular unless imaging keywords present
    if (/health.?indicator|survey|questionnaire|clinical.?trial|patient.?record|ehr/i.test(blob)) return 'tabular';
    if (/\bimage\b|\bphoto\b|\bpng\b|\bjpeg\b/i.test(blob)) return 'image';
    if (/\btext\b|\bnlp\b|\bdocument\b/i.test(blob)) return 'text';
    return 'unknown';
}

function inferKaggleTask(title: string, desc: string, tags: string[]): string {
    const blob = [title, desc, ...tags].join(' ').toLowerCase();
    if (/segment(?:ation)?/i.test(blob)) return 'segmentation';
    if (/object\s*detect/i.test(blob)) return 'object detection';
    if (/classif(?:y|ication)/i.test(blob)) return 'classification';
    if (/detect(?:ion)?/i.test(blob)) return 'detection';
    if (/predict/i.test(blob)) return 'prediction';
    if (/regression/i.test(blob)) return 'regression';
    if (/forecast/i.test(blob)) return 'forecasting';
    if (/recogni/i.test(blob)) return 'recognition';
    return 'unknown';
}

// ── Main search function ──────────────────────────────────────────────────────

export async function searchKaggleDatasets(
    qu: QueryUnderstanding,
    expanded: ExpandedQueries,
    trace?: Record<string, unknown>
): Promise<Partial<NormalizedDataset>[]> {
    const KAGGLE_USERNAME = process.env.KAGGLE_USERNAME;
    const KAGGLE_KEY = process.env.KAGGLE_KEY;
    const TRACE = process.env.DEBUG_API_TRACE === 'true';
    const TIMEOUT = parseInt(process.env.EXTERNAL_API_TIMEOUT_MS || '15000', 10);

    if (!KAGGLE_USERNAME || !KAGGLE_KEY) {
        if (trace) { trace.called = false; trace.success = false; trace.reason = 'KAGGLE_USERNAME or KAGGLE_KEY not configured'; }
        if (TRACE) console.log('[KAGGLE] NOT_CONFIGURED');
        return [];
    }

    const auth = Buffer.from(`${KAGGLE_USERNAME}:${KAGGLE_KEY}`).toString('base64');
    if (trace) { trace.called = true; trace.success = false; }

    const queries = expanded.kaggleDatasetQueries;
    if (TRACE) console.log('[KAGGLE] START queries=', JSON.stringify(queries));

    const t0 = performance.now();
    const rawResults: any[] = [];
    let httpStatus: number | null = null;
    const diagnostics: FetchDiagnostics = { networkFailures: 0 };

    for (const q of queries) {
        if (!q || q.trim().length < 3) continue;

        const cacheKey = searchKey('kaggle', q);
        const cached = searchResultCache.get(cacheKey);
        if (cached !== null) {
            rawResults.push(...(cached as any[]));
            continue;
        }

        const url = `${KAGGLE_API}?search=${encodeURIComponent(q)}&sortBy=relevance&pageSize=20`;
        const res = await kaggleFetch(url, auth, TIMEOUT, diagnostics);
        if (!res) continue;

        httpStatus = res.status;

        if (!res.ok) {
            httpStatus = res.status;
            if (TRACE) console.warn('[KAGGLE] failed status=', res.status, 'q=', q);
            continue;
        }
        try {
            const data = await res.json();
            const items: any[] = Array.isArray(data) ? data : [];
            searchResultCache.set(cacheKey, items);
            rawResults.push(...items);
            if (TRACE) console.log('[KAGGLE] q=', q, 'found=', items.length);
        } catch {
            if (TRACE) console.warn('[KAGGLE] parse error q=', q);
        }
    }

    // Deduplicate by ref
    const uniqueMap = new Map<string, any>();
    for (const item of rawResults) {
        if (item?.ref && !uniqueMap.has(item.ref)) uniqueMap.set(item.ref, item);
    }
    const uniqueRaw = Array.from(uniqueMap.values());

    // Relevance pre-filter
    const allKeywords = [...qu.explicitKeywords, ...qu.inferredKeywords];
    const filtered = uniqueRaw.filter(item => {
        if (allKeywords.length === 0) return true;
        const blob = [
            item.title, item.subtitle, item.description,
            ...(Array.isArray(item.tags) ? item.tags.map((t: any) => typeof t === 'string' ? t : t?.name ?? '') : [])
        ].join(' ').toLowerCase();
        return allKeywords.some(kw => blob.includes(kw.toLowerCase()));
    });

    if (TRACE) console.log('[KAGGLE] after dedup+filter:', filtered.length, '/', uniqueRaw.length);

    // Normalize results
    const normalized: Partial<NormalizedDataset>[] = filtered.map(item => {
        const tags: string[] = (item.tags ?? []).map((t: any) => typeof t === 'string' ? t : t?.name ?? '').filter(Boolean);
        const desc = item.subtitle || item.description || '';
        const modality = inferKaggleModality(item.title ?? '', desc, tags);
        const task = inferKaggleTask(item.title ?? '', desc, tags);
        const sizeBytes: number | null = item.totalBytes ?? null;
        const size = sizeBytes != null
            ? sizeBytes > 1e9 ? `${(sizeBytes / 1e9).toFixed(1)} GB`
            : sizeBytes > 1e6 ? `${(sizeBytes / 1e6).toFixed(0)} MB`
            : sizeBytes > 1e3 ? `${(sizeBytes / 1e3).toFixed(0)} KB`
            : `${sizeBytes} B`
            : 'unknown';

        const evidence = [
            { value: item.title, state: 'CONFIRMED' as const, confidence: 1.0, source: 'Kaggle metadata', verified: true },
            { value: item.licenseName || 'unknown', state: item.licenseName ? 'CONFIRMED' as const : 'UNKNOWN' as const, confidence: item.licenseName ? 0.9 : 0, source: 'Kaggle metadata', verified: !!item.licenseName },
            { value: modality, state: modality !== 'unknown' ? 'INFERRED' as const : 'UNKNOWN' as const, confidence: modality !== 'unknown' ? 0.7 : 0, source: 'inferred from title/description/tags', verified: false },
        ];

        return {
            id: item.ref,
            name: item.title ?? item.ref,
            title: item.title ?? item.ref,
            subtitle: item.subtitle ?? '',
            source: 'Kaggle' as const,
            url: `https://www.kaggle.com/datasets/${item.ref}`,
            description: desc.slice(0, 2000),
            domain: qu.domain.value ?? '',
            subdomain: qu.subdomain.value ?? '',
            task,
            modality,
            modalities: modality !== 'unknown' ? [modality] : [],
            formats: [],
            languages: [],
            license: item.licenseName ?? 'unknown',
            size,
            sizeBytes,
            downloads: item.downloadCount ?? null,
            likes: item.voteCount ?? null,
            creator: item.creatorName ?? 'unknown',
            tags,
            schema: {},
            splits: {},
            features: [],
            sample_count: null,
            image_resolution: null,
            video: modality === 'video',
            related_models: [],
            raw_metadata: item,
            evidence,
            targetLabels: [],
            metadataQuality: computeKaggleMetadataQuality(item, desc, tags),
            matchScore: 0,
            scoreBreakdown: { task: 0, modality: 0, domain: 0, subdomain: 0, target: 0, metadata: 0, semantic: 0, quality: 0, popularity: 0 },
            rejected: false,
            rejectionReason: null,
            matchReason: '',
        };
    });

    const dur = Math.round(performance.now() - t0);
    if (trace) {
        trace.success = normalized.length > 0 || httpStatus === 200;
        trace.datasetsFound = normalized.length;
        trace.durationMs = dur;
        if (httpStatus !== null && httpStatus !== 200) trace.httpStatus = httpStatus;
        if (diagnostics.networkFailures > 0) trace.networkFailures = diagnostics.networkFailures;
        if (httpStatus === null && diagnostics.networkFailures > 0) trace.reason = 'Network connection to Kaggle failed';
    }
    if (TRACE) console.log('[KAGGLE] DONE total=', normalized.length, 'duration=', dur, 'ms');

    return normalized;
}

function computeKaggleMetadataQuality(item: any, desc: string, tags: string[]): number {
    let score = 0;
    if (item.title) score += 20;
    if (desc.length > 50) score += 20;
    if (desc.length > 200) score += 10;
    if (item.licenseName && item.licenseName !== 'Unknown') score += 20;
    if (tags.length > 2) score += 10;
    if (item.totalBytes != null) score += 10;
    if (item.downloadCount > 100) score += 10;
    return Math.min(100, score);
}
