# validateUploadedFile

**File:** `src\server\security\uploadValidator.ts`

## Description
Validates uploaded file against MIME whitelist, extension whitelist, and magic byte signatures.

## Signature
```typescript
function validateUploadedFile(buffer: Buffer,
    originalName: string,
    claimedMime?: string): FileValidationResult
```
