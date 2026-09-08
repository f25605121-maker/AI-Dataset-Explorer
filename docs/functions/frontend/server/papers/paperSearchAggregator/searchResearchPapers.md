# searchResearchPapers

**File:** `src\server\papers\paperSearchAggregator.ts`

## Description
Research Paper Search Aggregator
Orchestrates multi-query research profile construction, parallel querying across
Semantic Scholar, OpenAlex, arXiv, Crossref, and PubMed, deduplication, scoring,
relationship classification, and research synthesis generation.
/

import type { NormalizedPaper, ResearchLandscape, ResearchSynthesis } from '@/types/papers';
import type { NormalizedDataset, NormalizedModel } from '@/types/pipeline';
import type { QueryUnderstanding } from '@/server/query-understanding/queryParser';
import { extractCoreSearchKeywords } from '@/server/assistant/keywordExtractor';
import { searchSemanticScholar } from './semanticScholar';
import { searchOpenAlex } from './openAlex';
import { searchArxiv } from './arxiv';
import { searchCrossref } from './crossref';
import { searchPubMed } from './pubmed';
import {
    normalizeSemanticScholar,
    normalizeOpenAlex,
    normalizeArxiv,
    normalizeCrossref,
    normalizePubMed,
    deduplicateAndMergePapers,
} from './paperNormalizer';
import { scorePaper, buildResearchLandscape } from './paperScorer';
import { paperQueryCache } from './paperCache';

export interface ResearchSearchInput {
    query: string;
    queryUnderstanding?: QueryUnderstanding;
    datasets?: Partial<NormalizedDataset>[];
    models?: Partial<NormalizedModel>[];
    bestDataset?: Partial<NormalizedDataset> | null;
    bestModel?: Partial<NormalizedModel> | null;
    limit?: number;
}

export interface ResearchSearchResult {
    papers: NormalizedPaper[];
    researchLandscape: ResearchLandscape;
    researchSynthesis: ResearchSynthesis;
    audit: Record<string, any>;
}

/**
Builds targeted scholarly search queries based on the project research profile.
Uses sub-string extraction to ensure concise 2-5 word queries are sent to academic APIs.
/
function buildScholarlyQueries(input: ResearchSearchInput): string[] {
    const queries: string[] = [];
    const qu = input.queryUnderstanding;
    const rawQuery = input.query.trim();

    // 1. Extract concise core sub-string keywords
    const extracted = extractCoreSearchKeywords(rawQuery);
    if (extracted.primaryQuery) queries.push(extracted.primaryQuery);
    if (extracted.secondaryQuery && extracted.secondaryQuery !== extracted.primaryQuery) {
        queries.push(extracted.secondaryQuery);
    }
    if (extracted.tertiaryQuery && !queries.includes(extracted.tertiaryQuery)) {
        queries.push(extracted.tertiaryQuery);
    }

    // 2. Short raw user query (only if <= 5 words)
    if (rawQuery && rawQuery.split(/\s+/).length <= 5) {
        queries.push(rawQuery);
    }

    // 3. Exact dataset names & repository IDs
    if (input.bestDataset?.id) {
        queries.push(input.bestDataset.id);
        const shortName = input.bestDataset.id.split('/').pop();
        if (shortName && shortName !== input.bestDataset.id) {
            queries.push(shortName.replace(/_/g, ' '));
        }
    }
    if (input.bestDataset?.name && input.bestDataset.name !== input.bestDataset.id) {
        queries.push(input.bestDataset.name);
    }

    // 4. Platform & Robot specific queries (e.g. SO-101, LeRobot, Project-IRA)
    const specificEntity = qu?.specificEntityMentioned;
    const target = qu?.target.value;
    const task = qu?.task.value;
    const framework = qu?.framework.value;
    const domain = qu?.domain.value;
    const modality = qu?.modality.value;

    if (specificEntity) {
        queries.push(specificEntity);
        if (task) queries.push(`${specificEntity} ${task}`);
        if (domain) queries.push(`${specificEntity} ${domain}`);
    }

    if (target && target !== 'unknown') {
        queries.push(target);
        if (task && task !== 'unknown') queries.push(`${target} ${task}`);
        if (modality && modality !== 'unknown') queries.push(`${target} ${modality}`);
    }

    // 5. Model names (e.g. SmolVLA, Pi0.5, SegFormer)
    if (input.bestModel?.name || input.bestModel?.architecture) {
        const modelName = input.bestModel.name || input.bestModel.architecture;
        if (modelName) {
            queries.push(modelName);
            if (target && target !== 'unknown') queries.push(`${modelName} ${target}`);
            if (task && task !== 'unknown') queries.push(`${modelName} ${task}`);
        }
    }

    // 6. Task + Modality technical query
    if (task && task !== 'unknown' && modality && modality !== 'unknown') {
        queries.push(`${task} ${modality}`);
    }

    // Deduplicate and limit to concise queries (<= 6 words each)
    const seen = new Set<string>();
    const cleaned: string[] = [];
    for (const q of queries) {
        const norm = q.toLowerCase().replace(/[^a-z0-9\s\-_]/g, ' ').replace(/\s+/g, ' ').trim();
        if (norm.length >= 3 && norm.split(/\s+/).length <= 6 && !seen.has(norm)) {
            seen.add(norm);
            cleaned.push(q.trim());
        }
    }

    return cleaned.slice(0, 6);
}

/**
Generates an evidence-grounded Research Synthesis distinguishing FACTS FROM SOURCE vs AI INTERPRETATION.
/
function generateResearchSynthesis(
    papers: NormalizedPaper[],
    input: ResearchSearchInput,
    landscape: ResearchLandscape
): ResearchSynthesis {
    const factsFromSource: Array<{ source: string; fact: string }> = [];
    const aiInterpretation: string[] = [];

    const topPapers = papers.slice(0, 5);

    // Extract facts from top retrieved papers
    for (const paper of topPapers) {
        const yearStr = paper.year ? ` (${paper.year})` : '';
        const venueStr = paper.venue && !paper.venue.includes('Academic') ? ` in ${paper.venue}` : '';
        const citationStr = paper.citationCount ? ` [${paper.citationCount.toLocaleString()} citations]` : '';

        factsFromSource.push({
            source: `${paper.authors[0] || 'Authors'} et al.${yearStr}${venueStr}`,
            fact: `"${paper.title}" — ${paper.tldr || paper.abstract.slice(0, 160)}...${citationStr}`,
        });
    }

    // Context facts
    if (input.bestDataset?.id) {
        factsFromSource.push({
            source: `Dataset Hub (${input.bestDataset.source || 'Hub'})`,
            fact: `Selected dataset identifier: "${input.bestDataset.id}" (${input.bestDataset.task || 'ML Task'}).`,
        });
    }

    // AI Interpretations
    const domain = input.queryUnderstanding?.domain.value || 'Machine Learning';
    const task = input.queryUnderstanding?.task.value || 'AI';
    const target = input.queryUnderstanding?.target.value;

    aiInterpretation.push(
        `Research Landscape is classified as "${landscape.researchMaturity}" with ${landscape.totalPapers} relevant scientific papers discovered across open academic repositories.`
    );

    if (landscape.exactDatasetPapers > 0) {
        aiInterpretation.push(
            `Found ${landscape.exactDatasetPapers} peer-reviewed publication(s) directly using or benchmarking the target dataset.`
        );
    }

    if (target && target !== 'unknown') {
        aiInterpretation.push(
            `Literature on ${target} demonstrates growing adoption of modern deep learning architectures and standardized evaluation protocols.`
        );
    } else {
        aiInterpretation.push(
            `Recent publications in ${domain} focus heavily on ${task} improvements, self-supervised pretraining, and multimodal alignment.`
        );
    }

    if (landscape.latestPaperYear && landscape.latestPaperYear >= 2025) {
        aiInterpretation.push(
            `Recent state-of-the-art breakthroughs (${landscape.latestPaperYear}) provide viable baseline architectures for rapid transfer learning.`
        );
    }

    const summary = [
        `Analysis of ${landscape.totalPapers} scientific papers reveals an active ${landscape.researchMaturity.toLowerCase()} research trajectory in ${domain}.`,
        topPapers.length > 0
            ? `Key literature highlights ${topPapers[0].title} by ${topPapers[0].authors[0] || 'researchers'}${topPapers[0].year ? ` (${topPapers[0].year})` : ''}, addressing ${task}.`
            : `Scholarly literature provides foundational methodologies for your project.`,
        input.bestDataset ? `The dataset ${input.bestDataset.name || input.bestDataset.id} aligns directly with current experimental benchmarks.` : '',
    ].filter(Boolean).join(' ');

    return {
        summary,
        factsFromSource,
        aiInterpretation,
    };
}

/**
Main Paper Search Aggregator

## Signature
```typescript
function searchResearchPapers(input: ResearchSearchInput): Promise<ResearchSearchResult>
```
