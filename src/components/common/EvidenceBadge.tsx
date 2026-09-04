"use client";

import React from "react";

export interface EvidenceBadgeProps {
  level?: string;
  sourcesCount?: number;
  showTooltip?: boolean;
  className?: string;
}

export function EvidenceBadge({
  level = "SUPPORTED",
  sourcesCount,
  showTooltip = true,
  className = "",
}: EvidenceBadgeProps) {
  const norm = (level || "SUPPORTED").toUpperCase();

  let badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  let icon = "🟢";
  let label = "VERIFIED MATCH";
  let desc = "Anatomy, modality, and task directly supported by source metadata.";

  if (norm === "VERIFIED") {
    badgeClass = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    icon = "🟢";
    label = "VERIFIED MATCH";
    desc = "All requested constraints directly supported by primary metadata.";
  } else if (norm === "SUPPORTED" || norm === "HIGH_RELEVANCE") {
    badgeClass = "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
    icon = "🔵";
    label = "SUPPORTED";
    desc = "Primary constraints verified from repository metadata.";
  } else if (norm === "PARTIAL" || norm === "PROVISIONAL") {
    badgeClass = "bg-amber-500/10 text-amber-400 border-amber-500/30";
    icon = "🟡";
    label = "PARTIAL MATCH";
    desc = "Some constraints verified; secondary attributes unverified.";
  } else {
    badgeClass = "bg-zinc-500/10 text-zinc-400 border-zinc-500/30";
    icon = "⚪";
    label = "UNVERIFIED EVIDENCE";
    desc = "Semantically related but key metadata is missing.";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wide uppercase ${badgeClass} ${className}`}
      title={showTooltip ? desc : undefined}
    >
      <span>{icon}</span>
      <span>{label}</span>
      {typeof sourcesCount === "number" && sourcesCount > 0 && (
        <span className="opacity-75 font-normal">({sourcesCount} src)</span>
      )}
    </span>
  );
}

export default EvidenceBadge;
