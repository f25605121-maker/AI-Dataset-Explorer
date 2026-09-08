# classifyPaperRelationship

**File:** `src\server\papers\paperClassifier.ts`

## Description
Paper Relationship Classifier
Classifies the relationship between a research paper and the selected project / dataset / model:
1. EXACT_DATASET — Paper explicitly uses or benchmarks the exact dataset.
2. EXACT_MODEL — Paper explicitly studies, trains, evaluates, or introduces the model.
3. DIRECTLY_RELATED — Paper studies the exact same platform, robot, task, or architecture.
4. RELATED_RESEARCH — Paper is conceptually or domain related.
RULE: NEVER label "EXACT DATASET" without concrete evidence (exact repo name, dataset token,
HF dataset ID, or author/org dataset identifier in title, abstract, or metadata).
/

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
Checks for exact dataset usage in title, abstract, topics, and venue.
/
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
Checks for exact model usage / study in title, abstract, and topics.
/
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
Classifies a single paper's relationship given query and retrieved entities context.

## Signature
```typescript
function classifyPaperRelationship(paper: NormalizedPaper,
    context: ClassificationContext): PaperClassificationResult
```
