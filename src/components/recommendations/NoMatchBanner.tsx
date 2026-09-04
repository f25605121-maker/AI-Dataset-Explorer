"use client";

import React from "react";

interface NoMatchBannerProps {
    explanation?: string;
    closestAlternatives?: Array<{
        name: string;
        score: number;
        modality?: string;
        task?: string;
        why?: string[];
        difference?: string;
    }>;
}

export default function NoMatchBanner({
    explanation,
    closestAlternatives = [],
}: NoMatchBannerProps) {
    return (
        <div className="p-6 sm:p-8 rounded-3xl border border-amber-500/40 bg-amber-500/5 shadow-lg space-y-4 animate-in fade-in">
            <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-lg font-bold shrink-0">
                    ⚠
                </div>
                <div className="space-y-1">
                    <div className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        NO DIRECT DATASET MATCH (Section 27 Policy)
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-primary">
                        No Exact Benchmark Dataset Matched All Constraints
                    </h3>
                    <p className="text-xs text-muted leading-relaxed max-w-3xl">
                        {explanation ||
                            "The system evaluated indexed scientific repositories and detected that no single dataset simultaneously satisfies your exact constraints. Rather than fabricating an artificial match, here are the highest-scoring related alternatives and an explanation of what differs."}
                    </p>
                </div>
            </div>

            {closestAlternatives.length > 0 && (
                <div className="pt-2 border-t border-subtle space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">
                        Closest Related Scientific Alternatives:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {closestAlternatives.slice(0, 3).map((alt, idx) => (
                            <div
                                key={idx}
                                className="p-3.5 rounded-xl bg-card border border-subtle space-y-1.5"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-primary truncate max-w-[180px]">
                                        {alt.name}
                                    </span>
                                    <span className="text-xs font-black text-amber-400">
                                        {alt.score}%
                                    </span>
                                </div>
                                <div className="text-[11px] text-muted line-clamp-2">
                                    {alt.difference || (alt.why && alt.why[0]) || "Partial match in adjacent domain or modality"}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
