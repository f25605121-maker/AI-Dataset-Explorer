"use client";

import React, { useState } from "react";
import { useSearchSession } from "@/context/SearchSessionContext";
import EvidenceBadge from "@/components/common/EvidenceBadge";
import ConfidenceBadge from "@/components/common/ConfidenceBadge";
import MatchBreakdown from "@/components/common/MatchBreakdown";
import UserFeedbackModal from "@/components/modals/UserFeedbackModal";
import ScoreBreakdownModal from "@/components/recommendations/ScoreBreakdownModal";
import { MatchBreakdown as MatchBreakdownType, EvidenceItem, QualityTier, EvidenceLevel } from "@/server/search/types";
import { extractExplicitModality } from "@/server/search/modalityParser";

export interface DatasetItem {
    id: string;
    name: string;
    title?: string;
    subtitle?: string;
    description?: string;
    url: string;
    creator?: string;
    creatorName?: string;
    ref?: string;
    matchScore?: number;
    relevanceScore?: number;
    confidenceScore?: number;
    tier?: QualityTier;
    evidenceLevel?: EvidenceLevel;
    evidenceSources?: string[];
    evidenceStrength?: number;
    matchBreakdown?: MatchBreakdownType;
    evidence?: EvidenceItem[];
    warnings?: string[];
    scoreBreakdown?: any;
    license?: string;
    sizeBytes?: number | null;
    datasetSize?: number | null;
    source?: string;
    matchReason?: string;
    rejected?: boolean;
    rejectionReason?: string | null;
    downloads?: number | null;
    tags?: string[];
    modality?: string;
    task?: string;
    formats?: string[];
    matchCategory?: 'EXACT_MATCH' | 'PARTIAL_MATCH' | 'RELATED_RESOURCE';
    whyMatches?: string[];
    verifiedClaims?: string[];
    unverifiedClaims?: string[];
    potentialLimitations?: string[];
    samplingCompatibilityVerified?: boolean;
    samplingCompatibilityNote?: string;
    matchLevel?: 'DIRECT_MATCH' | 'STRONG_MATCH' | 'PARTIAL_MATCH' | 'WEAK_MATCH' | 'NO_MATCH';
    matchLevelExplanation?: string;
    satisfiedRequirements?: string[];
    missingRequirements?: string[];
    unknownRequirements?: string[];
}

interface DatasetCardProps {
    dataset: DatasetItem;
    isCompared?: boolean;
    onToggleCompare?: (id: string) => void;
    onOpenDetails?: (dataset: DatasetItem) => void;
}

export default function DatasetCard({
    dataset,
    isCompared = false,
    onToggleCompare,
    onOpenDetails,
}: DatasetCardProps) {
    const { isAssetPinned, togglePinAsset, query } = useSearchSession();
    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);

    const title = dataset.title || dataset.name || dataset.id || "Unnamed Dataset";
    const description = dataset.subtitle || dataset.description || "No description provided.";
    const score = dataset.matchScore ?? dataset.relevanceScore ?? 0;
    const source = (dataset.source || "Dataset").toLowerCase();
    const isKaggle = source.includes("kaggle");
    const datasetId = dataset.id || dataset.ref || dataset.name;
    const isPinnedInSession = isAssetPinned(datasetId) || isCompared;
    const tier = dataset.tier || (score >= 85 ? "Tier A" : score >= 70 ? "Tier B" : score >= 50 ? "Tier C" : "Tier D");

    const handlePinToggle = () => {
        if (onToggleCompare) {
            onToggleCompare(datasetId);
        }
        togglePinAsset({
            id: datasetId,
            type: 'dataset',
            title,
            subtitle: dataset.subtitle || dataset.modality,
            source: dataset.source || (isKaggle ? 'Kaggle' : 'Hugging Face'),
            score,
            badge: 'Dataset',
            url: dataset.url,
            data: dataset,
            pinnedAt: Date.now(),
        });
    };

    const formatSize = (bytes?: number | null) => {
        if (!bytes || bytes === 0) return "Size unstated";
        const mb = bytes / (1024 * 1024);
        if (mb < 1000) return `${mb.toFixed(1)} MB`;
        return `${(mb / 1024).toFixed(1)} GB`;
    };

    const getScoreBadgeClass = (s: number) => {
        if (dataset.matchLevel === 'DIRECT_MATCH') return 'status-badge-emerald';
        if (dataset.matchLevel === 'STRONG_MATCH') return 'status-badge-cyan';
        if (dataset.matchLevel === 'PARTIAL_MATCH') return 'status-badge-amber';
        if (dataset.matchLevel === 'WEAK_MATCH') return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/40';
        if (dataset.matchLevel === 'NO_MATCH') return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
        // Fallback to score-based coloring
        if (s >= 85) return 'status-badge-emerald';
        if (s >= 70) return 'status-badge-cyan';
        return 'status-badge-amber';
    };

    const getTierBadgeClass = (t: QualityTier) => {
        if (t === "Tier A") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
        if (t === "Tier B") return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40";
        if (t === "Tier C") return "bg-amber-500/20 text-amber-400 border-amber-500/40";
        return "bg-zinc-500/20 text-zinc-400 border-zinc-500/40";
    };

    const explicitModality = (dataset.modality && dataset.modality !== 'General' && dataset.modality !== 'unknown')
        ? dataset.modality
        : extractExplicitModality(title, description, dataset.tags || [], dataset.formats || []);

    return (
        <div
            className={`group relative rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 ${
                dataset.rejected
                    ? "border-rose-500/30 bg-rose-500/5 opacity-80"
                    : isPinnedInSession
                    ? "border-accent bg-accent-subtle/30 shadow-sm"
                    : "border-subtle bg-card hover:bg-card-hover hover:border-strong hover:shadow-md"
            }`}
        >
            <div>
                {/* Top row: Source badge + Tier + Match score + Compare button */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border tracking-wide uppercase ${
                                isKaggle ? "status-badge-blue" : "status-badge-amber"
                            }`}
                        >
                            {isKaggle ? "Kaggle" : "Hugging Face"}
                        </span>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierBadgeClass(tier)}`}>
                            {tier}
                        </span>

                        <EvidenceBadge level={dataset.evidenceLevel} />
                    </div>

                    <div className="flex items-center gap-2">
                        <ConfidenceBadge score={dataset.confidenceScore} showLabel={false} />

                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getScoreBadgeClass(score)}`}>
                            {dataset.matchLevel
                                ? `${dataset.matchLevel.replace(/_/g, ' ')} • ${score}`
                                : `${score}/100 Match`}
                        </span>

                        <button
                            type="button"
                            onClick={handlePinToggle}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all duration-200 flex items-center gap-1 ${
                                isPinnedInSession
                                    ? "bg-accent text-white shadow-accent-sm border-transparent"
                                    : "bg-card-subtle text-muted border-subtle hover:text-primary hover:border-strong"
                            }`}
                            title={isPinnedInSession ? "Pinned to Benchmark Lab (click to unpin)" : "Pin to Benchmark Lab matrix"}
                        >
                            <span>{isPinnedInSession ? "✓ Pinned" : "📌 Pin"}</span>
                        </button>
                    </div>
                </div>

                {/* Title & Description */}
                <h3 className="text-base font-bold text-primary mt-3 group-hover:text-accent transition-colors line-clamp-1">
                    {title}
                </h3>

                {/* Enclosed Description Box */}
                <div className="p-3 rounded-xl bg-card-subtle border border-subtle mt-2.5 shadow-xs">
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                        {description}
                    </p>
                </div>

                {/* Metadata Pills */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3.5 text-[11px]">
                    <span className="px-2.5 py-1 rounded-lg bg-card-subtle border border-subtle text-secondary font-medium">
                        <span className="text-muted mr-1">Modality:</span>
                        {explicitModality}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-card-subtle border border-subtle text-secondary font-medium">
                        <span className="text-muted mr-1">Size:</span>
                        {formatSize(dataset.sizeBytes || dataset.datasetSize)}
                    </span>
                    {dataset.license && (
                        <span className="px-2.5 py-1 rounded-lg bg-card-subtle border border-subtle text-secondary font-medium truncate max-w-[140px]" title={dataset.license}>
                            {dataset.license}
                        </span>
                    )}
                    {typeof dataset.downloads === "number" && dataset.downloads > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-card-subtle border border-subtle text-secondary font-medium">
                            📥 {dataset.downloads.toLocaleString()}
                        </span>
                    )}
                </div>

                {/* Verification Checklist */}
                {((dataset.whyMatches && dataset.whyMatches.length > 0) || (dataset.unverifiedClaims && dataset.unverifiedClaims.length > 0) || dataset.samplingCompatibilityNote) && (
                    <div className="mt-2.5 p-2.5 rounded-lg bg-card-subtle/50 border border-subtle/60 text-[11px] space-y-1.5">
                        {dataset.whyMatches && dataset.whyMatches.slice(0, 2).map((why, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-emerald-400">
                                <span className="text-[10px] mt-0.5">✓</span>
                                <span className="leading-tight">{why}</span>
                            </div>
                        ))}
                        {dataset.unverifiedClaims && dataset.unverifiedClaims.slice(0, 2).map((unv, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-amber-400">
                                <span className="text-[10px] mt-0.5">!</span>
                                <span className="leading-tight">{unv}</span>
                            </div>
                        ))}
                        {dataset.samplingCompatibilityNote && !dataset.unverifiedClaims?.includes(dataset.samplingCompatibilityNote) && (
                            <div className="flex items-start gap-1.5 text-amber-400">
                                <span className="text-[10px] mt-0.5">⚠️</span>
                                <span className="leading-tight">{dataset.samplingCompatibilityNote}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Expandable Match Breakdown */}
                <MatchBreakdown
                    breakdown={dataset.matchBreakdown}
                    evidence={dataset.evidence}
                    warnings={dataset.warnings}
                    matchReason={dataset.matchReason}
                    rejectionReason={dataset.rejectionReason}
                    overallScore={score}
                />
            </div>

            {/* Bottom Actions & User Feedback */}
            <div className="mt-4 pt-3 border-t border-subtle flex items-center justify-between gap-2">
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
                        onClick={() => setBreakdownModalOpen(true)}
                        className="text-xs text-accent hover:text-accent-hover transition flex items-center gap-1 px-2 py-1 rounded hover:bg-card-subtle font-bold"
                        title="View calibrated multi-factor score breakdown"
                    >
                        <span>📊</span>
                        <span className="text-[11px]">Score Breakdown</span>
                    </button>

                    {onOpenDetails && (
                        <button
                            type="button"
                            onClick={() => onOpenDetails(dataset)}
                            className="text-xs font-semibold text-muted hover:text-primary transition flex items-center gap-1"
                        >
                            <span>Metrics</span>
                            <span className="text-[10px]">▾</span>
                        </button>
                    )}
                </div>

                {dataset.url && (
                    <a
                        href={dataset.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-card-subtle hover:bg-card border border-subtle hover:border-strong text-primary transition flex items-center gap-1 group/link"
                    >
                        <span>Open Source</span>
                        <span className="group-hover/link:translate-x-0.5 transition-transform">↗</span>
                    </a>
                )}
            </div>

            {/* Score Breakdown Modal */}
            <ScoreBreakdownModal
                isOpen={breakdownModalOpen}
                onClose={() => setBreakdownModalOpen(false)}
                title={title}
                score={score}
                matchLevel={(dataset as any).matchLevel}
                matchLevelExplanation={(dataset as any).matchLevelExplanation}
                breakdown={{
                    ...dataset.scoreBreakdown,
                    requirementCoverage: (dataset as any).requirementCoverage,
                    hardConstraintScore: (dataset as any).hardConstraintScore,
                    technicalCompatibility: (dataset as any).technicalCompatibility,
                    semantic: dataset.matchBreakdown?.semantic,
                    task: dataset.matchBreakdown?.task,
                    domain: dataset.matchBreakdown?.domain,
                }}
                requirementMatches={(dataset as any).requirementMatches}
                satisfiedRequirements={dataset.satisfiedRequirements}
                missingRequirements={dataset.missingRequirements}
                unknownRequirements={dataset.unknownRequirements}
                conflictingRequirements={(dataset as any).conflictingRequirements}
                scoringTrace={(dataset as any).scoringTrace}
                why={dataset.whyMatches || (dataset.evidence ? dataset.evidence.map(e => e.claim) : [])}
                warnings={dataset.warnings || []}
            />

            {/* User Feedback Modal */}
            <UserFeedbackModal
                isOpen={feedbackModalOpen}
                onClose={() => setFeedbackModalOpen(false)}
                candidateId={datasetId}
                candidateTitle={title}
                candidateType="dataset"
                searchQuery={query}
            />
        </div>
    );
}
