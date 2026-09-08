# buildResearchLandscape

**File:** `src\server\papers\paperScorer.ts`

## Description
Generates 2-4 factual evidence-grounded bullet points explaining why the paper is relevant.
/
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
Calculates research maturity and research landscape summary from scored papers.

## Signature
```typescript
function buildResearchLandscape(papers: NormalizedPaper[]): ResearchLandscape
```
