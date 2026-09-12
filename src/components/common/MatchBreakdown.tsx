"use client";

import React, { useState } from "react";

export interface MatchBreakdownProps {
  breakdown?: any;
  evidence?: Array<{ claim: string; evidenceText: string }>;
  warnings?: string[];
  matchReason?: string;
  rejectionReason?: string | null;
  overallScore?: number;
  initialExpanded?: boolean;
}

export function MatchBreakdown({
  breakdown,
  evidence = [],
  warnings = [],
  matchReason,
  rejectionReason,
  overallScore = 85,
  initialExpanded = false,
}: MatchBreakdownProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);

  const b = breakdown || {
    anatomy: 0,
    modality: 0,
    task: 0,
    dimension: 0,
    target: 0,
    domain: 0,
    semantic: 0,
    evidence: 0,
    metadata: 0,
    accessibility: 0,
    popularity: 0,
    overall: overallScore,
    confirmedClaims: [],
    warnings: warnings,
  };

  const dimensions = [
    { label: "Anatomy Alignment", score: b.anatomy ?? 0, weight: "25%" },
    { label: "Task Alignment", score: b.task ?? 0, weight: "18%" },
    { label: "Modality Alignment", score: b.modality ?? 0, weight: "15%" },
    { label: "Target / Labels", score: b.target ?? 0, weight: "10%" },
    { label: "Dimensionality (3D/2D)", score: b.dimension ?? 0, weight: "8%" },
    { label: "Semantic Similarity", score: b.semantic ?? 0, weight: "8%" },
    { label: "Primary Evidence", score: b.evidence ?? 0, weight: "6%" },
    { label: "Metadata Quality", score: b.metadata ?? 0, weight: "4%" },
  ];

  const getScoreBarColor = (s: number) => {
    if (s >= 85) return "bg-emerald-500";
    if (s >= 65) return "bg-cyan-500";
    if (s >= 40) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="mt-3 border-t border-subtle/50 pt-2.5 text-xs">
      {/* Toggle Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-1 text-secondary hover:text-primary transition-colors font-medium text-left"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-accent text-[11px]">⚡</span>
          <span className="font-semibold text-primary">Why this result?</span>
          <span className="text-[10px] text-muted">
            ({b.overall ?? overallScore}/100 Match Breakdown)
          </span>
        </div>
        <span className="text-[11px] text-muted">{isExpanded ? "▲ Hide" : "▼ Explain"}</span>
      </button>

      {/* Rejection Alert if Disqualified */}
      {rejectionReason && (
        <div className="mt-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] flex items-start gap-1.5">
          <span className="text-rose-400 font-bold">✗</span>
          <div>
            <strong className="font-semibold">Disqualified / Not Recommended:</strong> {rejectionReason}
          </div>
        </div>
      )}

      {/* Expanded Detailed Breakdown */}
      {isExpanded && (
        <div className="mt-2.5 space-y-3 bg-card-subtle rounded-xl p-3 border border-subtle">
          {/* Reason Summary */}
          {matchReason && (
            <div className="text-[11px] text-secondary border-b border-subtle pb-2">
              <span className="font-semibold text-primary">Synthesis:</span> {matchReason}
            </div>
          )}

          {/* Dimension Breakdown Bars */}
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase font-bold tracking-wider text-muted mb-1">
              Weighted Multi-Factor Scoring
            </div>
            {dimensions.map((dim, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <span className="text-muted w-36 truncate text-[11px]">
                  {dim.label} <span className="text-[9px] opacity-60">({dim.weight})</span>
                </span>
                <div className="flex-1 h-1.5 bg-card rounded-full overflow-hidden border border-subtle max-w-[140px]">
                  <div
                    className={`h-full rounded-full transition-all ${getScoreBarColor(dim.score)}`}
                    style={{ width: `${dim.score}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-primary w-8 text-right">
                  {dim.score}%
                </span>
              </div>
            ))}
          </div>

          {/* Confirmed Claims */}
          {b.confirmedClaims && b.confirmedClaims.length > 0 && (
            <div className="border-t border-subtle pt-2">
              <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 mb-1 flex items-center gap-1">
                <span>✓</span> Confirmed Against Evidence
              </div>
              <ul className="space-y-0.5">
                {b.confirmedClaims.map((claim: string, idx: number) => (
                  <li key={idx} className="text-[11px] text-secondary flex items-start gap-1">
                    <span className="text-emerald-400">✓</span>
                    <span>{claim}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Verified Evidence Details */}
          {evidence.length > 0 && (
            <div className="border-t border-subtle pt-2">
              <div className="text-[10px] uppercase font-bold tracking-wider text-cyan-400 mb-1 flex items-center gap-1">
                <span>📄</span> Primary Evidence Sources
              </div>
              <div className="space-y-1">
                {evidence.slice(0, 3).map((item, idx) => (
                  <div key={idx} className="text-[10px] bg-card p-1.5 rounded border border-subtle text-secondary">
                    <div className="font-semibold text-primary">{item.claim}</div>
                    <div className="text-muted truncate">{item.evidenceText}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Potential Limitations / Warnings */}
          {warnings.length > 0 && (
            <div className="border-t border-subtle pt-2">
              <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400 mb-1 flex items-center gap-1">
                <span>⚠️</span> Potential Limitations
              </div>
              <ul className="space-y-0.5">
                {warnings.map((warn, idx) => (
                  <li key={idx} className="text-[11px] text-amber-300/90 flex items-start gap-1">
                    <span className="text-amber-400">⚠</span>
                    <span>{warn}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MatchBreakdown;
