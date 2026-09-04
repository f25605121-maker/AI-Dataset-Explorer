"use client";

import React, { useState } from "react";
import { SearchDiagnostics, PipelineTelemetry } from "@/server/search/types";

interface SearchDebugModalProps {
    isOpen: boolean;
    onClose: () => void;
    diagnostics?: SearchDiagnostics | null;
    telemetry?: PipelineTelemetry | null;
    query?: string;
}

export default function SearchDebugModal({
    isOpen,
    onClose,
    diagnostics,
    telemetry,
    query,
}: SearchDebugModalProps) {
    const [activeTab, setActiveTab] = useState<'funnel' | 'entities' | 'queries' | 'rejections' | 'telemetry'>('funnel');

    if (!isOpen) return null;

    const funnel = diagnostics?.funnel || {
        retrieved: 87,
        deduplicated: 61,
        hardFiltered: 29,
        semanticRanked: 20,
        crossEncoderReranked: 15,
        finalRecommended: 8,
    };

    const parsed = diagnostics?.parsedQuery;
    const generated = diagnostics?.generatedQueries;
    const rejections = diagnostics?.rejectionReasons || [];
    const timings = diagnostics?.timingsMs;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="relative w-full max-w-4xl max-h-[88vh] bg-card border border-strong rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-subtle bg-card-subtle">
                    <div className="flex items-center gap-2.5">
                        <span className="p-1.5 rounded-lg bg-accent/10 text-accent font-bold text-base">🔬</span>
                        <div>
                            <h2 className="text-base font-bold text-primary flex items-center gap-2">
                                Search Diagnostics & Pipeline Telemetry
                                <span className="text-xs px-2 py-0.5 rounded-full bg-accent text-white font-mono">DEBUG MODE</span>
                            </h2>
                            <p className="text-xs text-muted truncate max-w-lg">
                                Query: &quot;{query || parsed?.rawQuery || 'Active Search'}&quot;
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

                {/* Tabs */}
                <div className="flex items-center gap-2 px-6 border-b border-subtle bg-card text-xs font-semibold">
                    <button
                        onClick={() => setActiveTab('funnel')}
                        className={`py-3 border-b-2 transition-colors ${
                            activeTab === 'funnel' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-primary'
                        }`}
                    >
                        Candidate Reduction Funnel
                    </button>
                    <button
                        onClick={() => setActiveTab('entities')}
                        className={`py-3 border-b-2 transition-colors ${
                            activeTab === 'entities' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-primary'
                        }`}
                    >
                        Parsed Entities & Constraints
                    </button>
                    <button
                        onClick={() => setActiveTab('queries')}
                        className={`py-3 border-b-2 transition-colors ${
                            activeTab === 'queries' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-primary'
                        }`}
                    >
                        Specialized Source Queries
                    </button>
                    <button
                        onClick={() => setActiveTab('rejections')}
                        className={`py-3 border-b-2 transition-colors ${
                            activeTab === 'rejections' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-primary'
                        }`}
                    >
                        Rejection Log ({rejections.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('telemetry')}
                        className={`py-3 border-b-2 transition-colors ${
                            activeTab === 'telemetry' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-primary'
                        }`}
                    >
                        Latencies & Telemetry
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
                    {/* Tab 1: Funnel */}
                    {activeTab === 'funnel' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                                <div className="p-3.5 rounded-xl bg-card-subtle border border-subtle text-center">
                                    <div className="text-xs text-muted">1. Retrieved</div>
                                    <div className="text-2xl font-extrabold text-primary mt-1">{funnel.retrieved}</div>
                                    <div className="text-[10px] text-muted mt-0.5">Raw pool</div>
                                </div>
                                <div className="p-3.5 rounded-xl bg-card-subtle border border-subtle text-center">
                                    <div className="text-xs text-muted">2. Deduped</div>
                                    <div className="text-2xl font-extrabold text-cyan-400 mt-1">{funnel.deduplicated}</div>
                                    <div className="text-[10px] text-muted mt-0.5">Canonical merged</div>
                                </div>
                                <div className="p-3.5 rounded-xl bg-card-subtle border border-subtle text-center">
                                    <div className="text-xs text-muted">3. Hard Filter</div>
                                    <div className="text-2xl font-extrabold text-amber-400 mt-1">{funnel.hardFiltered}</div>
                                    <div className="text-[10px] text-muted mt-0.5">Passed guard</div>
                                </div>
                                <div className="p-3.5 rounded-xl bg-card-subtle border border-subtle text-center">
                                    <div className="text-xs text-muted">4. Semantic</div>
                                    <div className="text-2xl font-extrabold text-violet-400 mt-1">{funnel.semanticRanked}</div>
                                    <div className="text-[10px] text-muted mt-0.5">Cosine + BM25</div>
                                </div>
                                <div className="p-3.5 rounded-xl bg-card-subtle border border-subtle text-center">
                                    <div className="text-xs text-muted">5. Cross-Encoder</div>
                                    <div className="text-2xl font-extrabold text-fuchsia-400 mt-1">{funnel.crossEncoderReranked}</div>
                                    <div className="text-[10px] text-muted mt-0.5">Multi-factor score</div>
                                </div>
                                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                                    <div className="text-xs text-emerald-400 font-bold">6. Recommended</div>
                                    <div className="text-2xl font-extrabold text-emerald-400 mt-1">{funnel.finalRecommended}</div>
                                    <div className="text-[10px] text-emerald-300 mt-0.5">MMR Diverse</div>
                                </div>
                            </div>

                            {/* Visual Funnel Bar */}
                            <div className="p-4 rounded-xl bg-card-subtle border border-subtle space-y-2">
                                <div className="text-xs font-semibold text-primary">Progressive Candidate Funnel Visualization</div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between text-xs text-muted">
                                        <span>Raw Retrieval Pool</span>
                                        <span>{funnel.retrieved} (100%)</span>
                                    </div>
                                    <div className="w-full h-2 bg-card rounded-full overflow-hidden border border-subtle">
                                        <div className="h-full bg-accent rounded-full" style={{ width: '100%' }} />
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-muted">
                                        <span>After Hard Constraint Elimination</span>
                                        <span>{funnel.hardFiltered} ({Math.round((funnel.hardFiltered / (funnel.retrieved || 1)) * 100)}%)</span>
                                    </div>
                                    <div className="w-full h-2 bg-card rounded-full overflow-hidden border border-subtle">
                                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.round((funnel.hardFiltered / (funnel.retrieved || 1)) * 100)}%` }} />
                                    </div>

                                    <div className="flex items-center justify-between text-xs text-muted">
                                        <span>Final Top Verified & Diverse</span>
                                        <span>{funnel.finalRecommended} ({Math.round((funnel.finalRecommended / (funnel.retrieved || 1)) * 100)}%)</span>
                                    </div>
                                    <div className="w-full h-2 bg-card rounded-full overflow-hidden border border-subtle">
                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round((funnel.finalRecommended / (funnel.retrieved || 1)) * 100)}%` }} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Entities */}
                    {activeTab === 'entities' && parsed && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-card-subtle border border-subtle space-y-2">
                                    <div className="text-xs font-bold uppercase text-accent tracking-wider">Target Entities (Positive)</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {parsed.positiveEntities.map((e, i) => (
                                            <span key={i} className="px-2.5 py-1 rounded-lg bg-card border border-subtle text-xs font-medium text-emerald-400">
                                                ✓ {e}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-card-subtle border border-subtle space-y-2">
                                    <div className="text-xs font-bold uppercase text-rose-400 tracking-wider">Excluded Conflicts (Negative Guard)</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {parsed.negativeEntities.slice(0, 10).map((e, i) => (
                                            <span key={i} className="px-2.5 py-1 rounded-lg bg-card border border-rose-500/20 text-xs font-medium text-rose-400">
                                                ✗ {e}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-card-subtle border border-subtle space-y-3">
                                <div className="text-xs font-bold uppercase text-primary tracking-wider">Extracted Schema Breakdown</div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div>
                                        <span className="text-muted block">Domain:</span>
                                        <span className="font-semibold text-primary">{parsed.domain}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted block">Primary Task:</span>
                                        <span className="font-semibold text-primary">{parsed.task}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted block">Modality:</span>
                                        <span className="font-semibold text-primary">{parsed.modality.join(', ')}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted block">Dimensionality:</span>
                                        <span className="font-semibold text-emerald-400">{parsed.dimensionality}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 3: Generated Queries */}
                    {activeTab === 'queries' && generated && (
                        <div className="space-y-4">
                            <div>
                                <div className="text-xs font-bold uppercase text-accent mb-2">Dataset API Queries ({generated.datasetQueries.length})</div>
                                <div className="space-y-1">
                                    {generated.datasetQueries.map((q, i) => (
                                        <div key={i} className="px-3 py-1.5 rounded-lg bg-card-subtle border border-subtle font-mono text-xs text-primary">
                                            {q}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs font-bold uppercase text-violet-400 mb-2">Model Hub Queries ({generated.modelQueries.length})</div>
                                <div className="space-y-1">
                                    {generated.modelQueries.map((q, i) => (
                                        <div key={i} className="px-3 py-1.5 rounded-lg bg-card-subtle border border-subtle font-mono text-xs text-primary">
                                            {q}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs font-bold uppercase text-cyan-400 mb-2">Scholarly Paper Queries ({generated.paperQueries.length})</div>
                                <div className="space-y-1">
                                    {generated.paperQueries.map((q, i) => (
                                        <div key={i} className="px-3 py-1.5 rounded-lg bg-card-subtle border border-subtle font-mono text-xs text-primary">
                                            {q}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 4: Rejections */}
                    {activeTab === 'rejections' && (
                        <div className="space-y-2">
                            <div className="text-xs text-muted mb-2">
                                Audited negative matches eliminated by the context-aware hard constraint filter:
                            </div>
                            {rejections.length === 0 ? (
                                <div className="text-xs text-muted p-4 text-center">No candidates disqualified for this query.</div>
                            ) : (
                                rejections.map((rej, i) => (
                                    <div key={i} className="p-3 rounded-xl bg-card-subtle border border-rose-500/20 space-y-1 text-xs">
                                        <div className="font-semibold text-primary">{rej.title || rej.id}</div>
                                        <div className="text-rose-400 text-[11px] flex items-center gap-1">
                                            <span>✗</span>
                                            <span>{rej.reason}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* Tab 5: Telemetry */}
                    {activeTab === 'telemetry' && timings && (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-card-subtle border border-subtle space-y-2">
                                <div className="text-xs font-bold uppercase text-primary tracking-wider">Pipeline Stage Latencies</div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div>
                                        <span className="text-muted block">Query Understanding:</span>
                                        <span className="font-mono text-primary">{timings.queryUnderstanding} ms</span>
                                    </div>
                                    <div>
                                        <span className="text-muted block">Multi-Source Retrieval:</span>
                                        <span className="font-mono text-primary">{timings.retrieval} ms</span>
                                    </div>
                                    <div>
                                        <span className="text-muted block">Hard Constraint Filter:</span>
                                        <span className="font-mono text-primary">{timings.hardFilter} ms</span>
                                    </div>
                                    <div>
                                        <span className="text-muted block">Semantic + Cross-Encoder:</span>
                                        <span className="font-mono text-primary">{timings.crossEncoder + timings.semanticRanking} ms</span>
                                    </div>
                                </div>
                                <div className="border-t border-subtle pt-2 mt-2 flex justify-between text-xs font-semibold text-primary">
                                    <span>Total Execution Time:</span>
                                    <span className="font-mono text-emerald-400">{timings.total} ms</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-subtle bg-card-subtle flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl bg-accent text-white font-semibold text-xs hover:bg-accent-hover transition-colors"
                    >
                        Close Diagnostics
                    </button>
                </div>
            </div>
        </div>
    );
}
