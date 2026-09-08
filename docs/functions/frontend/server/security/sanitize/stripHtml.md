# stripHtml

**File:** `src\server\security\sanitize.ts`

## Description
Sanitization utility for inputs before storing in database/file store or rendering.
Protects against XSS, NoSQL/JSON injection, null byte injection, and prototype pollution.
/

const DANGEROUS_PATTERNS = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    /javascript\s*:/gi,
    /data\s*:\s*text\/html/gi,
    /vbscript\s*:/gi,
    /on\w+\s*=/gi, // onerror=, onclick=, onload=
];

/**
Strips HTML tags and script vectors from strings.

## Signature
```typescript
function stripHtml(input: string): string
```
