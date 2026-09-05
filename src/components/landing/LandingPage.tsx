"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import QueryTerminal from "./QueryTerminal";
import HardwareEstimator from "./HardwareEstimator";

// Dynamic import for Three.js WebGL canvas (client-only)
const ThreeNeuralMesh = dynamic(() => import("./ThreeNeuralMesh"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[380px] flex items-center justify-center bg-[#0e1629]/90 rounded-2xl">
      <div className="flex flex-col items-center gap-3 text-cyan-300 font-mono text-xs">
        <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
        <span>Initializing 3D Neural Lattice...</span>
      </div>
    </div>
  ),
});

export default function LandingPage() {
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopySnippet = () => {
    const code = `from peft import LoraConfig, get_peft_model
# Auto-configured for 24GB VRAM target
peft_config = LoraConfig(
  r=16, lora_alpha=32,
  target_modules=["q_proj", "v_proj"],
  lora_dropout=0.05,
  bias="none",
  task_type="CAUSAL_LM"
)`;
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0d1322] text-[#F8FAFC] antialiased selection:bg-cyan-400/30 selection:text-cyan-300 relative overflow-x-hidden">
      {/* Matrix Grid Pattern Background */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(rgba(34, 211, 238, 0.18) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Ambient Glow Canvas Spotlights */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[650px] bg-gradient-to-b from-cyan-500/25 via-blue-600/20 to-transparent rounded-full blur-[130px]" />
        <div className="absolute top-[28%] -left-32 w-[650px] h-[650px] bg-violet-600/20 rounded-full blur-[140px]" />
        <div className="absolute top-[50%] -right-32 w-[700px] h-[700px] bg-cyan-400/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-10 left-1/4 w-[850px] h-[450px] bg-indigo-500/20 rounded-full blur-[160px]" />
      </div>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* HIGH-TECH GLASSMORPHIC NAVIGATION                            */}
      {/* ──────────────────────────────────────────────────────────── */}
      <header className="fixed top-3 inset-x-0 z-50 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-cyan-500/30 bg-[#131c31]/85 backdrop-blur-xl">
          {/* Brand Logo + Name */}
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform bg-[#0d1322] border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                <span className="text-cyan-300 font-black text-sm">✦</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[16px] font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                  AI Dataset <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-300 to-indigo-300">Explorer</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/60 text-cyan-300 font-mono text-[11px] font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  RAG 2.5
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-[14px]">
            <Link
              href="/"
              className="px-3.5 py-1.5 rounded-lg text-white bg-cyan-500/20 border border-cyan-400/40 font-semibold transition-all shadow-[0_0_14px_rgba(6,182,212,0.25)]"
            >
              Home
            </Link>
            <Link
              href="/explore"
              className="px-3.5 py-1.5 rounded-lg text-slate-200 hover:text-cyan-300 hover:bg-white/10 transition-colors font-medium"
            >
              Explore Studio
            </Link>
            <Link
              href="/benchmark"
              className="px-3.5 py-1.5 rounded-lg text-slate-200 hover:text-cyan-300 hover:bg-white/10 transition-colors font-medium"
            >
              Benchmark & Compare Lab
            </Link>
            <Link
              href="/roadmap"
              className="px-3.5 py-1.5 rounded-lg text-slate-200 hover:text-cyan-300 hover:bg-white/10 transition-colors font-medium"
            >
              Pipeline Roadmap
            </Link>
          </nav>

          {/* Right Telemetry & Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live Status Pill */}
            <div className="hidden xl:flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-cyan-500/30 text-[12px] font-mono shadow-[0_0_12px_rgba(16,185,129,0.15)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-slate-300">Ecosystem:</span>
              <span className="text-emerald-300 font-bold">142k+ Online</span>
              <span className="text-slate-500">|</span>
              <span className="text-cyan-300 font-semibold">18ms p99</span>
            </div>

            {/* Quick Switcher Button */}
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById("aiTerminalInput");
                el?.focus();
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-cyan-500/30 text-slate-200 hover:text-white hover:border-cyan-400 text-[12px] font-mono transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
            >
              <span className="text-cyan-300">❯_</span>
              <span className="font-medium">Find weights</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 border border-slate-700 text-[10px] font-semibold">⌘K</kbd>
            </button>

            {/* Launch Studio CTA */}
            <Link
              href="/explore"
              className="relative group overflow-hidden rounded-xl p-[1px] text-[13px] font-semibold"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 rounded-xl" />
              <span className="relative block px-4 py-1.5 rounded-xl bg-[#0e1628] text-white group-hover:bg-opacity-80 transition-all flex items-center gap-1.5 shadow-[0_0_24px_rgba(6,182,212,0.5)]">
                <span className="text-cyan-300">🚀</span>
                <span className="font-bold">Launch Studio</span>
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* MAIN HERO & WORKSPACE CONTENT                                */}
      {/* ──────────────────────────────────────────────────────────── */}
      <main className="relative z-10 flex-1 pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col gap-24">
          {/* HERO SECTION WITH INTEGRATED 3D NEURAL CORE */}
          <section className="relative pt-6 md:pt-10 flex flex-col items-center">
            {/* Glowing Nexus Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-400/50 shadow-[0_0_28px_rgba(6,182,212,0.35)] mb-6 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-mono text-xs uppercase tracking-wider text-cyan-300 font-bold">
                ✦ RAG-Powered AI Intelligence 2.5 • Nexus Pipeline
              </span>
              <span className="text-cyan-500">•</span>
              <span className="font-mono text-xs text-indigo-200 font-semibold">
                142k+ Models & Sets
              </span>
            </div>

            {/* Master Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-5xl leading-[1.12] text-center">
              Find the Perfect Dataset & Weights for your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-indigo-300 drop-shadow-[0_0_35px_rgba(34,211,238,0.55)]">
                Next AI Project
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-200 text-lg md:text-xl max-w-3xl mt-5 font-normal leading-relaxed text-center">
              High-dimensional vector search across Hugging Face, Kaggle & arXiv. Synthesize instant VRAM feasibility profiles, quant compatibility matrices, and 5-phase execution roadmaps.
            </p>

            {/* Feature Checklist Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-6 text-xs font-mono text-slate-100">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-emerald-500/40 shadow-[0_0_14px_rgba(16,185,129,0.2)]">
                <span className="text-emerald-400 font-bold">✓</span>
                <span className="font-medium">Hugging Face & Kaggle Hybrid Pairing</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/40 shadow-[0_0_14px_rgba(6,182,212,0.2)]">
                <span className="text-cyan-300 font-bold">⚡</span>
                <span className="font-medium">Accurate LoRA & KV-Cache VRAM Math</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-indigo-500/40 shadow-[0_0_14px_rgba(99,102,241,0.2)]">
                <span className="text-indigo-300 font-bold">🛠️</span>
                <span className="font-medium">Production PyTorch & vLLM Starters</span>
              </div>
            </div>

            {/* 3D NEURAL SCENE & QUERY PLAYGROUND SPLIT */}
            <div className="w-full max-w-6xl mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Interactive 3D Scene Viewport Element */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <div className="w-full rounded-2xl border border-cyan-500/35 bg-[#131c31]/90 backdrop-blur-xl overflow-hidden relative shadow-[0_0_40px_rgba(6,182,212,0.25)] flex flex-col">
                  {/* 3D Viewport Header */}
                  <div className="bg-[#0f172a]/95 px-4 py-2.5 border-b border-cyan-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                      <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                        Live 3D Neural Mesh
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-indigo-300 px-2 py-0.5 rounded bg-indigo-950/70 border border-indigo-500/40">
                      Interactive Orbit
                    </span>
                  </div>

                  {/* 3D Canvas Embed */}
                  <div className="relative w-full h-[380px] bg-gradient-to-b from-[#0e1629]/90 to-[#0c1222]/95 flex items-center justify-center overflow-hidden">
                    <ThreeNeuralMesh />

                    {/* Floating Interactive Hint */}
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none text-[11px] font-mono text-slate-300 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30">
                      <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                        <span>✦</span> 42 Clustered Datasets
                      </span>
                      <span className="text-slate-300 text-[10px]">Move mouse to rotate</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive AI Query Terminal */}
              <div className="lg:col-span-7">
                <QueryTerminal />
              </div>
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────── */}
          {/* FEDERATED REGISTRY ECOSYSTEM TICKER                          */}
          {/* ──────────────────────────────────────────────────────────── */}
          <section className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs text-cyan-300 uppercase tracking-widest font-bold">
                  <span className="w-2 h-0.5 bg-cyan-400 inline-block" />
                  Federated Ecosystem Telemetry
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">
                  Synchronized with Top Open-Weight Registries
                </h2>
              </div>
              <p className="text-slate-300 text-sm max-w-md font-medium">
                Continuously mapped into Pinecone vector index with real-time paper citations and automated license audits.
              </p>
            </div>

            {/* Ecosystem Grid Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {/* Kaggle */}
              <a
                className="group rounded-xl border border-cyan-500/30 hover:border-cyan-400 bg-[#131c31]/80 backdrop-blur-md p-4 hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all flex flex-col"
                href="https://www.kaggle.com/datasets"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-950/70 border border-cyan-400/50 flex items-center justify-center font-bold text-cyan-300 text-sm shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                    K
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                </div>
                <span className="text-[15px] font-bold text-white group-hover:text-cyan-300 transition-colors">Kaggle</span>
                <span className="font-mono text-xs text-cyan-300 mt-1 font-bold">64,200+ Sets</span>
                <span className="text-[11px] text-slate-300 mt-2 font-medium">Tabular & Multimodal</span>
              </a>

              {/* Hugging Face */}
              <a
                className="group rounded-xl border border-amber-500/30 hover:border-amber-400 bg-[#131c31]/80 backdrop-blur-md p-4 hover:shadow-[0_0_25px_rgba(245,158,11,0.35)] transition-all flex flex-col"
                href="https://huggingface.co/datasets"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-950/50 border border-amber-400/50 flex items-center justify-center text-lg shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                    🤗
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                </div>
                <span className="text-[15px] font-bold text-white group-hover:text-amber-300 transition-colors">Hugging Face</span>
                <span className="font-mono text-xs text-amber-300 mt-1 font-bold">120,000+ Weights</span>
                <span className="text-[11px] text-slate-300 mt-2 font-medium">Transformers & Diffusers</span>
              </a>

              {/* arXiv */}
              <a
                className="group rounded-xl border border-rose-500/30 hover:border-rose-400 bg-[#131c31]/80 backdrop-blur-md p-4 hover:shadow-[0_0_25px_rgba(244,63,94,0.35)] transition-all flex flex-col"
                href="https://arxiv.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-rose-950/50 border border-rose-400/50 flex items-center justify-center font-bold text-rose-300 text-sm shadow-[0_0_10px_rgba(244,63,94,0.3)]">
                    α
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                </div>
                <span className="text-[15px] font-bold text-white group-hover:text-rose-300 transition-colors">arXiv ML</span>
                <span className="font-mono text-xs text-rose-300 mt-1 font-bold">2.4M+ Papers</span>
                <span className="text-[11px] text-slate-300 mt-2 font-medium">Deep ML & Vision</span>
              </a>

              {/* Papers With Code */}
              <a
                className="group rounded-xl border border-indigo-500/30 hover:border-indigo-400 bg-[#131c31]/80 backdrop-blur-md p-4 hover:shadow-[0_0_25px_rgba(99,102,241,0.35)] transition-all flex flex-col"
                href="https://paperswithcode.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-950/50 border border-indigo-400/50 flex items-center justify-center font-bold text-indigo-300 text-sm shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                    ⚡
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                </div>
                <span className="text-[15px] font-bold text-white group-hover:text-indigo-300 transition-colors">Papers & Code</span>
                <span className="font-mono text-xs text-indigo-300 mt-1 font-bold">8,400+ SOTA</span>
                <span className="text-[11px] text-slate-300 mt-2 font-medium">Evaluation Benchmarks</span>
              </a>

              {/* GitHub AI */}
              <a
                className="group rounded-xl border border-slate-500/30 hover:border-slate-300 bg-[#131c31]/80 backdrop-blur-md p-4 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] transition-all flex flex-col"
                href="https://github.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-600 flex items-center justify-center font-bold text-white text-sm">
                    🐙
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                </div>
                <span className="text-[15px] font-bold text-white group-hover:text-slate-200 transition-colors">GitHub Repos</span>
                <span className="font-mono text-xs text-slate-300 mt-1 font-bold">Open Source</span>
                <span className="text-[11px] text-slate-300 mt-2 font-medium">Fine-Tuning Code</span>
              </a>

              {/* PyTorch Hub */}
              <a
                className="group rounded-xl border border-orange-500/30 hover:border-orange-400 bg-[#131c31]/80 backdrop-blur-md p-4 hover:shadow-[0_0_25px_rgba(249,115,22,0.35)] transition-all flex flex-col"
                href="https://pytorch.org/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-950/50 border border-orange-400/50 flex items-center justify-center font-bold text-orange-300 text-sm shadow-[0_0_10px_rgba(249,115,22,0.3)]">
                    🔥
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                </div>
                <span className="text-[15px] font-bold text-white group-hover:text-orange-300 transition-colors">PyTorch Hub</span>
                <span className="font-mono text-xs text-orange-300 mt-1 font-bold">TorchScript</span>
                <span className="text-[11px] text-slate-300 mt-2 font-medium">vLLM & Triton Engine</span>
              </a>
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────── */}
          {/* 4-PHASE ARCHITECTURE ("FROM INTENT TO SERVING")              */}
          {/* ──────────────────────────────────────────────────────────── */}
          <section className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs text-cyan-300 uppercase tracking-widest font-bold">
                  <span className="w-2 h-0.5 bg-cyan-400 inline-block" />
                  Execution Flow
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">
                  From Project Intent to Model Serving in Seconds
                </h2>
              </div>
              <p className="text-slate-300 text-sm max-w-md font-medium">
                End-to-end telemetry pipeline resolving dense query vectors into actionable compute footprints.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Node 01 */}
              <div className="rounded-2xl p-6 border border-cyan-500/30 bg-[#131c31]/80 backdrop-blur-md hover:border-cyan-400 transition-all flex flex-col shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-400/40 px-2.5 py-1 rounded-md">
                    NODE 01
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                    ⚡
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Query Intent Parser</h3>
                <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                  Extracts target task domain, context length requirements, license constraints, and precision objectives.
                </p>
                <div className="mt-auto rounded-xl bg-[#090f1d] border border-cyan-500/20 p-3 font-mono text-[11px] text-slate-200 flex flex-col gap-1">
                  <div><span className="text-cyan-300 font-semibold">task_type:</span> &quot;VLM Medical&quot;</div>
                  <div><span className="text-indigo-300 font-semibold">ctx_tokens:</span> 4,096 tokens</div>
                  <div><span className="text-emerald-300 font-semibold">license:</span> &quot;MIT / Apache-2&quot;</div>
                </div>
              </div>

              {/* Node 02 */}
              <div className="rounded-2xl p-6 border border-indigo-500/30 bg-[#131c31]/80 backdrop-blur-md hover:border-indigo-400 transition-all flex flex-col shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-400/40 px-2.5 py-1 rounded-md">
                    NODE 02
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                    🔍
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Hybrid Vector Search</h3>
                <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                  Dual-retrieval combining 1536-dim Pinecone dense embeddings with BM25 lexical token matching across verified datasets.
                </p>
                <div className="mt-auto rounded-xl bg-[#090f1d] border border-indigo-500/20 p-3 font-mono text-[11px] text-slate-200 flex flex-col gap-1">
                  <div><span className="text-indigo-300 font-semibold">dense_cosine:</span> 0.962</div>
                  <div><span className="text-cyan-300 font-semibold">bm25_score:</span> 24.18</div>
                  <div><span className="text-emerald-300 font-semibold">candidate_pool:</span> 380 assets</div>
                </div>
              </div>

              {/* Node 03 */}
              <div className="rounded-2xl p-6 border border-emerald-500/30 bg-[#131c31]/80 backdrop-blur-md hover:border-emerald-400 transition-all flex flex-col shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-400/40 px-2.5 py-1 rounded-md">
                    NODE 03
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                    💾
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">AI Sizing & VRAM Engine</h3>
                <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                  Calculates parameter footprint, optimizer state memory, KV-cache growth, and quantization loss metrics.
                </p>
                <div className="mt-auto rounded-xl bg-[#090f1d] border border-emerald-500/20 p-3 font-mono text-[11px] text-slate-200 flex flex-col gap-1">
                  <div><span className="text-emerald-300 font-semibold">fit_status:</span> &quot;RTX 4090 Ready&quot;</div>
                  <div><span className="text-cyan-300 font-semibold">overhead_margin:</span> 38% free</div>
                  <div><span className="text-indigo-300 font-semibold">quant_scheme:</span> AWQ 4-bit / FP16</div>
                </div>
              </div>

              {/* Node 04 */}
              <div className="rounded-2xl p-6 border border-violet-500/30 bg-[#131c31]/80 backdrop-blur-md hover:border-violet-400 transition-all flex flex-col shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-[11px] font-bold text-violet-300 bg-violet-950/80 border border-violet-400/40 px-2.5 py-1 rounded-md">
                    NODE 04
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-400/40 flex items-center justify-center text-violet-300">
                    📜
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Production Roadmap & Code</h3>
                <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                  Generates a structured 5-phase engineering checklist alongside production LoRA scripts and FastAPI vLLM endpoints.
                </p>
                <div className="mt-auto rounded-xl bg-[#090f1d] border border-violet-500/20 p-3 font-mono text-[11px] text-slate-200 flex flex-col gap-1">
                  <div><span className="text-violet-300 font-semibold">engine:</span> vLLM + Triton</div>
                  <div><span className="text-cyan-300 font-semibold">starter_script:</span> train_qlora.py</div>
                  <div><span className="text-emerald-300 font-semibold">phases:</span> 5 steps generated</div>
                </div>
              </div>
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────── */}
          {/* HARDWARE FEASIBILITY MATRIX SECTION                          */}
          {/* ──────────────────────────────────────────────────────────── */}
          <section>
            <HardwareEstimator />
          </section>

          {/* ──────────────────────────────────────────────────────────── */}
          {/* BENCHMARK LAB & SERVING SCRIPTS PREVIEW                     */}
          {/* ──────────────────────────────────────────────────────────── */}
          <section className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-mono text-xs text-cyan-300 uppercase tracking-widest font-bold">
                  <span className="w-2 h-0.5 bg-cyan-400 inline-block" />
                  High-Precision ML Tooling
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mt-1">
                  Engineered for Production Intelligence
                </h2>
              </div>
              <p className="text-slate-300 text-sm max-w-md font-medium">
                Evaluate throughput, inspect memory profiles, and export automated fine-tuning recipes without configuration fatigue.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Card 1: Multi-Model Benchmark Lab with Mini Sparkline */}
              <div className="rounded-2xl p-6 border border-cyan-500/30 bg-[#131c31]/80 backdrop-blur-md hover:border-cyan-400 transition-all flex flex-col justify-between shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mb-4 text-xl">
                    ⚖️
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Multi-Model Benchmark Lab
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Head-to-head evaluation across latency distributions, FP16 vs INT4 perplexity preservation, and commercial license safety.
                  </p>
                </div>

                <div className="mt-6 rounded-xl bg-[#090f1d] border border-cyan-500/20 p-4 shadow-inner">
                  <div className="flex justify-between items-center font-mono text-xs mb-3 text-slate-300 font-medium">
                    <span>Inference Latency (ms/token)</span>
                    <span className="text-cyan-300 font-bold">vLLM Engine</span>
                  </div>
                  <div className="flex items-end gap-2.5 h-20 pt-2 border-b border-slate-700/80 pb-2">
                    <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full bg-cyan-500/40 rounded-t h-[45%] border-t border-cyan-300" />
                      <span className="font-mono text-[10px] text-slate-300">Mistral</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full bg-cyan-400 rounded-t h-[30%] shadow-[0_0_14px_rgba(34,211,238,0.7)]" />
                      <span className="font-mono text-[10px] text-cyan-200 font-bold">Llama-3</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full bg-indigo-500/50 rounded-t h-[75%] border-t border-indigo-300" />
                      <span className="font-mono text-[10px] text-slate-300">Qwen-2</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full bg-emerald-500/50 rounded-t h-[38%] border-t border-emerald-300" />
                      <span className="font-mono text-[10px] text-slate-300">Gemma-2</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-2">
                    <span>Lower is faster</span>
                    <span className="text-emerald-300 font-bold">Llama-3: 14.8 ms/tok</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Production Code Generator with Interactive Tab */}
              <div className="rounded-2xl p-6 border border-indigo-500/30 bg-[#131c31]/80 backdrop-blur-md hover:border-indigo-400 transition-all flex flex-col justify-between shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 mb-4 text-xl">
                    💻
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Automated LoRA & Serve Scripts
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Generates modular scripts with PEFT configurations, FlashAttention-2 flags, and FastAPI endpoints ready for cloud deployment.
                  </p>
                </div>

                <div className="mt-6 rounded-xl bg-[#090f1d] border border-indigo-500/25 p-3.5 font-mono text-[11px] shadow-inner">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-700/80 text-slate-300 mb-2">
                    <span className="text-indigo-300 flex items-center gap-1 font-bold">
                      📄 train_qlora.py
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySnippet}
                      className="text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-semibold"
                    >
                      <span>📋</span>
                      <span className={copiedCode ? "text-emerald-300 font-bold" : ""}>
                        {copiedCode ? "Copied!" : "Copy"}
                      </span>
                    </button>
                  </div>
                  <pre className="text-slate-200 overflow-x-auto leading-relaxed font-medium">
                    <code>
                      <span className="text-indigo-300 font-semibold">from</span> peft{" "}
                      <span className="text-indigo-300 font-semibold">import</span> LoraConfig, get_peft_model
                      {"\n"}
                      <span className="text-slate-400"># Auto-configured for 24GB VRAM target</span>
                      {"\n"}
                      peft_config = LoraConfig(
                      {"\n"}  r=16, lora_alpha=32,
                      {"\n"}  target_modules=[
                      <span className="text-emerald-300">&quot;q_proj&quot;</span>,{" "}
                      <span className="text-emerald-300">&quot;v_proj&quot;</span>],
                      {"\n"}  lora_dropout=0.05,
                      {"\n"}  bias=<span className="text-emerald-300">&quot;none&quot;</span>,
                      {"\n"}  task_type=<span className="text-cyan-300">&quot;CAUSAL_LM&quot;</span>
                      {"\n"})
                    </code>
                  </pre>
                </div>
              </div>

              {/* Card 3: 5-Phase Interactive Roadmap Preview */}
              <div className="rounded-2xl p-6 border border-emerald-500/30 bg-[#131c31]/80 backdrop-blur-md hover:border-emerald-400 transition-all flex flex-col justify-between shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 mb-4 text-xl">
                    🗺️
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Interactive Pipeline Roadmap
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Step-by-step engineering sequence with milestone verifications, deduplication strategies, and deployment checklists.
                  </p>
                </div>

                <div className="mt-6 rounded-xl bg-[#090f1d] border border-emerald-500/25 p-4 flex flex-col gap-2.5 font-mono text-[11px] shadow-inner">
                  <div className="flex items-center gap-2.5 text-slate-100 font-medium">
                    <span className="text-emerald-400">✓</span>
                    <span>Phase 1: MinHash Token Deduplication</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-100 font-medium">
                    <span className="text-emerald-400">✓</span>
                    <span>Phase 2: FP16 Quantized Baseline Run</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-cyan-200 font-bold">
                    <span className="text-cyan-300 animate-spin">⟳</span>
                    <span>Phase 3: LoRA Rank Sweep & Evaluation</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-400 font-medium">
                    <span className="text-slate-500">○</span>
                    <span>Phase 4: GGUF Export & Ollama Packaging</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-400 font-medium">
                    <span className="text-slate-500">○</span>
                    <span>Phase 5: vLLM High-Concurrency Serving</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────── */}
          {/* CREATOR SPOTLIGHT & TOPOLOGY FLOW                            */}
          {/* ──────────────────────────────────────────────────────────── */}
          <section className="rounded-3xl p-6 md:p-10 border border-cyan-500/30 bg-[#131c31]/80 backdrop-blur-xl relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/90 border border-cyan-400/60 text-cyan-300 font-mono text-xs uppercase tracking-wider self-start font-bold shadow-[0_0_16px_rgba(6,182,212,0.35)]">
                  <span>❯_</span>
                  <span>Architected by Hammad Ali Tariq</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping ml-1" />
                </div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                  Built to Eliminate Friction in Deep Tech & ML Pipelines
                </h2>
                <p className="text-slate-200 text-sm md:text-base leading-relaxed">
                  AI Dataset Explorer integrates high-dimensional vector search, automated GPU hardware profiling, and production code generation into an elegant, unified developer platform.
                </p>

                {/* Tech Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-cyan-500/30 text-slate-200 font-mono text-[11px] font-semibold">Next.js 16</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-cyan-500/30 text-slate-200 font-mono text-[11px] font-semibold">Tailwind CSS v4</span>
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-400/50 text-cyan-200 font-mono text-[11px] font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]">Three.js WebGL</span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-400/50 text-indigo-200 font-mono text-[11px] font-bold shadow-[0_0_8px_rgba(99,102,241,0.3)]">Pinecone Vector DB</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-mono text-[11px] font-semibold">NextAuth.js</span>
                </div>
              </div>

              {/* Architecture Topology Flow */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl bg-[#0b1222] border border-cyan-500/30 p-5 font-mono text-xs flex flex-col gap-3 shadow-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                    <span className="text-cyan-300 font-bold uppercase text-[11px]">Topology Execution Flow</span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 text-[10px] font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]">200 OK</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#070b15] border border-cyan-500/20 flex items-center justify-between">
                    <span className="text-slate-300 font-medium">01. Query Ingestion</span>
                    <span className="text-cyan-300 font-bold">User Intent Vector</span>
                  </div>
                  <div className="text-center -my-1 text-cyan-400 font-bold">↓</div>
                  <div className="p-2.5 rounded-lg bg-[#070b15] border border-indigo-500/20 flex items-center justify-between">
                    <span className="text-slate-300 font-medium">02. Semantic Retrieval</span>
                    <span className="text-indigo-300 font-bold">1536-dim Index</span>
                  </div>
                  <div className="text-center -my-1 text-indigo-400 font-bold">↓</div>
                  <div className="p-2.5 rounded-lg bg-[#070b15] border border-emerald-500/20 flex items-center justify-between">
                    <span className="text-slate-300 font-medium">03. Context Reranking</span>
                    <span className="text-emerald-300 font-bold">Gemini Synthesis</span>
                  </div>
                  <div className="text-center -my-1 text-emerald-400 font-bold">↓</div>
                  <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-400/50 flex items-center justify-between shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                    <span className="text-cyan-200 font-bold">04. Emitted Output</span>
                    <span className="text-white font-bold">Matched Sets + Scripts</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ──────────────────────────────────────────────────────────── */}
          {/* FINAL RADIANT CALL TO ACTION                                 */}
          {/* ──────────────────────────────────────────────────────────── */}
          <section className="rounded-3xl p-8 md:p-14 text-center border border-cyan-400/50 bg-[#131c31]/90 backdrop-blur-xl relative overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.25)]">
            <div className="max-w-3xl mx-auto flex flex-col items-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/90 border border-cyan-400/60 text-cyan-300 font-mono text-xs uppercase tracking-wider mb-4 font-bold shadow-[0_0_16px_rgba(6,182,212,0.35)]">
                <span>🚀</span>
                <span>Instant Access • Zero Infrastructure Setup</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">
                Ready to Build Your Next AI Breakthrough?
              </h2>
              <p className="text-slate-200 text-base md:text-lg mt-3 max-w-xl font-normal">
                Explore thousands of curated datasets, inspect VRAM feasibility, and obtain end-to-end implementation pipelines now.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto">
                <Link
                  href="/explore"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 text-[#070b15] font-bold text-sm transition-all shadow-[0_0_35px_rgba(34,211,238,0.6)] active:scale-95"
                >
                  Launch Explore Studio →
                </Link>
                <Link
                  href="/roadmap"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-white font-mono text-xs font-semibold transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                >
                  View Sample Roadmap
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ──────────────────────────────────────────────────────────── */}
      {/* HIGH-CRAFT DEVELOPER FOOTER                                  */}
      {/* ──────────────────────────────────────────────────────────── */}
      <footer className="mt-auto border-t border-cyan-500/20 bg-[#070c18] relative z-10 text-slate-300 text-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-800">
            {/* Platform Info */}
            <div className="lg:col-span-2 flex flex-col gap-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center bg-[#0d1322] border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                  <span className="text-cyan-300 font-bold text-xs">✦</span>
                </div>
                <span className="text-[16px] font-bold text-white">AI Dataset Explorer</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed max-w-sm font-normal">
                Next-generation RAG-orchestrated dataset repository and telemetry playground. Seamlessly profile high-dimensional embeddings and discover compute feasibility.
              </p>
              <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-slate-900 border border-emerald-500/40 text-[11px] font-mono text-emerald-300 font-semibold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                All systems operational
              </div>
            </div>

            {/* Platform Routes */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs uppercase tracking-wider text-white font-bold">Platform Routes</span>
              <Link className="text-xs text-slate-300 hover:text-cyan-300 transition-colors" href="/">Home Overview</Link>
              <Link className="text-xs text-slate-300 hover:text-cyan-300 transition-colors" href="/explore">Explore Studio</Link>
              <Link className="text-xs text-slate-300 hover:text-cyan-300 transition-colors" href="/benchmark">Benchmark & Compare Lab</Link>
              <Link className="text-xs text-slate-300 hover:text-cyan-300 transition-colors" href="/roadmap">Pipeline Roadmap</Link>
            </div>

            {/* Ecosystem */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs uppercase tracking-wider text-white font-bold">Live Ecosystem</span>
              <a className="text-xs text-slate-300 hover:text-cyan-300 transition-colors" href="https://www.kaggle.com/datasets" target="_blank" rel="noopener noreferrer">Kaggle Datasets</a>
              <a className="text-xs text-slate-300 hover:text-cyan-300 transition-colors" href="https://huggingface.co/datasets" target="_blank" rel="noopener noreferrer">Hugging Face Hub</a>
              <a className="text-xs text-slate-300 hover:text-cyan-300 transition-colors" href="https://arxiv.org/" target="_blank" rel="noopener noreferrer">arXiv ML Preprints</a>
              <a className="text-xs text-slate-300 hover:text-cyan-300 transition-colors" href="https://paperswithcode.com/" target="_blank" rel="noopener noreferrer">Papers With Code</a>
            </div>

            {/* Compute Cluster Telemetry */}
            <div className="flex flex-col gap-2 font-mono text-[11px]">
              <span className="text-xs uppercase tracking-wider text-white font-bold">Compute Nodes</span>
              <div className="text-slate-300">Cluster: <span className="text-indigo-300 font-semibold">us-east-rag-04</span></div>
              <div className="text-slate-300">Latency: <span className="text-emerald-300 font-semibold">18ms p99</span></div>
              <div className="text-slate-300">Vector Embed: <span className="text-cyan-300 font-semibold">1536-dim Ada</span></div>
              <div className="text-slate-300">VRAM Buffer: <span className="text-emerald-300 font-semibold">68% Headroom</span></div>
            </div>
          </div>

          {/* Bottom Legal Row */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-mono">
            <div>© 2026 AI Dataset Explorer. Architected by Hammad Ali Tariq.</div>
            <div className="flex items-center gap-6">
              <span className="text-cyan-400/80">Privacy & Security Ready</span>
              <span className="text-cyan-400/80">Production v2.5</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
