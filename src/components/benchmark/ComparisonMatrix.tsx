"use client";

import React from "react";
import { Dataset, PretrainedModel } from "@/types/assets";

export interface ComparisonMatrixProps {
  datasets: Dataset[];
  models: PretrainedModel[];
  onSelectDataset?: (dataset: Dataset) => void;
  onSelectModel?: (model: PretrainedModel) => void;
}

export function ComparisonMatrix({
  datasets,
  models,
  onSelectDataset,
  onSelectModel,
}: ComparisonMatrixProps) {
  return (
    <div className="rounded-3xl border border-subtle bg-card p-6 shadow-xl space-y-6">
      <div>
        <h3 className="text-base font-bold text-primary flex items-center gap-2">
          <span>📊</span> Dataset vs Model Cross-Compatibility Matrix
        </h3>
        <p className="text-xs text-muted mt-0.5">
          Evaluate input modalities, format conversions, and pretrained transfer feasibility.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-subtle text-faint uppercase font-bold tracking-wider text-[10px]">
              <th className="py-3 px-4 bg-card-solid rounded-l-xl">Dataset Candidate</th>
              <th className="py-3 px-4 bg-card-solid">Source / Modality</th>
              <th className="py-3 px-4 bg-card-solid">Compatible Model Architecture</th>
              <th className="py-3 px-4 bg-card-solid">License Rights</th>
              <th className="py-3 px-4 bg-card-solid">Match Score</th>
              <th className="py-3 px-4 bg-card-solid rounded-r-xl text-right">Roadmap Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {datasets.map((ds, idx) => {
              const pairedModel = models[idx % Math.max(1, models.length)];
              return (
                <tr key={ds.id || idx} className="hover:bg-card-hover/50 transition">
                  <td className="py-3.5 px-4 font-bold text-primary">
                    <div className="truncate max-w-[200px]" title={ds.name}>
                      {ds.name}
                    </div>
                    <span className="text-[10px] text-muted font-normal block truncate">
                      {ds.subtitle || ds.description?.slice(0, 50)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded bg-card-subtle text-secondary font-medium uppercase text-[10px]">
                      {ds.source} · {ds.modality || "Imaging"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-status-cyan">
                    {pairedModel ? (
                      <span title={pairedModel.architecture}>
                        {pairedModel.name || pairedModel.architecture}
                      </span>
                    ) : (
                      "Standard Backbone"
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                        ds.commercialLicenseBadge === "COMMERCIAL"
                          ? "status-badge-emerald"
                          : "status-badge-amber"
                      }`}
                    >
                      {ds.commercialLicenseBadge || "ACADEMIC"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-status-emerald">
                    {ds.matchScore}%
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectDataset?.(ds)}
                      className="px-3 py-1 rounded-lg bg-accent text-white text-[11px] font-bold shadow-accent-sm hover:brightness-110 transition"
                    >
                      Select
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ComparisonMatrix;
