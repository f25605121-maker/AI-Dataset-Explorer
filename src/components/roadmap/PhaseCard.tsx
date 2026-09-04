"use client";

import React from "react";
import { EngineeringPhase } from "@/types/roadmap";

export interface PhaseCardProps {
  phase: EngineeringPhase;
  isExpanded?: boolean;
}

export function PhaseCard({ phase, isExpanded = true }: PhaseCardProps) {
  return (
    <div className="rounded-3xl border border-subtle bg-card p-6 sm:p-7 shadow-xl space-y-5">
      {/* Phase Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-accent flex items-center justify-center text-white font-bold text-sm shadow-accent-sm">
            {phase.phaseNumber}
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-accent-gradient">
              {phase.phaseName || `Phase ${phase.phaseNumber}`}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-primary">{phase.title}</h3>
          </div>
        </div>

        <span className="px-3 py-1 rounded-full bg-card-subtle text-secondary border border-subtle text-xs font-mono font-semibold">
          ⏱ {phase.timeEstimate}
        </span>
      </div>

      {/* Summary */}
      <p className="text-xs sm:text-sm text-secondary leading-relaxed">{phase.summary}</p>

      {/* Deliverables & Recommended Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Deliverables */}
        <div className="p-4 rounded-2xl bg-card-solid border border-subtle space-y-2">
          <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
            <span>✓</span> Phase Deliverables
          </div>
          <ul className="space-y-1.5 text-secondary">
            {phase.deliverables.map((d, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-[11px]">
                <span className="text-emerald-400 mt-0.5">▪</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended Tools & Details */}
        <div className="p-4 rounded-2xl bg-card-solid border border-subtle space-y-2">
          <div className="text-[10px] uppercase font-bold tracking-wider text-status-cyan flex items-center gap-1.5">
            <span>🛠</span> Recommended Stack & Tools
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {phase.recommendedTools.map((tool, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg bg-card-subtle border border-subtle text-primary font-mono text-[10px] font-bold"
              >
                {tool}
              </span>
            ))}
          </div>
          {phase.technicalDetails && (
            <p className="text-[11px] text-muted pt-2 border-t border-subtle leading-relaxed">
              {phase.technicalDetails}
            </p>
          )}
        </div>
      </div>

      {/* Embedded Domain Code Snippet */}
      {phase.domainCodeSnippet && (
        <div className="space-y-2 pt-2">
          <div className="text-[10px] uppercase font-bold tracking-wider text-faint">
            Target Execution Snippet
          </div>
          <pre className="p-4 rounded-2xl bg-[#030712] border border-subtle font-mono text-xs text-cyan-300 overflow-x-auto leading-relaxed shadow-inner">
            <code>{phase.domainCodeSnippet}</code>
          </pre>
        </div>
      )}
    </div>
  );
}

export default PhaseCard;
