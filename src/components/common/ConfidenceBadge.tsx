"use client";

import React from "react";

export interface ConfidenceBadgeProps {
  score?: number;
  showLabel?: boolean;
  className?: string;
}

export function ConfidenceBadge({ score, showLabel = true, className = "" }: ConfidenceBadgeProps) {
  if (score === undefined) return null;
  let colorClass = "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  if (score < 60) {
    colorClass = "text-amber-400 bg-amber-500/10 border-amber-500/30";
  } else if (score < 80) {
    colorClass = "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colorClass} ${className}`}
      title={`Epistemic Confidence: ${score}% (measures completeness of source metadata & proof)`}
    >
      <span className="opacity-80">🛡️</span>
      <span>{score}%</span>
      {showLabel && <span className="opacity-75 font-normal">Confidence</span>}
    </span>
  );
}

export default ConfidenceBadge;
