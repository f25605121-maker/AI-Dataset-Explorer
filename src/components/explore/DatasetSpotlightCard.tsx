"use client";

import React, { useState } from "react";
import { Dataset } from "@/types/assets";
import { useSearchSession } from "@/hooks/useSearchSession";
import { ConfidenceBadge } from "@/components/common/ConfidenceBadge";
import { EvidenceBadge } from "@/components/common/EvidenceBadge";
import { MatchBreakdown } from "@/components/common/MatchBreakdown";
import UserFeedbackModal from "@/components/modals/UserFeedbackModal";
import { extractExplicitModality } from "@/server/search/modalityParser";

export interface DatasetSpotlightCardProps {
  dataset: Dataset;
  isCompared?: boolean;
  onToggleCompare?: (id: string) => void;
  onOpenDetails?: (dataset: Dataset) => void;
}

export function DatasetSpotlightCard({
  dataset,
  isCompared = false,
  onToggleCompare,
  onOpenDetails,
}: DatasetSpotlightCardProps) {
  const { isAssetPinned, togglePinAsset, query } = useSearchSession();
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  const title = dataset.title || dataset.name || dataset.id || "Unnamed Dataset";
  const description = dataset.subtitle || dataset.description || "No description provided.";
  const score = dataset.matchScore ?? dataset.relevanceScore ?? 0;
  const source = (dataset.source || "Dataset").toLowerCase();
  const isKaggle = source.includes("kaggle");
  const datasetId = dataset.id || dataset.name;
  const isPinnedInSession = isAssetPinned(datasetId) || isCompared;
  const tier = score >= 85 ? "Tier A" : score >= 70 ? "Tier B" : score >= 50 ? "Tier C" : "Tier D";

  const handlePinToggle = () => {
    if (onToggleCompare) {
      onToggleCompare(datasetId);
    }
    togglePinAsset({
      id: datasetId,
      type: "dataset",
      title,
      subtitle: dataset.subtitle || dataset.modality,
      source: dataset.source || (isKaggle ? "Kaggle" : "Hugging Face"),
      score,
      badge: "Dataset",
      url: dataset.url,
      data: dataset,
      pinnedAt: Date.now(),
    });
  };

  const formatSize = (bytes?: number | null) => {
    if (!bytes || bytes === 0) return dataset.sizeFormatted || "Size unstated";
    const mb = bytes / (1024 * 1024);
    if (mb < 1000) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  const getScoreBadgeClass = (s: number) => {
    if (s >= 85) return "status-badge-emerald";
    if (s >= 70) return "status-badge-cyan";
    return "status-badge-amber";
  };

  const getTierBadgeClass = (t: string) => {
    if (t === "Tier A") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    if (t === "Tier B") return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40";
    if (t === "Tier C") return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    return "bg-zinc-500/20 text-zinc-400 border-zinc-500/40";
  };

  const explicitModality =
    dataset.modality && dataset.modality !== "General" && dataset.modality !== "unknown"
      ? dataset.modality
      : extractExplicitModality(title, description, dataset.tags || [], dataset.formats || []);

  return (
    <div
      className={`group relative rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 ${
        isPinnedInSession
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
              {score}% Match
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
            {formatSize(dataset.sizeBytes)}
          </span>
          {dataset.license && (
            <span
              className="px-2.5 py-1 rounded-lg bg-card-subtle border border-subtle text-secondary font-medium truncate max-w-[140px]"
              title={dataset.license}
            >
              {dataset.license}
            </span>
          )}
          {typeof dataset.downloads === "number" && dataset.downloads > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-card-subtle border border-subtle text-secondary font-medium">
              📥 {dataset.downloads.toLocaleString()}
            </span>
          )}
        </div>

        {/* Expandable Match Breakdown */}
        <MatchBreakdown
          breakdown={dataset.scoreBreakdown}
          evidence={dataset.evidence}
          matchReason={dataset.matchReason}
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

export default DatasetSpotlightCard;
