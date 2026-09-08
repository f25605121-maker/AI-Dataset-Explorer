# extractExplicitModality

**File:** `src\server\search\modalityParser.ts`

## Description
Universal Modality Parser
Extracts and normalizes explicit data modality from dataset/model titles,
descriptions, tags, and formats.
Prioritizes explicit keyword signals:
MRI, CT, Ultrasound, X-ray, Histopathology, Dermoscopy, Fundus, OCT, Audio, Tabular, Text, Video.

## Signature
```typescript
function extractExplicitModality(title?: string | null,
    description?: string | null,
    tags: string[] = [],
    formats: string[] = []): string
```
