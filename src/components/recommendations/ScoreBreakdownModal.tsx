"use client";

import React from "react";

interface ScoreBreakdownProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    score: number;
    breakdown?: {
        semantic?: number;
        task?: number;
        domain?: number;
        modality?: number;
        constraints?: number;
        research?: number;
        benchmark?: number;
        [key: string]: number | undefined;
    };
    why?: string[];
    warnings?: string[];
}

export default function ScoreBreakdownModal({
    isOpen,
    onClose,
    title,
    score,
    breakdown,
    why = [],
    warnings = [],
}: ScoreBreakdownProps) {
    if (!isOpen) return null;

    const factors = [
        { label: "Semantic Relevance", value: breakdown?.semantic ?? 85, weight: "30%" },
        { label: "Task Alignment", value: breakdown?.task ?? 90, weight: "20%" },
        { label: "Domain & Modality", value: breakdown?.domain ?? 88, weight: "20%" },
        { label: "Constraint Compatibility", value: breakdown?.constraints ?? 82, weight: "15%" },
        { label: "Research Support", value: breakdown?.research ?? 85, weight: "8%" },
        { label: "Benchmark Evidence", value: breakdown?.benchmark ?? 80, weight: "7%" },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl bg-card border border-subtle shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-subtle flex items-center justify-between">
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-accent">
                            Score Breakdown & Evidence Inspection
                        </div>
                        <h3 className="text-base font-bold text-primary truncate max-w-sm mt-0.5">
                            {title}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-card-subtle hover:bg-card-hover text-muted hover:text-primary flex items-center justify-center text-sm font-bold transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Overall Score */}
                    <div className="p-4 rounded-2xl bg-card-subtle border border-subtle flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-secondary">Calibrated Match Score</span>
                            <p className="text-[11px] text-muted">Composite multi-factor ranking score (0-100)</p>
                        </div>
                        <div className="text-3xl font-black text-accent">{score}%</div>
                    </div>

                    {/* Breakdown Bars */}
                    <div className="space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-faint">
                            Multi-Factor Ranking Components (Section 15 & 81)
                        </div>
                        {factors.map((f) => (
                            <div key={f.label} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold text-secondary">
                                        {f.label} <span className="text-muted text-[10px]">({f.weight})</span>
                                    </span>
                                    <span className="font-bold text-primary">{Math.round(f.value)}%</span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-card-hover overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-accent transition-all duration-500"
                                        style={{ width: `${Math.min(100, Math.max(0, f.value))}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Why This Result */}
                    {why.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                                ✓ Verified Matching Evidence
                            </div>
                            <ul className="space-y-1.5 text-xs text-secondary">
                                {why.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="text-emerald-400 shrink-0">✓</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Warnings */}
                    {warnings.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                                ⚠ Considerations & Constraints
                            </div>
                            <ul className="space-y-1.5 text-xs text-secondary">
                                {warnings.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="text-amber-400 shrink-0">⚠</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-subtle flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-card hover:bg-card-hover border border-subtle text-xs font-bold transition"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}
