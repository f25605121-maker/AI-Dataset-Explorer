"use client";

import React from "react";
import type { NormalizedPaper } from "@/types/papers";

interface PaperDetailModalProps {
    paper: NormalizedPaper | null;
    onClose: () => void;
}

export default function PaperDetailModal({ paper, onClose }: PaperDetailModalProps) {
    if (!paper) return null;

    const title = paper.title || "Untitled Research Paper";
    const authors = Array.isArray(paper.authors) && paper.authors.length > 0
        ? paper.authors.join(", ")
        : "Not available";
    const year = paper.year || (paper.publicationDate ? paper.publicationDate.slice(0, 4) : "Not available");
    const pubDate = paper.publicationDate || "Not available";
    const venue = paper.venue || "Academic Publication";
    const abstract = paper.abstract || "Abstract not available.";
    const citations = typeof paper.citationCount === "number"
        ? `${paper.citationCount.toLocaleString()} (${paper.citationSource || 'Academic Index'})`
        : "Not available";
    const score = paper.relevanceScore ?? 50;

    const getScoreBadgeClass = (s: number) => {
        if (s >= 85) return "status-badge-emerald";
        if (s >= 70) return "status-badge-cyan";
        return "status-badge-amber";
    };

    const formatTimestamp = (iso?: string) => {
        if (!iso) return "Recently checked";
        try {
            const d = new Date(iso);
            return d.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return iso;
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-3xl rounded-3xl bg-modal border border-strong shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
                {/* Header: Badges + Close button */}
                <div className="flex items-start justify-between gap-4 border-b border-subtle pb-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span
                            className={`text-xs font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${
                                paper.relationship === "EXACT_DATASET"
                                    ? "status-badge-emerald"
                                    : paper.relationship === "EXACT_MODEL"
                                    ? "status-badge-cyan"
                                    : paper.relationship === "DIRECTLY_RELATED"
                                    ? "status-badge-violet"
                                    : "bg-card-subtle text-muted border-subtle"
                            }`}
                        >
                            {paper.relationship.replace(/_/g, " ")}
                        </span>

                        {paper.isPreprint && (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-status-amber border border-amber-500/20 uppercase tracking-wider">
                                Preprint
                            </span>
                        )}

                        {paper.openAccess && (
                            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-status-emerald border border-emerald-500/20">
                                🔓 Open Access
                            </span>
                        )}
                    </div>

                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-card hover:bg-card-hover border border-subtle text-muted hover:text-primary flex items-center justify-center transition"
                    >
                        ✕
                    </button>
                </div>

                {/* Title & Metadata */}
                <div className="space-y-2">
                    <h2 className="text-xl sm:text-2xl font-black text-primary leading-snug">
                        {title}
                    </h2>
                    <div className="text-xs sm:text-sm text-secondary font-medium leading-relaxed">
                        <strong>Authors:</strong> {authors}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted pt-1">
                        <span><strong>Venue:</strong> {venue}</span>
                        <span>·</span>
                        <span><strong>Published:</strong> {pubDate} ({year})</span>
                    </div>
                </div>

                {/* KPI Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 bg-card-solid rounded-2xl border border-subtle">
                        <span className="text-faint font-bold uppercase tracking-wider text-[10px]">AI Relevance</span>
                        <div className="text-base font-black text-primary mt-1">
                            <span className={`px-2 py-0.5 rounded-md border ${getScoreBadgeClass(score)}`}>
                                {score}%
                            </span>
                        </div>
                    </div>
                    <div className="p-3.5 bg-card-solid rounded-2xl border border-subtle">
                        <span className="text-faint font-bold uppercase tracking-wider text-[10px]">Citations</span>
                        <div className="text-sm font-bold text-status-cyan mt-1 truncate" title={citations}>
                            {citations}
                        </div>
                    </div>
                    <div className="p-3.5 bg-card-solid rounded-2xl border border-subtle">
                        <span className="text-faint font-bold uppercase tracking-wider text-[10px]">DOI</span>
                        <div className="text-xs font-mono font-semibold text-secondary mt-1 truncate" title={paper.doi || 'Not available'}>
                            {paper.doi || "Not available"}
                        </div>
                    </div>
                    <div className="p-3.5 bg-card-solid rounded-2xl border border-subtle">
                        <span className="text-faint font-bold uppercase tracking-wider text-[10px]">arXiv ID</span>
                        <div className="text-xs font-mono font-semibold text-status-emerald mt-1 truncate">
                            {paper.arxivId || "Not available"}
                        </div>
                    </div>
                </div>

                {/* Relationship & Evidence Box */}
                <div className="p-4 rounded-2xl bg-card border border-subtle space-y-2">
                    <div className="text-xs font-bold text-accent-gradient uppercase tracking-wider flex items-center gap-1.5">
                        <span>✦</span> Relationship Classification Evidence
                    </div>
                    <p className="text-xs text-secondary leading-relaxed">
                        {paper.relationshipEvidence || "Classified from title, abstract, and entity metadata matching."}
                    </p>
                </div>

                {/* "Why is this paper relevant?" Bullet points */}
                {Array.isArray(paper.whyRelevant) && paper.whyRelevant.length > 0 && (
                    <div className="p-5 rounded-2xl bg-card-solid border border-subtle space-y-3">
                        <div className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
                            <span>💡</span> Why is this paper relevant?
                        </div>
                        <ul className="space-y-2 text-xs sm:text-sm text-secondary">
                            {paper.whyRelevant.map((point, idx) => (
                                <li key={idx} className="flex items-start gap-2.5">
                                    <span className="text-accent-to mt-0.5 font-bold">•</span>
                                    <span>{point}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Full Abstract */}
                <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-faint">
                        Abstract / Research Summary
                    </h4>
                    <div className="p-4 sm:p-5 rounded-2xl bg-card-solid border border-subtle text-xs sm:text-sm text-secondary leading-relaxed whitespace-pre-line shadow-xs">
                        {abstract}
                    </div>
                </div>

                {/* Topics & Fields of Study */}
                {Array.isArray(paper.topics) && paper.topics.length > 0 && (
                    <div className="space-y-2">
                        <span className="text-xs font-bold text-faint uppercase tracking-wider">Topics & Concepts:</span>
                        <div className="flex flex-wrap gap-1.5">
                            {paper.topics.map((topic, i) => (
                                <span
                                    key={i}
                                    className="px-2.5 py-1 rounded-lg bg-card-subtle border border-subtle text-xs text-secondary font-medium"
                                >
                                    #{topic}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Source Provenance & Audit Footer */}
                <div className="p-3.5 rounded-xl bg-card-subtle border border-subtle text-[11px] text-muted flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                        <strong>Scholarly Sources:</strong> {paper.sources?.join(", ") || "Academic Aggregator"}
                    </div>
                    <div>
                        <strong>Last checked:</strong> {formatTimestamp(paper.lastChecked)}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-subtle">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl bg-card hover:bg-card-hover border border-subtle text-secondary font-bold text-xs transition"
                    >
                        Close
                    </button>

                    <div className="flex items-center gap-2">
                        {paper.pdfUrl && (
                            <a
                                href={paper.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-status-rose border border-rose-500/20 font-bold text-xs transition flex items-center gap-1.5"
                            >
                                <span>📄</span> Open PDF ↗
                            </a>
                        )}

                        {paper.paperUrl && (
                            <a
                                href={paper.paperUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-xs shadow-accent hover:brightness-110 transition flex items-center gap-1.5"
                            >
                                <span>View Source Publication</span>
                                <span>↗</span>
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
