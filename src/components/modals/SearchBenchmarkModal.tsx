"use client";

import React, { useState, useEffect } from "react";
import { runBenchmarkEvaluation } from "@/server/search/evaluation";
import { IREvaluationComparison, IRBenchmarkMetrics } from "@/server/search/types";

interface SearchBenchmarkModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchBenchmarkModal({ isOpen, onClose }: SearchBenchmarkModalProps) {
    const [evalData, setEvalData] = useState<{
        comparisons: IREvaluationComparison[];
        aggregate: {
            baseline: IRBenchmarkMetrics;
            advanced: IRBenchmarkMetrics;
            overallPrecisionGain: number;
            overallNdcgGain: number;
            overallErrorReduction: number;
        };
    } | null>(null);

    const [isRunning, setIsRunning] = useState(false);
    const [activeTab, setActiveTab] = useState<'summary' | 'queries'>('summary');

    const handleRunEvaluation = () => {
        setIsRunning(true);
        setTimeout(() => {
            try {
                const res = runBenchmarkEvaluation();
                setEvalData(res);
            } catch (e) {
                console.error('Failed to run benchmark evaluation:', e);
            } finally {
                setIsRunning(false);
            }
        }, 300);
    };

    useEffect(() => {
        if (isOpen && !evalData) {
            handleRunEvaluation();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const agg = evalData?.aggregate;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-4xl max-h-[90vh] bg-card border border-strong rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-subtle bg-card-subtle">
                    <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-base">📊</span>
                        <div>
                            <h2 className="text-base font-bold text-primary flex items-center gap-2">
                                Empirical IR Benchmark & Precision Evaluation
                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono">
                                    A/B BENCHMARK
                                </span>
                            </h2>
                            <p className="text-xs text-muted">
                                Rigorous quantitative metrics comparing Baseline Keyword Retrieval vs Advanced Retrieval Pipeline
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-card border border-transparent hover:border-subtle transition-colors text-lg"
                    >
                        ✕
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center justify-between px-6 border-b border-subtle bg-card text-xs font-semibold">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveTab('summary')}
                            className={`py-3 border-b-2 transition-colors ${
                                activeTab === 'summary' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-primary'
                            }`}
                        >
                            Aggregate IR Performance
                        </button>
                        <button
                            onClick={() => setActiveTab('queries')}
                            className={`py-3 border-b-2 transition-colors ${
                                activeTab === 'queries' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-primary'
                            }`}
                        >
                            Benchmark Query Breakdown ({evalData?.comparisons.length || 5})
                        </button>
                    </div>

                    <button
                        onClick={handleRunEvaluation}
                        disabled={isRunning}
                        className="my-1.5 px-3 py-1.5 rounded-lg bg-card-subtle hover:bg-card border border-subtle text-primary text-xs font-medium flex items-center gap-1.5"
                    >
                        <span>{isRunning ? "⏳" : "🔄"}</span>
                        <span>{isRunning ? "Evaluating..." : "Rerun Benchmark"}</span>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
                    {activeTab === 'summary' && agg && (
                        <div className="space-y-6">
                            {/* Top Highlight Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                                    <div className="text-xs font-semibold text-emerald-400">Precision @ 5 Accuracy</div>
                                    <div className="text-3xl font-extrabold text-emerald-400 mt-1">
                                        {agg.advanced.precisionAt5}%
                                    </div>
                                    <div className="text-[11px] text-emerald-300/80 mt-1">
                                        +{agg.overallPrecisionGain}% vs Baseline ({agg.baseline.precisionAt5}%)
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-center">
                                    <div className="text-xs font-semibold text-cyan-400">NDCG @ 10 Ranking Quality</div>
                                    <div className="text-3xl font-extrabold text-cyan-400 mt-1">
                                        {agg.advanced.ndcgAt10}%
                                    </div>
                                    <div className="text-[11px] text-cyan-300/80 mt-1">
                                        +{agg.overallNdcgGain}% vs Baseline ({agg.baseline.ndcgAt10}%)
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/30 text-center">
                                    <div className="text-xs font-semibold text-violet-400">Wrong Anatomy / Modality Error</div>
                                    <div className="text-3xl font-extrabold text-violet-400 mt-1">
                                        {agg.advanced.wrongAnatomyRate}%
                                    </div>
                                    <div className="text-[11px] text-violet-300/80 mt-1">
                                        -{agg.overallErrorReduction}% false positives (Baseline: {agg.baseline.wrongAnatomyRate}%)
                                    </div>
                                </div>
                            </div>

                            {/* Comparison Table */}
                            <div className="rounded-xl border border-subtle overflow-hidden bg-card-subtle">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-card border-b border-subtle text-muted uppercase tracking-wider text-[10px]">
                                        <tr>
                                            <th className="py-2.5 px-4 font-semibold">Information Retrieval Metric</th>
                                            <th className="py-2.5 px-4 font-semibold text-muted">Baseline (Keyword + Popularity)</th>
                                            <th className="py-2.5 px-4 font-semibold text-emerald-400">Advanced Evidence Pipeline</th>
                                            <th className="py-2.5 px-4 font-semibold text-right">Delta Improvement</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-subtle/50 text-secondary">
                                        <tr>
                                            <td className="py-2.5 px-4 font-medium text-primary">Precision @ 5</td>
                                            <td className="py-2.5 px-4">{agg.baseline.precisionAt5}%</td>
                                            <td className="py-2.5 px-4 font-bold text-emerald-400">{agg.advanced.precisionAt5}%</td>
                                            <td className="py-2.5 px-4 text-right font-semibold text-emerald-400">+{agg.advanced.precisionAt5 - agg.baseline.precisionAt5}%</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2.5 px-4 font-medium text-primary">Precision @ 10</td>
                                            <td className="py-2.5 px-4">{agg.baseline.precisionAt10}%</td>
                                            <td className="py-2.5 px-4 font-bold text-emerald-400">{agg.advanced.precisionAt10}%</td>
                                            <td className="py-2.5 px-4 text-right font-semibold text-emerald-400">+{agg.advanced.precisionAt10 - agg.baseline.precisionAt10}%</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2.5 px-4 font-medium text-primary">Recall @ 10</td>
                                            <td className="py-2.5 px-4">{agg.baseline.recallAt10}%</td>
                                            <td className="py-2.5 px-4 font-bold text-emerald-400">{agg.advanced.recallAt10}%</td>
                                            <td className="py-2.5 px-4 text-right font-semibold text-emerald-400">+{agg.advanced.recallAt10 - agg.baseline.recallAt10}%</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2.5 px-4 font-medium text-primary">NDCG @ 10</td>
                                            <td className="py-2.5 px-4">{agg.baseline.ndcgAt10}%</td>
                                            <td className="py-2.5 px-4 font-bold text-cyan-400">{agg.advanced.ndcgAt10}%</td>
                                            <td className="py-2.5 px-4 text-right font-semibold text-cyan-400">+{agg.advanced.ndcgAt10 - agg.baseline.ndcgAt10}%</td>
                                        </tr>
                                        <tr>
                                            <td className="py-2.5 px-4 font-medium text-primary">Mean Reciprocal Rank (MRR)</td>
                                            <td className="py-2.5 px-4">{agg.baseline.mrr}%</td>
                                            <td className="py-2.5 px-4 font-bold text-emerald-400">{agg.advanced.mrr}%</td>
                                            <td className="py-2.5 px-4 text-right font-semibold text-emerald-400">+{agg.advanced.mrr - agg.baseline.mrr}%</td>
                                        </tr>
                                        <tr className="bg-rose-500/5">
                                            <td className="py-2.5 px-4 font-medium text-rose-300">Wrong Anatomy Error Rate</td>
                                            <td className="py-2.5 px-4 text-rose-400">{agg.baseline.wrongAnatomyRate}%</td>
                                            <td className="py-2.5 px-4 font-bold text-emerald-400">{agg.advanced.wrongAnatomyRate}%</td>
                                            <td className="py-2.5 px-4 text-right font-semibold text-emerald-400">-{agg.baseline.wrongAnatomyRate - agg.advanced.wrongAnatomyRate}%</td>
                                        </tr>
                                        <tr className="bg-rose-500/5">
                                            <td className="py-2.5 px-4 font-medium text-rose-300">Wrong Modality Error Rate</td>
                                            <td className="py-2.5 px-4 text-rose-400">{agg.baseline.wrongModalityRate}%</td>
                                            <td className="py-2.5 px-4 font-bold text-emerald-400">{agg.advanced.wrongModalityRate}%</td>
                                            <td className="py-2.5 px-4 text-right font-semibold text-emerald-400">-{agg.baseline.wrongModalityRate - agg.advanced.wrongModalityRate}%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Individual Queries */}
                    {activeTab === 'queries' && evalData && (
                        <div className="space-y-4">
                            {evalData.comparisons.map((c, i) => (
                                <div key={i} className="p-4 rounded-xl bg-card-subtle border border-subtle space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <div className="font-bold text-primary text-sm">&quot;{c.query}&quot;</div>
                                            <div className="text-xs text-muted mt-0.5">Benchmark scenario {i + 1}</div>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">
                                            +{c.improvementPercent.precisionAt5}% Precision
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-card p-3 rounded-lg border border-subtle">
                                        <div>
                                            <span className="text-muted block">Baseline Precision@5:</span>
                                            <span className="font-semibold text-primary">{c.baseline.precisionAt5}%</span>
                                        </div>
                                        <div>
                                            <span className="text-muted block">Advanced Precision@5:</span>
                                            <span className="font-semibold text-emerald-400">{c.advanced.precisionAt5}%</span>
                                        </div>
                                        <div>
                                            <span className="text-muted block">Baseline Wrong Anatomy:</span>
                                            <span className="font-semibold text-rose-400">{c.baseline.wrongAnatomyRate}%</span>
                                        </div>
                                        <div>
                                            <span className="text-muted block">Advanced Wrong Anatomy:</span>
                                            <span className="font-semibold text-emerald-400">{c.advanced.wrongAnatomyRate}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-3 border-t border-subtle bg-card-subtle flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent-hover transition-colors"
                    >
                        Close Benchmark Viewer
                    </button>
                </div>
            </div>
        </div>
    );
}
