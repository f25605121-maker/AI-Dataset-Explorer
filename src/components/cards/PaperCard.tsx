"use client";

import React, { useState } from "react";
import type { NormalizedPaper, PaperRelationship } from "@/types/papers";
import { useSearchSession } from "@/context/SearchSessionContext";
import EvidenceBadge from "@/components/common/EvidenceBadge";
import ConfidenceBadge from "@/components/common/ConfidenceBadge";
import MatchBreakdown from "@/components/common/MatchBreakdown";
import UserFeedbackModal from "@/components/modals/UserFeedbackModal";
import { QualityTier, EvidenceLevel, MatchBreakdown as MatchBreakdownType } from "@/server/search/types";

interface PaperCardProps {
    paper: NormalizedPaper & {
        matchScore?: number;
        confidenceScore?: number;
        tier?: QualityTier;
        evidenceLevel?: EvidenceLevel;
        matchBreakdown?: MatchBreakdownType;
        warnings?: string[];
        matchReason?: string;
        description?: string;
        whyMatches?: string[];
        paperRelationships?: { datasetId?: string; modelId?: string; summary?: string };
    };
    onOpenDetails?: (paper: NormalizedPaper) => void;
}

export default function PaperCard({ paper, onOpenDetails }: PaperCardProps) {
    const { isAssetPinned, togglePinAsset, query } = useSearchSession();
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

    const title = paper.title || "Untitled Research Paper";
    const paperId = paper.id || title;
    const isPinned = isAssetPinned(paperId);
    const score = paper.relevanceScore ?? paper.matchScore ?? 50;
    const tier = paper.tier || (score >= 85 ? "Tier A" : score >= 70 ? "Tier B" : score >= 50 ? "Tier C" : "Tier D");

    const handlePin = () => {
        togglePinAsset({
            id: paperId,
            type: 'paper',
            title,
            subtitle: `${paper.venue || 'Academic'} · ${paper.year || ''}`,
            source: paper.venue || 'Research Literature',
            score,
            badge: 'Paper',
            url: paper.paperUrl || paper.pdfUrl || "",
            data: paper,
            pinnedAt: Date.now(),
        });
    };

    const authors = Array.isArray(paper.authors) && paper.authors.length > 0
        ? paper.authors.slice(0, 3).join(", ") + (paper.authors.length > 3 ? " et al." : "")
        : "Authors not available";

    const year = paper.year || (paper.publicationDate ? paper.publicationDate.slice(0, 4) : "Not available");
    const venue = paper.venue || "Academic Index";
    const abstract = paper.tldr || paper.abstract || paper.description || "Abstract not available.";
    const citations = typeof paper.citationCount === "number"
        ? `${paper.citationCount.toLocaleString()} citations`
        : "Citations unstated";

    const getRelationshipBadge = (rel: PaperRelationship | string | undefined, paperType?: string) => {
        const typeOrRel = (paperType || rel || "").toUpperCase();

        if (typeOrRel.includes("FOUNDATIONAL")) {
            return { label: "FOUNDATIONAL", className: "bg-purple-500/20 text-purple-400 border-purple-500/40", icon: "🏛️" };
        }
        if (typeOrRel.includes("DATASET") || typeOrRel === "EXACT_DATASET") {
            return { label: "DATASET-SPECIFIC", className: "status-badge-emerald", icon: "📦" };
        }
        if (typeOrRel.includes("MODEL") || typeOrRel === "EXACT_MODEL") {
            return { label: "MODEL-SPECIFIC", className: "status-badge-cyan", icon: "🤖" };
        }
        if (typeOrRel.includes("BENCHMARK") || typeOrRel.includes("CHALLENGE")) {
            return { label: "BENCHMARK", className: "bg-amber-500/20 text-amber-400 border-amber-500/40", icon: "🏆" };
        }
        if (typeOrRel.includes("LATEST")) {
            return { label: "LATEST RESEARCH", className: "bg-blue-500/20 text-blue-400 border-blue-500/40", icon: "⚡" };
        }
        if (typeOrRel.includes("SURVEY") || typeOrRel.includes("REVIEW")) {
            return { label: "SURVEY", className: "bg-indigo-500/20 text-indigo-400 border-indigo-500/40", icon: "📚" };
        }
        if (typeOrRel === "DIRECTLY_RELATED") {
            return { label: "DIRECTLY RELATED", className: "status-badge-violet", icon: "🎯" };
        }
        return { label: "METHOD", className: "bg-card-subtle text-muted border-subtle", icon: "🔬" };
    };

    const relBadge = getRelationshipBadge(paper.relationship, (paper as any).paper_type || (paper as any).paperType);

    const getScoreBadgeClass = (s: number) => {
        if (s >= 85) return "status-badge-emerald";
        if (s >= 70) return "status-badge-cyan";
        return "status-badge-amber";
    };

    const getTierBadgeClass = (t: QualityTier) => {
        if (t === "Tier A") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
        if (t === "Tier B") return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40";
        if (t === "Tier C") return "bg-amber-500/20 text-amber-400 border-amber-500/40";
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/40";
    };

    return (
        <div className={`group rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-lg relative ${
            isPinned
                ? "border-accent bg-accent-subtle/30 shadow-sm"
                : "border-subtle bg-card hover:bg-card-hover hover:border-strong"
        }`}>
            <div>
                {/* Top header row: Category / Relationship Badge + Tier + Evidence + Year + Pin */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider flex items-center gap-1 ${relBadge.className}`}
                            title={paper.relationshipEvidence || relBadge.label}
                        >
                            <span>{relBadge.icon}</span>
                            <span>{relBadge.label}</span>
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierBadgeClass(tier)}`}>
                            {tier}
                        </span>

                        <EvidenceBadge level={paper.evidenceLevel || "SUPPORTED"} />

                        {paper.isPreprint && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                                Preprint
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {paper.confidenceScore !== undefined && (
                            <ConfidenceBadge score={paper.confidenceScore} showLabel={false} />
                        )}

                        <span className="text-xs font-mono font-bold text-muted">
                            {year}
                        </span>

                        <button
                            type="button"
                            onClick={handlePin}
                            className={`text-[11px] px-2 py-0.5 rounded-lg border font-semibold transition-all duration-200 flex items-center gap-1 ${
                                isPinned
                                    ? "bg-accent text-white shadow-accent-sm border-transparent"
                                    : "bg-card-subtle text-muted border-subtle hover:text-primary hover:border-strong"
                            }`}
                            title={isPinned ? "Pinned to Benchmark Lab" : "Pin paper to Benchmark Lab"}
                        >
                            <span>{isPinned ? "✓" : "📌"}</span>
                        </button>
                    </div>
                </div>

                {/* Paper Title */}
                <h3
                    onClick={() => onOpenDetails?.(paper)}
                    className="text-base font-bold text-primary mt-3 cursor-pointer group-hover:text-accent transition-colors line-clamp-2 leading-snug"
                    title={title}
                >
                    {title}
                </h3>

                {/* Authors & Venue */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs text-muted">
                    <span className="text-secondary font-medium truncate max-w-[220px]">
                        {authors}
                    </span>
                    <span className="text-faint">·</span>
                    <span className="text-muted truncate max-w-[180px]" title={venue}>
                        {venue}
                    </span>
                </div>

                {/* Abstract Preview Box */}
                <div className="p-3.5 rounded-xl bg-card-subtle border border-subtle mt-3 shadow-xs">
                    <p className="text-xs text-muted line-clamp-3 leading-relaxed">
                        {abstract}
                    </p>
                </div>

                {/* Evidence Verification Checklist */}
                {paper.whyMatches && paper.whyMatches.length > 0 && (
                    <div className="mt-2.5 p-2 rounded-lg bg-card-subtle/50 border border-subtle/60 text-[11px] space-y-1">
                        {paper.whyMatches.slice(0, 2).map((why, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-emerald-400">
                                <span className="text-[10px] mt-0.5">✓</span>
                                <span className="leading-tight">{why}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Cross-Entity Paper Relationship */}
                {paper.paperRelationships?.summary && (
                    <div className="mt-2 px-2.5 py-1.5 rounded-lg border text-[11px] bg-cyan-500/10 text-cyan-400 border-cyan-500/30 flex items-center gap-1.5">
                        <span>🔗</span>
                        <span>{paper.paperRelationships.summary}</span>
                    </div>
                )}

                {/* AI Relevance Score & Citations */}
                <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-subtle text-xs">
                    <div
                        className="flex items-center gap-1.5 group/score relative cursor-help"
                        title="Relevance calculated from multi-factor evidence matching against target anatomy, modality, task, and benchmarks."
                    >
                        <span className="text-[11px] text-muted font-bold uppercase tracking-wider">AI Relevance:</span>
                        <span className={`text-xs font-black px-2 py-0.5 rounded-md border ${getScoreBadgeClass(score)}`}>
                            {score}%
                        </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted">
                        <span title={`Citation count from ${paper.citationSource || 'Scholarly Index'}`}>
                            📊 {citations}
                        </span>
                        {paper.openAccess && (
                            <span className="text-emerald-400 font-semibold" title="Open Access Publication">
                                🔓 OA
                            </span>
                        )}
                    </div>
                </div>

                {/* Expandable Match Breakdown if present */}
                <MatchBreakdown
                    breakdown={paper.matchBreakdown}
                    evidence={[]}
                    warnings={paper.warnings || []}
                    matchReason={paper.matchReason || paper.relationshipEvidence || undefined}
                    overallScore={score}
                />
            </div>

            {/* Action Buttons & Feedback */}
            <div className="mt-4 pt-3 border-t border-subtle flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setFeedbackModalOpen(true)}
                        className="text-xs text-muted hover:text-primary transition flex items-center gap-1 px-2 py-1 rounded hover:bg-card-subtle"
                        title="Rate relevance of this search result"
                    >
                        <span>👍/👎</span>
                        <span className="text-[11px]">Feedback</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => onOpenDetails?.(paper)}
                        className="px-2.5 py-1.5 rounded-lg bg-card-subtle hover:bg-card border border-subtle text-primary font-bold text-xs transition flex items-center gap-1"
                    >
                        <span>🔍</span> Read Details
                    </button>
                </div>

                <div className="flex items-center gap-1.5">
                    {paper.pdfUrl && (
                        <a
                            href={paper.pdfUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-bold text-xs transition flex items-center gap-1"
                            title="Open direct PDF"
                        >
                            <span>📄</span> PDF
                        </a>
                    )}
                    {paper.paperUrl && (
                        <a
                            href={paper.paperUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-accent text-white font-bold text-xs shadow-accent-sm hover:brightness-110 transition flex items-center gap-1"
                            title="View original publisher/repository page"
                        >
                            <span>Source</span>
                            <span>↗</span>
                        </a>
                    )}
                </div>
            </div>

            {/* User Feedback Modal */}
            <UserFeedbackModal
                isOpen={feedbackModalOpen}
                onClose={() => setFeedbackModalOpen(false)}
                candidateId={paperId}
                candidateTitle={title}
                candidateType="paper"
                searchQuery={query}
            />
        </div>
    );
}
