/**
 * Paper Normalizer & Deduplication Engine
 *
 * Normalizes raw responses from Semantic Scholar, OpenAlex, arXiv, Crossref, and PubMed
 * into a single unified `NormalizedPaper` contract.
 *
 * Deduplication follows strict identity priority:
 * 1. Normalized DOI (e.g. "10.1145/...")
 * 2. Normalized arXiv ID (e.g. "2401.12345")
 * 3. Semantic Scholar ID
 * 4. Normalized title + First author + Year
 */

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
 * Normalizes a raw Semantic Scholar paper.
 */
export function normalizeSemanticScholar(raw: SemanticScholarPaperRaw): NormalizedPaper {
    const authors = Array.isArray(raw.authors) ? raw.authors.map((a) => a.name).filter(Boolean) : [];
    const doi = normalizeDoi(raw.externalIds?.DOI);
    const arxivId = normalizeArxivId(raw.externalIds?.ArXiv);
    const id = doi ? `doi:${doi}` : arxivId ? `arxiv:${arxivId}` : `s2:${raw.paperId}`;

    const pdfUrl = raw.openAccessPdf?.url || (arxivId ? `https://arxiv.org/pdf/${arxivId}.pdf` : null);
    const isPreprint = Boolean(arxivId && (!raw.venue || raw.venue.toLowerCase().includes('arxiv')));

    return {
        id,
        title: (raw.title || 'Untitled Research Paper').trim(),
        authors: authors.length > 0 ? authors : ['Authors not listed'],
        authorDetails: Array.isArray(raw.authors) ? raw.authors.map((a) => ({ name: a.name, authorId: a.authorId })) : [],
        year: raw.year || null,
        publicationDate: raw.publicationDate || (raw.year ? `${raw.year}-01-01` : null),
        venue: raw.venue?.trim() || (isPreprint ? 'arXiv Preprint' : 'Academic Publication'),
        abstract: raw.abstract?.trim() || raw.tldr?.text?.trim() || 'Abstract not available.',
        tldr: raw.tldr?.text?.trim(),
        citationCount: typeof raw.citationCount === 'number' ? raw.citationCount : null,
        citationSource: 'Semantic Scholar',
        openAccess: Boolean(raw.openAccessPdf?.url || arxivId),
        openAccessPdf: raw.openAccessPdf?.url || null,
        pdfUrl,
        doi,
        paperUrl: raw.url || (doi ? `https://doi.org/${doi}` : arxivId ? `https://arxiv.org/abs/${arxivId}` : `https://www.semanticscholar.org/paper/${raw.paperId}`),
        arxivId,
        semanticScholarId: raw.paperId,
        pubmedId: raw.externalIds?.PubMed,
        relationship: 'RELATED_RESEARCH',
        relationshipEvidence: 'Derived from scholarly relevance search.',
        relevanceScore: 50,
        scoreBreakdown: defaultScoreBreakdown(),
        topics: Array.isArray(raw.fieldsOfStudy) ? raw.fieldsOfStudy : [],
        fieldsOfStudy: Array.isArray(raw.fieldsOfStudy) ? raw.fieldsOfStudy : [],
        publicationTypes: Array.isArray(raw.publicationTypes) ? raw.publicationTypes : [],
        isPreprint,
        whyRelevant: [],
        sources: ['Semantic Scholar'],
        lastChecked: new Date().toISOString(),
        rawMetadata: raw as unknown as Record<string, unknown>,
    };
}

/**
 * Normalizes a raw OpenAlex work.
 */
export function normalizeOpenAlex(raw: OpenAlexWorkRaw): NormalizedPaper {
    const authors: string[] = [];
    if (Array.isArray(raw.authorships)) {
        for (const auth of raw.authorships) {
            if (auth.author?.display_name) {
                authors.push(auth.author.display_name.trim());
            }
        }
    }

    const doi = normalizeDoi(raw.doi);
    const id = doi ? `doi:${doi}` : `openalex:${raw.id?.replace('https://openalex.org/', '')}`;
    const venue = raw.primary_location?.source?.display_name || raw.host_venue?.display_name || 'Academic Venue';
    const abstract = reconstructOpenAlexAbstract(raw.abstract_inverted_index) || 'Abstract not available.';
    const pdfUrl = raw.primary_location?.pdf_url || raw.open_access?.oa_url || null;
    const isPreprint = raw.type === 'preprint' || venue.toLowerCase().includes('arxiv') || venue.toLowerCase().includes('biorxiv');

    const topics = Array.isArray(raw.concepts)
        ? raw.concepts.sort((a, b) => b.score - a.score).slice(0, 5).map((c) => c.display_name)
        : [];

    return {
        id,
        title: (raw.display_name || raw.title || 'Untitled Scholarly Work').trim(),
        authors: authors.length > 0 ? authors : ['Authors not listed'],
        year: raw.publication_year || null,
        publicationDate: raw.publication_date || (raw.publication_year ? `${raw.publication_year}-01-01` : null),
        venue,
        abstract,
        citationCount: typeof raw.cited_by_count === 'number' ? raw.cited_by_count : null,
        citationSource: 'OpenAlex',
        openAccess: Boolean(raw.open_access?.is_oa || pdfUrl),
        openAccessPdf: pdfUrl,
        pdfUrl,
        doi,
        paperUrl: raw.doi || raw.primary_location?.landing_page_url || raw.id || `https://doi.org/${doi}`,
        openAlexId: raw.id,
        relationship: 'RELATED_RESEARCH',
        relationshipEvidence: 'Retrieved from OpenAlex citation graph.',
        relevanceScore: 50,
        scoreBreakdown: defaultScoreBreakdown(),
        topics,
        isPreprint,
        whyRelevant: [],
        sources: ['OpenAlex'],
        lastChecked: new Date().toISOString(),
        rawMetadata: raw as unknown as Record<string, unknown>,
    };
}

/**
 * Normalizes a raw arXiv paper.
 */
export function normalizeArxiv(raw: ArxivPaperRaw): NormalizedPaper {
    const arxivId = normalizeArxivId(raw.arxivId);
    const doi = normalizeDoi(raw.doi);
    const id = doi ? `doi:${doi}` : `arxiv:${arxivId || raw.id}`;
    const yearMatch = raw.published.match(/\b(19\d\d|20\d\d)\b/);
    const year = yearMatch ? parseInt(yearMatch[1], 10) : null;
    const pubDate = raw.published ? raw.published.split('T')[0] : (year ? `${year}-01-01` : null);

    return {
        id,
        title: raw.title.trim(),
        authors: raw.authors.length > 0 ? raw.authors : ['Authors not listed'],
        year,
        publicationDate: pubDate,
        venue: raw.journalRef ? raw.journalRef : 'arXiv Preprint',
        abstract: raw.summary.trim() || 'Summary not available.',
        citationCount: null, // arXiv does not provide native citation counts
        openAccess: true,   // All arXiv papers are open access
        openAccessPdf: raw.pdfUrl,
        pdfUrl: raw.pdfUrl,
        doi,
        paperUrl: raw.landingUrl || `https://arxiv.org/abs/${arxivId}`,
        arxivId,
        relationship: 'RELATED_RESEARCH',
        relationshipEvidence: 'Discovered from arXiv research repository.',
        relevanceScore: 50,
        scoreBreakdown: defaultScoreBreakdown(),
        topics: raw.categories || (raw.primaryCategory ? [raw.primaryCategory] : []),
        isPreprint: !raw.journalRef,
        whyRelevant: [],
        sources: ['arXiv'],
        lastChecked: new Date().toISOString(),
        rawMetadata: raw as unknown as Record<string, unknown>,
    };
}

/**
 * Normalizes a raw Crossref work.
 */
export function normalizeCrossref(raw: CrossrefWorkRaw): NormalizedPaper {
    const doi = normalizeDoi(raw.DOI);
    const id = doi ? `doi:${doi}` : `crossref:${raw.DOI}`;
    const title = Array.isArray(raw.title) && raw.title.length > 0 ? raw.title[0].trim() : 'Untitled Work';

    const authors: string[] = [];
    if (Array.isArray(raw.author)) {
        for (const a of raw.author) {
            const name = a.name || `${a.given || ''} ${a.family || ''}`.trim();
            if (name) authors.push(name);
        }
    }

    const dateParts = raw.published?.['date-parts']?.[0]
        || raw['published-online']?.['date-parts']?.[0]
        || raw['published-print']?.['date-parts']?.[0];

    const year = dateParts && dateParts.length > 0 ? dateParts[0] : null;
    const month = dateParts && dateParts.length > 1 ? String(dateParts[1]).padStart(2, '0') : '01';
    const day = dateParts && dateParts.length > 2 ? String(dateParts[2]).padStart(2, '0') : '01';
    const publicationDate = year ? `${year}-${month}-${day}` : null;

    const venue = Array.isArray(raw['container-title']) && raw['container-title'].length > 0
        ? raw['container-title'][0].trim()
        : raw.publisher || 'Peer-Reviewed Conference / Journal';

    let pdfUrl: string | null = null;
    if (Array.isArray(raw.link)) {
        const pdfObj = raw.link.find((l) => l['content-type']?.includes('pdf'));
        if (pdfObj?.URL) pdfUrl = pdfObj.URL;
    }

    return {
        id,
        title,
        authors: authors.length > 0 ? authors : ['Authors not listed'],
        year,
        publicationDate,
        venue,
        abstract: raw.abstract?.replace(/<[^>]+>/g, '').trim() || 'Abstract available on publisher source page.',
        citationCount: typeof raw['is-referenced-by-count'] === 'number' ? raw['is-referenced-by-count'] : null,
        citationSource: 'Crossref',
        openAccess: Boolean(pdfUrl),
        openAccessPdf: pdfUrl,
        pdfUrl,
        doi,
        paperUrl: raw.URL || (doi ? `https://doi.org/${doi}` : `https://search.crossref.org/?q=${encodeURIComponent(title)}`),
        relationship: 'RELATED_RESEARCH',
        relationshipEvidence: 'Crossref DOI record and publication registry.',
        relevanceScore: 50,
        scoreBreakdown: defaultScoreBreakdown(),
        topics: Array.isArray(raw.subject) ? raw.subject : [],
        isPreprint: raw.type === 'posted-content' || raw.type === 'peer-review',
        whyRelevant: [],
        sources: ['Crossref'],
        lastChecked: new Date().toISOString(),
        rawMetadata: raw as unknown as Record<string, unknown>,
    };
}

/**
 * Normalizes a raw PubMed article.
 */
export function normalizePubMed(raw: PubMedArticleRaw): NormalizedPaper {
    const doi = normalizeDoi(raw.doi);
    const id = doi ? `doi:${doi}` : `pmid:${raw.uid}`;

    return {
        id,
        title: raw.title.trim(),
        authors: raw.authors.length > 0 ? raw.authors : ['Authors not listed'],
        year: raw.year || null,
        publicationDate: raw.pubdate || (raw.year ? `${raw.year}-01-01` : null),
        venue: raw.source || 'PubMed Clinical / Biomedical Journal',
        abstract: 'Peer-reviewed clinical and biomedical article indexed in PubMed.',
        citationCount: null,
        openAccess: false,
        openAccessPdf: null,
        pdfUrl: null,
        doi,
        paperUrl: raw.url || `https://pubmed.ncbi.nlm.nih.gov/${raw.uid}/`,
        pubmedId: raw.uid,
        relationship: 'RELATED_RESEARCH',
        relationshipEvidence: 'Indexed in PubMed biomedical database.',
        relevanceScore: 50,
        scoreBreakdown: defaultScoreBreakdown(),
        topics: ['Biomedical', 'Clinical ML'],
        isPreprint: false,
        whyRelevant: [],
        sources: ['PubMed'],
        lastChecked: new Date().toISOString(),
        rawMetadata: raw as unknown as Record<string, unknown>,
    };
}

/**
 * Merges two normalized papers that refer to the exact same scholarly work.
 */
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
 * Deduplicates and merges raw paper lists from all 5 providers.
 */
export function deduplicateAndMergePapers(papers: NormalizedPaper[]): NormalizedPaper[] {
    const doiMap = new Map<string, NormalizedPaper>();
    const arxivMap = new Map<string, NormalizedPaper>();
    const s2Map = new Map<string, NormalizedPaper>();
    const titleYearMap = new Map<string, NormalizedPaper>();
    const mergedList: NormalizedPaper[] = [];

    for (const paper of papers) {
        let existing: NormalizedPaper | undefined;

        // 1. Check DOI
        if (paper.doi) {
            existing = doiMap.get(paper.doi);
        }

        // 2. Check arXiv ID
        if (!existing && paper.arxivId) {
            existing = arxivMap.get(paper.arxivId);
        }

        // 3. Check Semantic Scholar ID
        if (!existing && paper.semanticScholarId) {
            existing = s2Map.get(paper.semanticScholarId);
        }

        // 4. Check Normalized Title + Author + Year
        const normTitle = normalizeTitle(paper.title);
        const firstAuth = getFirstAuthorLastName(paper.authors);
        const titleKey = `${normTitle}::${firstAuth}::${paper.year || 'na'}`;
        if (!existing && normTitle.length > 10) {
            existing = titleYearMap.get(titleKey);
        }

        if (existing) {
            // Merge metadata into existing record in-place
            const merged = mergePaperRecords(existing, paper);
            Object.assign(existing, merged);

            // Re-index all keys with updated record
            if (merged.doi) doiMap.set(merged.doi, existing);
            if (merged.arxivId) arxivMap.set(merged.arxivId, existing);
            if (merged.semanticScholarId) s2Map.set(merged.semanticScholarId, existing);
            if (normTitle.length > 10) titleYearMap.set(titleKey, existing);
        } else {
            // New unique paper
            mergedList.push(paper);
            if (paper.doi) doiMap.set(paper.doi, paper);
            if (paper.arxivId) arxivMap.set(paper.arxivId, paper);
            if (paper.semanticScholarId) s2Map.set(paper.semanticScholarId, paper);
            if (normTitle.length > 10) titleYearMap.set(titleKey, paper);
        }
    }

    return mergedList;
}
