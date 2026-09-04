"use client";

import { useState, useEffect, useCallback } from "react";

export interface RecentSearchItem {
    id: string;
    query: string;
    timestamp: number;
    category?: string;
}

const STORAGE_KEY = "aide_recent_searches_v1";

const INITIAL_SEEDS: RecentSearchItem[] = [
    {
        id: "seed-1",
        query: "Real-time AI system for driver drowsiness detection using in-cabin video streams",
        timestamp: Date.now() - 1000 * 60 * 12, // 12 mins ago
        category: "Computer Vision",
    },
    {
        id: "seed-2",
        query: "Coronary artery CT segmentation with 3D U-Net and Dice loss",
        timestamp: Date.now() - 1000 * 60 * 65, // 1 hour ago
        category: "Medical Imaging",
    },
    {
        id: "seed-3",
        query: "Vehicle tracking in CCTV video with DeepSORT and YOLOv8",
        timestamp: Date.now() - 1000 * 60 * 180, // 3 hours ago
        category: "Object Detection",
    },
    {
        id: "seed-4",
        query: "Chest X-ray pneumonia classification with DenseNet-121",
        timestamp: Date.now() - 1000 * 60 * 60 * 7, // 7 hours ago
        category: "Medical AI",
    },
    {
        id: "seed-5",
        query: "Explain backpropagation vs Adam optimizer with learning rate warmup",
        timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
        category: "Machine Learning",
    },
    {
        id: "seed-6",
        query: "AI Dataset Explorer Prompt Design and Benchmarking",
        timestamp: Date.now() - 1000 * 60 * 60 * 30, // 1.2 days ago
        category: "LLM & IR",
    },
    {
        id: "seed-7",
        query: "Building an Intelligent Vibe Coder App architecture",
        timestamp: Date.now() - 1000 * 60 * 60 * 48, // 2 days ago
        category: "Software AI",
    },
    {
        id: "seed-8",
        query: "Project Folder Structure Evaluation and Best Practices",
        timestamp: Date.now() - 1000 * 60 * 60 * 72, // 3 days ago
        category: "Architecture",
    },
];

export function useRecentSearches() {
    const [recentSearches, setRecentSearches] = useState<RecentSearchItem[]>([]);
    const [isHydrated, setIsHydrated] = useState(false);

    // Hydrate from localStorage on client mount
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setRecentSearches(parsed);
                    setIsHydrated(true);
                    return;
                }
            }
            // If empty or never set, populate with initial seeds
            setRecentSearches(INITIAL_SEEDS);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEEDS));
        } catch {
            setRecentSearches(INITIAL_SEEDS);
        }
        setIsHydrated(true);
    }, []);

    // Add a new search query
    const addSearch = useCallback((query: string, category?: string) => {
        const trimmed = query.trim();
        if (!trimmed) return;

        setRecentSearches((prev) => {
            // Remove duplicate query if present
            const filtered = prev.filter(
                (item) => item.query.toLowerCase() !== trimmed.toLowerCase()
            );

            const newItem: RecentSearchItem = {
                id: `search-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                query: trimmed,
                timestamp: Date.now(),
                category,
            };

            const updated = [newItem, ...filtered].slice(0, 40); // keep up to 40
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch {}
            return updated;
        });
    }, []);

    // Remove single search item
    const removeSearch = useCallback((id: string) => {
        setRecentSearches((prev) => {
            const updated = prev.filter((item) => item.id !== id);
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            } catch {}
            return updated;
        });
    }, []);

    // Clear all searches
    const clearAllSearches = useCallback(() => {
        setRecentSearches([]);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch {}
    }, []);

    return {
        recentSearches,
        addSearch,
        removeSearch,
        clearAllSearches,
        isHydrated,
    };
}
