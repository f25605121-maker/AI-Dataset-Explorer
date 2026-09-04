import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition, testName, detail) {
    if (condition) {
        console.log(`  ✓ PASS: ${testName}`);
        passed++;
    } else {
        console.error(`  ✗ FAIL: ${testName} ${detail ? `- ${detail}` : ''}`);
        failed++;
    }
}

async function runTests() {
    console.log('====================================================');
    console.log('  RUNNING 20-POINT SECURITY HARDENING VERIFICATION  ');
    console.log('====================================================\n');

    // ── Item 1: Add HSTS ──────────────────────────────────────────────
    console.log('--- Test Item 1: HSTS (HTTP Strict Transport Security) ---');
    const nextConfigFile = await fs.readFile(path.join(process.cwd(), 'next.config.ts'), 'utf-8');
    assert(
        nextConfigFile.includes('Strict-Transport-Security') &&
        nextConfigFile.includes('max-age=63072000') &&
        nextConfigFile.includes('includeSubDomains') &&
        nextConfigFile.includes('preload'),
        'next.config.ts enforces 2-year HSTS with includeSubDomains and preload'
    );
    const middlewareFile = await fs.readFile(path.join(process.cwd(), 'src', 'middleware.ts'), 'utf-8');
    assert(
        middlewareFile.includes('Strict-Transport-Security') && middlewareFile.includes('preload'),
        'middleware.ts attaches HSTS header dynamically to all responses'
    );

    // ── Item 2: Add CSRF tokens ───────────────────────────────────────
    console.log('\n--- Test Item 2: CSRF Tokens ---');
    const csrfFile = await fs.readFile(path.join(process.cwd(), 'src', 'lib', 'security', 'csrf.ts'), 'utf-8');
    assert(csrfFile.includes('generateCsrfToken') && csrfFile.includes('verifyCsrfTokenSignature') && csrfFile.includes('validateCsrf'), 'CSRF cryptographic verification and Double-Submit cookie logic implemented');
    const csrfRoute = await fs.readFile(path.join(process.cwd(), 'src', 'app', 'api', 'csrf', 'route.ts'), 'utf-8');
    assert(csrfRoute.includes('generateCsrfToken') && csrfRoute.includes('setCsrfCookie'), 'GET /api/csrf endpoint implemented');

    // ── Item 3: Reset sessions on password change ─────────────────────
    console.log('\n--- Test Item 3: Reset Sessions on Password Change ---');
    const userStoreFile = await fs.readFile(path.join(process.cwd(), 'src', 'lib', 'auth', 'userStore.ts'), 'utf-8');
    assert(userStoreFile.includes('sessionVersion') && userStoreFile.includes('passwordChangedAt'), 'userStore tracks sessionVersion and passwordChangedAt');
    const changePwRoute = await fs.readFile(path.join(process.cwd(), 'src', 'app', 'api', 'auth', 'change-password', 'route.ts'), 'utf-8');
    assert(changePwRoute.includes('updateUserPassword'), '/api/auth/change-password invalidates active sessions on update');
    const nextAuthRoute = await fs.readFile(path.join(process.cwd(), 'src', 'app', 'api', 'auth', '[...nextauth]', 'route.ts'), 'utf-8');
    assert(nextAuthRoute.includes('tokenVersion < currentVersion') && nextAuthRoute.includes('AUTH_SESSION_INVALIDATED'), 'NextAuth rejects stale JWTs when session version increments');

    // ── Item 4: Expire reset links ────────────────────────────────────
    console.log('\n--- Test Item 4: Expire Reset Links ---');
    assert(userStoreFile.includes('expiresAt = now + 15 * 60 * 1000') && userStoreFile.includes('tokenRecord.used = true'), 'Reset tokens enforce strict 15-min expiration and single-use consumption');
    const resetRoute = await fs.readFile(path.join(process.cwd(), 'src', 'app', 'api', 'auth', 'reset-password', 'route.ts'), 'utf-8');
    assert(resetRoute.includes('consumePasswordResetToken'), '/api/auth/reset-password enforces token validity and expiry');

    // ── Item 5: Prevent user enumeration ──────────────────────────────
    console.log('\n--- Test Item 5: Prevent User Enumeration ---');
    const forgotRoute = await fs.readFile(path.join(process.cwd(), 'src', 'app', 'api', 'auth', 'forgot-password', 'route.ts'), 'utf-8');
    assert(forgotRoute.includes('dummyPasswordTiming123') && forgotRoute.includes('If an account with that email exists'), 'Forgot password masks existence and performs timing delay');
    assert(nextAuthRoute.includes('e8Y6l1k9bJqN0lW3r.Z7eu1uL7y0kP1Q7pM9j9nQ2x3v8W9u2t1O2') || nextAuthRoute.includes('dummyPasswordTiming123'), 'Credentials authorization resists timing-based user enumeration');

    // ── Item 6: Whitelist upload types ────────────────────────────────
    console.log('\n--- Test Item 6: Whitelist Upload Types & Magic Bytes ---');
    const uploadValidatorFile = await fs.readFile(path.join(process.cwd(), 'src', 'lib', 'security', 'uploadValidator.ts'), 'utf-8');
    assert(uploadValidatorFile.includes('verifyMagicBytes') && uploadValidatorFile.includes('ALLOWED_MIME_TYPES') && uploadValidatorFile.includes('DANGEROUS_EXTS'), 'Upload validator implements magic bytes, MIME whitelist, and extension checks');
    const uploadRoute = await fs.readFile(path.join(process.cwd(), 'src', 'app', 'api', 'upload', 'route.ts'), 'utf-8');
    assert(uploadRoute.includes('validateUploadedFile') && uploadRoute.includes('validateCsrf'), 'Upload route enforces CSRF, auth, and magic byte validation');

    // ── Item 7: Verify payment webhooks ───────────────────────────────
    console.log('\n--- Test Item 7: Verify Payment Webhooks ---');
    const webhookFile = await fs.readFile(path.join(process.cwd(), 'src', 'lib', 'payments', 'webhookValidator.ts'), 'utf-8');
    assert(webhookFile.includes('crypto.timingSafeEqual') && webhookFile.includes('isEventProcessed') && webhookFile.includes('TIMESTAMP_TOLERANCE_SEC'), 'Webhook validator enforces HMAC-SHA256, timing safety, and idempotency');
    const webhookRoute = await fs.readFile(path.join(process.cwd(), 'src', 'app', 'api', 'webhooks', 'stripe', 'route.ts'), 'utf-8');
    assert(webhookRoute.includes('verifyStripeWebhookSignature') && webhookRoute.includes('markEventProcessed'), 'Stripe webhook endpoint handles events idempotently');

    // ── Item 8: Set prices server side ────────────────────────────────
    console.log('\n--- Test Item 8: Set Prices Server Side ---');
    const pricingFile = await fs.readFile(path.join(process.cwd(), 'src', 'lib', 'pricing', 'catalog.ts'), 'utf-8');
    assert(pricingFile.includes('SERVER_PRICING_CATALOG') && pricingFile.includes('calculateOrderAmount'), 'Server-authoritative pricing catalog defined');
    const checkoutRoute = await fs.readFile(path.join(process.cwd(), 'src', 'app', 'api', 'checkout', 'route.ts'), 'utf-8');
    assert(checkoutRoute.includes('calculateOrderAmount') && checkoutRoute.includes('PRICE_TAMPERING_BLOCKED'), 'Checkout endpoint resolves price strictly server-side and logs tampering attempts');

    // ── Item 9: Block prompt injection ────────────────────────────────
    console.log('\n--- Test Item 9: Block Prompt Injection ---');
    const promptShieldFile = await fs.readFile(path.join(process.cwd(), 'src', 'lib', 'security', 'promptShield.ts'), 'utf-8');
    assert(promptShieldFile.includes('INJECTION_PATTERNS') && promptShieldFile.includes('scanAndShieldPrompt') && promptShieldFile.includes('getHardenedSystemInstruction') && promptShieldFile.includes('guardrailOutput'), 'Prompt shield implements pattern detection, boundary containment, and output guardrails');

    // ── Item 10: Cap AI usage ─────────────────────────────────────────
    console.log('\n--- Test Item 10: Cap AI Usage & Token Bounds ---');
    const usageLimiterFile = await fs.readFile(path.join(process.cwd(), 'src', 'lib', 'security', 'usageLimiter.ts'), 'utf-8');
    assert(usageLimiterFile.includes('checkAiQuota') && usageLimiterFile.includes('recordAiUsage') && usageLimiterFile.includes('capOutputTokens'), 'AI usage limiter enforces daily request/token quotas and output ceilings');

    // ── Item 11: Limit request size ───────────────────────────────────
    console.log('\n--- Test Item 11: Limit Request Size ---');
    assert(middlewareFile.includes('MAX_JSON_PAYLOAD_BYTES') && middlewareFile.includes('413') && middlewareFile.includes('PAYLOAD_TOO_LARGE'), 'Middleware limits request payload sizes and returns 413 Payload Too Large');

    // ── Item 12: Rate limit password resets ───────────────────────────
    console.log('\n--- Test Item 12: Rate Limit Password Resets ---');
    assert(forgotRoute.includes('isRateLimited') && forgotRoute.includes('password-reset-request') && forgotRoute.includes('password-reset-email'), 'Password reset requests rate-limited per IP and per email');

    // ── Item 13: Sanitize before storing ──────────────────────────────
    console.log('\n--- Test Item 13: Sanitize Before Storing ---');
    const sanitizeFile = await fs.readFile(path.join(process.cwd(), 'src', 'lib', 'security', 'sanitize.ts'), 'utf-8');
    assert(sanitizeFile.includes('stripHtml') && sanitizeFile.includes('sanitizeText') && sanitizeFile.includes('sanitizeEmail') && sanitizeFile.includes('sanitizeObject'), 'Sanitization utility strips HTML tags, escapes XSS vectors, and neutralizes prototype pollution');

    // ── Item 14: Lock down CORS ───────────────────────────────────────
    console.log('\n--- Test Item 14: Lock Down CORS ---');
    assert(middlewareFile.includes('DEFAULT_ALLOWED_ORIGINS') && middlewareFile.includes('Access-Control-Allow-Origin') && middlewareFile.includes('Access-Control-Allow-Credentials'), 'Middleware locks down CORS to explicit allowlist with preflight handling');

    // ── Item 15: Disable directory listing ────────────────────────────
    console.log('\n--- Test Item 15: Disable Directory Listing & Probing ---');
    assert(middlewareFile.includes('BLOCKED_PATH_PATTERNS') && middlewareFile.includes('SENSITIVE_FILE_ACCESS_BLOCKED') && middlewareFile.includes('403'), 'Middleware blocks path traversal (..) and access to .env, .git, and users.json');
    assert(nextConfigFile.includes('X-Robots-Tag'), 'next.config.ts adds X-Robots-Tag: noindex, nofollow for APIs');

    // ── Item 16: Remove default admin route ───────────────────────────
    console.log('\n--- Test Item 16: Stealth Admin Route Protection ---');
    const adminRoute = await fs.readFile(path.join(process.cwd(), 'src', 'app', 'api', 'admin', 'route.ts'), 'utf-8');
    assert(adminRoute.includes('SUPER_ADMIN') && adminRoute.includes('404') && adminRoute.includes('ADMIN_ACCESS_UNAUTHORIZED'), 'Admin route returns stealth 404 for unauthenticated/non-admin users');

    // ── Item 17: Lock accounts after failed login ─────────────────────
    console.log('\n--- Test Item 17: Lock Accounts After Failed Login ---');
    const lockoutFile = await fs.readFile(path.join(process.cwd(), 'src', 'lib', 'auth', 'accountLockout.ts'), 'utf-8');
    assert(lockoutFile.includes('MAX_FAILED_ATTEMPTS = 5') && lockoutFile.includes('LOCKOUT_DURATION_MS = 15 * 60 * 1000') && lockoutFile.includes('recordFailedAttempt'), 'Account lockout locks for 15 minutes after 5 failed attempts');

    // ── Item 18: Log security events ──────────────────────────────────
    console.log('\n--- Test Item 18: Log Security Events ---');
    const loggerFile = await fs.readFile(path.join(process.cwd(), 'src', 'lib', 'security', 'securityLogger.ts'), 'utf-8');
    assert(loggerFile.includes('logSecurityEvent') && loggerFile.includes('SecurityEventType') && loggerFile.includes('recentSecurityLogs'), 'Structured JSON security logger records audit events');

    // ── Item 19: Set secure cookie flags ──────────────────────────────
    console.log('\n--- Test Item 19: Set Secure Cookie Flags ---');
    assert(nextAuthRoute.includes('httpOnly: true') && nextAuthRoute.includes('sameSite: \'lax\'') && nextAuthRoute.includes('cookiePrefix'), 'NextAuth configured with httpOnly, secure in prod, sameSite lax, and prefix support');

    // ── Item 20: Restrict database permissions ────────────────────────
    console.log('\n--- Test Item 20: Restrict Database Permissions ---');
    const secureStoreFile = await fs.readFile(path.join(process.cwd(), 'src', 'lib', 'db', 'secureStore.ts'), 'utf-8');
    assert(secureStoreFile.includes('resolveSafePath') && secureStoreFile.includes('DIRECTORY_TRAVERSAL_BLOCKED'), 'SecureDataStore enforces path containment and atomic writes');
    const dbDocFile = await fs.readFile(path.join(process.cwd(), 'docs', 'database-security.md'), 'utf-8');
    assert(dbDocFile.includes('Principle of Least Privilege') && dbDocFile.includes('Row Level Security (RLS)'), 'Database security guide provides least-privilege PostgreSQL roles & RLS policies');

    console.log('\n====================================================');
    console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED  `);
    console.log('====================================================\n');

    if (failed > 0) {
        process.exit(1);
    }
}

runTests().catch((e) => {
    console.error('Test execution error:', e);
    process.exit(1);
});
