"use client";

import React from "react";
import { EngineeringPhase } from "@/types/roadmap";

export interface RoadmapStepperProps {
  phases: EngineeringPhase[];
  activePhaseIndex: number;
  onSelectPhase: (index: number) => void;
}

export function RoadmapStepper({
  phases,
  activePhaseIndex,
  onSelectPhase,
}: RoadmapStepperProps) {
  return (
    <div className="w-full bg-card border border-subtle rounded-3xl p-4 sm:p-6 shadow-xl">
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 sm:pb-0">
        {phases.map((phase, idx) => {
          const isActive = activePhaseIndex === idx;
          const isCompleted = activePhaseIndex > idx;

          return (
            <button
              key={phase.id || idx}
              type="button"
              onClick={() => onSelectPhase(idx)}
              className={`flex-1 min-w-[140px] text-left p-3 rounded-2xl transition-all duration-200 border ${
                isActive
                  ? "bg-accent/15 border-accent shadow-accent-sm"
                  : isCompleted
                  ? "bg-card-subtle border-emerald-500/30 text-muted"
                  : "bg-card-subtle border-subtle text-muted hover:border-strong"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isActive
                      ? "bg-accent text-white"
                      : isCompleted
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-card text-muted"
                  }`}
                >
                  Phase {phase.phaseNumber || idx + 1}
                </span>
                <span className="text-[10px] font-mono text-muted">{phase.timeEstimate}</span>
              </div>
              <h4 className="text-xs font-bold text-primary truncate mt-1" title={phase.title}>
                {phase.title}
              </h4>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default RoadmapStepper;
