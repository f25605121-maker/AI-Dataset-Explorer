# POST

**File:** `src\app\api\auth\login\route.ts`

## Description
POST /api/auth/login

Production authentication endpoint:
- Rate-limited & locked against brute-force attacks
- Verifies credentials using bcrypt
- Sets browser-sandboxed HttpOnly session cookie
- Returns user profile only (tokens NEVER exposed in JSON or URLs)

## Signature
```typescript
function POST(req: NextRequest): void
```
