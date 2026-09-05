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
      <div className="flex flex-col items-center gap-3 text-cyan-300 font-label-code text-xs">
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
    <div className="bg-[#0d1322] text-[#F8FAFC] font-body-md text-[15px] antialiased min-h-screen flex flex-col selection:bg-cyan-400/30 selection:text-cyan-300 matrix-grid relative overflow-x-hidden">
      {/* Ambient Glow Canvas Spotlights */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1100px] h-[650px] bg-gradient-to-b from-cyan-500/25 via-blue-600/20 to-transparent rounded-full blur-[130px]" />
        <div className="absolute top-[28%] -left-32 w-[650px] h-[650px] bg-violet-600/20 rounded-full blur-[140px]" />
        <div className="absolute top-[50%] -right-32 w-[700px] h-[700px] bg-cyan-400/20 rounded-full blur-[150px]" />
        <div className="absolute bottom-10 left-1/4 w-[850px] h-[450px] bg-indigo-500/20 rounded-full blur-[160px]" />
      </div>

      {/* ============================================================ */}
      {/* HIGH-TECH GLASSMORPHIC & CYBER-COMPUTE NAVIGATION            */}
      {/* ============================================================ */}
      <header className="fixed top-3 inset-x-0 z-50 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="glass-card specular-border rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-cyan-500/30">
          {/* Brand Logo + Name */}
          <div className="flex items-center gap-3 shrink-0">
            <Link className="flex items-center gap-2.5 group" href="/">
              <div className="relative w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform bg-[#0d1322] border border-cyan-400/50 shadow-[0_0_12px_rgba(6,182,212,0.4)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="AI Dataset Explorer Logo"
                  className="w-full h-full object-contain"
                  src="/logo-stitch.png"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-[16px] font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                  AI Dataset <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-300 to-indigo-300">Explorer</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-400/60 text-cyan-300 font-label-code text-[11px] font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                  RAG 2.5
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 font-body-sm text-[14px]">
            <Link
              className="px-3.5 py-1.5 rounded-lg text-white bg-cyan-500/20 border border-cyan-400/40 font-semibold transition-all shadow-[0_0_14px_rgba(6,182,212,0.25)]"
              href="/"
            >
              Home
            </Link>
            <Link
              className="px-3.5 py-1.5 rounded-lg text-slate-200 hover:text-cyan-300 hover:bg-white/10 transition-colors font-medium"
              href="/explore"
            >
              Explore Studio
            </Link>
            <Link
              className="px-3.5 py-1.5 rounded-lg text-slate-200 hover:text-cyan-300 hover:bg-white/10 transition-colors font-medium"
              href="/benchmark"
            >
              Benchmark &amp; Compare Lab
            </Link>
            <Link
              className="px-3.5 py-1.5 rounded-lg text-slate-200 hover:text-cyan-300 hover:bg-white/10 transition-colors font-medium"
              href="/roadmap"
            >
              Pipeline Roadmap
            </Link>
            <Link
              className="px-3.5 py-1.5 rounded-lg text-slate-200 hover:text-cyan-300 hover:bg-white/10 transition-colors font-medium"
              href="https://github.com/f25605121-maker/AI-Dataset-Explorer"
              target="_blank"
              rel="noopener noreferrer"
            >
              Docs
            </Link>
          </nav>

          {/* Right Telemetry & Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live Status Pill */}
            <div className="hidden xl:flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-cyan-500/30 text-[12px] font-label-code shadow-[0_0_12px_rgba(16,185,129,0.15)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span className="text-slate-300">Ecosystem:</span>
              <span className="text-emerald-300 font-bold">142k+ Online</span>
              <span className="text-slate-500">|</span>
              <span className="text-cyan-300 font-semibold">18ms p99</span>
            </div>

            {/* ⌘K Quick Switcher Button */}
            <button
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-cyan-500/30 text-slate-200 hover:text-white hover:border-cyan-400 text-[12px] font-label-code transition-all shadow-[0_0_10px_rgba(6,182,212,0.15)]"
              onClick={() => {
                const el = document.getElementById("aiTerminalInput");
                el?.focus();
                el?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
              type="button"
            >
              <span className="material-symbols-outlined text-[16px] text-cyan-300">terminal</span>
              <span className="font-medium">Find weights</span>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-200 border border-slate-700 text-[10px] font-semibold">⌘K</kbd>
            </button>

            {/* Launch Studio Radiant CTA */}
            <Link
              className="relative group overflow-hidden rounded-xl p-[1px] font-headline-sm text-[13px] font-semibold"
              href="/explore"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-400 via-indigo-500 to-violet-500 rounded-xl animate-pulse" />
              <span className="relative block px-4 py-1.5 rounded-xl bg-[#0e1628] text-white group-hover:bg-opacity-80 transition-all flex items-center gap-1.5 shadow-[0_0_24px_rgba(6,182,212,0.5)]">
                <span className="material-symbols-outlined text-[17px] text-cyan-300">rocket_launch</span>
                <span className="font-bold">Launch Studio</span>
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* ============================================================ */}
      {/* MAIN HERO & WORKSPACE CONTENT                                */}
      {/* ============================================================ */}
      <main className="relative z-10 flex-1 pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col gap-24">
          {/* HERO SECTION WITH INTEGRATED 3D NEURAL CORE */}
          <section className="relative pt-6 md:pt-10 flex flex-col items-center">
            {/* Glowing Nexus Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-cyan-400/50 shadow-[0_0_28px_rgba(6,182,212,0.35)] mb-6 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="font-label-code text-[12px] uppercase tracking-wider text-cyan-300 font-bold">
                ✦ RAG-Powered AI Intelligence 2.5 • Nexus Pipeline
              </span>
              <span className="text-cyan-500">•</span>
              <span className="font-label-code text-[12px] text-indigo-200 font-semibold">
                142k+ Models &amp; Sets
              </span>
            </div>

            {/* Master Title */}
            <h1 className="font-headline-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-5xl leading-[1.12] text-center">
              Find the Perfect Dataset &amp; Weights for your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-indigo-300 drop-shadow-[0_0_35px_rgba(34,211,238,0.55)]">
                Next AI Project
              </span>
            </h1>

            {/* Subtitle */}
            <p className="font-body-lead text-slate-200 text-lg md:text-xl max-w-3xl mt-5 font-normal leading-relaxed text-center">
              High-dimensional vector search across Hugging Face, Kaggle &amp; arXiv. Synthesize instant VRAM feasibility profiles, quant compatibility matrices, and 5-phase execution roadmaps.
            </p>

            {/* Fast Feature Checklist Badges */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 mt-6 text-[13px] font-label-code text-slate-100">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-emerald-500/40 shadow-[0_0_14px_rgba(16,185,129,0.2)]">
                <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
                <span className="font-medium">Hugging Face &amp; Kaggle Hybrid Pairing</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/40 shadow-[0_0_14px_rgba(6,182,212,0.2)]">
                <span className="material-symbols-outlined text-cyan-300 text-[18px]">memory</span>
                <span className="font-medium">Accurate LoRA &amp; KV-Cache VRAM Math</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-indigo-500/40 shadow-[0_0_14px_rgba(99,102,241,0.2)]">
                <span className="material-symbols-outlined text-indigo-300 text-[18px]">schema</span>
                <span className="font-medium">Production PyTorch &amp; vLLM Starters</span>
              </div>
            </div>

            {/* HERO 3D NEURAL SCENE & QUERY PLAYGROUND SPLIT */}
            <div className="w-full max-w-6xl mt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Interactive 3D Scene Viewport Element */}
              <div className="lg:col-span-5 flex flex-col items-center justify-center">
                <div className="w-full glass-card specular-border rounded-2xl border border-cyan-500/35 overflow-hidden relative shadow-[0_0_40px_rgba(6,182,212,0.25)] flex flex-col">
                  {/* 3D Viewport Header */}
                  <div className="bg-[#0f172a]/95 px-4 py-2.5 border-b border-cyan-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                      <span className="font-label-code text-[11px] font-bold uppercase tracking-wider text-cyan-300">
                        Live 3D Neural Mesh
                      </span>
                    </div>
                    <span className="font-label-code text-[10px] text-indigo-300 px-2 py-0.5 rounded bg-indigo-950/70 border border-indigo-500/40">
                      Interactive Orbit
                    </span>
                  </div>

                  {/* Embed 3D Animation Custom Element */}
                  <div className="relative w-full h-[380px] bg-gradient-to-b from-[#0e1629]/90 to-[#0c1222]/95 flex items-center justify-center overflow-hidden">
                    <ThreeNeuralMesh />

                    {/* Floating Interactive Hint */}
                    <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none text-[11px] font-label-code text-slate-300 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-cyan-500/30">
                      <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                        <span className="material-symbols-outlined text-[14px]">view_in_ar</span> 42 Clustered Datasets
                      </span>
                      <span className="text-slate-300 text-[10px]">Move mouse to rotate</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive AI Query Terminal Column */}
              <div className="lg:col-span-7">
                <QueryTerminal />
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* FEDERATED REGISTRY ECOSYSTEM TICKER                          */}
          {/* ============================================================ */}
          <section className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-label-code text-[12px] text-cyan-300 uppercase tracking-widest font-bold">
                  <span className="w-2 h-0.5 bg-cyan-400 inline-block" />
                  Federated Ecosystem Telemetry
                </div>
                <h2 className="font-headline-md text-2xl md:text-3xl font-bold text-white mt-1">
                  Synchronized with Top Open-Weight Registries
                </h2>
              </div>
              <p className="font-body-sm text-slate-300 text-sm max-w-md font-medium">
                Continuously mapped into Pinecone vector index with real-time paper citations and automated license audits.
              </p>
            </div>

            {/* Ecosystem Grid Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
              {/* Kaggle */}
              <a
                className="group glass-card specular-border p-4 rounded-xl border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all flex flex-col"
                href="https://www.kaggle.com/datasets"
                rel="noopener noreferrer"
                target="_blank"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-950/70 border border-cyan-400/50 flex items-center justify-center font-headline-sm font-bold text-cyan-300 text-sm shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                    K
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                </div>
                <span className="font-headline-sm text-[15px] font-bold text-white group-hover:text-cyan-300 transition-colors">Kaggle</span>
                <span className="font-label-code text-[12px] text-cyan-300 mt-1 font-bold">64,200+ Sets</span>
                <span className="text-[11px] text-slate-300 mt-2 font-medium">Tabular &amp; Multimodal</span>
              </a>

              {/* Hugging Face */}
              <a
                className="group glass-card specular-border p-4 rounded-xl border border-amber-500/30 hover:border-amber-400 hover:shadow-[0_0_25px_rgba(245,158,11,0.35)] transition-all flex flex-col"
                href="https://huggingface.co/datasets"
                rel="noopener noreferrer"
                target="_blank"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-950/50 border border-amber-400/50 flex items-center justify-center text-lg shadow-[0_0_10px_rgba(245,158,11,0.3)]">
                    🤗
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                </div>
                <span className="font-headline-sm text-[15px] font-bold text-white group-hover:text-amber-300 transition-colors">Hugging Face</span>
                <span className="font-label-code text-[12px] text-amber-300 mt-1 font-bold">58,400+ Models</span>
                <span className="text-[11px] text-slate-300 mt-2 font-medium">Transformers &amp; Hub</span>
              </a>

              {/* arXiv ML */}
              <a
                className="group glass-card specular-border p-4 rounded-xl border border-violet-500/30 hover:border-violet-400 hover:shadow-[0_0_25px_rgba(139,92,246,0.35)] transition-all flex flex-col"
                href="https://arxiv.org/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-violet-950/70 border border-violet-400/50 flex items-center justify-center font-label-code font-bold text-violet-300 text-sm shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                    αX
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                </div>
                <span className="font-headline-sm text-[15px] font-bold text-white group-hover:text-violet-300 transition-colors">arXiv ML</span>
                <span className="font-label-code text-[12px] text-violet-300 mt-1 font-bold">22,800+ Papers</span>
                <span className="text-[11px] text-slate-300 mt-2 font-medium">SOTA Architectures</span>
              </a>

              {/* Papers With Code */}
              <a
                className="group glass-card specular-border p-4 rounded-xl border border-indigo-500/30 hover:border-indigo-400 hover:shadow-[0_0_25px_rgba(99,102,241,0.35)] transition-all flex flex-col"
                href="https://paperswithcode.com/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-950/70 border border-indigo-400/50 flex items-center justify-center text-base shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                    📄
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                </div>
                <span className="font-headline-sm text-[15px] font-bold text-white group-hover:text-indigo-300 transition-colors">Papers w/ Code</span>
                <span className="font-label-code text-[12px] text-indigo-300 mt-1 font-bold">12,000+ SOTA</span>
                <span className="text-[11px] text-slate-300 mt-2 font-medium">Leaderboard Benchmarks</span>
              </a>

              {/* UCI Machine */}
              <a
                className="group glass-card specular-border p-4 rounded-xl border border-emerald-500/30 hover:border-emerald-400 hover:shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all flex flex-col"
                href="https://archive.ics.uci.edu/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-950/70 border border-emerald-400/50 flex items-center justify-center font-label-code font-bold text-emerald-300 text-xs shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                    UCI
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                </div>
                <span className="font-headline-sm text-[15px] font-bold text-white group-hover:text-emerald-300 transition-colors">UCI Machine</span>
                <span className="font-label-code text-[12px] text-emerald-300 mt-1 font-bold">700+ Baselines</span>
                <span className="text-[11px] text-slate-300 mt-2 font-medium">Verified Standards</span>
              </a>

              {/* GitHub AI */}
              <a
                className="group glass-card specular-border p-4 rounded-xl border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(6,182,212,0.35)] transition-all flex flex-col"
                href="https://github.com/"
                rel="noopener noreferrer"
                target="_blank"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 border border-cyan-400/40 flex items-center justify-center font-label-code font-bold text-white text-xs shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                    GH
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                </div>
                <span className="font-headline-sm text-[15px] font-bold text-white group-hover:text-cyan-300 transition-colors">GitHub AI</span>
                <span className="font-label-code text-[12px] text-cyan-300 mt-1 font-bold">4,500+ Starters</span>
                <span className="text-[11px] text-slate-300 mt-2 font-medium">Production PyTorch</span>
              </a>
            </div>
          </section>

          {/* ============================================================ */}
          {/* FUTURISTIC ARCHITECTURAL PIPELINE CIRCUIT GRAPH              */}
          {/* ============================================================ */}
          <section className="flex flex-col gap-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-400/50 text-cyan-300 font-label-code text-[11px] uppercase tracking-wider mb-3 shadow-[0_0_14px_rgba(6,182,212,0.25)] font-bold">
                <span className="material-symbols-outlined text-[15px]">account_tree</span>
                End-to-End Deep Nexus Flow
              </div>
              <h2 className="font-headline-lg text-3xl md:text-4xl font-extrabold text-white">
                From Project Intent to Model Serving in Seconds
              </h2>
              <p className="font-body-md text-slate-300 mt-2 font-medium">
                Every query traverses our federated vector mesh to produce grounded pairings, hardware envelopes, and ready-to-run PyTorch scripts.
              </p>
            </div>

            {/* 4 Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Node 01 */}
              <div className="glass-card specular-border rounded-2xl p-6 border border-cyan-500/30 hover:border-cyan-400 transition-all group flex flex-col relative shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-label-code text-[11px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-400/40 px-2.5 py-1 rounded-md shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                    NODE 01
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 group-hover:scale-110 transition-transform shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                    <span className="material-symbols-outlined text-[22px]">query_stats</span>
                  </div>
                </div>
                <h3 className="font-headline-sm text-[17px] font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                  Query Intent Parser
                </h3>
                <p className="font-body-sm text-slate-300 text-sm mb-4 leading-relaxed font-normal">
                  Deconstructs natural language inputs into dimensional metadata: task modality, context limits, license tags, and precision targets.
                </p>
                <div className="mt-auto rounded-xl bg-[#090f1d] border border-cyan-500/20 p-3 font-label-code text-[11px] text-slate-200 flex flex-col gap-1">
                  <div><span className="text-cyan-300 font-semibold">task_type:</span> &quot;VLM Medical&quot;</div>
                  <div><span className="text-indigo-300 font-semibold">ctx_tokens:</span> 4,096 tokens</div>
                  <div><span className="text-emerald-300 font-semibold">license:</span> &quot;MIT / Apache-2&quot;</div>
                </div>
              </div>

              {/* Node 02 */}
              <div className="glass-card specular-border rounded-2xl p-6 border border-indigo-500/30 hover:border-indigo-400 transition-all group flex flex-col relative shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-label-code text-[11px] font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-400/40 px-2.5 py-1 rounded-md shadow-[0_0_8px_rgba(99,102,241,0.3)]">
                    NODE 02
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 group-hover:scale-110 transition-transform shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                    <span className="material-symbols-outlined text-[22px]">travel_explore</span>
                  </div>
                </div>
                <h3 className="font-headline-sm text-[17px] font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                  Hybrid Vector Search
                </h3>
                <p className="font-body-sm text-slate-300 text-sm mb-4 leading-relaxed font-normal">
                  Dual-retrieval combining 1536-dim Pinecone dense embeddings with BM25 lexical token matching across verified datasets.
                </p>
                <div className="mt-auto rounded-xl bg-[#090f1d] border border-indigo-500/20 p-3 font-label-code text-[11px] text-slate-200 flex flex-col gap-1">
                  <div><span className="text-indigo-300 font-semibold">dense_cosine:</span> 0.962</div>
                  <div><span className="text-cyan-300 font-semibold">bm25_score:</span> 24.18</div>
                  <div><span className="text-emerald-300 font-semibold">candidate_pool:</span> 380 assets</div>
                </div>
              </div>

              {/* Node 03 */}
              <div className="glass-card specular-border rounded-2xl p-6 border border-emerald-500/30 hover:border-emerald-400 transition-all group flex flex-col relative shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-label-code text-[11px] font-bold text-emerald-300 bg-emerald-950/80 border border-emerald-400/40 px-2.5 py-1 rounded-md shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                    NODE 03
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 group-hover:scale-110 transition-transform shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                    <span className="material-symbols-outlined text-[22px]">memory</span>
                  </div>
                </div>
                <h3 className="font-headline-sm text-[17px] font-bold text-white mb-2 group-hover:text-emerald-300 transition-colors">
                  AI Sizing &amp; VRAM Engine
                </h3>
                <p className="font-body-sm text-slate-300 text-sm mb-4 leading-relaxed font-normal">
                  Calculates parameter footprint, optimizer state memory, KV-cache growth, and quantization loss metrics.
                </p>
                <div className="mt-auto rounded-xl bg-[#090f1d] border border-emerald-500/20 p-3 font-label-code text-[11px] text-slate-200 flex flex-col gap-1">
                  <div><span className="text-emerald-300 font-semibold">fit_status:</span> &quot;RTX 4090 Ready&quot;</div>
                  <div><span className="text-cyan-300 font-semibold">overhead_margin:</span> 38% free</div>
                  <div><span className="text-indigo-300 font-semibold">quant_scheme:</span> AWQ 4-bit / FP16</div>
                </div>
              </div>

              {/* Node 04 */}
              <div className="glass-card specular-border rounded-2xl p-6 border border-violet-500/30 hover:border-violet-400 transition-all group flex flex-col relative shadow-[0_0_20px_rgba(139,92,246,0.15)]">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-label-code text-[11px] font-bold text-violet-300 bg-violet-950/80 border border-violet-400/40 px-2.5 py-1 rounded-md shadow-[0_0_8px_rgba(139,92,246,0.3)]">
                    NODE 04
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-400/40 flex items-center justify-center text-violet-300 group-hover:scale-110 transition-transform shadow-[0_0_12px_rgba(139,92,246,0.3)]">
                    <span className="material-symbols-outlined text-[22px]">terminal</span>
                  </div>
                </div>
                <h3 className="font-headline-sm text-[17px] font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">
                  Production Roadmap &amp; Code
                </h3>
                <p className="font-body-sm text-slate-300 text-sm mb-4 leading-relaxed font-normal">
                  Generates a structured 5-phase engineering checklist alongside production LoRA scripts and FastAPI vLLM endpoints.
                </p>
                <div className="mt-auto rounded-xl bg-[#090f1d] border border-violet-500/20 p-3 font-label-code text-[11px] text-slate-200 flex flex-col gap-1">
                  <div><span className="text-violet-300 font-semibold">engine:</span> vLLM + Triton</div>
                  <div><span className="text-cyan-300 font-semibold">starter_script:</span> train_qlora.py</div>
                  <div><span className="text-emerald-300 font-semibold">phases:</span> 5 steps generated</div>
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* LIVE HARDWARE FEASIBILITY & VRAM PROFILER WORKSTATION        */}
          {/* ============================================================ */}
          <HardwareEstimator />

          {/* ============================================================ */}
          {/* ENTERPRISE CAPABILITIES & LIVE BENCHMARKS PREVIEW            */}
          {/* ============================================================ */}
          <section className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 font-label-code text-[12px] text-cyan-300 uppercase tracking-widest font-bold">
                  <span className="w-2 h-0.5 bg-cyan-400 inline-block" />
                  High-Precision ML Tooling
                </div>
                <h2 className="font-headline-lg text-3xl md:text-4xl font-extrabold text-white mt-1">
                  Engineered for Production Intelligence
                </h2>
              </div>
              <p className="font-body-sm text-slate-300 text-sm max-w-md font-medium">
                Evaluate throughput, inspect memory profiles, and export automated fine-tuning recipes without configuration fatigue.
              </p>
            </div>

            {/* Bento Grid 3 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Card 1: Multi-Model Benchmark Lab with Mini Sparkline */}
              <div className="glass-card specular-border rounded-2xl p-6 border border-cyan-500/30 hover:border-cyan-400 transition-all flex flex-col justify-between shadow-[0_0_20px_rgba(6,182,212,0.15)]">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mb-4 shadow-[0_0_10px_rgba(6,182,212,0.3)]">
                    <span className="material-symbols-outlined text-[22px]">balance</span>
                  </div>
                  <h3 className="font-headline-sm text-lg font-bold text-white mb-2">
                    Multi-Model Benchmark Lab
                  </h3>
                  <p className="font-body-sm text-slate-300 text-sm leading-relaxed font-normal">
                    Head-to-head evaluation across latency distributions, FP16 vs INT4 perplexity preservation, and commercial license safety.
                  </p>
                </div>

                {/* Mini Sparkline Latency Chart */}
                <div className="mt-6 rounded-xl bg-[#090f1d] border border-cyan-500/20 p-4 shadow-inner">
                  <div className="flex justify-between items-center font-label-code text-[11px] mb-3 text-slate-300 font-medium">
                    <span>Inference Latency (ms/token)</span>
                    <span className="text-cyan-300 font-bold">vLLM Engine</span>
                  </div>
                  <div className="flex items-end gap-2.5 h-20 pt-2 border-b border-slate-700/80 pb-2">
                    <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full bg-cyan-500/40 rounded-t h-[45%] border-t border-cyan-300" />
                      <span className="font-label-code text-[10px] text-slate-300 font-medium">Mistral</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full bg-cyan-400 rounded-t h-[30%] shadow-[0_0_14px_rgba(34,211,238,0.7)]" />
                      <span className="font-label-code text-[10px] text-cyan-200 font-bold">Llama-3</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full bg-indigo-500/50 rounded-t h-[75%] border-t border-indigo-300" />
                      <span className="font-label-code text-[10px] text-slate-300 font-medium">Qwen-2</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <div className="w-full bg-emerald-500/50 rounded-t h-[38%] border-t border-emerald-300" />
                      <span className="font-label-code text-[10px] text-slate-300 font-medium">Gemma-2</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-label-code text-slate-400 pt-2">
                    <span>Lower is faster</span>
                    <span className="text-emerald-300 font-bold">Llama-3: 14.8 ms/tok</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Production Code Generator with Interactive Tab */}
              <div className="glass-card specular-border rounded-2xl p-6 border border-indigo-500/30 hover:border-indigo-400 transition-all flex flex-col justify-between shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 mb-4 shadow-[0_0_10px_rgba(99,102,241,0.3)]">
                    <span className="material-symbols-outlined text-[22px]">code</span>
                  </div>
                  <h3 className="font-headline-sm text-lg font-bold text-white mb-2">
                    Automated LoRA &amp; Serve Scripts
                  </h3>
                  <p className="font-body-sm text-slate-300 text-sm leading-relaxed font-normal">
                    Generates modular scripts with PEFT configurations, FlashAttention-2 flags, and FastAPI endpoints ready for cloud deployment.
                  </p>
                </div>

                {/* Live Code Preview Tab */}
                <div className="mt-6 rounded-xl bg-[#090f1d] border border-indigo-500/25 p-3.5 font-label-code text-[11px] shadow-inner">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-700/80 text-slate-300 mb-2">
                    <span className="text-indigo-300 flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-[13px]">description</span>
                      train_qlora.py
                    </span>
                    <button
                      className="text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[10px] font-semibold"
                      onClick={handleCopySnippet}
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[12px]">content_copy</span>
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
              <div className="glass-card specular-border rounded-2xl p-6 border border-emerald-500/30 hover:border-emerald-400 transition-all flex flex-col justify-between shadow-[0_0_20px_rgba(16,185,129,0.15)]">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 mb-4 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                    <span className="material-symbols-outlined text-[22px]">schema</span>
                  </div>
                  <h3 className="font-headline-sm text-lg font-bold text-white mb-2">
                    Interactive Pipeline Roadmap
                  </h3>
                  <p className="font-body-sm text-slate-300 text-sm leading-relaxed font-normal">
                    Step-by-step engineering sequence with milestone verifications, deduplication strategies, and deployment checklists.
                  </p>
                </div>

                {/* Mini Checklist Preview */}
                <div className="mt-6 rounded-xl bg-[#090f1d] border border-emerald-500/25 p-4 flex flex-col gap-2.5 font-label-code text-[11px] shadow-inner">
                  <div className="flex items-center gap-2.5 text-slate-100 font-medium">
                    <span className="material-symbols-outlined text-emerald-400 text-[16px] shadow-[0_0_6px_rgba(52,211,153,0.6)]">check_circle</span>
                    <span>Phase 1: MinHash Token Deduplication</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-100 font-medium">
                    <span className="material-symbols-outlined text-emerald-400 text-[16px] shadow-[0_0_6px_rgba(52,211,153,0.6)]">check_circle</span>
                    <span>Phase 2: FP16 Quantized Baseline Run</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-cyan-200 font-bold">
                    <span className="material-symbols-outlined text-cyan-300 text-[16px] animate-spin">sync</span>
                    <span>Phase 3: LoRA Rank Sweep &amp; Evaluation</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-400 font-medium">
                    <span className="material-symbols-outlined text-slate-500 text-[16px]">radio_button_unchecked</span>
                    <span>Phase 4: GGUF Export &amp; Ollama Packaging</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-400 font-medium">
                    <span className="material-symbols-outlined text-slate-500 text-[16px]">radio_button_unchecked</span>
                    <span>Phase 5: vLLM High-Concurrency Serving</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* CREATOR SPOTLIGHT & ARCHITECTURE BRIEF                       */}
          {/* ============================================================ */}
          <section className="glass-card specular-border rounded-3xl p-6 md:p-10 border border-cyan-500/30 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 flex flex-col gap-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/90 border border-cyan-400/60 text-cyan-300 font-label-code text-[11px] uppercase tracking-wider self-start font-bold shadow-[0_0_16px_rgba(6,182,212,0.35)]">
                  <span className="material-symbols-outlined text-[15px] text-cyan-300">terminal</span>
                  <span>Architected by Hammad Ali Tariq</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping ml-1" />
                </div>
                <h2 className="font-headline-lg text-2xl md:text-3xl font-extrabold text-white">
                  Built to Eliminate Friction in Deep Tech &amp; ML Pipelines
                </h2>
                <div className="flex flex-col gap-3">
                  <div className="inline-flex items-center gap-2.5 p-1 px-3.5 rounded-xl bg-slate-900/90 border border-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.25)] self-start">
                    <span className="material-symbols-outlined text-cyan-300 text-[18px]">verified</span>
                    <span className="text-xs font-label-code text-slate-300 uppercase tracking-wider">Architected &amp; Engineered by</span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 font-bold tracking-wide text-[16px]">Hammad Ali Tariq</span>
                  </div>
                  <p className="font-body-md text-slate-200 text-sm md:text-base leading-relaxed font-normal">
                    AI Dataset Explorer integrates high-dimensional vector search, automated GPU hardware profiling, and production code generation into an elegant, unified developer platform.
                  </p>
                </div>

                {/* Tech Badges */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-cyan-500/30 text-slate-200 font-label-code text-[11px] font-semibold">Next.js 16 (App Router)</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-cyan-500/30 text-slate-200 font-label-code text-[11px] font-semibold">Tailwind CSS v4</span>
                  <span className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-400/50 text-cyan-200 font-label-code text-[11px] font-bold shadow-[0_0_8px_rgba(6,182,212,0.3)]">Gemini RAG Synthesis</span>
                  <span className="px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-400/50 text-indigo-200 font-label-code text-[11px] font-bold shadow-[0_0_8px_rgba(99,102,241,0.3)]">Pinecone Vector DB</span>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 font-label-code text-[11px] font-semibold">NextAuth.js</span>
                </div>

                {/* Social Links */}
                <div className="flex items-center gap-3 pt-3">
                  <a
                    className="px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-white font-label-code text-[12px] font-bold transition-all flex items-center gap-2 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                    href="https://github.com/f25605121-maker/AI-Dataset-Explorer"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="material-symbols-outlined text-[16px]">code</span>
                    <span>GitHub Repository</span>
                  </a>
                  <a
                    className="px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-indigo-500/40 hover:border-indigo-400 text-white font-label-code text-[12px] font-bold transition-all flex items-center gap-2 shadow-[0_0_12px_rgba(99,102,241,0.2)]"
                    href="https://www.linkedin.com/"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <span className="material-symbols-outlined text-[16px]">contact_page</span>
                    <span>LinkedIn Profile</span>
                  </a>
                </div>
              </div>

              {/* Architecture Visual Topology Card */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl bg-[#0b1222] border border-cyan-500/30 p-5 font-label-code text-[12px] flex flex-col gap-3 shadow-xl">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                    <span className="text-cyan-300 font-bold uppercase text-[11px]">Topology Execution Flow</span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 text-[10px] font-bold shadow-[0_0_8px_rgba(16,185,129,0.3)]">200 OK</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#070b15] border border-cyan-500/20 flex items-center justify-between">
                    <span className="text-slate-300 font-medium">01. Query Ingestion</span>
                    <span className="text-cyan-300 font-bold">User Intent Vector</span>
                  </div>
                  <div className="flex justify-center -my-1 text-cyan-400">
                    <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#070b15] border border-indigo-500/20 flex items-center justify-between">
                    <span className="text-slate-300 font-medium">02. Semantic Retrieval</span>
                    <span className="text-indigo-300 font-bold">1536-dim Index</span>
                  </div>
                  <div className="flex justify-center -my-1 text-indigo-400">
                    <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#070b15] border border-emerald-500/20 flex items-center justify-between">
                    <span className="text-slate-300 font-medium">03. Context Reranking</span>
                    <span className="text-emerald-300 font-bold">Gemini Synthesis</span>
                  </div>
                  <div className="flex justify-center -my-1 text-emerald-400">
                    <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-400/50 flex items-center justify-between shadow-[0_0_12px_rgba(6,182,212,0.25)]">
                    <span className="text-cyan-200 font-bold">04. Emitted Output</span>
                    <span className="text-white font-bold">Matched Sets + Scripts</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* FINAL RADIANT CALL TO ACTION                                 */}
          {/* ============================================================ */}
          <section className="glass-card specular-border rounded-3xl p-8 md:p-14 text-center border border-cyan-400/50 relative overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.25)]">
            <div className="max-w-3xl mx-auto flex flex-col items-center">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/90 border border-cyan-400/60 text-cyan-300 font-label-code text-[11px] uppercase tracking-wider mb-4 font-bold shadow-[0_0_16px_rgba(6,182,212,0.35)]">
                <span className="material-symbols-outlined text-[14px]">rocket</span>
                Instant Access • Zero Infrastructure Setup
              </div>
              <h2 className="font-headline-lg text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">
                Ready to Build Your Next AI Breakthrough?
              </h2>
              <p className="font-body-lead text-slate-200 text-base md:text-lg mt-3 max-w-xl font-normal">
                Explore thousands of curated datasets, inspect VRAM feasibility, and obtain end-to-end implementation pipelines now.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 mt-8 w-full sm:w-auto">
                <Link
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 text-[#070b15] font-headline-sm text-[15px] font-bold transition-all shadow-[0_0_35px_rgba(34,211,238,0.6)] active:scale-95"
                  href="/explore"
                >
                  Launch Explore Studio →
                </Link>
                <Link
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/40 text-white font-label-code text-[13px] font-semibold transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                  href="/roadmap"
                >
                  View Sample Roadmap
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ============================================================ */}
      {/* HIGH-CRAFT DEVELOPER FOOTER                                  */}
      {/* ============================================================ */}
      <footer className="mt-auto border-t border-cyan-500/20 bg-[#070c18] relative z-10 text-slate-300 font-body-sm text-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-slate-800">
            {/* Col 1 & 2: Platform Info */}
            <div className="lg:col-span-2 flex flex-col gap-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center bg-[#0d1322] border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt="Brand Logo"
                    className="w-full h-full object-contain"
                    src="/logo-stitch.png"
                  />
                </div>
                <span className="font-headline-sm text-[16px] font-bold text-white">AI Dataset Explorer</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed max-w-sm font-normal">
                Next-generation RAG-orchestrated dataset repository and telemetry playground. Seamlessly profile high-dimensional embeddings and discover compute feasibility.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                  <span className="text-xs text-slate-400 font-label-code">Created by</span>
                  <a
                    href="https://www.linkedin.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-indigo-300 hover:text-cyan-200 transition-colors flex items-center gap-1 font-label-code"
                  >
                    <span>Hammad Ali Tariq</span>
                    <span className="material-symbols-outlined text-[13px] text-cyan-400">arrow_outward</span>
                  </a>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-full bg-slate-900 border border-emerald-500/40 text-[11px] font-label-code text-emerald-300 font-semibold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                All systems operational
              </div>
            </div>

            {/* Col 3: Platform Routes */}
            <div className="flex flex-col gap-2.5">
              <span className="font-headline-sm text-xs uppercase tracking-wider text-white font-bold">Platform Routes</span>
              <Link className="text-xs text-slate-300 hover:text-cyan-300 transition-colors" href="/">Home Overview</Link>
              <Link className="text-xs text-slate-300 hover:text-cyan-300 transition-colors" href="/explore">Explore Studio</Link>
              <Link className="text-xs text-slate-300 hover:text-cyan-300 transition-colors" href="/benchmark">Benchmark &amp; Compare Lab</Link>
              <Link className="text-xs text-slate-300 hover:text-cyan-300 transition-colors" href="/roadmap">Pipeline Roadmap</Link>
              <Link className="text-xs text-slate-300 hover:text-cyan-300 transition-colors" href="https://github.com/f25605121-maker/AI-Dataset-Explorer" target="_blank" rel="noopener noreferrer">Documentation</Link>
            </div>

            {/* Col 4: Ecosystem */}
            <div className="flex flex-col gap-2.5">
              <span className="font-headline-sm text-xs uppercase tracking-wider text-white font-bold">Live Ecosystem</span>
              <a className="text-xs text-slate-300 hover:text-cyan-300 transition-colors" href="https://www.kaggle.com/datasets" rel="noopener noreferrer" target="_blank">Kaggle Datasets</a>
              <a className="text-xs text-slate-300 hover:text-cyan-300 transition-colors" href="https://huggingface.co/datasets" rel="noopener noreferrer" target="_blank">Hugging Face Hub</a>
              <a className="text-xs text-slate-300 hover:text-cyan-300 transition-colors" href="https://arxiv.org/" rel="noopener noreferrer" target="_blank">arXiv ML Preprints</a>
              <a className="text-xs text-slate-300 hover:text-cyan-300 transition-colors" href="https://paperswithcode.com/" rel="noopener noreferrer" target="_blank">Papers With Code</a>
              <a className="text-xs text-slate-300 hover:text-cyan-300 transition-colors" href="https://github.com/" rel="noopener noreferrer" target="_blank">GitHub AI Repos</a>
            </div>

            {/* Col 5: Compute Cluster Telemetry */}
            <div className="flex flex-col gap-2 font-label-code text-[11px]">
              <span className="font-headline-sm text-xs uppercase tracking-wider text-white font-bold">Compute Nodes</span>
              <div className="text-slate-300">Cluster: <span className="text-indigo-300 font-semibold">us-east-rag-04</span></div>
              <div className="text-slate-300">Latency: <span className="text-emerald-300 font-semibold">18ms p99</span></div>
              <div className="text-slate-300">Vector Embed: <span className="text-cyan-300 font-semibold">1536-dim Ada</span></div>
              <div className="text-slate-300">VRAM Buffer: <span className="text-emerald-300 font-semibold">68% Headroom</span></div>
            </div>
          </div>

          {/* Bottom Legal Row */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-label-code">
            <div>© 2026 AI Dataset Explorer. Architected by Hammad Ali Tariq.</div>
            <div className="flex items-center gap-6">
              <span className="hover:text-cyan-300 transition-colors cursor-pointer">Privacy Telemetry</span>
              <span className="hover:text-cyan-300 transition-colors cursor-pointer">API Terms</span>
              <span className="hover:text-cyan-300 transition-colors cursor-pointer">Security Specs</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
