"use client";

import React from "react";

type MatchLevel = 'DIRECT_MATCH' | 'STRONG_MATCH' | 'PARTIAL_MATCH' | 'WEAK_MATCH' | 'NO_MATCH';

interface RequirementMatchDisplay {
    requirementId: string;
    status: 'SATISFIED' | 'PARTIAL' | 'NOT_SATISFIED' | 'UNKNOWN' | 'CONFLICT';
    evidence: string | null;
    confidence: number;
    explanation: string;
}

interface ScoreBreakdownProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    score: number;
    matchLevel?: MatchLevel;
    matchLevelExplanation?: string;
    breakdown?: {
        semantic?: number;
        task?: number;
        domain?: number;
        modality?: number;
        constraints?: number;
        research?: number;
        benchmark?: number;
        requirementCoverage?: number;
        hardConstraintScore?: number;
        technicalCompatibility?: number;
        [key: string]: number | undefined;
    };
    requirementMatches?: RequirementMatchDisplay[];
    satisfiedRequirements?: string[];
    missingRequirements?: string[];
    unknownRequirements?: string[];
    conflictingRequirements?: string[];
    scoringTrace?: {
        crossEncoderContribution?: number;
        requirementContribution?: number;
        technicalContribution?: number;
        rawBeforeCap?: number;
        appliedCap?: number | null;
        capReason?: string | null;
    };
    why?: string[];
    warnings?: string[];
}

function MatchLevelBadge({ level }: { level?: MatchLevel }) {
    if (!level) return null;
    const configs: Record<MatchLevel, { color: string; label: string }> = {
        DIRECT_MATCH:  { color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', label: '✓ DIRECT MATCH' },
        STRONG_MATCH:  { color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40', label: '◎ STRONG MATCH' },
        PARTIAL_MATCH: { color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', label: '◑ PARTIAL MATCH' },
        WEAK_MATCH:    { color: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40', label: '○ WEAK MATCH' },
        NO_MATCH:      { color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', label: '✗ NO MATCH' },
    };
    const cfg = configs[level];
    return (
        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.color}`}>
            {cfg.label}
        </span>
    );
}

function ScoreBar({ label, value, color = 'bg-accent' }: { label: string; value: number; color?: string }) {
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-secondary">{label}</span>
                <span className="text-xs font-bold text-primary">{value}</span>
            </div>
            <div className="h-1.5 rounded-full bg-card-subtle overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
                />
            </div>
        </div>
    );
}

function StatusIcon({ status }: { status: RequirementMatchDisplay['status'] }) {
    if (status === 'SATISFIED') return <span className="text-emerald-400 shrink-0 text-sm">✓</span>;
    if (status === 'PARTIAL') return <span className="text-amber-400 shrink-0 text-sm">◑</span>;
    if (status === 'NOT_SATISFIED') return <span className="text-rose-400 shrink-0 text-sm">✗</span>;
    if (status === 'CONFLICT') return <span className="text-red-400 shrink-0 text-sm">⚡</span>;
    return <span className="text-zinc-400 shrink-0 text-sm">?</span>;
}

export default function ScoreBreakdownModal({
    isOpen,
    onClose,
    title,
    score,
    matchLevel,
    matchLevelExplanation,
    breakdown,
    requirementMatches,
    satisfiedRequirements = [],
    missingRequirements = [],
    unknownRequirements = [],
    conflictingRequirements = [],
    scoringTrace,
    why = [],
    warnings = [],
}: ScoreBreakdownProps) {
    if (!isOpen) return null;

    const hasRequirements = (requirementMatches?.length ?? 0) > 0;

    // Score bars
    const coreBars = [
        breakdown?.requirementCoverage != null
            ? { label: 'Requirement Coverage', value: breakdown.requirementCoverage, color: 'bg-accent' }
            : null,
        breakdown?.hardConstraintScore != null
            ? { label: 'Hard Constraint Score', value: breakdown.hardConstraintScore, color: breakdown.hardConstraintScore < 50 ? 'bg-rose-500' : breakdown.hardConstraintScore < 80 ? 'bg-amber-500' : 'bg-emerald-500' }
            : null,
        breakdown?.technicalCompatibility != null
            ? { label: 'Technical Compatibility', value: breakdown.technicalCompatibility, color: 'bg-cyan-500' }
            : null,
        { label: 'Semantic Relevance', value: breakdown?.semantic ?? breakdown?.domain ?? 75, color: 'bg-violet-500' },
        { label: 'Task Alignment', value: breakdown?.task ?? 80, color: 'bg-blue-500' },
    ].filter(Boolean) as { label: string; value: number; color: string }[];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="w-full max-w-lg rounded-3xl bg-card border border-subtle shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-subtle flex items-center justify-between">
                    <div>
                        <div className="text-[11px] font-bold uppercase tracking-wider text-accent">
                            Match Analysis
                        </div>
                        <div className="text-sm font-bold text-primary mt-1 line-clamp-1">{title}</div>
                        {matchLevelExplanation && (
                            <div className="text-[11px] text-muted mt-1 line-clamp-2">{matchLevelExplanation}</div>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-muted hover:text-primary text-xl ml-4 shrink-0 transition-colors"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6 space-y-6">
                    {/* Score + Level */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-card-subtle border border-subtle shrink-0">
                            <span className="text-2xl font-black text-primary">{score}</span>
                            <span className="text-[9px] text-muted font-semibold uppercase tracking-wider">/100</span>
                        </div>
                        <div className="flex flex-col gap-2">
                            <MatchLevelBadge level={matchLevel} />
                            <div className="text-[11px] text-muted">
                                {hasRequirements
                                    ? `${satisfiedRequirements.length} satisfied · ${missingRequirements.length} missing · ${unknownRequirements.length} unknown`
                                    : 'Score based on semantic + modality alignment'}
                            </div>
                        </div>
                    </div>

                    {/* Score Factors */}
                    <div className="space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted">Score Factors</div>
                        {coreBars.map((bar, i) => (
                            <ScoreBar key={i} label={bar.label} value={bar.value} color={bar.color} />
                        ))}
                    </div>

                    {/* Requirement Breakdown — only shown when requirements are detected */}
                    {hasRequirements && (
                        <div className="space-y-3">
                            <div className="text-xs font-bold uppercase tracking-wider text-muted">
                                Requirement Breakdown
                            </div>
                            <div className="space-y-1.5">
                                {requirementMatches!.map((m) => (
                                    <div key={m.requirementId} className="flex items-start gap-2 text-xs">
                                        <StatusIcon status={m.status} />
                                        <div className="flex-1 min-w-0">
                                            <span className={
                                                m.status === 'SATISFIED' ? 'text-emerald-300' :
                                                m.status === 'PARTIAL' ? 'text-amber-300' :
                                                m.status === 'CONFLICT' ? 'text-red-400' :
                                                m.status === 'NOT_SATISFIED' ? 'text-rose-400' :
                                                'text-zinc-400'
                                            }>
                                                {m.requirementId.replace(/^req_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                                            </span>
                                            <span className="text-muted ml-1.5 text-[10px]">{m.explanation}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Conflict warning */}
                    {conflictingRequirements.length > 0 && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30">
                            <div className="text-xs font-bold text-red-400 mb-1">⚡ Domain Conflicts</div>
                            <ul className="space-y-0.5">
                                {conflictingRequirements.map((c, i) => (
                                    <li key={i} className="text-xs text-red-300">{c}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Scoring trace (collapsed) */}
                    {scoringTrace && (
                        <details className="group">
                            <summary className="text-xs font-semibold text-muted cursor-pointer hover:text-primary">
                                📊 Scoring Trace (debug)
                            </summary>
                            <div className="mt-2 p-3 rounded-xl bg-card-subtle border border-subtle text-[10px] text-muted font-mono space-y-0.5">
                                {scoringTrace.crossEncoderContribution != null && <div>Retrieval: {scoringTrace.crossEncoderContribution}</div>}
                                {scoringTrace.requirementContribution != null && <div>Requirements: {scoringTrace.requirementContribution}</div>}
                                {scoringTrace.technicalContribution != null && <div>Technical: {scoringTrace.technicalContribution}</div>}
                                {scoringTrace.rawBeforeCap != null && <div>Raw: {scoringTrace.rawBeforeCap}</div>}
                                {scoringTrace.appliedCap != null && <div className="text-amber-400">Cap: {scoringTrace.appliedCap} ({scoringTrace.capReason})</div>}
                            </div>
                        </details>
                    )}

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
