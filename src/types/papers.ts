/**
 * Research Paper Types & Schemas
 *
 * Defines the standard normalized paper interface, relationship classifications,
 * research landscape metrics, and scoring breakdowns.
 */

export type PaperRelationship =
    | 'EXACT_DATASET'
    | 'EXACT_MODEL'
    | 'DIRECTLY_RELATED'
    | 'RELATED_RESEARCH'
    | string;

export type ResearchMaturity = 'Established' | 'Developing' | 'Emerging Discovery' | 'Emerging' | string;

export interface PaperAuthor {
    name: string;
    authorId?: string;
    affiliations?: string[];
}

export interface PaperScoreBreakdown {
    exactDataset: number; // up to 35
    exactModel: number;   // up to 25
    taskMatch: number;    // up to 15
    domainMatch: number;  // up to 10
    modalityMatch: number;// up to 5
    keywordMatch: number; // up to 5
    recency: number;      // up to 5
}

export interface NormalizedPaper {
    id: string;                      // Canonical ID (DOI or arXiv or S2 or normalized hash)
    title: string;
    authors: string[];
    authorDetails?: PaperAuthor[];
    year: number | null;
    publicationDate: string | null;  // YYYY-MM-DD if available
    venue: string;                   // Conference / Journal / Repository
    abstract: string;
    tldr?: string;                   // AI or author short summary
    citationCount: number | null;
    citationSource?: string;         // E.g. 'Semantic Scholar', 'OpenAlex', 'Crossref'
    url?: string;                    // Canonical primary link
    paperUrl?: string | null;        // Landing / Abstract page
    pdfUrl?: string | null;          // Direct PDF link if available
    doi?: string | null;             // Normalized DOI
    arxivId?: string | null;         // e.g. 2305.12345
    pmid?: string | null;            // PubMed ID
    source?: 'semantic_scholar' | 'openalex' | 'arxiv' | 'pubmed' | 'crossref' | string;
    sources?: string[];              // All sources confirming this paper

    // Relationship to User Query & Discovered Assets
    relationship: PaperRelationship;
    relationshipReason?: string;     // Human-readable rationale for badge
    associatedDataset?: string;      // Dataset name / ID this paper benchmarked
    associatedModel?: string;        // Model name / ID this paper introduced/used

    // Quality & Relevance Scores
    relevanceScore: number;          // 0-100 normalized score
    confidenceScore?: number;        // 0-100 source reliability
    scoreBreakdown?: PaperScoreBreakdown;

    // Attributes for Filtering & Highlighting
    isPreprint?: boolean;
    isPeerReviewed?: boolean;
    openAccess?: boolean;
    hasCode?: boolean;
    codeUrl?: string | null;
    meshTerms?: string[];
    concepts?: string[];
    topMentionedDatasets?: string[];
    topMentionedModels?: string[];
    benchmarkMetrics?: Record<string, number | string>;
    whyRelevant?: string | string[] | null;
    relationshipEvidence?: string | null;
    badge?: string;
    data?: any;
    [key: string]: any;
}

export interface ResearchLandscape {
    totalPapers: number;
    exactDatasetPapers: number;
    exactModelPapers: number;
    directlyRelatedPapers: number;
    relatedResearchPapers: number;
    latestPaperYear: number | null;
    mostCitedPaperYear: number | null;
    mostCitedPaperTitle?: string | null;
    topCitationCount: number | null;
    researchMaturity: ResearchMaturity;
    maturityReason: string;
    yearlyDistribution: Record<number, number> | Array<{ year: number; count: number }>;
}

export interface ResearchSynthesis {
    summary: string;
    factsFromSource: Array<{ fact: string; source: string }>;
    aiInterpretation: string[];
}
