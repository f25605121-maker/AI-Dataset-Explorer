/**
 * Paper Scorer, Landscape Analyzer & Rationale Generator
 *
 * Computes transparent AI Relevance Scores (0–100), Research Landscape metrics,
 * Research Maturity classifications, and evidence-grounded "Why is this paper relevant?" points.
 */

import type {
    NormalizedPaper,
    PaperScoreBreakdown,
    ResearchLandscape,
    ResearchMaturity,
} from '@/types/papers';
import type { QueryUnderstanding } from '@/server/query-understanding/queryParser';
import type { ClassificationContext } from './paperClassifier';
import { classifyPaperRelationship } from './paperClassifier';

/**
 * Computes the transparent AI Relevance Score (0-100) for a paper.
 */
export function scorePaper(
    paper: NormalizedPaper,
    context: ClassificationContext
): NormalizedPaper {
    const qu = context.queryUnderstanding;
    const textCorpus = `${paper.title} ${paper.abstract} ${paper.tldr || ''} ${paper.venue} ${(paper.topics || []).join(' ')}`.toLowerCase();

    // 1. Relationship classification
    const classification = classifyPaperRelationship(paper, context);
    const relationship = classification.relationship;

    // 2. Score breakdown components
    let exactDataset = 0;
    let exactModel = 0;
    let taskMatch = 0;
    let domainMatch = 0;
    let modalityMatch = 0;
    let keywordMatch = 0;
    let recency = 0;

    // Exact Dataset (+35)
    if (relationship === 'EXACT_DATASET') {
        exactDataset = 35;
    }

    // Exact Model (+25)
    if (relationship === 'EXACT_MODEL') {
        exactModel = 25;
    }

    // Directly Related baseline
    if (relationship === 'DIRECTLY_RELATED') {
        taskMatch += 10;
        domainMatch += 5;
    }

    // Task Match (+15)
    const task = (qu?.task.value || '').toLowerCase();
    if (task && task !== 'unknown' && textCorpus.includes(task)) {
        taskMatch = 15;
    } else if (task && task !== 'unknown') {
        const taskWords = task.split(/\s+/).filter((w) => w.length > 3);
        const matched = taskWords.filter((w) => textCorpus.includes(w));
        if (matched.length > 0) {
            taskMatch = Math.round((matched.length / taskWords.length) * 12);
        }
    }

    // Domain Match (+10)
    const domain = (qu?.domain.value || '').toLowerCase();
    const subdomain = (qu?.subdomain.value || '').toLowerCase();
    if (domain && domain !== 'unknown' && textCorpus.includes(domain)) {
        domainMatch = 10;
    } else if (subdomain && subdomain !== 'unknown' && textCorpus.includes(subdomain)) {
        domainMatch = 10;
    } else if (domain) {
        domainMatch = 5;
    }

    // Modality Match (+5)
    const modality = (qu?.modality.value || '').toLowerCase();
    if (modality && modality !== 'unknown' && textCorpus.includes(modality)) {
        modalityMatch = 5;
    }

    // Target / Entity / Keyword Match (+5)
    const target = (qu?.target.value || '').toLowerCase();
    if (target && target !== 'unknown' && textCorpus.includes(target)) {
        keywordMatch += 3;
    }
    const explicitWords = qu?.explicitKeywords || [];
    const matchedKeywords = explicitWords.filter((kw) => textCorpus.includes(kw.toLowerCase()));
    if (matchedKeywords.length > 0) {
        keywordMatch = Math.min(5, keywordMatch + 2);
    }

    // Recency (+5)
    const currentYear = new Date().getFullYear();
    const paperYear = paper.year || (paper.publicationDate ? parseInt(paper.publicationDate.slice(0, 4), 10) : null);
    if (paperYear) {
        const diff = currentYear - paperYear;
        if (diff <= 0) recency = 5;       // Current/Future year (e.g. 2026)
        else if (diff === 1) recency = 4; // 2025
        else if (diff === 2) recency = 3; // 2024
        else if (diff === 3) recency = 2; // 2023
        else if (diff <= 5) recency = 1;  // 2021-2022
    }

    // Base score for any scholarly paper returned by search
    let rawScore = exactDataset + exactModel + taskMatch + domainMatch + modalityMatch + keywordMatch + recency;
    if (relationship === 'DIRECTLY_RELATED' && rawScore < 60) rawScore = 65 + recency;
    if (relationship === 'RELATED_RESEARCH' && rawScore < 30) rawScore = 40 + recency;
    if (relationship === 'EXACT_DATASET' && rawScore < 85) rawScore = 88 + recency;
    if (relationship === 'EXACT_MODEL' && rawScore < 75) rawScore = 78 + recency;

    const relevanceScore = Math.min(100, Math.max(10, rawScore));

    const scoreBreakdown: PaperScoreBreakdown = {
        exactDataset,
        exactModel,
        taskMatch,
        domainMatch,
        modalityMatch,
        keywordMatch,
        recency,
    };

    // Generate 2-4 bullet points for "Why is this paper relevant?"
    const whyRelevant = generateWhyRelevantPoints(paper, relationship, classification.evidence, qu, paperYear);

    return {
        ...paper,
        relationship,
        relationshipEvidence: classification.evidence,
        datasetMentioned: classification.datasetMentioned,
        modelMentioned: classification.modelMentioned,
        relevanceScore,
        scoreBreakdown,
        whyRelevant,
    };
}

/**
 * Generates 2-4 factual evidence-grounded bullet points explaining why the paper is relevant.
 */
function generateWhyRelevantPoints(
    paper: NormalizedPaper,
    relationship: NormalizedPaper['relationship'],
    evidence: string,
    qu?: QueryUnderstanding,
    year?: number | null
): string[] {
    const points: string[] = [];

    // Point 1: Core relationship rationale
    if (relationship === 'EXACT_DATASET') {
        points.push(`Directly uses and evaluates the dataset: ${evidence}`);
    } else if (relationship === 'EXACT_MODEL') {
        points.push(`Specifically examines the target model architecture: ${evidence}`);
    } else if (relationship === 'DIRECTLY_RELATED') {
        points.push(`Addresses the same core research problem: ${evidence}`);
    } else {
        points.push(`Contextually related to the ${qu?.domain.value || 'machine learning'} domain.`);
    }

    // Point 2: Specific task & modality alignment
    if (qu?.task.value && qu.task.value !== 'unknown') {
        points.push(`Investigates "${qu.task.value}" methodology relevant to your project.`);
    }

    // Point 3: Publication & citation evidence
    if (year && year >= 2024) {
        points.push(`Recent research (${year}) reflecting state-of-the-art developments.`);
    } else if (typeof paper.citationCount === 'number' && paper.citationCount > 20) {
        points.push(`Well-cited foundational work (${paper.citationCount.toLocaleString()} citations on ${paper.citationSource || 'Academic Index'}).`);
    }

    // Point 4: Open access & venue
    if (paper.openAccess) {
        points.push(`Open access full-text publication available (${paper.venue || 'Open Access'}).`);
    } else if (paper.venue && !paper.venue.includes('Academic')) {
        points.push(`Published in ${paper.venue}.`);
    }

    return points.slice(0, 4);
}

/**
 * Calculates research maturity and research landscape summary from scored papers.
 */
export function buildResearchLandscape(papers: NormalizedPaper[]): ResearchLandscape {
    const totalPapers = papers.length;
    const exactDatasetPapers = papers.filter((p) => p.relationship === 'EXACT_DATASET').length;
    const exactModelPapers = papers.filter((p) => p.relationship === 'EXACT_MODEL').length;
    const directlyRelatedPapers = papers.filter((p) => p.relationship === 'DIRECTLY_RELATED').length;
    const relatedResearchPapers = papers.filter((p) => p.relationship === 'RELATED_RESEARCH').length;

    // Years
    const years = papers.map((p) => p.year).filter((y): y is number => typeof y === 'number' && y > 1990);
    const latestPaperYear = years.length > 0 ? Math.max(...years) : null;

    // Most cited paper
    let mostCitedPaper: NormalizedPaper | null = null;
    let maxCitations = -1;
    for (const p of papers) {
        if (typeof p.citationCount === 'number' && p.citationCount > maxCitations) {
            maxCitations = p.citationCount;
            mostCitedPaper = p;
        }
    }

    // Yearly distribution (group by year)
    const yearCountMap = new Map<number, number>();
    for (const y of years) {
        yearCountMap.set(y, (yearCountMap.get(y) || 0) + 1);
    }
    const yearlyDistribution = Array.from(yearCountMap.entries())
        .map(([year, count]) => ({ year, count }))
        .sort((a, b) => b.year - a.year);

    // Determine Research Maturity
    let researchMaturity: ResearchMaturity = 'Emerging';
    let maturityReason = '';

    const recentPapers = papers.filter((p) => p.year && p.year >= 2024).length;
    const totalCitations = papers.reduce((sum, p) => sum + (p.citationCount || 0), 0);

    if (totalPapers >= 8 && totalCitations > 100 && (directlyRelatedPapers >= 4 || exactDatasetPapers > 0)) {
        researchMaturity = 'Established';
        maturityReason = `Established literature with strong citation activity (${totalCitations.toLocaleString()}+ total citations) and multiple independent studies.`;
    } else if (totalPapers >= 3 || recentPapers >= 2 || directlyRelatedPapers >= 2) {
        researchMaturity = 'Developing';
        maturityReason = `Developing research field with active publications (${recentPapers} recent papers since 2024) and growing benchmark adoption.`;
    } else {
        researchMaturity = 'Emerging';
        maturityReason = `Emerging frontier area with early publications and exploratory implementations.`;
    }

    return {
        totalPapers,
        exactDatasetPapers,
        exactModelPapers,
        directlyRelatedPapers,
        relatedResearchPapers,
        latestPaperYear,
        mostCitedPaperYear: mostCitedPaper?.year || null,
        mostCitedPaperTitle: mostCitedPaper?.title || null,
        topCitationCount: maxCitations >= 0 ? maxCitations : null,
        researchMaturity,
        maturityReason,
        yearlyDistribution,
    };
}
