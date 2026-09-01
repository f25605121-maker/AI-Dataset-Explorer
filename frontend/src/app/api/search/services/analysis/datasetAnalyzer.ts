/**
 * Dataset Analyzer
 *
 * Generates a structured analysis of a dataset based ONLY on retrieved metadata.
 * Does NOT call the LLM to invent facts. Returns evidence-backed field objects.
 */

import type { NormalizedDataset } from '../../schemas/types';
import { extractDatasetFacts, type DatasetFacts } from '../evidence/evidenceExtractor';

export interface DatasetAnalysis {
    id: string;
    name: string;
    source: string;
    url: string;
    overview: {
        what: string;
        task: string;
        taskState: string;
        taskSource: string;
        modality: string;
        modalityState: string;
        modalitySource: string;
        domain: string;
    };
    schema: {
        features: string[];
        featuresState: string;
        splits: Record<string, unknown>;
        splitsState: string;
        sampleCount: number | string | null;
        sampleCountState: string;
    };
    quality: {
        metadataQuality: number;
        licenseType: string;
        licenseState: string;
        size: string;
        sizeState: string;
        creator: string;
        downloads: number | null;
        likes: number | null;
    };
    limitations: {
        items: string[];
        state: string;
    };
    relatedModels: {
        models: string[];
        state: string;
    };
    evidenceConfidence: number;
    tags: string[];
    facts: DatasetFacts;
}

export function analyzeDataset(ds: Partial<NormalizedDataset>): DatasetAnalysis {
    const facts = extractDatasetFacts(ds);

    return {
        id: ds.id ?? '',
        name: ds.name ?? ds.id ?? '',
        source: ds.source ?? 'unknown',
        url: ds.url ?? '',
        overview: {
            what: facts.what.value,
            task: facts.task.value ?? 'Unknown',
            taskState: facts.task.state,
            taskSource: facts.task.source,
            modality: facts.modality.value ?? 'Unknown',
            modalityState: facts.modality.state,
            modalitySource: facts.modality.source,
            domain: facts.domain.value ?? 'Unknown',
        },
        schema: {
            features: facts.features.value ?? [],
            featuresState: facts.features.state,
            splits: facts.splits.value ?? {},
            splitsState: facts.splits.state,
            sampleCount: facts.sampleCount.value ?? null,
            sampleCountState: facts.sampleCount.state,
        },
        quality: {
            metadataQuality: ds.metadataQuality ?? 0,
            licenseType: facts.license.value ?? 'Unknown',
            licenseState: facts.license.state,
            size: facts.size.value ?? 'Unknown',
            sizeState: facts.size.state,
            creator: ds.creator ?? 'Unknown',
            downloads: ds.downloads ?? null,
            likes: ds.likes ?? null,
        },
        limitations: {
            items: facts.limitations.value ?? [],
            state: facts.limitations.state,
        },
        relatedModels: {
            models: facts.relatedModels.value ?? [],
            state: facts.relatedModels.state,
        },
        evidenceConfidence: facts.evidenceConfidence,
        tags: ds.tags ?? [],
        facts,
    };
}
