/**
 * Model Architecture Analyzer
 *
 * Extracts and presents model architecture information with evidence.
 * Architecture is ONLY reported when confirmed by evidence.
 */

import type { NormalizedModel } from '../../schemas/types';
import { extractModelFacts, type ModelFacts } from '../evidence/evidenceExtractor';

export interface ModelArchitectureAnalysis {
    id: string;
    name: string;
    source: string;
    url: string;
    architecture: {
        name: string;
        state: 'CONFIRMED' | 'INFERRED' | 'UNKNOWN';
        confidence: number;
        source: string;
        note: string;
    };
    baseModel: {
        name: string;
        state: 'CONFIRMED' | 'INFERRED' | 'UNKNOWN';
    };
    task: {
        value: string;
        state: 'CONFIRMED' | 'INFERRED' | 'UNKNOWN';
        source: string;
    };
    modalities: string[];
    parameters: {
        value: number | string | null;
        state: 'CONFIRMED' | 'INFERRED' | 'UNKNOWN';
        source: string;
    };
    framework: {
        value: string;
        state: 'CONFIRMED' | 'INFERRED' | 'UNKNOWN';
    };
    trainingDatasets: {
        value: string[];
        state: 'CONFIRMED' | 'INFERRED' | 'UNKNOWN';
        source: string;
    };
    inputTypes: string[];
    outputTypes: string[];
    license: string;
    evidenceConfidence: number;
    facts: ModelFacts;
}

export function analyzeModelArchitecture(m: Partial<NormalizedModel>): ModelArchitectureAnalysis {
    const facts = extractModelFacts(m);

    // Build architecture note
    let archNote = '';
    if (facts.architecture.state === 'CONFIRMED') {
        archNote = `Confirmed from ${facts.architecture.source}.`;
    } else if (facts.architecture.state === 'INFERRED') {
        archNote = `Inferred from model name and available metadata. Verify with ${facts.architecture.source}.`;
    } else {
        archNote = 'Architecture could not be determined from available metadata. ' +
            'Check the model repository at ' + (m.url ?? 'the source') + ' directly.';
    }

    return {
        id: m.id ?? '',
        name: m.name ?? m.id ?? '',
        source: m.source ?? 'unknown',
        url: m.url ?? '',
        architecture: {
            name: facts.architecture.value ?? 'Unknown',
            state: facts.architecture.state,
            confidence: facts.architecture.confidence,
            source: facts.architecture.source,
            note: archNote,
        },
        baseModel: {
            name: facts.baseModel.value ?? 'Unknown',
            state: facts.baseModel.state,
        },
        task: {
            value: facts.task.value ?? 'Unknown',
            state: facts.task.state,
            source: facts.task.source,
        },
        modalities: m.modalities ?? [],
        parameters: {
            value: facts.parameters.value,
            state: facts.parameters.state,
            source: facts.parameters.source,
        },
        framework: {
            value: facts.framework.value ?? 'Unknown',
            state: facts.framework.state,
        },
        trainingDatasets: {
            value: facts.trainingDatasets.value ?? [],
            state: facts.trainingDatasets.state,
            source: facts.trainingDatasets.source,
        },
        inputTypes: m.input_types ?? [],
        outputTypes: m.output_types ?? [],
        license: m.license ?? 'unknown',
        evidenceConfidence: facts.evidenceConfidence,
        facts,
    };
}
