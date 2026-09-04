"use client";

import React, { useState } from "react";
import { PretrainedModel } from "@/types/assets";

export interface ModelSpecTableProps {
  models: PretrainedModel[];
  selectedGpu?: "T4" | "A10G" | "A100";
  onGpuChange?: (gpu: "T4" | "A10G" | "A100") => void;
  onSelectModel?: (model: PretrainedModel) => void;
}

export function ModelSpecTable({
  models,
  selectedGpu = "A10G",
  onGpuChange,
  onSelectModel,
}: ModelSpecTableProps) {
  const [activeGpu, setActiveGpu] = useState<"T4" | "A10G" | "A100">(selectedGpu);

  const handleGpuSelect = (gpu: "T4" | "A10G" | "A100") => {
    setActiveGpu(gpu);
    onGpuChange?.(gpu);
  };

  return (
    <div className="rounded-3xl border border-subtle bg-card p-6 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle pb-4">
        <div>
          <h3 className="text-base font-bold text-primary flex items-center gap-2">
            <span>🤖</span> Multi-Model Head-to-Head Specification Table
          </h3>
          <p className="text-xs text-muted mt-0.5">
            Evaluate parameters volume, context resolution, FP32/FP16 VRAM sizing, inference latency, and licensing guard.
          </p>
        </div>

        {/* GPU Selector */}
        <div className="flex items-center gap-1.5 text-xs text-muted shrink-0">
          <span className="text-[10px] uppercase font-bold text-faint">Benchmark GPU:</span>
          {(["T4", "A10G", "A100"] as const).map((gpu) => (
            <button
              key={gpu}
              type="button"
              onClick={() => handleGpuSelect(gpu)}
              className={`px-2.5 py-1 rounded-md font-mono text-[10px] font-bold transition ${
                activeGpu === gpu
                  ? "bg-accent text-white shadow-accent-sm"
                  : "bg-card-subtle text-muted hover:text-primary"
              }`}
            >
              {gpu}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-subtle text-faint uppercase font-bold tracking-wider text-[10px]">
              <th className="py-3 px-4 bg-card-solid rounded-l-xl">Model Candidate</th>
              <th className="py-3 px-4 bg-card-solid">Architecture & Family</th>
              <th className="py-3 px-4 bg-card-solid">Parameters</th>
              <th className="py-3 px-4 bg-card-solid">Context Resolution</th>
              <th className="py-3 px-4 bg-card-solid">VRAM (FP16)</th>
              <th className="py-3 px-4 bg-card-solid">Latency ({activeGpu})</th>
              <th className="py-3 px-4 bg-card-solid">Licensing Guard</th>
              <th className="py-3 px-4 bg-card-solid rounded-r-xl text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {models.map((model, idx) => (
              <tr key={model.id || idx} className="hover:bg-card-hover/50 transition">
                <td className="py-3.5 px-4 font-bold text-primary">
                  <div className="truncate max-w-[180px]" title={model.name}>
                    {model.name}
                  </div>
                  <span className="text-[10px] text-muted font-mono block">
                    {model.downloads ? `📥 ${model.downloads.toLocaleString()}` : "Hugging Face"}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-secondary font-medium">
                  {model.architectureFamily || model.architecture}
                </td>
                <td className="py-3.5 px-4 font-mono text-primary">
                  {model.paramsCount || "Standard"}
                </td>
                <td className="py-3.5 px-4 text-muted font-mono text-[11px]">
                  {model.contextResolution || "96x96x96 Patch"}
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-status-cyan">
                  {model.vramFp16 || "12.8 GB"}
                </td>
                <td className="py-3.5 px-4 font-mono font-bold text-status-emerald">
                  {activeGpu === "T4"
                    ? model.latencyT4 || "420 ms"
                    : activeGpu === "A10G"
                    ? model.latencyA10G || "185 ms"
                    : model.latencyA100 || "82 ms"}
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${
                      model.commercialLicenseBadge === "COMMERCIAL"
                        ? "status-badge-emerald"
                        : "status-badge-amber"
                    }`}
                  >
                    {model.commercialLicenseBadge || "COMMERCIAL"}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  {onSelectModel && (
                    <button
                      type="button"
                      onClick={() => onSelectModel(model)}
                      className="px-3 py-1 rounded-lg bg-accent text-white text-[11px] font-bold shadow-accent-sm hover:brightness-110 transition"
                    >
                      Select
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ModelSpecTable;
