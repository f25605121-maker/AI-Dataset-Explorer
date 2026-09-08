# validateCsrf

**File:** `src\server\security\csrf.ts`

## Description
Validates the CSRF token in an incoming request using the Double Submit Cookie pattern.
Compares the token in the `x-csrf-token` header (or request body) against the token in the cookie.

## Signature
```typescript
function validateCsrf(req: Request | NextRequest): 
```
