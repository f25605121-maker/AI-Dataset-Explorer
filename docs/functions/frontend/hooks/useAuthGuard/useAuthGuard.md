# useAuthGuard

**File:** `src\hooks\useAuthGuard.ts`

## Description
useAuthGuard

Defense-in-depth client-side route guard.
If the user's session expires or is missing on a protected view,
automatically redirects them to /login with the target route preserved
in the redirect_to query parameter.

## Signature
```typescript
function useAuthGuard(options: UseAuthGuardOptions = {}): void
```
