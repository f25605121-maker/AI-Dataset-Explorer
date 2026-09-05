"use client";

import { useState } from "react";
import Link from "next/link";

type ParamSize = "7B" | "14B" | "32B" | "70B" | "405B";
type Precision = "INT4" | "FP8" | "FP16";

interface ProfileItem {
  vram: number;
  pct: number;
  weights: string;
  lora: string;
  kv: string;
  gpu: string;
  spec: string;
  runpod: string;
  lambda: string;
  status: string;
  color: "emerald" | "amber" | "rose";
}

const hwProfiles: Record<ParamSize, Record<Precision, ProfileItem>> = {
  "7B": {
    INT4: { vram: 4.8, pct: 20, weights: "3.5 GB", lora: "0.6 GB", kv: "0.8 GB", gpu: "NVIDIA RTX 4060 / 3060", spec: "12GB VRAM • Consumer Entry", runpod: "$0.18 / hr", lambda: "$0.28 / hr", status: "Consumer GPU Ready", color: "emerald" },
    FP8:  { vram: 8.4, pct: 35, weights: "7.0 GB", lora: "0.9 GB", kv: "1.2 GB", gpu: "NVIDIA RTX 4070 / 3080", spec: "16GB VRAM • Consumer Solid", runpod: "$0.24 / hr", lambda: "$0.38 / hr", status: "Consumer GPU Ready", color: "emerald" },
    FP16: { vram: 14.2, pct: 59, weights: "9.5 GB", lora: "1.4 GB", kv: "2.1 GB", gpu: "NVIDIA GeForce RTX 4090", spec: "24GB GDDR6X • 1,008 GB/s Bandwidth", runpod: "$0.34 / hr", lambda: "$0.59 / hr", status: "Consumer GPU Ready (RTX 4090)", color: "emerald" }
  },
  "14B": {
    INT4: { vram: 9.2, pct: 38, weights: "7.0 GB", lora: "1.2 GB", kv: "1.6 GB", gpu: "NVIDIA RTX 4070 Ti / 4080", spec: "16GB VRAM • High-End Consumer", runpod: "$0.28 / hr", lambda: "$0.44 / hr", status: "Consumer GPU Ready", color: "emerald" },
    FP8:  { vram: 16.5, pct: 68, weights: "14.0 GB", lora: "1.8 GB", kv: "2.4 GB", gpu: "NVIDIA RTX 4090 / A10G", spec: "24GB VRAM • Fits on 24GB Card", runpod: "$0.45 / hr", lambda: "$0.75 / hr", status: "Consumer GPU Ready (RTX 4090)", color: "emerald" },
    FP16: { vram: 28.8, pct: 75, weights: "24.2 GB", lora: "2.8 GB", kv: "3.8 GB", gpu: "NVIDIA A100 (40GB) / L40S", spec: "40-48GB VRAM • Datacenter Node", runpod: "$0.85 / hr", lambda: "$1.29 / hr", status: "Datacenter Node Required", color: "amber" }
  },
  "32B": {
    INT4: { vram: 19.4, pct: 81, weights: "16.0 GB", lora: "2.1 GB", kv: "2.5 GB", gpu: "NVIDIA RTX 4090 24GB", spec: "24GB VRAM • Tight Consumer Fit", runpod: "$0.34 / hr", lambda: "$0.59 / hr", status: "Tight Consumer Fit (RTX 4090)", color: "emerald" },
    FP8:  { vram: 34.2, pct: 86, weights: "28.0 GB", lora: "3.2 GB", kv: "4.2 GB", gpu: "NVIDIA A100 40GB", spec: "40GB HBM2e • Datacenter Single", runpod: "$0.89 / hr", lambda: "$1.45 / hr", status: "Datacenter Node Required", color: "amber" },
    FP16: { vram: 64.8, pct: 90, weights: "54.0 GB", lora: "4.8 GB", kv: "7.2 GB", gpu: "NVIDIA A100 (80GB) SXM4", spec: "80GB HBM2e • High-VRAM Node", runpod: "$1.85 / hr", lambda: "$2.49 / hr", status: "Datacenter A100 (80GB)", color: "amber" }
  },
  "70B": {
    INT4: { vram: 38.5, pct: 82, weights: "35.0 GB", lora: "3.4 GB", kv: "4.8 GB", gpu: "NVIDIA A100 (40GB) / 2x 3090", spec: "48GB Pooled VRAM • Dual Node", runpod: "$1.10 / hr", lambda: "$1.65 / hr", status: "Multi-GPU Cluster Required", color: "amber" },
    FP8:  { vram: 74.0, pct: 92, weights: "64.0 GB", lora: "5.2 GB", kv: "8.4 GB", gpu: "NVIDIA A100 (80GB) SXM", spec: "80GB HBM2e • Single Datacenter", runpod: "$1.85 / hr", lambda: "$2.65 / hr", status: "Datacenter A100 (80GB)", color: "amber" },
    FP16: { vram: 142.0, pct: 98, weights: "128.0 GB", lora: "9.6 GB", kv: "14.0 GB", gpu: "2x NVIDIA H100 (80GB) NVLink", spec: "160GB Pooled HBM3 Cluster", runpod: "$4.90 / hr", lambda: "$6.50 / hr", status: "Multi-H100 Cluster Required", color: "rose" }
  },
  "405B": {
    INT4: { vram: 220.0, pct: 95, weights: "190.0 GB", lora: "12.0 GB", kv: "18.0 GB", gpu: "4x NVIDIA A100 (80GB)", spec: "320GB Pooled VRAM Cluster", runpod: "$7.40 / hr", lambda: "$9.80 / hr", status: "4x GPU Cluster Required", color: "rose" },
    FP8:  { vram: 420.0, pct: 98, weights: "380.0 GB", lora: "18.0 GB", kv: "22.0 GB", gpu: "8x NVIDIA H100 (80GB) SXM5", spec: "640GB SuperPOD Cluster", runpod: "$19.60 / hr", lambda: "$24.50 / hr", status: "8x H100 SuperPOD Cluster", color: "rose" },
    FP16: { vram: 820.0, pct: 100, weights: "760.0 GB", lora: "28.0 GB", kv: "32.0 GB", gpu: "16x NVIDIA H100 NVLink Fabric", spec: "1.28 TB Distributed HBM3", runpod: "$39.20 / hr", lambda: "$48.90 / hr", status: "Multi-Node Supercomputing Mesh", color: "rose" }
  }
};

const paramList: ParamSize[] = ["7B", "14B", "32B", "70B", "405B"];
const precisionList: { id: Precision; label: string }[] = [
  { id: "INT4", label: "INT4 (AWQ/GPTQ)" },
  { id: "FP8", label: "FP8 Transformer" },
  { id: "FP16", label: "FP16 / BF16 Native" }
];

export default function HardwareEstimator() {
  const [param, setParam] = useState<ParamSize>("7B");
  const [precision, setPrecision] = useState<Precision>("FP16");
  const [contextTokens, setContextTokens] = useState<number>(4096);

  const data = hwProfiles[param][precision];
  const ratio = contextTokens / 4096;
  const baseKvNum = parseFloat(data.kv);
  const scaledKv = (baseKvNum * ratio).toFixed(1);
  const totalVram = (data.vram - baseKvNum + parseFloat(scaledKv)).toFixed(1);
  const vramPercent = Math.min(data.pct * (ratio > 1 ? 1.08 : 1), 100);

  return (
    <section className="glass-card specular-border rounded-3xl p-6 md:p-10 border border-cyan-500/35 relative overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
      {/* Top Title Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-cyan-500/20">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/50 text-cyan-300 font-label-code text-[11px] uppercase tracking-wider mb-2 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <span className="material-symbols-outlined text-[15px]">speed</span>
            Interactive GPU Profiler Workstation
          </div>
          <h2 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-white">
            VRAM Footprint &amp; Cloud Hardware Estimator
          </h2>
          <p className="font-body-sm text-slate-300 text-sm mt-1 max-w-xl font-medium">
            Model weights alone don&apos;t cause OOM crashes. Profile full memory ceilings including optimizer states, KV-cache, and CUDA context headroom.
          </p>
        </div>

        {/* Overall Status Badge */}
        <div
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border shrink-0 transition-all ${
            data.color === "emerald"
              ? "bg-emerald-950/70 border-emerald-400/60 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              : data.color === "amber"
              ? "bg-amber-950/70 border-amber-400/60 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
              : "bg-rose-950/70 border-rose-400/60 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
          }`}
          id="hwFeasibilityBadge"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-80" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-current" />
          </span>
          <div>
            <div className="font-label-code text-[10px] uppercase text-emerald-300 font-bold tracking-wider">
              Feasibility Verdict
            </div>
            <div className="font-headline-sm text-[14px] font-bold text-white" id="hwStatusText">
              {data.status}
            </div>
          </div>
        </div>
      </div>

      {/* Workstation Controls & Telemetry Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8 items-start">
        {/* Left Controls Column (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Parameter Selection Pills */}
          <div>
            <label className="block font-label-code text-[11px] text-cyan-300 uppercase tracking-wider mb-2.5 font-bold">
              Target Model Parameter Scale:
            </label>
            <div className="grid grid-cols-5 gap-2" id="paramSelectorGroup">
              {paramList.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setParam(p)}
                  className={`hw-param-btn py-2 px-1 rounded-xl font-label-code text-[12px] text-center transition-all ${
                    param === p
                      ? "bg-cyan-500/25 border border-cyan-400 text-cyan-200 font-bold shadow-[0_0_14px_rgba(6,182,212,0.4)]"
                      : "bg-slate-900 border border-slate-700 text-slate-200 hover:border-cyan-400/60 font-semibold"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Precision Format Pills */}
          <div>
            <label className="block font-label-code text-[11px] text-cyan-300 uppercase tracking-wider mb-2.5 font-bold">
              Quantization &amp; Execution Precision:
            </label>
            <div className="grid grid-cols-3 gap-2" id="precSelectorGroup">
              {precisionList.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPrecision(item.id)}
                  className={`hw-prec-btn py-2 px-2 rounded-xl font-label-code text-[11px] text-center transition-all ${
                    precision === item.id
                      ? "bg-cyan-500/25 border border-cyan-400 text-cyan-200 font-bold shadow-[0_0_14px_rgba(6,182,212,0.4)]"
                      : "bg-slate-900 border border-slate-700 text-slate-200 hover:border-cyan-400/60 font-semibold"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Context Window Slider */}
          <div className="rounded-xl bg-[#0a0f1d] border border-cyan-500/25 p-4 shadow-inner">
            <div className="flex justify-between items-center mb-2 font-label-code text-[12px]">
              <span className="text-slate-300 font-medium">Context Window Tokens:</span>
              <span className="text-cyan-300 font-bold text-[13px]" id="contextLabel">
                {contextTokens.toLocaleString()} tokens
              </span>
            </div>
            <input
              className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
              id="contextSlider"
              max={32768}
              min={2048}
              step={2048}
              type="range"
              value={contextTokens}
              onChange={(e) => setContextTokens(Number(e.target.value))}
            />
            <div className="flex justify-between font-label-code text-[10px] text-slate-400 mt-1 font-semibold">
              <span>2k</span>
              <span>8k</span>
              <span>16k</span>
              <span>32k</span>
            </div>
          </div>

          {/* Cloud Cost Compare Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
              <div className="font-label-code text-[11px] text-slate-300 flex items-center justify-between font-semibold">
                <span>RunPod Spot</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
              </div>
              <div className="font-metric-display text-[22px] font-bold text-cyan-300 mt-1" id="costRunpod">
                {data.runpod}
              </div>
              <div className="text-[10px] text-slate-400 font-label-code mt-0.5">Community Cloud</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
              <div className="font-label-code text-[11px] text-slate-300 flex items-center justify-between font-semibold">
                <span>Lambda Labs</span>
                <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
              </div>
              <div className="font-metric-display text-[22px] font-bold text-indigo-300 mt-1" id="costLambda">
                {data.lambda}
              </div>
              <div className="text-[10px] text-slate-400 font-label-code mt-0.5">Reserved On-Demand</div>
            </div>
          </div>
        </div>

        {/* Right Telemetry Readout & Breakdown Column (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="rounded-2xl bg-[#0c1426] border border-cyan-500/30 p-5 md:p-6 shadow-inner">
            {/* Total VRAM Meter Header */}
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-3">
              <div>
                <span className="font-label-code text-[11px] text-cyan-300 uppercase tracking-widest block font-bold">
                  Total Estimated VRAM Footprint
                </span>
                <span className="font-headline-sm text-lg font-bold text-white">
                  Inference + LoRA Fine-Tuning
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-metric-display text-4xl font-extrabold text-cyan-300 drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]" id="totalVramDisplay">
                  {totalVram}
                </span>
                <span className="font-label-code text-cyan-200 text-lg font-bold">GB</span>
              </div>
            </div>

            {/* Visual VRAM Bar */}
            <div className="w-full bg-slate-900 h-4 rounded-full overflow-hidden p-0.5 border border-cyan-500/30 relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-500 to-emerald-400 transition-all duration-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                id="vramMeterBar"
                style={{ width: `${vramPercent}%` }}
              />
            </div>

            {/* Hardware Marks */}
            <div className="flex justify-between font-label-code text-[10px] text-slate-400 mt-1.5 px-0.5 font-medium">
              <span>0 GB</span>
              <span className="text-slate-300 font-semibold">16GB (4080)</span>
              <span className="text-cyan-300 font-bold">24GB (4090)</span>
              <span className="text-indigo-300 font-bold">80GB (A100)</span>
              <span>160GB+</span>
            </div>

            {/* Deep Breakdown Table */}
            <div className="mt-6 rounded-xl bg-[#080e1b] border border-cyan-500/20 overflow-hidden font-label-code text-[12px]">
              <div className="px-4 py-2.5 bg-slate-900/80 border-b border-cyan-500/20 text-cyan-200 flex justify-between font-bold">
                <span>Allocation Component</span>
                <span>Estimated Size</span>
              </div>
              <div className="divide-y divide-slate-800/80">
                <div className="px-4 py-2 flex justify-between text-slate-200 font-medium">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                    <span>Model Weights Memory:</span>
                  </span>
                  <span className="font-bold text-white" id="memWeights">{data.weights}</span>
                </div>
                <div className="px-4 py-2 flex justify-between text-slate-200 font-medium">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
                    <span>LoRA Rank=16 Adapters:</span>
                  </span>
                  <span className="font-bold text-white" id="memLora">{data.lora}</span>
                </div>
                <div className="px-4 py-2 flex justify-between text-slate-200 font-medium">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
                    <span>KV-Cache Allocation:</span>
                  </span>
                  <span className="font-bold text-white" id="memKv">{scaledKv} GB</span>
                </div>
                <div className="px-4 py-2 flex justify-between text-slate-200 font-medium">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
                    <span>PyTorch CUDA Overhead:</span>
                  </span>
                  <span className="font-bold text-white">1.2 GB</span>
                </div>
              </div>
            </div>

            {/* Hardware Node Recommendation Card */}
            <div className="mt-5 p-4 rounded-xl bg-cyan-950/30 border border-cyan-400/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shrink-0 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  <span className="material-symbols-outlined text-[24px]">developer_board</span>
                </div>
                <div>
                  <div className="font-label-code text-[11px] text-cyan-300 font-bold uppercase tracking-wider">
                    Optimal Node Pick
                  </div>
                  <div className="font-headline-sm text-[16px] font-bold text-white" id="recGpuNode">
                    {data.gpu}
                  </div>
                  <div className="font-label-code text-[11px] text-slate-300 font-medium" id="recGpuSpec">
                    {data.spec}
                  </div>
                </div>
              </div>
              <Link
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/30 to-indigo-500/30 hover:from-cyan-500/40 hover:to-indigo-500/40 border border-cyan-400/60 text-cyan-200 font-label-code text-[12px] font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                href="/benchmark"
              >
                <span>Open Full Lab</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
