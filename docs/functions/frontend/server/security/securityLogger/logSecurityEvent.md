# logSecurityEvent

**File:** `src\server\security\securityLogger.ts`

## Description
Logs a structured security event.

## Signature
```typescript
function logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): SecurityEvent
```
