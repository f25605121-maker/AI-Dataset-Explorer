import { StructuredQueryUnderstanding, ResearchQuerySchema } from './types';
import { getRequirementProfile } from './requirementExtractor';

export interface TieredQuery {
    query: string;
    tier: 1 | 2 | 3 | 4;
    category: 'dataset' | 'model' | 'paper' | 'benchmark';
}

export interface SpecializedQueries {
    datasetQueries: string[];
    modelQueries: string[];
    paperQueries: string[];
    benchmarkQueries: string[];
    allQueries: string[];
    tieredQueries: TieredQuery[];
}

function isResearchSchema(input: StructuredQueryUnderstanding | ResearchQuerySchema): input is ResearchQuerySchema {
    return 'primaryDomain' in input;
}

function addQuery(target: TieredQuery[], query: string, tier: 1 | 2 | 3 | 4, category: TieredQuery['category']): void {
    const normalized = query.trim().replace(/\s+/g, ' ');
    if (!normalized || target.some(item => item.category === category && item.query.toLowerCase() === normalized.toLowerCase())) return;
    target.push({ query: normalized, tier, category });
}

/** Build provider queries from structured requirements without domain lookup branches. */
export function expandQueries(input: StructuredQueryUnderstanding | ResearchQuerySchema): SpecializedQueries {
    const rawQuery = isResearchSchema(input) ? input.originalQuery : input.rawQuery;
    const profile = getRequirementProfile(rawQuery);
    const dimensions = {
        domain: profile.domain || '',
        object: profile.object || '',
        modality: profile.input?.modality || '',
        task: profile.output?.type || '',
        constraints: profile.requirements.filter(requirement => requirement.isHard).map(requirement => requirement.detectedValue).join(' '),
    };

    const core = [dimensions.object, dimensions.modality, dimensions.task, dimensions.domain]
        .filter(value => value && !/general|discovery/i.test(value))
        .join(' ')
        .trim() || rawQuery;
    const compact = [dimensions.object, dimensions.modality, dimensions.task]
        .filter(Boolean)
        .join(' ')
        .trim() || rawQuery;
    const queries: TieredQuery[] = [];

    addQuery(queries, `${core} dataset`, 1, 'dataset');
    addQuery(queries, `${compact} data`, 2, 'dataset');
    addQuery(queries, `${compact} model architecture`, 1, 'model');
    addQuery(queries, `${compact} method`, 2, 'model');
    addQuery(queries, `${core} research paper`, 1, 'paper');
    addQuery(queries, `${compact} benchmark`, 3, 'benchmark');
    if (dimensions.constraints) addQuery(queries, `${compact} ${dimensions.constraints}`, 2, 'dataset');

    const byCategory = (category: TieredQuery['category']) => queries.filter(item => item.category === category).map(item => item.query);
    const datasetQueries = byCategory('dataset');
    const modelQueries = byCategory('model');
    const paperQueries = byCategory('paper');
    const benchmarkQueries = byCategory('benchmark');
    return {
        datasetQueries,
        modelQueries,
        paperQueries,
        benchmarkQueries,
        allQueries: queries.map(item => item.query),
        tieredQueries: queries,
    };
}
