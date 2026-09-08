# reconstructOpenAlexAbstract

**File:** `src\server\papers\openAlex.ts`

## Description
OpenAlex API Integration
Discovers scholarly works, concepts, citations, and open-access metadata from OpenAlex.
/

import { providerRawCache, buildPaperSearchKey } from './paperCache';

export interface OpenAlexAuthor {
    author: {
        id: string;
        display_name: string;
    };
    institutions?: Array<{ id: string; display_name: string }>;
}

export interface OpenAlexWorkRaw {
    id: string;
    doi?: string;
    title?: string;
    display_name?: string;
    publication_year?: number;
    publication_date?: string;
    cited_by_count?: number;
    open_access?: {
        is_oa?: boolean;
        oa_status?: string;
        oa_url?: string;
    };
    primary_location?: {
        source?: {
            display_name?: string;
            type?: string;
        };
        pdf_url?: string;
        landing_page_url?: string;
    };
    host_venue?: {
        display_name?: string;
    };
    authorships?: OpenAlexAuthor[];
    concepts?: Array<{
        id: string;
        display_name: string;
        score: number;
    }>;
    abstract_inverted_index?: Record<string, number[]>;
    type?: string;
}

export interface OpenAlexResponse {
    meta?: {
        count?: number;
        page?: number;
        per_page?: number;
    };
    results?: OpenAlexWorkRaw[];
}

/**
Reconstructs standard abstract paragraph text from OpenAlex inverted index structure.

## Signature
```typescript
function reconstructOpenAlexAbstract(invertedIndex?: Record<string, number[]>): string
```
