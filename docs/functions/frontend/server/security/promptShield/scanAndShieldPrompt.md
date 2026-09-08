# scanAndShieldPrompt

**File:** `src\server\security\promptShield.ts`

## Description
Scans user input for prompt injection, jailbreak attempts, and token manipulation.

## Signature
```typescript
function scanAndShieldPrompt(rawInput: string, userId?: string, ip?: string): PromptScanResult
```
