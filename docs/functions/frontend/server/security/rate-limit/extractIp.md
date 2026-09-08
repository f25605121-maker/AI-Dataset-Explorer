# extractIp

**File:** `src\server\security\rate-limit.ts`

## Description
Extracts the best available IP from a Request.
Only trusts x-forwarded-for when explicitly enabled (e.g. behind a known proxy).
Default: uses x-real-ip only, falls back to "unknown".

## Signature
```typescript
function extractIp(req: Request, trustForwardedFor = false): string
```
