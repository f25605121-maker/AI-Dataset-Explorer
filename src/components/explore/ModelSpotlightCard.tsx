"use client";

import React, { useState } from "react";
import { PretrainedModel } from "@/types/assets";
import { useSearchSession } from "@/hooks/useSearchSession";
import { ConfidenceBadge } from "@/components/common/ConfidenceBadge";
import { EvidenceBadge } from "@/components/common/EvidenceBadge";
import { MatchBreakdown } from "@/components/common/MatchBreakdown";
import UserFeedbackModal from "@/components/modals/UserFeedbackModal";

export interface ModelSpotlightCardProps {
  model: PretrainedModel;
}

export function ModelSpotlightCard({ model }: ModelSpotlightCardProps) {
  const { isAssetPinned, togglePinAsset, query } = useSearchSession();
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);

  const title = model.name || model.id || "Hugging Face Model";
  const score = model.matchScore ?? model.confidenceScore ?? 75;
  const task = model.task || model.pipeline || "Machine Learning";
  const architecture = model.architecture || "Pretrained Transformer";
  const description =
    model.description || "Open-source pretrained model weights available for inference and fine-tuning.";
  const modelId = model.id || model.name || title;
  const isPinned = isAssetPinned(modelId);
  const tier = score >= 85 ? "Tier A" : score >= 70 ? "Tier B" : score >= 50 ? "Tier C" : "Tier D";

  const handlePin = () => {
    togglePinAsset({
      id: modelId,
      type: "model",
      title,
      subtitle: `${architecture} · ${task}`,
      source: "Hugging Face",
      score,
      badge: "Model",
      url: model.url,
      data: model,
      pinnedAt: Date.now(),
    });
  };

  const getTierBadgeClass = (t: string) => {
    if (t === "Tier A") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    if (t === "Tier B") return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40";
    if (t === "Tier C") return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    return "bg-zinc-500/20 text-zinc-400 border-zinc-500/40";
  };

  return (
    <div
      className={`group rounded-2xl border p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-md ${
        isPinned
          ? "border-accent bg-accent-subtle/30 shadow-sm"
          : "border-subtle bg-card hover:bg-card-hover hover:border-strong"
      }`}
    >
      <div>
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wide flex items-center gap-1 status-badge-violet">
              <span>🤗</span> Hugging Face
            </span>

            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getTierBadgeClass(tier)}`}>
              {tier}
            </span>

            <EvidenceBadge level={model.badge || "SUPPORTED"} />
          </div>

          <div className="flex items-center gap-2">
            <ConfidenceBadge score={model.confidenceScore} showLabel={false} />

            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border status-badge-cyan">
              {score}% Match
            </span>

            <button
              type="button"
              onClick={handlePin}
              className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition-all duration-200 flex items-center gap-1 ${
                isPinned
                  ? "bg-accent text-white shadow-accent-sm border-transparent"
                  : "bg-card-subtle text-muted border-subtle hover:text-primary hover:border-strong"
              }`}
              title={isPinned ? "Pinned to Benchmark Lab (click to unpin)" : "Pin to Benchmark Lab matrix"}
            >
              <span>{isPinned ? "✓ Pinned" : "📌 Pin"}</span>
            </button>
          </div>
        </div>

        {/* Model Title */}
        <h3 className="text-base font-bold text-primary mt-3 group-hover:text-accent transition-colors truncate" title={title}>
          {title}
        </h3>

        {/* Architecture & Task info */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-xs text-secondary">
            Arch: <strong className="text-status-emerald">{architecture}</strong>
          </span>
          <span className="text-xs text-faint">·</span>
          <span className="text-xs text-muted truncate max-w-[160px]">{task}</span>
        </div>

        {/* Enclosed Description Box */}
        <div className="p-3 rounded-xl bg-card-subtle border border-subtle mt-2.5 shadow-xs">
          <p className="text-xs text-muted line-clamp-2 leading-relaxed">{description}</p>
        </div>

        {/* Specs & Downloads if available */}
        <div className="flex flex-wrap gap-1.5 mt-3.5 text-[11px]">
          {model.paramsCount && (
            <span className="px-2.5 py-1 rounded-lg bg-card-subtle border border-subtle text-secondary font-medium">
              {model.paramsCount}
            </span>
          )}
          {model.vramFp16 && (
            <span className="px-2.5 py-1 rounded-lg bg-card-subtle border border-subtle text-secondary font-medium">
              VRAM: {model.vramFp16}
            </span>
          )}
          {typeof model.downloads === "number" && model.downloads > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-card-subtle border border-subtle text-secondary font-medium">
              📥 {model.downloads.toLocaleString()}
            </span>
          )}
        </div>

        {/* Match Breakdown */}
        <MatchBreakdown
          breakdown={model.metadata}
          matchReason={model.description}
          overallScore={score}
        />
      </div>

      {/* Bottom link & Feedback */}
      <div className="mt-4 pt-3 border-t border-subtle flex items-center justify-between">
        <button
          type="button"
          onClick={() => setFeedbackModalOpen(true)}
          className="text-xs text-muted hover:text-primary transition flex items-center gap-1 px-2 py-1 rounded hover:bg-card-subtle"
          title="Rate relevance of this search result"
        >
          <span>👍/👎</span>
          <span className="text-[11px]">Feedback</span>
        </button>

        {model.url && (
          <a
            href={model.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-card-subtle hover:bg-card border border-subtle hover:border-strong text-primary transition flex items-center gap-1 group/link"
          >
            <span>Model Card</span>
            <span className="group-hover/link:translate-x-0.5 transition-transform">↗</span>
          </a>
        )}
      </div>

      {/* User Feedback Modal */}
      <UserFeedbackModal
        isOpen={feedbackModalOpen}
        onClose={() => setFeedbackModalOpen(false)}
        candidateId={modelId}
        candidateTitle={title}
        candidateType="model"
        searchQuery={query}
      />
    </div>
  );
}

export default ModelSpotlightCard;
