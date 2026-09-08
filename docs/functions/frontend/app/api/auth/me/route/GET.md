# GET

**File:** `src\app\api\auth\me\route.ts`

## Description
GET /api/auth/me

Verifies the incoming browser-sandboxed HttpOnly session cookie,
checks validity against the server-side user store, and returns
the authenticated user context.

## Signature
```typescript
function GET(req: NextRequest): void
```
