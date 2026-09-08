"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import {
    getRankedPopularDatasets,
    PopularDatasetItem,
} from "@/lib/algorithms/popularity";

export default function LandingPage() {
    const [rankedDatasets, setRankedDatasets] = useState<PopularDatasetItem[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(true);

    // Initialize ranked datasets from the popularity algorithm on mount
    useEffect(() => {
        const ranked = getRankedPopularDatasets();
        setRankedDatasets(ranked);
    }, []);

    // Smooth auto-cycle between top popular datasets unless user interacted
    useEffect(() => {
        if (!isAutoPlaying || rankedDatasets.length === 0) return;
        const interval = setInterval(() => {
            setSelectedIndex((prev) => (prev + 1) % Math.min(5, rankedDatasets.length));
        }, 6000);
        return () => clearInterval(interval);
    }, [isAutoPlaying, rankedDatasets.length]);

    const activeDataset = rankedDatasets[selectedIndex] || rankedDatasets[0];

    return (
        <div className="min-h-screen flex flex-col bg-page text-primary selection:bg-accent selection:text-white relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-[600px] md:w-[900px] h-[600px] md:h-[900px] rounded-full bg-accent opacity-[var(--glow-opacity,0.2)] blur-[140px] animate-pulse-glow" />
                <div className="absolute top-1/3 -left-40 w-[500px] md:w-[700px] h-[500px] md:h-[700px] rounded-full bg-cyan-500/10 blur-[130px] opacity-[var(--glow-opacity,0.2)]" />
                <div className="absolute bottom-10 right-1/4 w-[400px] md:w-[600px] h-[400px] md:h-[600px] rounded-full bg-violet-500/10 blur-[150px] opacity-[var(--glow-opacity,0.2)]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border-subtle)_1px,transparent_1px),linear-gradient(to_bottom,var(--border-subtle)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
            </div>

            {/* Reusable Navbar */}
            <Navbar variant="landing" />

            {/* ── HERO SECTION ─────────────────────────────────────────── */}
            <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-20 lg:pt-20 lg:pb-32 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                
                {/* Left: Heading & Value Proposition */}
                <div className="space-y-6 text-left">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-subtle bg-card shadow-sm text-xs font-semibold">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-secondary">AI Dataset & Model Intelligence</span>
                        <span className="text-faint">·</span>
                        <span className="text-accent-gradient font-bold">RAG Powered</span>
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-black tracking-tight leading-[1.08] text-primary">
                        Find the perfect<br />
                        dataset for your<br />
                        <span className="text-accent-gradient inline-flex items-center gap-3">
                            AI project
                            <span className="inline-block text-accent-from text-3xl lg:text-4xl animate-bounce">✦</span>
                        </span>
                    </h1>

                    {/* Enclosed Value Proposition Card */}
                    <div className="p-5 sm:p-6 rounded-3xl bg-card border border-subtle shadow-md space-y-4 max-w-xl">
                        <p className="text-sm sm:text-base text-muted leading-relaxed">
                            Instant dataset discovery, pretrained Hugging Face models, research papers, VRAM feasibility estimates, and step-by-step project roadmaps — all in one unified workspace.
                        </p>

                        {/* Key Value Points */}
                        <div className="space-y-2 pt-3 border-t border-subtle">
                            {[
                                "Smart dataset recommendations across Kaggle & Hugging Face",
                                "Model architecture matching & hardware VRAM estimation",
                                "Production roadmap & step-by-step implementation guide",
                            ].map((item) => (
                                <div key={item} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-card-solid border border-subtle text-xs sm:text-sm font-medium text-secondary shadow-xs">
                                    <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-accent-sm">
                                        ✓
                                    </div>
                                    <span>{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 flex flex-wrap items-center gap-4">
                        <Link
                            href="/explore"
                            className="px-7 py-3.5 bg-accent hover:brightness-110 active:scale-95 text-white font-bold rounded-2xl text-sm transition-all shadow-accent flex items-center gap-2 group"
                        >
                            <span>Start Exploring Studio</span>
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                        
                        <Link
                            href="/benchmark"
                            className="px-6 py-3.5 border border-subtle bg-card hover:bg-card-hover text-secondary hover:text-primary font-semibold rounded-2xl text-sm transition flex items-center gap-2"
                        >
                            <span>Benchmark Lab</span>
                            <span className="text-xs">⚖️</span>
                        </Link>

                        <Link
                            href="/roadmap"
                            className="px-6 py-3.5 border border-subtle bg-card hover:bg-card-hover text-secondary hover:text-primary font-semibold rounded-2xl text-sm transition flex items-center gap-2"
                        >
                            <span>Pipeline Roadmap</span>
                            <span className="text-xs">🛠️</span>
                        </Link>
                    </div>


                    {/* Enclosed Interactive Prompt Chip Bar */}
                    <div className="p-4 rounded-2xl bg-card border border-subtle shadow-sm max-w-xl">
                        <p className="text-xs text-muted mb-2.5 font-bold uppercase tracking-wider">Quick explore popular project searches:</p>
                        <div className="flex flex-wrap gap-2">
                            {rankedDatasets.slice(0, 4).map((ds) => (
                                <Link
                                    key={ds.id}
                                    href={`/explore?q=${encodeURIComponent(ds.query)}`}
                                    className="px-3 py-1.5 text-xs rounded-xl bg-card-solid hover:bg-card-hover border border-subtle text-secondary hover:text-primary transition flex items-center gap-1.5 font-medium shadow-xs"
                                >
                                    <span>{ds.icon}</span>
                                    <span className="truncate max-w-[200px]">{ds.title}</span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: 3D Interactive Dynamic Popular Dataset Showcase */}
                {activeDataset && (
                    <div className="relative mt-8 lg:mt-0 select-none">
                        <div className="absolute inset-0 bg-accent opacity-[var(--glow-opacity,0.2)] blur-[100px] rounded-full pointer-events-none" />

                        <div
                            className="relative w-full rounded-3xl border border-strong glass-card p-6 shadow-2xl transition-all duration-500 hover:scale-[1.01]"
                            style={{ transform: "perspective(1200px) rotateY(-6deg) rotateX(4deg) scale(1.01)" }}
                        >
                            {/* Algorithm Category Switcher Pills */}
                            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-subtle overflow-x-auto">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono uppercase font-bold text-faint mr-1">Trending:</span>
                                    {rankedDatasets.slice(0, 4).map((ds, idx) => (
                                        <button
                                            key={ds.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedIndex(idx);
                                                setIsAutoPlaying(false);
                                            }}
                                            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shrink-0 ${
                                                selectedIndex === idx
                                                    ? "bg-accent text-white shadow-accent-sm"
                                                    : "bg-card-subtle hover:bg-card-hover text-muted hover:text-primary border border-subtle"
                                            }`}
                                        >
                                            <span>{ds.icon}</span>
                                            <span>{ds.domainCategory.toUpperCase()}</span>
                                            {idx === 0 && <span className="text-[9px] px-1.5 py-0.5 rounded status-badge-amber ml-0.5 font-mono">#1</span>}
                                        </button>
                                    ))}
                                </div>

                                <span className="text-[10px] font-bold text-accent-gradient shrink-0">
                                    Rank #{activeDataset.rank || (selectedIndex + 1)}
                                </span>
                            </div>

                            {/* Dynamic Mock Search Bar */}
                            <div className="flex items-center bg-input rounded-2xl px-4 py-3 border border-subtle mb-4 shadow-inner">
                                <span className="text-accent-to mr-2.5 text-xs">✦</span>
                                <div className="text-xs sm:text-sm text-primary font-medium flex-1 truncate">
                                    {activeDataset.query}
                                </div>
                                <Link
                                    href={`/explore?q=${encodeURIComponent(activeDataset.query)}`}
                                    className="px-3 py-1 text-xs font-bold rounded-xl bg-accent text-white shadow-accent-sm hover:brightness-110 transition shrink-0"
                                >
                                    Explore
                                </Link>
                            </div>

                            {/* Popularity Algorithm Badge */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-accent-subtle text-accent-gradient border border-accent uppercase tracking-wider">
                                    {activeDataset.trendingBadge || `🔥 Ranked #${activeDataset.rank || 1} Popular Dataset`}
                                </span>
                                <span className="text-[11px] font-semibold text-muted">
                                    Popularity Score: <strong className="text-status-emerald">{activeDataset.popularityScore || 95}/100</strong>
                                </span>
                            </div>

                            {/* Top Matched Popular Dataset Card */}
                            <div className="bg-card-solid rounded-2xl border border-subtle p-4 mb-4 shadow-sm flex flex-col sm:flex-row gap-4">
                                <div className="w-full sm:w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-subtle shrink-0 flex items-center justify-center text-4xl shadow-inner">
                                    {activeDataset.icon}
                                </div>
                                <div className="flex-1 flex flex-col justify-center min-w-0">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <h4 className="text-primary font-bold text-base truncate">
                                            {activeDataset.title}
                                        </h4>
                                        <span className="px-2.5 py-0.5 rounded-full status-badge-emerald text-[10px] font-bold border shrink-0">
                                            {activeDataset.matchScore}% Match
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted leading-relaxed line-clamp-2 mb-2.5">
                                        {activeDataset.description}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                                        <span className="px-2 py-0.5 rounded-md bg-card-subtle text-secondary font-medium border border-subtle">
                                            {activeDataset.modality}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-card-subtle text-secondary font-medium border border-subtle">
                                            {activeDataset.size}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md bg-card-subtle text-secondary font-medium border border-subtle truncate max-w-[120px]">
                                            {activeDataset.source}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* 3 Metrics Cards */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-card-solid rounded-xl p-3 border border-subtle">
                                    <div className="text-[10px] text-muted font-semibold uppercase">Compatible Models</div>
                                    <div className="mt-1.5 space-y-1">
                                        {activeDataset.models.slice(0, 2).map((m) => (
                                            <div key={m.name} className="px-2 py-0.5 bg-card-subtle rounded text-[10px] font-semibold text-secondary flex justify-between">
                                                <span className="truncate max-w-[70px]">{m.name}</span>
                                                <span className="text-status-emerald font-bold">{m.match}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-card-solid rounded-xl p-3 border border-subtle flex flex-col items-center justify-center text-center">
                                    <div className="text-[10px] text-muted font-semibold uppercase">Hardware VRAM</div>
                                    <div className="text-base font-black text-status-cyan mt-1">{activeDataset.hardwareVram}</div>
                                    <span className="text-[9px] text-faint truncate max-w-full">{activeDataset.recommendedGpu.split("/")[0]}</span>
                                </div>

                                <div className="bg-card-solid rounded-xl p-3 border border-subtle flex flex-col items-center justify-center text-center">
                                    <div className="text-[10px] text-muted font-semibold uppercase">Roadmap</div>
                                    <div className="text-base font-black text-status-violet mt-1">{activeDataset.roadmapPhases} Phases</div>
                                    <span className="text-[9px] text-faint">Production Guide</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* ── TRUSTED SOURCES MARQUEE ──────────────────────────────── */}
            <section className="border-y border-subtle bg-card-subtle py-10 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted mb-6">
                        Seamlessly aggregating intelligence from trusted AI ecosystems
                    </p>
                    <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8">
                        {[
                            { name: "Kaggle", icon: "k", color: "text-status-blue" },
                            { name: "Hugging Face", icon: "🤗", color: "" },
                            { name: "arXiv", icon: "a", color: "text-status-rose" },
                            { name: "Papers With Code", icon: "📄", color: "text-status-emerald" },
                            { name: "UCI Machine Learning", icon: "UCI", color: "text-status-amber" },
                            { name: "GitHub AI Repos", icon: "GH", color: "text-status-violet" },
                        ].map((src) => (
                            <div
                                key={src.name}
                                className="flex items-center gap-2.5 px-4 py-2 rounded-xl border border-subtle bg-card hover:bg-card-hover transition-all text-xs sm:text-sm font-bold text-secondary shadow-sm"
                            >
                                <span className={`font-mono font-black ${src.color}`}>{src.icon}</span>
                                <span>{src.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION: HOW IT WORKS ────────────────────────────────── */}
            <section id="how-it-works" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                    <span className="px-3.5 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-accent-subtle text-accent-gradient border border-accent">
                        4-Step AI Pipeline
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-primary">
                        From project idea to trained model in minutes
                    </h2>
                    <p className="text-sm sm:text-base text-muted">
                        Our intelligent RAG system breaks down your query, matches high-quality datasets, identifies model weights, and generates a structured deployment roadmap.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
                    {[
                        {
                            step: "01",
                            title: "Describe Your Goal",
                            text: "Type your problem in natural language or question format.",
                            icon: "💬",
                            badge: "Query Parser",
                        },
                        {
                            step: "02",
                            title: "Multi-Source Search",
                            text: "Simultaneous scanning across Kaggle, Hugging Face, and arXiv.",
                            icon: "🔍",
                            badge: "Hybrid Search",
                        },
                        {
                            step: "03",
                            title: "AI Synthesis & Ranking",
                            text: "Evidence-grounded matching scores and hardware estimates.",
                            icon: "⚡",
                            badge: "AI Ranking",
                        },
                        {
                            step: "04",
                            title: "Follow the Roadmap",
                            text: "Actionable phases from data preparation to inference API.",
                            icon: "🗺️",
                            badge: "Interactive Path",
                        },
                    ].map((s) => (
                        <div
                            key={s.step}
                            className="rounded-3xl p-6 border border-subtle bg-card hover:bg-card-hover transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between shadow-sm group"
                        >
                            <div>
                                <div className="flex items-center justify-between mb-5">
                                    <div className="w-12 h-12 rounded-2xl bg-accent-subtle border border-accent flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                                        {s.icon}
                                    </div>
                                    <span className="text-xs font-mono font-bold text-faint group-hover:text-accent-to transition">
                                        STEP {s.step}
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-accent-to">
                                    {s.badge}
                                </span>
                                <h3 className="text-lg font-bold text-primary mt-1 mb-2">{s.title}</h3>
                                <p className="text-xs text-muted leading-relaxed">{s.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── SECTION: CORE FEATURES BENTO GRID ────────────────────── */}
            <section className="py-20 border-t border-subtle bg-card-subtle relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
                        <span className="px-3.5 py-1 rounded-full text-xs font-bold tracking-widest uppercase bg-accent-subtle text-accent-gradient border border-accent">
                            Powerful Capabilities
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-primary">
                            Everything you need to accelerate your AI workflow
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                 title: "Multi-Model & Dataset Benchmark Lab",
                                 text: "Head-to-head comparison engine evaluating accuracy, FP32/FP16 VRAM sizing, inference latencies, and commercial licensing rights across up to 4 pinned assets.",
                                 icon: "⚖️",
                            },
                            {
                                 title: "Pipeline & Implementation Roadmap",
                                 text: "Automated ML Engineer generating 5-phase engineering plans, domain preprocessing protocols, and production-ready PyTorch & FastAPI starter scripts.",
                                 icon: "🛠️",
                            },
                            {
                                 title: "VRAM & Hardware Profiling",
                                 text: "Hardware requirement calculations and training cost estimates for NVIDIA T4, RTX 3090/4090, A10G, and A100 GPUs across RunPod, Lambda Labs, and AWS.",
                                 icon: "⚡",
                            },
                            {
                                title: "Interactive Project Roadmaps",
                                text: "Step-by-step guidance covering data collection, cleaning, baseline training, and quantized deployment.",
                                icon: "🛣️",
                            },
                            {
                                title: "Dataset Comparison & Score Breakdown",
                                text: "Compare up to 4 datasets side-by-side with dimensional score breakdowns across task, modality, and domain.",
                                icon: "📊",
                            },
                            {
                                title: "Multi-Theme & Custom Accents",
                                text: "Personalize your workspace with dynamic themes and 4 custom accent color palettes.",
                                icon: "🎨",
                            },
                        ].map((f) => (
                            <div
                                key={f.title}
                                className="rounded-3xl p-7 border border-subtle bg-card hover:bg-card-hover transition-all duration-300 hover:shadow-xl space-y-4"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-card-solid border border-subtle flex items-center justify-center text-2xl shadow-sm">
                                    {f.icon}
                                </div>
                                <h3 className="text-lg font-bold text-primary">{f.title}</h3>
                                <p className="text-xs sm:text-sm text-muted leading-relaxed">{f.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── SECTION: ABOUT THE CREATOR & PROJECT ─────────────────── */}
            <section id="about" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="rounded-3xl border border-subtle glass-card p-8 sm:p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-accent opacity-15 blur-3xl pointer-events-none" />
                    
                    <div className="grid lg:grid-cols-[1fr_2fr] gap-8 items-center relative z-10">
                        <div className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-widest text-accent-to">
                                Open Source & Curated
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-black text-primary">About AI Dataset Explorer</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="p-5 rounded-2xl bg-card-solid border border-subtle shadow-xs">
                                <p className="text-sm text-secondary leading-relaxed">
                                    AI Dataset Explorer was created by <strong className="text-primary font-semibold">Hammad Ali Tariq</strong> to streamline machine learning discovery. By unifying datasets, model checkpoints, feasibility heuristics, and roadmaps, builders can focus on innovation rather than hunting across fragmented repositories.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5 pt-1">
                                <span className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-card-solid border border-subtle text-secondary shadow-xs">Next.js 16 (App Router)</span>
                                <span className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-card-solid border border-subtle text-secondary shadow-xs">Tailwind CSS</span>
                                <span className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-card-solid border border-subtle text-secondary shadow-xs">NextAuth.js</span>
                                <span className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-card-solid border border-subtle text-secondary shadow-xs">Gemini RAG Synthesis</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── BOTTOM CTA BANNER ────────────────────────────────────── */}
            <section className="pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="rounded-3xl bg-accent p-8 sm:p-12 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                    <div className="relative z-10 space-y-2 text-center md:text-left">
                        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                            Ready to discover your next AI breakthrough?
                        </h2>
                        <p className="text-white/80 text-sm max-w-xl">
                            Explore thousands of curated datasets and models with instant AI compatibility analysis.
                        </p>
                    </div>
                    <div className="relative z-10 shrink-0 flex items-center gap-3">
                        <Link
                            href="/explore"
                            className="px-7 py-3.5 bg-white text-slate-900 font-bold rounded-2xl text-sm shadow-xl hover:bg-slate-100 active:scale-95 transition-all"
                        >
                            Open Studio Now →
                        </Link>
                    </div>
                </div>
            </section>

            {/* Reusable Footer */}
            <Footer />
        </div>
    );
}
