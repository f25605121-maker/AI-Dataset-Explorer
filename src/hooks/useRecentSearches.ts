"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

export interface RecentSearchItem {
    id: string;
    query: string;
    timestamp: number;
    category?: string;
}

export const SEARCH_HISTORY_EVENT = "aide_search_history_updated";

/**
 * Broadcasts search history changes synchronously across all mounted components and windows.
 */
export function broadcastSearchHistory(searches: RecentSearchItem[], key: string) {
    if (typeof window !== "undefined") {
        window.dispatchEvent(
            new CustomEvent(SEARCH_HISTORY_EVENT, {
                detail: { searches, key },
            })
        );
    }
}

/**
 * Pure synchronous utility to add a search to storage and broadcast to all components.
 */
export function addSearchToHistory(
    query: string,
    userId?: string | null,
    category?: string,
    currentSearches?: RecentSearchItem[]
): RecentSearchItem[] {
    const trimmed = query.trim();
    if (!trimmed) return currentSearches || [];

    const storageKey = userId
        ? `aide_recent_searches_user_${encodeURIComponent(userId)}`
        : "aide_recent_searches_guest";

    let existing: RecentSearchItem[] = [];
    if (currentSearches && currentSearches.length > 0) {
        existing = currentSearches;
    } else if (typeof window !== "undefined") {
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) existing = parsed;
            }
        } catch {}
    }

    // Deduplicate: move existing query to top
    const filtered = existing.filter(
        (item) => item.query.toLowerCase() !== trimmed.toLowerCase()
    );

    const newItem: RecentSearchItem = {
        id: `search-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        query: trimmed,
        timestamp: Date.now(),
        category,
    };

    const updatedList = [newItem, ...filtered].slice(0, 40);

    if (typeof window !== "undefined") {
        try {
            localStorage.setItem(storageKey, JSON.stringify(updatedList));
        } catch {}
        broadcastSearchHistory(updatedList, storageKey);
    }

    if (userId && typeof window !== "undefined") {
        fetch("/api/user/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: trimmed, category }),
        }).catch(() => {});
    }

    return updatedList;
}

export function useRecentSearches() {
    const { data: session, status } = useSession();
    const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // Derive a unique storage key scoped strictly to the current user account
    const userId = session?.user
        ? ((session.user as any).id || session.user.email || "authenticated")
        : null;

    const storageKey = userId
        ? `aide_recent_searches_user_${encodeURIComponent(userId)}`
        : "aide_recent_searches_guest";

    const currentKeyRef = useRef(storageKey);
    currentKeyRef.current = storageKey;
    const recentSearchesRef = useRef<RecentSearchItem[]>([]);
    recentSearchesRef.current = recentSearches;

    // Synchronous cross-component listener for real-time history updates (like ChatGPT sidebar)
    useEffect(() => {
        function handleRealtimeUpdate(e: Event) {
            const customEvent = e as CustomEvent<{ searches?: RecentSearchItem[]; key?: string }>;
            if (customEvent.detail) {
                if (customEvent.detail.key === currentKeyRef.current && Array.isArray(customEvent.detail.searches)) {
                    setRecentSearches(customEvent.detail.searches);
                    return;
                }
            }

            // Fallback: reload from localStorage for this user's key
            try {
                const raw = localStorage.getItem(currentKeyRef.current);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed)) {
                        setRecentSearches(parsed);
                    }
                } else {
                    setRecentSearches([]);
                }
            } catch {}
        }

        window.addEventListener(SEARCH_HISTORY_EVENT, handleRealtimeUpdate);
        window.addEventListener("storage", handleRealtimeUpdate);

        return () => {
            window.removeEventListener(SEARCH_HISTORY_EVENT, handleRealtimeUpdate);
            window.removeEventListener("storage", handleRealtimeUpdate);
        };
    }, []);

    // Hydrate & switch history whenever user session changes (login, logout, account switch)
    useEffect(() => {
        // Clean up legacy unscoped shared storage key to prevent cross-account leakage
        try {
            localStorage.removeItem("aide_recent_searches_v1");
        } catch {}

        // 1. Immediately reset state and load cached history for THIS specific account
        try {
            const cached = localStorage.getItem(storageKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (Array.isArray(parsed)) {
                    setRecentSearches(parsed);
                } else {
                    setRecentSearches([]);
                }
            } else {
                setRecentSearches([]);
            }
        } catch {
            setRecentSearches([]);
        }
        setIsHydrated(true);

        // 2. If authenticated, fetch fresh user-scoped history from the server in background
        if (userId && status === "authenticated") {
            const activeKey = storageKey;
            fetch("/api/user/history")
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    if (currentKeyRef.current !== activeKey) return;

                    if (data?.success && Array.isArray(data.history)) {
                        setRecentSearches(data.history);
                        try {
                            localStorage.setItem(activeKey, JSON.stringify(data.history));
                        } catch {}
                        broadcastSearchHistory(data.history, activeKey);
                    }
                })
                .catch(() => {});
        }
    }, [storageKey, userId, status]);

    // Add a new search query to this user's history in real time
    const addSearch = useCallback(
        (query: string, category?: string) => {
            const updated = addSearchToHistory(query, userId, category, recentSearchesRef.current);
            setRecentSearches(updated);
        },
        [userId]
    );

    // Remove single search item
    const removeSearch = useCallback(
        (id: string) => {
            const activeKey = currentKeyRef.current;
            const updatedList = recentSearchesRef.current.filter((item) => item.id !== id);

            try {
                localStorage.setItem(activeKey, JSON.stringify(updatedList));
            } catch {}

            setRecentSearches(updatedList);
            broadcastSearchHistory(updatedList, activeKey);

            if (userId) {
                fetch(`/api/user/history?id=${encodeURIComponent(id)}`, {
                    method: "DELETE",
                }).catch(() => {});
            }
        },
        [userId]
    );

    // Clear all searches for this user
    const clearAllSearches = useCallback(() => {
        const activeKey = currentKeyRef.current;

        setRecentSearches([]);
        try {
            localStorage.removeItem(activeKey);
        } catch {}

        broadcastSearchHistory([], activeKey);

        if (userId) {
            fetch("/api/user/history?all=true", {
                method: "DELETE",
            }).catch(() => {});
        }
    }, [userId]);

    return {
        recentSearches,
        addSearch,
        removeSearch,
        clearAllSearches,
        isHydrated,
    };
}
