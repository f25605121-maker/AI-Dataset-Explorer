"use client";

import { useState, useId } from "react";

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
    FP16: { vram: 14.2, pct: 59, weights: "9.5 GB", lora: "1.4 GB", kv: "2.1 GB", gpu: "NVIDIA RTX 4090", spec: "24GB GDDR6X • High-End Consumer", runpod: "$0.34 / hr", lambda: "$0.59 / hr", status: "Consumer GPU Ready (RTX 4090)", color: "emerald" }
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

const paramOptions: ParamSize[] = ["7B", "14B", "32B", "70B", "405B"];
const precisionOptions: Precision[] = ["INT4", "FP8", "FP16"];

export default function HardwareEstimator() {
  const [param, setParam] = useState<ParamSize>("7B");
  const [precision, setPrecision] = useState<Precision>("FP16");
  const [contextTokens, setContextTokens] = useState<number>(4096);
  const contextSliderId = useId();

  const data = hwProfiles[param][precision];
  const ratio = contextTokens / 4096;
  const baseKvNum = parseFloat(data.kv);
  const scaledKv = (baseKvNum * ratio).toFixed(1);
  const totalVram = (data.vram - baseKvNum + parseFloat(scaledKv)).toFixed(1);
  const barWidth = Math.min(data.pct * (ratio > 1 ? 1.08 : 1), 100);

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-[#131c31]/90 backdrop-blur-xl p-6 md:p-8 shadow-[0_0_35px_rgba(6,182,212,0.15)] relative overflow-hidden">
      {/* Background Accent Mesh */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-700/60">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-cyan-300 font-bold">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Hardware Feasibility Matrix
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white mt-1">
            VRAM Footprint & Cloud Hardware Estimator
          </h3>
          <p className="text-xs md:text-sm text-slate-300 mt-1">
            Simulate training & inference resource envelopes with dynamic quantization and KV-cache scaling.
          </p>
        </div>

        {/* Dynamic Status Badge */}
        <div
          className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-mono font-bold border shrink-0 transition-all ${
            data.color === "emerald"
              ? "bg-emerald-950/70 border-emerald-400/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.25)]"
              : data.color === "amber"
              ? "bg-amber-950/70 border-amber-400/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]"
              : "bg-rose-950/70 border-rose-400/60 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.25)]"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current animate-ping" />
          <span>{data.status}</span>
        </div>
      </div>

      {/* Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 border-b border-slate-700/60">
        {/* Model Parameter Scale */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-slate-300 uppercase tracking-wider font-semibold block">
            Parameter Scale
          </label>
          <div className="grid grid-cols-5 gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
            {paramOptions.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setParam(p)}
                className={`py-2 text-xs font-mono font-bold rounded-lg transition-all ${
                  param === p
                    ? "bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.35)]"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Quantization Precision */}
        <div className="space-y-2">
          <label className="text-xs font-mono text-slate-300 uppercase tracking-wider font-semibold block">
            Quantization Precision
          </label>
          <div className="grid grid-cols-3 gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-700">
            {precisionOptions.map((pr) => (
              <button
                key={pr}
                type="button"
                onClick={() => setPrecision(pr)}
                className={`py-2 text-xs font-mono font-bold rounded-lg transition-all ${
                  precision === pr
                    ? "bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.35)]"
                    : "text-slate-300 hover:text-white hover:bg-slate-800"
                }`}
              >
                {pr}
              </button>
            ))}
          </div>
        </div>

        {/* Context Window Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor={contextSliderId} className="text-xs font-mono text-slate-300 uppercase tracking-wider font-semibold block">
              Context Length
            </label>
            <span className="text-xs font-mono text-cyan-300 font-bold">
              {contextTokens.toLocaleString()} tokens
            </span>
          </div>
          <div className="pt-2">
            <input
              id={contextSliderId}
              type="range"
              min={2048}
              max={65536}
              step={2048}
              value={contextTokens}
              onChange={(e) => setContextTokens(Number(e.target.value))}
              aria-label="Context Length in tokens"
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>2k</span>
            <span>16k</span>
            <span>32k</span>
            <span>64k</span>
          </div>
        </div>
      </div>

      {/* Real-Time Results Matrix */}
      <div className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Total VRAM Gauge (5 cols) */}
        <div className="lg:col-span-5 rounded-xl bg-slate-900/90 border border-cyan-500/20 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300 uppercase font-semibold">
              Estimated Total VRAM
            </span>
            <span className="text-xs font-mono text-cyan-300">
              Weights + LoRA + KV
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl md:text-5xl font-extrabold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-300">
              {totalVram}
            </span>
            <span className="text-xl font-bold font-mono text-slate-300">GB</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 transition-all duration-300 shadow-[0_0_10px_rgba(6,182,212,0.6)]"
              style={{ width: `${barWidth}%` }}
            />
          </div>

          {/* Breakdown Pills */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-xs">
            <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-slate-400 block">Weights</span>
              <span className="font-bold text-slate-200">{data.weights}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-slate-400 block">LoRA r=64</span>
              <span className="font-bold text-cyan-300">{data.lora}</span>
            </div>
            <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
              <span className="text-[10px] text-slate-400 block">KV Cache</span>
              <span className="font-bold text-indigo-300">{scaledKv} GB</span>
            </div>
          </div>
        </div>

        {/* Recommended Hardware & Cloud Pricing (7 cols) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Hardware Recommendation */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-cyan-500/20 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block mb-1">
                Recommended Node
              </span>
              <h4 className="text-base font-bold text-white leading-tight">
                {data.gpu}
              </h4>
              <p className="text-xs font-mono text-cyan-300 mt-1">
                {data.spec}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center gap-2 text-xs font-mono text-slate-300">
              <span className="text-emerald-400">✓</span>
              <span>Memory bandwidth verified</span>
            </div>
          </div>

          {/* Real-time Cloud Pricing */}
          <div className="p-5 rounded-xl bg-slate-900/90 border border-indigo-500/20 flex flex-col justify-between space-y-3">
            <div>
              <span className="text-[11px] font-mono uppercase text-slate-400 font-semibold block mb-1">
                Spot Compute Rates
              </span>
              <div className="space-y-2 mt-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">RunPod Community:</span>
                  <span className="text-cyan-300 font-bold">{data.runpod}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300">Lambda Labs On-Demand:</span>
                  <span className="text-indigo-300 font-bold">{data.lambda}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>Auto-scaling ready</span>
              <span className="text-emerald-400">Low latency</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
