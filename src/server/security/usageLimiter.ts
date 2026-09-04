import { SERVER_PRICING_CATALOG } from '../pricing/catalog';
import { logSecurityEvent } from './securityLogger';
import { SecureDataStore } from '../db/secureStore';

export interface RequestLogItem {
    id: string;
    timestamp: number;
    dateKey: string; // YYYY-MM-DD
    querySnippet: string;
    type: 'dataset' | 'general' | 'hybrid' | 'assistant' | 'other';
    tokensUsed: number;
    status: 'success' | 'rate_limited' | 'quota_exceeded';
}

export interface UserUsageProfile {
    identifier: string;
    totalLifetimeRequests: number;
    totalLifetimeTokens: number;
    dailyRecords: Record<string, { requestsCount: number; tokensCount: number }>;
    recentRequests: RequestLogItem[];
    firstSeenAt: number;
    lastSeenAt: number;
}

export interface DailyHistoryEntry {
    date: string; // YYYY-MM-DD
    label: string; // e.g. "Aug 31" or "Today"
    count: number;
    tokens: number;
}

export interface UserUsageStats {
    identifier: string;
    planTier: string;
    planName: string;
    todayCount: number;
    dailyLimit: number;
    remainingRequestsToday: number;
    usedPercentage: number;
    totalLifetimeRequests: number;
    totalLifetimeTokens: number;
    dailyTokensToday: number;
    dailyTokenLimit: number;
    remainingTokensToday: number;
    resetHours: number;
    dailyHistory: DailyHistoryEntry[];
    recentRequests: RequestLogItem[];
    categoryBreakdown: {
        datasetSearches: number;
        generalAiInquiries: number;
        researchAndHybrid: number;
    };
    averageDailyRequests: number;
    memberSince: string;
}

interface DailyUsageRecord {
    dateKey: string; // YYYY-MM-DD
    requestsCount: number;
    tokensCount: number;
}

const usageStore = new Map<string, DailyUsageRecord>();
const profileStore = new Map<string, UserUsageProfile>();
const store = new SecureDataStore<UserUsageProfile>('user_usage.json');

let isStoreLoaded = false;
let persistTimeout: NodeJS.Timeout | null = null;

async function loadStoreIfNeeded(): Promise<void> {
    if (isStoreLoaded) return;
    try {
        const records = await store.readAll();
        for (const record of records) {
            if (record?.identifier) {
                profileStore.set(record.identifier.toLowerCase(), record);
                const today = getTodayKey();
                const todayRec = record.dailyRecords?.[today];
                if (todayRec) {
                    usageStore.set(record.identifier.toLowerCase(), {
                        dateKey: today,
                        requestsCount: todayRec.requestsCount || 0,
                        tokensCount: todayRec.tokensCount || 0,
                    });
                }
            }
        }
    } catch {
        // Fallback to empty in-memory store
    } finally {
        isStoreLoaded = true;
    }
}

// Trigger initial load in background
if (typeof process !== 'undefined') {
    loadStoreIfNeeded().catch(() => {});
}

function schedulePersist(): void {
    if (persistTimeout) return;
    persistTimeout = setTimeout(async () => {
        persistTimeout = null;
        try {
            const records = Array.from(profileStore.values());
            await store.writeAll(records);
        } catch (e) {
            console.error('[USAGE_STORE] Failed to persist user usage:', e);
        }
    }, 1500);
}

const HARD_CAP_COMPLETION_TOKENS = 2048;
const HARD_CAP_INPUT_LENGTH = 4000;

function getTodayKey(): string {
    return new Date().toISOString().split('T')[0];
}

/**
 * Enforces strict bounds on requested output tokens.
 */
export function capOutputTokens(requestedTokens?: number, maxCap = HARD_CAP_COMPLETION_TOKENS): number {
    if (!requestedTokens || requestedTokens <= 0) return 1024;
    return Math.min(requestedTokens, maxCap);
}

/**
 * Checks if user/IP has remaining daily AI query and token quota.
 */
export function checkAiQuota(
    identifier: string,
    planTier = 'free'
): { allowed: boolean; remainingRequests: number; remainingTokens: number; resetHours: number } {
    if (!identifier) {
        return { allowed: true, remainingRequests: 50, remainingTokens: 50000, resetHours: 24 };
    }

    const today = getTodayKey();
    const cleanId = identifier.toLowerCase();
    const plan = SERVER_PRICING_CATALOG[planTier.toLowerCase()] || SERVER_PRICING_CATALOG.free;

    const maxRequests = plan.aiQueryQuotaDaily;
    const maxTokens = plan.aiTokenQuotaDaily;

    const record = usageStore.get(cleanId);
    if (!record || record.dateKey !== today) {
        // Fresh day window
        usageStore.set(cleanId, {
            dateKey: today,
            requestsCount: 0,
            tokensCount: 0,
        });
        return {
            allowed: true,
            remainingRequests: maxRequests,
            remainingTokens: maxTokens,
            resetHours: 24 - new Date().getUTCHours(),
        };
    }

    const remainingRequests = Math.max(0, maxRequests - record.requestsCount);
    const remainingTokens = Math.max(0, maxTokens - record.tokensCount);

    if (record.requestsCount >= maxRequests || record.tokensCount >= maxTokens) {
        logSecurityEvent({
            eventType: 'AI_USAGE_EXCEEDED',
            severity: 'WARN',
            details: {
                identifier: cleanId,
                planTier,
                usedRequests: record.requestsCount,
                usedTokens: record.tokensCount,
                maxRequests,
                maxTokens,
            },
        });

        return {
            allowed: false,
            remainingRequests: 0,
            remainingTokens: 0,
            resetHours: 24 - new Date().getUTCHours(),
        };
    }

    return {
        allowed: true,
        remainingRequests,
        remainingTokens,
        resetHours: 24 - new Date().getUTCHours(),
    };
}

/**
 * Records AI token and query usage both daily and overall lifetime.
 */
export function recordAiUsage(
    identifier: string,
    tokensUsed = 100,
    metadata?: {
        querySnippet?: string;
        type?: 'dataset' | 'general' | 'hybrid' | 'assistant' | 'other';
        status?: 'success' | 'rate_limited' | 'quota_exceeded';
    }
): void {
    if (!identifier) return;
    const cleanId = identifier.toLowerCase();
    const today = getTodayKey();
    const now = Date.now();

    // 1. Update fast daily usage record
    const dailyRecord = usageStore.get(cleanId) || {
        dateKey: today,
        requestsCount: 0,
        tokensCount: 0,
    };

    if (dailyRecord.dateKey !== today) {
        dailyRecord.dateKey = today;
        dailyRecord.requestsCount = 0;
        dailyRecord.tokensCount = 0;
    }

    dailyRecord.requestsCount += 1;
    dailyRecord.tokensCount += Math.max(0, tokensUsed);
    usageStore.set(cleanId, dailyRecord);

    // 2. Update comprehensive profile record
    let profile = profileStore.get(cleanId);
    if (!profile) {
        profile = {
            identifier: cleanId,
            totalLifetimeRequests: 0,
            totalLifetimeTokens: 0,
            dailyRecords: {},
            recentRequests: [],
            firstSeenAt: now,
            lastSeenAt: now,
        };
    }

    profile.lastSeenAt = now;
    profile.totalLifetimeRequests = (profile.totalLifetimeRequests || 0) + 1;
    profile.totalLifetimeTokens = (profile.totalLifetimeTokens || 0) + Math.max(0, tokensUsed);

    if (!profile.dailyRecords) profile.dailyRecords = {};
    const existingDay = profile.dailyRecords[today] || { requestsCount: 0, tokensCount: 0 };
    profile.dailyRecords[today] = {
        requestsCount: (existingDay.requestsCount || 0) + 1,
        tokensCount: (existingDay.tokensCount || 0) + Math.max(0, tokensUsed),
    };

    // Add recent request entry (keep last 30)
    const logItem: RequestLogItem = {
        id: Math.random().toString(36).substring(2, 10),
        timestamp: now,
        dateKey: today,
        querySnippet: metadata?.querySnippet ? metadata.querySnippet.substring(0, 100) : 'AI Search Inquiry',
        type: metadata?.type || 'dataset',
        tokensUsed: Math.max(0, tokensUsed),
        status: metadata?.status || 'success',
    };

    if (!profile.recentRequests) profile.recentRequests = [];
    profile.recentRequests.unshift(logItem);
    if (profile.recentRequests.length > 30) {
        profile.recentRequests = profile.recentRequests.slice(0, 30);
    }

    profileStore.set(cleanId, profile);
    schedulePersist();
}

/**
 * Returns detailed user usage analytics for Settings and Dashboard.
 */
export async function getUserUsageStats(identifier: string, planTier = 'free'): Promise<UserUsageStats> {
    await loadStoreIfNeeded();
    const cleanId = (identifier || 'anonymous').toLowerCase();
    const today = getTodayKey();
    const plan = SERVER_PRICING_CATALOG[planTier.toLowerCase()] || SERVER_PRICING_CATALOG.free;
    const maxDailyRequests = plan.aiQueryQuotaDaily || 50;
    const maxDailyTokens = plan.aiTokenQuotaDaily || 50000;

    const profile = profileStore.get(cleanId);
    const dailyRecord = usageStore.get(cleanId);

    const todayCount = (dailyRecord?.dateKey === today ? dailyRecord.requestsCount : 0) || (profile?.dailyRecords?.[today]?.requestsCount || 0);
    const todayTokens = (dailyRecord?.dateKey === today ? dailyRecord.tokensCount : 0) || (profile?.dailyRecords?.[today]?.tokensCount || 0);

    const totalLifetimeRequests = profile ? Math.max(profile.totalLifetimeRequests || 0, todayCount) : todayCount;
    const totalLifetimeTokens = profile ? Math.max(profile.totalLifetimeTokens || 0, todayTokens) : todayTokens;

    const remainingRequestsToday = Math.max(0, maxDailyRequests - todayCount);
    const remainingTokensToday = Math.max(0, maxDailyTokens - todayTokens);
    const usedPercentage = Math.min(100, Math.round((todayCount / maxDailyRequests) * 100));

    // Generate last 7 days history
    const dailyHistory: DailyHistoryEntry[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dKey = d.toISOString().split('T')[0];
        const record = profile?.dailyRecords?.[dKey] || (dKey === today && dailyRecord ? { requestsCount: dailyRecord.requestsCount, tokensCount: dailyRecord.tokensCount } : { requestsCount: 0, tokensCount: 0 });

        const isToday = i === 0;
        const dayLabel = isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

        dailyHistory.push({
            date: dKey,
            label: dayLabel,
            count: record.requestsCount || 0,
            tokens: record.tokensCount || 0,
        });
    }

    // Category breakdown
    let datasetSearches = 0;
    let generalAiInquiries = 0;
    let researchAndHybrid = 0;

    const recent = profile?.recentRequests || [];
    if (recent.length > 0) {
        for (const req of recent) {
            if (req.type === 'dataset') datasetSearches++;
            else if (req.type === 'general') generalAiInquiries++;
            else researchAndHybrid++;
        }
    } else if (totalLifetimeRequests > 0) {
        datasetSearches = Math.ceil(totalLifetimeRequests * 0.7);
        generalAiInquiries = Math.floor(totalLifetimeRequests * 0.2);
        researchAndHybrid = Math.max(0, totalLifetimeRequests - datasetSearches - generalAiInquiries);
    }

    // Calculate average daily requests across active recorded days
    const activeDaysCount = profile?.dailyRecords ? Object.keys(profile.dailyRecords).length : 1;
    const averageDailyRequests = Math.max(1, Math.round((totalLifetimeRequests / Math.max(1, activeDaysCount)) * 10) / 10);

    const memberSince = profile?.firstSeenAt
        ? new Date(profile.firstSeenAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    return {
        identifier: cleanId,
        planTier: plan.id,
        planName: plan.name,
        todayCount,
        dailyLimit: maxDailyRequests,
        remainingRequestsToday,
        usedPercentage,
        totalLifetimeRequests,
        totalLifetimeTokens,
        dailyTokensToday: todayTokens,
        dailyTokenLimit: maxDailyTokens,
        remainingTokensToday,
        resetHours: Math.max(1, 24 - new Date().getUTCHours()),
        dailyHistory,
        recentRequests: recent,
        categoryBreakdown: {
            datasetSearches,
            generalAiInquiries,
            researchAndHybrid,
        },
        averageDailyRequests,
        memberSince,
    };
}

export { HARD_CAP_COMPLETION_TOKENS, HARD_CAP_INPUT_LENGTH };
