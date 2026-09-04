"use client";

import React from "react";

export interface QuerySummaryCardsProps {
  domain?: string;
  task?: string;
  modality?: string;
  target?: string;
  datasetsCount: number;
  modelsCount: number;
  papersCount: number;
  feasibilityScore?: number;
  gpuTarget?: string;
  isGeneralQuery?: boolean;
}

export function QuerySummaryCards({
  domain = "General / AI Concepts",
  task = "Discovery & Analysis",
  modality = "Multi-Modal",
  target = "General",
  datasetsCount,
  modelsCount,
  papersCount,
  feasibilityScore = 95,
  gpuTarget = "Hardware profiled",
  isGeneralQuery = false,
}: QuerySummaryCardsProps) {
  const cleanDomain = (d?: string) => {
    if (!d || d.toLowerCase() === "unknown" || d.trim() === "") return "Machine Learning & AI";
    return d;
  };

  const cleanTask = (t?: string) => {
    if (!t || t.toLowerCase() === "unknown" || t.trim() === "") return "Dataset Discovery & Analysis";
    return t;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Domain & Task */}
      <div className="p-4 rounded-2xl bg-card border border-subtle shadow-sm">
        <div className="text-[10px] uppercase font-bold tracking-wider text-faint">Domain & Task</div>
        <div
          className="text-sm sm:text-base font-bold text-primary mt-1 capitalize truncate"
          title={isGeneralQuery ? "General / AI Concepts" : cleanDomain(domain)}
        >
          {isGeneralQuery ? "General / AI Concepts" : cleanDomain(domain)}
        </div>
        <div
          className="text-xs text-muted mt-0.5 capitalize truncate"
          title={isGeneralQuery ? "Knowledge & Explanations" : cleanTask(task)}
        >
          {isGeneralQuery ? "Knowledge & Explanations" : cleanTask(task)}
        </div>
      </div>

      {/* Card 2: Modality & Format */}
      <div className="p-4 rounded-2xl bg-card border border-subtle shadow-sm">
        <div className="text-[10px] uppercase font-bold tracking-wider text-faint">Modality & Format</div>
        <div className="text-sm sm:text-base font-bold text-status-cyan mt-1 capitalize truncate">
          {isGeneralQuery ? "Text / Code" : (modality || "Multi-Modal")}
        </div>
        <div className="text-xs text-muted mt-0.5 truncate">
          {isGeneralQuery ? "Direct Statement" : `Target: ${target || "General"}`}
        </div>
      </div>

      {/* Card 3: Discovered Assets */}
      <div className="p-4 rounded-2xl bg-card border border-subtle shadow-sm">
        <div className="text-[10px] uppercase font-bold tracking-wider text-faint">Discovered Assets</div>
        <div className="text-sm sm:text-base font-bold text-primary mt-1">
          {datasetsCount} <span className="text-xs font-normal text-muted">Datasets</span> · {modelsCount}{" "}
          <span className="text-xs font-normal text-muted">Models</span> · {papersCount}{" "}
          <span className="text-xs font-normal text-muted">Papers</span>
        </div>
        <div className="text-xs text-muted mt-0.5">
          {isGeneralQuery ? "Direct Response" : "Kaggle, HF & Semantic Scholar"}
        </div>
      </div>

      {/* Card 4: Feasibility & Compute */}
      <div className="p-4 rounded-2xl bg-card border border-subtle shadow-sm">
        <div className="text-[10px] uppercase font-bold tracking-wider text-faint">Feasibility & Compute</div>
        <div className="text-sm sm:text-base font-bold text-status-emerald mt-1">
          {isGeneralQuery ? "100% Direct Match" : `${feasibilityScore}/100 Feasibility`}
        </div>
        <div className="text-xs text-muted mt-0.5 truncate">
          {isGeneralQuery ? "Interactive RAG" : (gpuTarget || "Hardware profiled")}
        </div>
      </div>
    </div>
  );
}

export default QuerySummaryCards;
