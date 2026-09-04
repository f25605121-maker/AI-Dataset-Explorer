/**
 * User Relevance Feedback Store
 *
 * Captures user feedback signals (thumbs up/down, error categories) for offline IR evaluation.
 */

import { UserFeedback } from './types';

// In-memory feedback store (persisted across runtime requests)
const feedbackStore: UserFeedback[] = [];

export function recordUserFeedback(feedback: Omit<UserFeedback, 'id' | 'createdAt'>): UserFeedback {
    const entry: UserFeedback = {
        ...feedback,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
    };

    feedbackStore.push(entry);
    if (feedbackStore.length > 5000) {
        feedbackStore.shift();
    }

    return entry;
}

export function getAllFeedback(): UserFeedback[] {
    return [...feedbackStore];
}

export function getFeedbackSummary(): {
    total: number;
    positive: number;
    negative: number;
    reasonCounts: Record<string, number>;
} {
    const positive = feedbackStore.filter(f => f.rating === 'positive').length;
    const negative = feedbackStore.filter(f => f.rating === 'negative').length;
    const reasonCounts: Record<string, number> = {
        wrong_anatomy: 0,
        wrong_modality: 0,
        wrong_task: 0,
        wrong_dimensionality: 0,
        poor_quality: 0,
        irrelevant: 0,
    };

    for (const f of feedbackStore) {
        if (f.reasons) {
            for (const r of f.reasons) {
                reasonCounts[r] = (reasonCounts[r] || 0) + 1;
            }
        }
    }

    return {
        total: feedbackStore.length,
        positive,
        negative,
        reasonCounts,
    };
}
