/**
 * Paper Relationship Classifier
 *
 * Classifies the relationship between a research paper and the selected project / dataset / model:
 *
 * 1. EXACT_DATASET — Paper explicitly uses or benchmarks the exact dataset.
 * 2. EXACT_MODEL — Paper explicitly studies, trains, evaluates, or introduces the model.
 * 3. DIRECTLY_RELATED — Paper studies the exact same platform, robot, task, or architecture.
 * 4. RELATED_RESEARCH — Paper is conceptually or domain related.
 *
 * RULE: NEVER label "EXACT DATASET" without concrete evidence (exact repo name, dataset token,
 * HF dataset ID, or author/org dataset identifier in title, abstract, or metadata).
 */

import type { NormalizedPaper, PaperRelationship } from '@/types/papers';
import type { NormalizedDataset, NormalizedModel } from '@/types/pipeline';
import type { QueryUnderstanding } from '@/server/query-understanding/queryParser';

export interface ClassificationContext {
    queryUnderstanding?: QueryUnderstanding;
    dataset?: Partial<NormalizedDataset> | null;
    model?: Partial<NormalizedModel> | null;
    allDatasets?: Partial<NormalizedDataset>[];
    allModels?: Partial<NormalizedModel>[];
    rawQuery?: string;
}

export interface PaperClassificationResult {
    relationship: PaperRelationship;
    evidence: string;
    datasetMentioned?: string;
    modelMentioned?: string;
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Checks for exact dataset usage in title, abstract, topics, and venue.
 */
function testExactDataset(
    paper: NormalizedPaper,
    datasetIds: string[],
    datasetNames: string[]
): { isExact: boolean; name?: string; evidence?: string } {
    const textCorpus = `${paper.title} ${paper.abstract} ${paper.tldr || ''} ${paper.venue}`.toLowerCase();

    for (const rawId of datasetIds) {
        if (!rawId || rawId.length < 4) continue;
        const normId = rawId.toLowerCase();
        const shortName = rawId.split('/').pop()?.toLowerCase() || normId;

        // Check full repo ID (e.g. "Project-IRA/TPSoSe2026_Dataset_Collection_LeRobot_SO101")
        if (textCorpus.includes(normId)) {
            return {
                isExact: true,
                name: rawId,
                evidence: `Explicitly references dataset repository: "${rawId}"`,
            };
        }

        // Check distinctive sub-tokens (e.g. "TPSoSe2026", "Project-IRA")
        const specificTokens = shortName.split(/[-_]/).filter((t) => t.length >= 6 && !['dataset', 'merged', 'collection', 'final', 'v1'].includes(t));
        for (const token of specificTokens) {
            if (textCorpus.includes(token)) {
                return {
                    isExact: true,
                    name: rawId,
                    evidence: `Directly mentions dataset identifier token: "${token}"`,
                };
            }
        }
    }

    for (const name of datasetNames) {
        if (!name || name.length < 5) continue;
        const normName = name.toLowerCase().trim();
        // Skip generic names like "Robotics Dataset"
        if (['dataset', 'image dataset', 'robotics dataset', 'data'].includes(normName)) continue;

        if (textCorpus.includes(normName)) {
            return {
                isExact: true,
                name,
                evidence: `Cites exact dataset name: "${name}"`,
            };
        }
    }

    return { isExact: false };
}

/**
 * Checks for exact model usage / study in title, abstract, and topics.
 */
function testExactModel(
    paper: NormalizedPaper,
    modelIds: string[],
    modelNames: string[]
): { isExact: boolean; name?: string; evidence?: string } {
    const textCorpus = `${paper.title} ${paper.abstract} ${paper.tldr || ''}`.toLowerCase();

    for (const rawId of modelIds) {
        if (!rawId || rawId.length < 3) continue;
        const shortName = rawId.split('/').pop()?.toLowerCase() || rawId.toLowerCase();
        if (shortName.length < 3) continue;

        // Avoid false positive on very short common words
        if (['vit', 'cnn', 'vla', 'yolo'].includes(shortName)) {
            const regex = new RegExp(`\\b${escapeRegex(shortName)}\\b`, 'i');
            if (regex.test(textCorpus)) {
                return {
                    isExact: true,
                    name: rawId,
                    evidence: `Focuses on architecture/model: "${shortName.toUpperCase()}"`,
                };
            }
        } else if (textCorpus.includes(shortName)) {
            return {
                isExact: true,
                name: rawId,
                evidence: `Specifically studies model: "${rawId}"`,
            };
        }
    }

    for (const name of modelNames) {
        if (!name || name.length < 3) continue;
        const normName = name.toLowerCase().trim();
        const regex = new RegExp(`\\b${escapeRegex(normName)}\\b`, 'i');
        if (regex.test(textCorpus)) {
            return {
                isExact: true,
                name,
                evidence: `Specifically evaluates model: "${name}"`,
            };
        }
    }

    return { isExact: false };
}

/**
 * Classifies a single paper's relationship given query and retrieved entities context.
 */
export function classifyPaperRelationship(
    paper: NormalizedPaper,
    context: ClassificationContext
): PaperClassificationResult {
    const textCorpus = `${paper.title} ${paper.abstract} ${paper.tldr || ''} ${paper.venue} ${(paper.topics || []).join(' ')}`.toLowerCase();

    // 1. Gather all candidate dataset IDs & names
    const datasetIds: string[] = [];
    const datasetNames: string[] = [];
    if (context.dataset?.id) datasetIds.push(context.dataset.id);
    if (context.dataset?.name) datasetNames.push(context.dataset.name);
    if (context.allDatasets) {
        for (const d of context.allDatasets.slice(0, 5)) {
            if (d.id) datasetIds.push(d.id);
            if (d.name) datasetNames.push(d.name);
        }
    }

    // 2. Check for Exact Dataset usage
    const exactDs = testExactDataset(paper, datasetIds, datasetNames);
    if (exactDs.isExact) {
        return {
            relationship: 'EXACT_DATASET',
            evidence: exactDs.evidence || 'Paper explicitly uses or cites the selected dataset.',
            datasetMentioned: exactDs.name,
        };
    }

    // 3. Gather all candidate model IDs & names
    const modelIds: string[] = [];
    const modelNames: string[] = [];
    if (context.model?.id) modelIds.push(context.model.id);
    if (context.model?.name) modelNames.push(context.model.name);
    if (context.allModels) {
        for (const m of context.allModels.slice(0, 4)) {
            if (m.id) modelIds.push(m.id);
            if (m.name) modelNames.push(m.name);
        }
    }
    // Also include known prominent models from query
    if (context.queryUnderstanding?.specificEntityMentioned) {
        modelNames.push(context.queryUnderstanding.specificEntityMentioned);
    }

    // 4. Check for Exact Model usage
    const exactMdl = testExactModel(paper, modelIds, modelNames);
    if (exactMdl.isExact) {
        return {
            relationship: 'EXACT_MODEL',
            evidence: exactMdl.evidence || 'Paper evaluates or fine-tunes the target model architecture.',
            modelMentioned: exactMdl.name,
        };
    }

    // 5. Check for Directly Related Research (same robot, target anatomy, or specific task benchmark)
    const target = (context.queryUnderstanding?.target.value || '').toLowerCase();
    const task = (context.queryUnderstanding?.task.value || '').toLowerCase();
    const modality = (context.queryUnderstanding?.modality.value || '').toLowerCase();
    const domain = (context.queryUnderstanding?.domain.value || '').toLowerCase();
    const platform = (context.queryUnderstanding?.framework.value || '').toLowerCase();

    let directMatchCount = 0;
    const directReasons: string[] = [];

    if (target && target !== 'unknown' && textCorpus.includes(target)) {
        directMatchCount += 2;
        directReasons.push(`Investigates target: "${target}"`);
    }

    if (platform && platform !== 'unknown' && textCorpus.includes(platform)) {
        directMatchCount += 2;
        directReasons.push(`Evaluates platform: "${platform}"`);
    }

    if (task && task !== 'unknown' && textCorpus.includes(task)) {
        directMatchCount += 1;
        directReasons.push(`Studies task: "${task}"`);
    }

    if (modality && modality !== 'unknown' && textCorpus.includes(modality)) {
        directMatchCount += 1;
    }

    if (directMatchCount >= 2) {
        return {
            relationship: 'DIRECTLY_RELATED',
            evidence: directReasons.join(' · ') || 'Directly addresses the same benchmark, robot platform, or technical problem.',
        };
    }

    // 6. Otherwise: Related Research
    const domainReason = domain && domain !== 'unknown' ? `Related to ${domain} research literature.` : 'Related machine learning methodology.';
    return {
        relationship: 'RELATED_RESEARCH',
        evidence: domainReason,
    };
}
