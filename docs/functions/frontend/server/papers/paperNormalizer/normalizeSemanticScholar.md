# normalizeSemanticScholar

**File:** `src\server\papers\paperNormalizer.ts`

## Description
Paper Normalizer & Deduplication Engine
Normalizes raw responses from Semantic Scholar, OpenAlex, arXiv, Crossref, and PubMed
into a single unified `NormalizedPaper` contract.
Deduplication follows strict identity priority:
1. Normalized DOI (e.g. "10.1145/...")
2. Normalized arXiv ID (e.g. "2401.12345")
3. Semantic Scholar ID
4. Normalized title + First author + Year
/

import type { NormalizedPaper, PaperScoreBreakdown } from '@/types/papers';
import type { SemanticScholarPaperRaw } from './semanticScholar';
import { type OpenAlexWorkRaw, reconstructOpenAlexAbstract } from './openAlex';
import type { ArxivPaperRaw } from './arxiv';
import type { CrossrefWorkRaw } from './crossref';
import type { PubMedArticleRaw } from './pubmed';

function normalizeDoi(doi?: string | null): string | null {
    if (!doi) return null;
    const clean = doi.trim().toLowerCase().replace(/^https?:\/\/(?:dx\.)?doi\.org\//, '');
    return clean.startsWith('10.') ? clean : null;
}

function normalizeArxivId(id?: string | null): string | null {
    if (!id) return null;
    const clean = id.trim().toLowerCase().replace(/^arxiv:\s*/i, '').replace(/v\d+$/i, '');
    return clean.length > 3 ? clean : null;
}

function normalizeTitle(title?: string | null): string {
    if (!title) return '';
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getFirstAuthorLastName(authors?: string[]): string {
    if (!authors || authors.length === 0) return '';
    const first = authors[0].trim();
    const parts = first.split(/\s+/);
    return parts[parts.length - 1].toLowerCase().replace(/[^a-z]/g, '');
}

function defaultScoreBreakdown(): PaperScoreBreakdown {
    return {
        exactDataset: 0,
        exactModel: 0,
        taskMatch: 0,
        domainMatch: 0,
        modalityMatch: 0,
        keywordMatch: 0,
        recency: 0,
    };
}

/**
Normalizes a raw Semantic Scholar paper.

## Signature
```typescript
function normalizeSemanticScholar(raw: SemanticScholarPaperRaw): NormalizedPaper
```
