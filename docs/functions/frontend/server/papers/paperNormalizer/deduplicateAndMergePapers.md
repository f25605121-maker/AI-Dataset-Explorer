# deduplicateAndMergePapers

**File:** `src\server\papers\paperNormalizer.ts`

## Description
Merges two normalized papers that refer to the exact same scholarly work.
/
function mergePaperRecords(primary: NormalizedPaper, secondary: NormalizedPaper): NormalizedPaper {
    // Merge sources
    const combinedSources = Array.from(new Set([...(primary.sources || []), ...(secondary.sources || [])]));

    // Best abstract (prefer longer, non-placeholder abstract)
    let bestAbstract = primary.abstract;
    if (
        (!bestAbstract || bestAbstract.length < 50 || bestAbstract.includes('not available')) &&
        secondary.abstract &&
        secondary.abstract.length > 50
    ) {
        bestAbstract = secondary.abstract;
    } else if (secondary.abstract && bestAbstract && secondary.abstract.length > bestAbstract.length + 50) {
        bestAbstract = secondary.abstract;
    }

    // Best citations: pick the higher verified number and its source
    let citationCount = primary.citationCount;
    let citationSource = primary.citationSource;
    if (typeof secondary.citationCount === 'number') {
        if (typeof citationCount !== 'number' || secondary.citationCount > citationCount) {
            citationCount = secondary.citationCount;
            citationSource = secondary.citationSource;
        }
    }

    // PDF URL: take secondary if primary missing
    const pdfUrl = primary.pdfUrl || secondary.pdfUrl || null;
    const openAccess = primary.openAccess || secondary.openAccess || Boolean(pdfUrl);
    const doi = primary.doi || secondary.doi || null;
    const arxivId = primary.arxivId || secondary.arxivId || null;
    const semanticScholarId = primary.semanticScholarId || secondary.semanticScholarId || null;
    const openAlexId = primary.openAlexId || secondary.openAlexId || null;
    const pubmedId = primary.pubmedId || secondary.pubmedId || null;

    // Venue: prefer peer-reviewed venue over generic preprint if available
    let venue = primary.venue;
    if (primary.isPreprint && !secondary.isPreprint && secondary.venue && !secondary.venue.toLowerCase().includes('arxiv')) {
        venue = secondary.venue;
    }

    const topics = Array.from(new Set([...primary.topics, ...secondary.topics])).slice(0, 8);

    return {
        ...primary,
        venue,
        abstract: bestAbstract,
        tldr: primary.tldr || secondary.tldr,
        citationCount,
        citationSource,
        openAccess,
        openAccessPdf: primary.openAccessPdf || secondary.openAccessPdf || pdfUrl,
        pdfUrl,
        doi,
        arxivId,
        semanticScholarId,
        openAlexId,
        pubmedId,
        topics,
        isPreprint: primary.isPreprint && secondary.isPreprint,
        sources: combinedSources,
    };
}

/**
Deduplicates and merges raw paper lists from all 5 providers.

## Signature
```typescript
function deduplicateAndMergePapers(papers: NormalizedPaper[]): NormalizedPaper[]
```
