# capOutputTokens

**File:** `src\server\security\usageLimiter.ts`

## Description
Enforces strict bounds on requested output tokens.

## Signature
```typescript
function capOutputTokens(requestedTokens?: number, maxCap = HARD_CAP_COMPLETION_TOKENS): number
```
