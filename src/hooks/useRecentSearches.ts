"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";

export interface RecentSearchItem {
    id: string;
    query: string;
    timestamp: number;
    category?: string;
}

export function useRecentSearches() {
    const { data: session, status } = useSession();
    const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // Derive a unique storage key scoped strictly to the current user account
    const userId = session?.user
        ? ((session.user as any).id || session.user.email || 'authenticated')
        : null;

    const storageKey = userId
        ? `aide_recent_searches_user_${encodeURIComponent(userId)}`
        : 'aide_recent_searches_guest';

    const currentKeyRef = useRef(storageKey);
    currentKeyRef.current = storageKey;

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

        // 2. If authenticated, fetch the fresh user-scoped history from the server
        if (userId && status === "authenticated") {
            const activeKey = storageKey;
            fetch("/api/user/history")
                .then((res) => (res.ok ? res.json() : null))
                .then((data) => {
                    // Avoid race condition if user switched accounts while request was in-flight
                    if (currentKeyRef.current !== activeKey) return;

                    if (data?.success && Array.isArray(data.history)) {
                        setRecentSearches(data.history);
                        try {
                            localStorage.setItem(activeKey, JSON.stringify(data.history));
                        } catch {}
                    }
                })
                .catch(() => {});
        }
    }, [storageKey, userId, status]);

    // Add a new search query to this user's history
    const addSearch = useCallback(
        (query: string, category?: string) => {
            const trimmed = query.trim();
            if (!trimmed) return;

            const activeKey = currentKeyRef.current;

            setRecentSearches((prev) => {
                // Deduplicate query
                const filtered = prev.filter(
                    (item) => item.query.toLowerCase() !== trimmed.toLowerCase()
                );

                const newItem: RecentSearchItem = {
                    id: `search-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                    query: trimmed,
                    timestamp: Date.now(),
                    category,
                };

                const updated = [newItem, ...filtered].slice(0, 40);
                try {
                    localStorage.setItem(activeKey, JSON.stringify(updated));
                } catch {}
                return updated;
            });

            // If authenticated, persist to server-side user store
            if (userId) {
                fetch("/api/user/history", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ query: trimmed, category }),
                }).catch(() => {});
            }
        },
        [userId]
    );

    // Remove single search item
    const removeSearch = useCallback(
        (id: string) => {
            const activeKey = currentKeyRef.current;

            setRecentSearches((prev) => {
                const updated = prev.filter((item) => item.id !== id);
                try {
                    localStorage.setItem(activeKey, JSON.stringify(updated));
                } catch {}
                return updated;
            });

            // If authenticated, remove from server
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

        // If authenticated, clear all on server
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
