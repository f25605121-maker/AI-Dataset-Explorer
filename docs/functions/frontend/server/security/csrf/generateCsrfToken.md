# generateCsrfToken

**File:** `src\server\security\csrf.ts`

## Description
Generates a signed CSRF token.
Format: `<randomHex>.<hmacSignature>`

## Signature
```typescript
function generateCsrfToken(): string
```
