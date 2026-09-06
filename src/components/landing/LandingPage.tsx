"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTheme } from "@/context/ThemeContext";

interface DomainPreset {
  query: string;
  primaryTask: string;
  primaryTaskSub: string;
  modality: string;
  modalitySub: string;
  constraintFit: string;
  constraintFitSub: string;
  verification: string;
  verificationSub: string;
}

const DOMAIN_PRESETS: Record<string, DomainPreset> = {
  "3D Medical Imaging": {
    query: "Detect tumors in 3D MRI scans with limited labeled data under 12GB VRAM and validate longitudinal progression metrics",
    primaryTask: "Classification + Progress",
    primaryTaskSub: "Dice & Progression Score",
    modality: "3D MRI + Clinical EHR",
    modalitySub: "T1w/T2-FLAIR + Tabular",
    constraintFit: "≤ 12GB VRAM · Few-Shot",
    constraintFitSub: "Ampere/Ada Architecture",
    verification: "Topological Graph",
    verificationSub: "Validated (94.2% Confs)",
  },
  "Multimodal Fusion": {
    query: "Align clinical tabular EHR biomarkers with chest CT volume tensors using cross-attention under strict HIPAA compliance",
    primaryTask: "Cross-Modal Alignment",
    primaryTaskSub: "InfoNCE Loss + Contrastive",
    modality: "Chest CT + Clinical EHR",
    modalitySub: "3D Tensor + Tabular",
    constraintFit: "≤ 16GB VRAM · Zero-Shot",
    constraintFitSub: "Ada / Hopper Architecture",
    verification: "Semantic Coherence",
    verificationSub: "Validated (96.1% Confs)",
  },
  "Time-Series Forecasting": {
    query: "Predict ICU patient telemetry shock events 6 hours in advance with irregular missing data under 8GB VRAM",
    primaryTask: "Shock Event Prediction",
    primaryTaskSub: "AUROC & Lead-Time Index",
    modality: "ICU Telemetry Stream",
    modalitySub: "Multivariate Continuous",
    constraintFit: "≤ 8GB VRAM · Low Latency",
    constraintFitSub: "Edge Tensor Architecture",
    verification: "Temporal Coherence",
    verificationSub: "Validated (95.4% Confs)",
  },
  "Sparse-Label NLP": {
    query: "Few-shot clinical trial entity extraction from unstructured physician notes with fewer than 200 labeled examples",
    primaryTask: "Entity Extraction (NER)",
    primaryTaskSub: "Token-F1 & Exact Match",
    modality: "Unstructured Notes",
    modalitySub: "Clinical NLP & Transcripts",
    constraintFit: "≤ 10GB VRAM · Few-Shot",
    constraintFitSub: "PEFT / LoRA Adapter",
    verification: "Lexical Precision",
    verificationSub: "Validated (93.8% Confs)",
  },
  "Edge Robotics": {
    query: "Real-time 6-DoF robotic arm grasp pose estimation using low-cost depth cameras on Jetson Orin Nano (8GB)",
    primaryTask: "6-DoF Pose Estimation",
    primaryTaskSub: "ADD-S & Latency Floor",
    modality: "RGB-D Depth Stream",
    modalitySub: "Point Cloud & Depth Frames",
    constraintFit: "≤ 8GB VRAM · 60 FPS",
    constraintFitSub: "Jetson Orin Nano / TensorRT",
    verification: "Spatial Grounding",
    verificationSub: "Validated (97.2% Confs)",
  },
};

interface NodeData {
  id: string;
  name: string;
  sub: string;
  metric: string;
  vram?: string;
  description: string;
}

const NODES_DATA: Record<string, NodeData> = {
  dataset: {
    id: "dataset",
    name: "ADNI-3 (845 Sub)",
    sub: "Standardized 3D NIfTI cohort",
    metric: "94% FIT",
    vram: "3D Volumetric NIfTI / DICOM",
    description: "Multi-site longitudinal 3D MRI, PET, and CSF telemetry with validated consent protocols.",
  },
  model: {
    id: "model",
    name: "Swin UNETR 3D",
    sub: "Shifted-Window Transformer",
    metric: "9.4GB PEAK",
    vram: "9.4 GB / 12.0 GB (78.3%)",
    description: "Hierarchical 3D medical image segmentation backbone with shifted window self-attention.",
  },
  paper: {
    id: "paper",
    name: "CVPR '24 Fusion",
    sub: "Multimodal Neuro Repr.",
    metric: "342 CITES",
    vram: "Peer-Reviewed Methodology",
    description: "Peer-reviewed methodology for fusing structural volumetric scans with clinical tabular markers.",
  },
  benchmark: {
    id: "benchmark",
    name: "BraTS / MedMNIST",
    sub: "Standardized 3D Testbed",
    metric: "0.884 DICE",
    vram: "Multi-Scanner Cohort Validation",
    description: "Standardized volumetric benchmark validating high Dice accuracy across multi-scanner cohorts.",
  },
  pipeline: {
    id: "pipeline",
    name: "MONAI + Torch",
    sub: "Native PyTorch 2.4",
    metric: "OPTIMIZED",
    vram: "AMP FP16 Mixed Precision",
    description: "Production medical imaging preprocessing, affine transforms, and distributed training harnesses.",
  },
  execPlan: {
    id: "execPlan",
    name: "8 Step Spec",
    sub: "ONNX / TRT Deployment",
    metric: "1-CLICK RUN",
    vram: "Docker / TensorRT Target",
    description: "From raw DICOM ingestion to quantized FP16 TensorRT inference runtime container.",
  },
  core: {
    id: "core",
    name: "3D MRI TUMOR PROBLEM",
    sub: "Target: ≤ 12GB VRAM",
    metric: "COHERENCE 94.2%",
    vram: "9.4 GB Peak Estimated",
    description: "Primary user problem statement decomposed into verified multi-modal topological constraints.",
  },
};

export default function LandingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();

  const [selectedDomain, setSelectedDomain] = useState<string>("3D Medical Imaging");
  const [problemQuery, setProblemQuery] = useState<string>(
    DOMAIN_PRESETS["3D Medical Imaging"].query
  );
  const [isRetrieving, setIsRetrieving] = useState<boolean>(false);
  const [activeNodeKey, setActiveNodeKey] = useState<string>("model");
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const activePreset = DOMAIN_PRESETS[selectedDomain] || DOMAIN_PRESETS["3D Medical Imaging"];
  const activeNode = NODES_DATA[activeNodeKey] || NODES_DATA.model;

  const handleDomainSelect = (domain: string) => {
    setSelectedDomain(domain);
    const preset = DOMAIN_PRESETS[domain];
    if (preset) {
      setProblemQuery(preset.query);
    }
  };

  const handleSynthesize = () => {
    setIsRetrieving(true);
    setTimeout(() => {
      setIsRetrieving(false);
      router.push(`/explore?q=${encodeURIComponent(problemQuery)}`);
    }, 500);
  };

  const handleCopyPipeline = () => {
    const code = `# AI Dataset Explorer - Auto-Synthesized MONAI Pipeline
import torch
from monai.networks.nets import SwinUNETR
from monai.transforms import Compose, LoadImaged, Spacingd, ScaleIntensityd

# Verified hardware ceiling: <= 12GB VRAM
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
model = SwinUNETR(
    img_size=(96, 96, 96),
    in_channels=1,
    out_channels=3,
    feature_size=48,
    use_checkpoint=True, # Saves ~3.2GB VRAM
).to(device)

print("Pipeline initialized successfully. Ready for ADNI-3 dataset.")`;
    navigator.clipboard.writeText(code);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2200);
  };

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <div className="bg-surface-container-lowest text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col selection:bg-cyan-radiant/25 selection:text-cyan-radiant overflow-x-clip">
      {/* ============================================================ */}
      {/* 0. FIXED TOP HUD NAVIGATION BAR                              */}
      {/* ============================================================ */}
      <header className="fixed top-0 left-0 w-full z-50 bg-void-surface/90 backdrop-blur-xl border-b border-border-dim shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <Link className="flex items-center gap-2.5 group" href="/">
              <div className="relative h-9 w-9 rounded-lg overflow-hidden flex items-center justify-center p-0.5 bg-void-base border border-border-dim group-hover:border-primary transition-colors shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="AI Dataset Explorer Logo"
                  className="h-full w-auto object-contain"
                  src="/logo-stitch.png"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-headline-sm text-[17px] text-text-primary font-bold tracking-tight group-hover:text-primary transition-colors">
                    AI Dataset Explorer
                  </span>
                  <span className="hidden xl:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-void-elevated border border-border-dim font-label-mono-sm text-[10px] text-primary uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-radiant animate-pulse" />
                    v2.4 HYBRID RETRIEVAL
                  </span>
                </div>
                <span className="font-body-sm text-[11px] text-text-muted hidden sm:block">
                  Discovery · Benchmarks · Roadmaps
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 h-full">
            <Link
              aria-current="page"
              className="h-full flex items-center font-body-md transition-colors px-1 text-primary border-b-2 border-primary font-semibold text-[14px]"
              href="/"
            >
              Home
            </Link>
            <Link
              className="h-full flex items-center font-body-md text-[14px] text-on-surface-variant hover:text-primary transition-colors px-1 font-medium"
              href="/explore"
            >
              Explore Studio
            </Link>
            <Link
              className="h-full flex items-center font-body-md text-[14px] text-on-surface-variant hover:text-primary transition-colors px-1 font-medium"
              href="/benchmark"
            >
              Benchmark &amp; Compare Lab
            </Link>
            <Link
              className="h-full flex items-center font-body-md text-[14px] text-on-surface-variant hover:text-primary transition-colors px-1 font-medium"
              href="/roadmap"
            >
              Pipeline &amp; Implementation Roadmap
            </Link>
          </nav>

          {/* Action Hub */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live Latency Telemetry */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-void-base border border-border-dim font-label-mono text-[11px] text-text-muted shadow-inner">
              <span className="w-2 h-2 rounded-full bg-tertiary" />
              <span className="text-tertiary font-bold">42ms</span>
              <span className="opacity-70">API</span>
            </div>

            {/* Dark/Light Mode Button */}
            <button
              aria-label="Toggle dark or light theme"
              className="p-2 rounded-lg bg-void-elevated border border-border-dim text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
              onClick={toggleTheme}
              title={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] block">
                {resolvedTheme === "dark" ? "light_mode" : "dark_mode"}
              </span>
            </button>

            {/* Sign In / User Account */}
            {session?.user ? (
              <Link
                aria-label="Account Settings"
                className="w-8 h-8 rounded-full bg-primary/20 border border-primary/50 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors text-xs font-bold"
                href="/settings"
                title={session.user.name || session.user.email || "Account"}
              >
                {session.user.name ? session.user.name.charAt(0).toUpperCase() : <span className="material-symbols-outlined text-[18px]">person</span>}
              </Link>
            ) : (
              <Link
                className="hidden sm:inline-block font-body-md text-[14px] text-on-surface-variant hover:text-on-surface hover:text-primary transition-colors px-2 py-1"
                href="/login"
              >
                Sign In
              </Link>
            )}

            {/* Radiant Launch Studio CTA */}
            <Link
              className="relative inline-flex items-center justify-center p-[1px] rounded overflow-hidden group shadow-md"
              href="/explore"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-cyan-radiant via-primary to-purple-bright opacity-80 group-hover:opacity-100 transition-opacity" />
              <span className="relative px-3.5 py-1.5 rounded-[calc(0.125rem-1px)] bg-void-base text-primary font-headline-sm text-[12px] font-bold tracking-wide uppercase transition-colors group-hover:bg-void-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px]">bolt</span>
                <span>Launch Studio</span>
              </span>
            </Link>

            {/* Mobile Hamburger Toggle Button */}
            <button
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle mobile menu"
              className="lg:hidden p-2 rounded-lg bg-void-elevated border border-border-dim text-on-surface-variant hover:text-on-surface transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
            >
              <span className="material-symbols-outlined text-[22px] block">
                {isMobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden bg-void-surface border-b border-border-dim px-4 py-4 shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
            <Link
              className="px-3 py-2 rounded-md font-medium text-primary bg-primary/10 border border-primary/30"
              href="/"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              className="px-3 py-2 rounded-md font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container"
              href="/explore"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Explore Studio
            </Link>
            <Link
              className="px-3 py-2 rounded-md font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container"
              href="/benchmark"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Benchmark &amp; Compare Lab
            </Link>
            <Link
              className="px-3 py-2 rounded-md font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container"
              href="/roadmap"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Pipeline &amp; Implementation Roadmap
            </Link>
            {!session?.user && (
              <Link
                className="px-3 py-2 rounded-md font-medium text-on-surface-variant hover:text-primary hover:bg-surface-container"
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
            <Link
              className="w-full text-center py-2.5 rounded bg-primary text-on-primary font-bold uppercase text-xs tracking-wider"
              href="/explore"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Launch Studio Now →
            </Link>
          </div>
        )}
      </header>

      {/* ============================================================ */}
      {/* MAIN CONTENT WRAPPER                                         */}
      {/* ============================================================ */}
      <main className="w-full pt-20 bg-surface-container-lowest flex-1">
        <div className="flex flex-col w-full">
          {/* Ambient Optical Emitters */}
          <div className="relative w-full overflow-hidden">
            <div className="absolute -top-32 left-1/4 w-[600px] h-[350px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-20 right-10 w-[500px] h-[400px] bg-purple-bright/10 rounded-full blur-[160px] pointer-events-none" />

            {/* ============================================================ */}
            {/* 1. HERO SECTION (2-Column Grid Desktop Wide)                 */}
            {/* ============================================================ */}
            <section className="w-full pt-8 sm:pt-12 pb-16 relative z-10">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10 items-start">
                {/* Left Column: Copy, Glass Input, Decomposition */}
                <div className="xl:col-span-6 flex flex-col gap-6">
                  {/* Status Pill */}
                  <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded bg-surface-container-high shadow-sm border border-border-dim">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-radiant opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                    </span>
                    <span className="font-label-mono-sm text-[10px] text-text-primary tracking-wider uppercase font-semibold">
                      AI RESEARCH OPERATING SYSTEM · v2.4 HYBRID RETRIEVAL
                    </span>
                    <span className="text-text-muted font-label-mono-sm text-[10px]">/</span>
                    <span className="font-label-mono-sm text-[10px] text-tertiary font-semibold">
                      15,200+ BENCHMARKED ARTIFACTS
                    </span>
                  </div>

                  {/* Hero Headline */}
                  <div className="flex flex-col gap-3">
                    <h1 className="font-headline-xl text-3xl sm:text-4xl lg:text-[44px] lg:leading-[52px] text-text-primary uppercase tracking-tight font-extrabold">
                      TURN AI PROBLEMS INTO{" "}
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-bright via-cyan-radiant to-tertiary">
                        RESEARCH-READY
                      </span>{" "}
                      SOLUTIONS.
                    </h1>
                    <p className="font-body-lg text-sm sm:text-base text-text-muted max-w-2xl leading-relaxed">
                      Describe your problem in plain language. AI Dataset Explorer extracts tasks, constraints, modality, and compute limits — then synthesizes verified datasets, pretrained backbones, research papers, and reproducible code.
                    </p>
                  </div>

                  {/* Glassmorphism Problem Input Box */}
                  <div className="bg-surface-container/80 backdrop-blur-md rounded-xl p-4 sm:p-5 shadow-xl border border-border-dim flex flex-col gap-4">
                    <div className="flex items-center justify-between font-label-mono-sm text-[11px] text-text-muted">
                      <span className="flex items-center gap-1.5 text-primary font-bold">
                        <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                        <span>NEURAL PROMPT SYNTHESIZER</span>
                      </span>
                      <span className="text-text-muted font-mono">PARSER: TENSOR-LLM-4</span>
                    </div>

                    <div className="relative">
                      <textarea
                        aria-label="Enter AI Problem Query"
                        className="w-full bg-void-surface text-text-primary font-code-md text-xs sm:text-sm p-3.5 pb-12 rounded-lg outline-none border border-border-dim focus:border-primary shadow-inner placeholder:text-text-muted/60 resize-none transition-colors leading-relaxed"
                        id="problemQueryInput"
                        onChange={(e) => setProblemQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSynthesize();
                          }
                        }}
                        placeholder="Detect tumors in 3D MRI scans with limited labeled data under 12GB VRAM..."
                        rows={3}
                        value={problemQuery}
                      />
                      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
                        <button
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-primary hover:bg-cyan-radiant text-on-primary font-headline-sm text-xs font-bold uppercase transition-all shadow-md active:scale-95 disabled:opacity-75"
                          disabled={isRetrieving}
                          id="synthesizeBtn"
                          onClick={handleSynthesize}
                          type="button"
                        >
                          {isRetrieving ? (
                            <>
                              <span className="material-symbols-outlined text-[14px] animate-spin">
                                progress_activity
                              </span>
                              <span>Synthesizing...</span>
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[14px]">bolt</span>
                              <span>Explore Corpus →</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Quick Domain Prompt Chips */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="font-label-mono-sm text-[10px] text-text-muted mr-1 font-semibold uppercase">
                        QUICK DOMAINS:
                      </span>
                      {Object.keys(DOMAIN_PRESETS).map((domain) => {
                        const isSelected = selectedDomain === domain;
                        return (
                          <button
                            className={`px-2.5 py-1 rounded font-label-mono-sm text-[11px] transition-all cursor-pointer ${
                              isSelected
                                ? "bg-primary/20 text-primary border border-primary/60 shadow-sm font-bold"
                                : "bg-void-elevated hover:bg-surface-bright text-on-surface-variant hover:text-text-primary border border-border-dim/40 font-medium"
                            }`}
                            key={domain}
                            onClick={() => handleDomainSelect(domain)}
                            type="button"
                          >
                            {domain}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Real-Time AI Problem Decomposition Panel */}
                  <div className="bg-surface-container-low rounded-xl p-4 sm:p-5 shadow-md border border-border-dim">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-dim/60">
                      <div className="flex items-center gap-2 font-label-mono text-[11px] text-text-primary font-semibold">
                        <span className="w-2 h-2 rounded-full bg-cyan-radiant" />
                        <span>UNDERSTANDING YOUR PROBLEM</span>
                        <span className="text-tertiary hidden sm:inline">(LATENCY 42ms)</span>
                      </div>
                      <span className="font-label-mono-sm text-[10px] text-secondary bg-secondary-container/40 px-2 py-0.5 rounded font-bold">
                        ENTROPY: 0.12
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      <div className="bg-void-surface p-2.5 rounded-lg border border-border-dim/50">
                        <span className="font-label-mono-sm text-[10px] text-text-muted block font-semibold">
                          PRIMARY TASK
                        </span>
                        <span className="font-headline-sm text-xs sm:text-[13px] text-primary font-bold mt-1 block truncate" title={activePreset.primaryTask}>
                          {activePreset.primaryTask}
                        </span>
                        <span className="font-label-mono-sm text-[9px] text-text-muted mt-0.5 block truncate">
                          {activePreset.primaryTaskSub}
                        </span>
                      </div>
                      <div className="bg-void-surface p-2.5 rounded-lg border border-border-dim/50">
                        <span className="font-label-mono-sm text-[10px] text-text-muted block font-semibold">
                          MODALITY
                        </span>
                        <span className="font-headline-sm text-xs sm:text-[13px] text-secondary font-bold mt-1 block truncate" title={activePreset.modality}>
                          {activePreset.modality}
                        </span>
                        <span className="font-label-mono-sm text-[9px] text-text-muted mt-0.5 block truncate">
                          {activePreset.modalitySub}
                        </span>
                      </div>
                      <div className="bg-void-surface p-2.5 rounded-lg border border-border-dim/50">
                        <span className="font-label-mono-sm text-[10px] text-text-muted block font-semibold">
                          CONSTRAINT FIT
                        </span>
                        <span className="font-headline-sm text-xs sm:text-[13px] text-tertiary font-bold mt-1 block truncate" title={activePreset.constraintFit}>
                          {activePreset.constraintFit}
                        </span>
                        <span className="font-label-mono-sm text-[9px] text-text-muted mt-0.5 block truncate">
                          {activePreset.constraintFitSub}
                        </span>
                      </div>
                      <div className="bg-void-surface p-2.5 rounded-lg border border-border-dim/50">
                        <span className="font-label-mono-sm text-[10px] text-text-muted block font-semibold">
                          VERIFICATION
                        </span>
                        <span className="font-headline-sm text-xs sm:text-[13px] text-text-primary font-bold mt-1 block truncate" title={activePreset.verification}>
                          {activePreset.verification}
                        </span>
                        <span className="font-label-mono-sm text-[9px] text-tertiary mt-0.5 block truncate">
                          {activePreset.verificationSub}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Interactive 3D Topological Graph Inspector */}
                <div className="xl:col-span-6 flex flex-col gap-4">
                  <div className="relative w-full h-[520px] sm:h-[580px] bg-void-surface rounded-xl overflow-hidden shadow-2xl border border-border-dim flex flex-col justify-between p-4">
                    {/* Top HUD Bar */}
                    <div className="flex items-center justify-between z-20 font-label-mono-sm text-[10px] sm:text-[11px] text-text-muted bg-void-surface/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border-dim/60">
                      <div className="flex items-center gap-2">
                        <span className="text-primary font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-cyan-radiant animate-pulse" />
                          TOPOLOGICAL GRAPH INSPECTOR
                        </span>
                        <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-surface-container font-label-mono-sm text-[9px] text-text-primary">
                          EGO-CENTRIC
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-tertiary" /> 9 NODES
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-bright" /> 14 EDGES
                        </span>
                        <span className="text-cyan-radiant font-bold">94.2% COHERENCE</span>
                      </div>
                    </div>

                    {/* Center Interactive Network SVG Visualization */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                      <svg className="w-full h-full max-h-[500px]" id="universeSvg" viewBox="0 0 700 520">
                        <defs>
                          <radialGradient cx="50%" cy="50%" id="centerGlow" r="50%">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                          </radialGradient>
                          <radialGradient cx="50%" cy="50%" id="purpleGlow" r="50%">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                          </radialGradient>
                          <linearGradient id="edgeGrad1" x1="0%" x2="100%" y1="0%" y2="100%">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.8" />
                          </linearGradient>
                        </defs>

                        {/* Coordinate Grid Background */}
                        <g opacity="0.15" stroke="#38455e" strokeWidth="0.8">
                          <line strokeDasharray="3,3" x1="100" x2="100" y1="0" y2="520" />
                          <line strokeDasharray="3,3" x1="250" x2="250" y1="0" y2="520" />
                          <line strokeDasharray="3,3" x1="450" x2="450" y1="0" y2="520" />
                          <line strokeDasharray="3,3" x1="600" x2="600" y1="0" y2="520" />
                          <line strokeDasharray="3,3" x1="0" x2="700" y1="130" y2="130" />
                          <line strokeDasharray="3,3" x1="0" x2="700" y1="260" y2="260" />
                          <line strokeDasharray="3,3" x1="0" x2="700" y1="390" y2="390" />
                          <circle
                            cx="350"
                            cy="260"
                            fill="none"
                            r="160"
                            stroke="#22d3ee"
                            strokeDasharray="4,6"
                            strokeOpacity="0.2"
                          />
                          <circle
                            cx="350"
                            cy="260"
                            fill="none"
                            r="230"
                            stroke="#a855f7"
                            strokeDasharray="2,4"
                            strokeOpacity="0.15"
                          />
                        </g>

                        {/* Synaptic Interconnect Vectors */}
                        <g strokeLinecap="round" strokeWidth="1.6">
                          {/* Problem -> Dataset */}
                          <line
                            className="animate-pulse"
                            stroke="url(#edgeGrad1)"
                            strokeDasharray="5,3"
                            x1="350"
                            x2="160"
                            y1="260"
                            y2="140"
                          />
                          {/* Problem -> Model */}
                          <line stroke="#06b6d4" strokeOpacity="0.7" x1="350" x2="540" y1="260" y2="150" />
                          {/* Problem -> Paper */}
                          <line stroke="#8b5cf6" strokeOpacity="0.7" x1="350" x2="530" y1="260" y2="380" />
                          {/* Problem -> Benchmark */}
                          <line stroke="#4edea3" strokeOpacity="0.7" x1="350" x2="180" y1="260" y2="380" />
                          {/* Problem -> Implementation */}
                          <line stroke="#22d3ee" strokeOpacity="0.8" x1="350" x2="350" y1="260" y2="80" />
                          {/* Cross Dependencies */}
                          <line stroke="#38455e" strokeDasharray="2,4" x1="160" x2="540" y1="140" y2="150" />
                          <line stroke="#38455e" strokeDasharray="2,4" x1="540" x2="530" y1="150" y2="380" />
                          <line stroke="#38455e" strokeDasharray="2,4" x1="180" x2="350" y1="380" y2="450" />
                          <line stroke="#38455e" strokeDasharray="2,4" x1="350" x2="530" y1="450" y2="380" />
                        </g>

                        {/* Orbit Nodes */}
                        {/* Node 1: DATASET */}
                        <g
                          aria-label="Dataset Node: ADNI-3"
                          className="cursor-pointer group transition-transform hover:scale-105"
                          onClick={() => setActiveNodeKey("dataset")}
                          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setActiveNodeKey("dataset")}
                          role="button"
                          tabIndex={0}
                          transform="translate(160, 140)"
                        >
                          <circle
                            fill="#0d1322"
                            r="36"
                            stroke={activeNodeKey === "dataset" ? "#22d3ee" : "#06b6d4"}
                            strokeWidth={activeNodeKey === "dataset" ? 3 : 1.5}
                          />
                          <circle fill="url(#centerGlow)" r="44" />
                          <text fill="#22d3ee" fontFamily="Space Grotesk" fontSize="11" fontWeight="700" textAnchor="middle" y="-5">
                            DATASET
                          </text>
                          <text fill="#94a3b8" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle" y="10">
                            ADNI-3 (845 Sub)
                          </text>
                          <text fill="#4edea3" fontFamily="JetBrains Mono" fontSize="7" textAnchor="middle" y="20">
                            94% FIT
                          </text>
                        </g>

                        {/* Node 2: MODEL */}
                        <g
                          aria-label="Model Node: Swin UNETR 3D"
                          className="cursor-pointer group transition-transform hover:scale-105"
                          onClick={() => setActiveNodeKey("model")}
                          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setActiveNodeKey("model")}
                          role="button"
                          tabIndex={0}
                          transform="translate(540, 150)"
                        >
                          <circle
                            fill="#0d1322"
                            r="36"
                            stroke={activeNodeKey === "model" ? "#c084fc" : "#8b5cf6"}
                            strokeWidth={activeNodeKey === "model" ? 3 : 1.5}
                          />
                          <circle fill="url(#purpleGlow)" r="44" />
                          <text fill="#d0bcff" fontFamily="Space Grotesk" fontSize="11" fontWeight="700" textAnchor="middle" y="-5">
                            MODEL
                          </text>
                          <text fill="#94a3b8" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle" y="10">
                            Swin UNETR 3D
                          </text>
                          <text fill="#4edea3" fontFamily="JetBrains Mono" fontSize="7" textAnchor="middle" y="20">
                            9.4GB PEAK
                          </text>
                        </g>

                        {/* Node 3: PAPER */}
                        <g
                          aria-label="Paper Node: CVPR 24"
                          className="cursor-pointer group transition-transform hover:scale-105"
                          onClick={() => setActiveNodeKey("paper")}
                          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setActiveNodeKey("paper")}
                          role="button"
                          tabIndex={0}
                          transform="translate(530, 380)"
                        >
                          <circle
                            fill="#0d1322"
                            r="34"
                            stroke={activeNodeKey === "paper" ? "#22d3ee" : "#38455e"}
                            strokeWidth={activeNodeKey === "paper" ? 2.5 : 1.5}
                          />
                          <text fill="#f8fafc" fontFamily="Space Grotesk" fontSize="11" fontWeight="700" textAnchor="middle" y="-5">
                            PAPER
                          </text>
                          <text fill="#94a3b8" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle" y="10">
                            CVPR &apos;24 Fusion
                          </text>
                          <text fill="#22d3ee" fontFamily="JetBrains Mono" fontSize="7" textAnchor="middle" y="20">
                            342 CITES
                          </text>
                        </g>

                        {/* Node 4: BENCHMARK */}
                        <g
                          aria-label="Benchmark Node: BraTS / MedMNIST"
                          className="cursor-pointer group transition-transform hover:scale-105"
                          onClick={() => setActiveNodeKey("benchmark")}
                          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setActiveNodeKey("benchmark")}
                          role="button"
                          tabIndex={0}
                          transform="translate(180, 380)"
                        >
                          <circle
                            fill="#0d1322"
                            r="34"
                            stroke={activeNodeKey === "benchmark" ? "#6ee7b7" : "#4edea3"}
                            strokeWidth={activeNodeKey === "benchmark" ? 2.5 : 1.5}
                          />
                          <text fill="#4edea3" fontFamily="Space Grotesk" fontSize="11" fontWeight="700" textAnchor="middle" y="-5">
                            BENCHMARK
                          </text>
                          <text fill="#94a3b8" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle" y="10">
                            BraTS / MedMNIST
                          </text>
                          <text fill="#d0bcff" fontFamily="JetBrains Mono" fontSize="7" textAnchor="middle" y="20">
                            0.884 DICE
                          </text>
                        </g>

                        {/* Node 5: PIPELINE */}
                        <g
                          aria-label="Pipeline Node: MONAI + Torch"
                          className="cursor-pointer group transition-transform hover:scale-105"
                          onClick={() => setActiveNodeKey("pipeline")}
                          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setActiveNodeKey("pipeline")}
                          role="button"
                          tabIndex={0}
                          transform="translate(350, 80)"
                        >
                          <circle
                            fill="#0d1322"
                            r="30"
                            stroke={activeNodeKey === "pipeline" ? "#38bdf8" : "#22d3ee"}
                            strokeWidth={activeNodeKey === "pipeline" ? 2.5 : 1.5}
                          />
                          <text fill="#22d3ee" fontFamily="Space Grotesk" fontSize="10" fontWeight="700" textAnchor="middle" y="-3">
                            PIPELINE
                          </text>
                          <text fill="#94a3b8" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle" y="11">
                            MONAI + Torch
                          </text>
                        </g>

                        {/* Node 6: EXEC PLAN */}
                        <g
                          aria-label="Execution Plan Node"
                          className="cursor-pointer group transition-transform hover:scale-105"
                          onClick={() => setActiveNodeKey("execPlan")}
                          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setActiveNodeKey("execPlan")}
                          role="button"
                          tabIndex={0}
                          transform="translate(350, 450)"
                        >
                          <circle
                            fill="#0d1322"
                            r="28"
                            stroke={activeNodeKey === "execPlan" ? "#c084fc" : "#8b5cf6"}
                            strokeWidth={activeNodeKey === "execPlan" ? 2.5 : 1.5}
                          />
                          <text fill="#d0bcff" fontFamily="Space Grotesk" fontSize="10" fontWeight="700" textAnchor="middle" y="-2">
                            EXEC PLAN
                          </text>
                          <text fill="#94a3b8" fontFamily="JetBrains Mono" fontSize="7" textAnchor="middle" y="10">
                            8 Step Spec
                          </text>
                        </g>

                        {/* Center Problem Core Node */}
                        <g
                          aria-label="Core Problem Center Node"
                          className="cursor-pointer group hover:scale-105 transition-transform"
                          onClick={() => setActiveNodeKey("core")}
                          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setActiveNodeKey("core")}
                          role="button"
                          tabIndex={0}
                          transform="translate(350, 260)"
                        >
                          <circle fill="url(#centerGlow)" r="52" />
                          <circle fill="#080d1a" r="44" stroke="#06b6d4" strokeWidth="2" />
                          <circle
                            className="animate-spin"
                            fill="none"
                            r="47"
                            stroke="#8b5cf6"
                            strokeDasharray="4,4"
                            strokeWidth="1"
                            style={{ transformOrigin: "0 0", animationDuration: "25s" }}
                          />
                          <text fill="#f8fafc" fontFamily="Space Grotesk" fontSize="11" fontWeight="700" textAnchor="middle" y="-8">
                            YOUR AI PROBLEM
                          </text>
                          <text fill="#22d3ee" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" textAnchor="middle" y="8">
                            3D MRI TUMOR
                          </text>
                          <text fill="#4edea3" fontFamily="JetBrains Mono" fontSize="8" textAnchor="middle" y="21">
                            VRAM: ≤12GB
                          </text>
                        </g>
                      </svg>
                    </div>

                    {/* Bottom Floating Telemetry Overlay */}
                    <div className="z-20 bg-void-elevated/95 backdrop-blur-md p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg border border-border-dim">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-label-mono-sm text-[9px] text-text-muted uppercase font-semibold">
                            Focal Entity
                          </span>
                          <span className="font-headline-sm text-xs sm:text-[13px] text-text-primary font-bold">
                            {activeNode.name}
                          </span>
                        </div>
                        <div className="h-6 w-px bg-surface-bright" />
                        <div className="flex flex-col">
                          <span className="font-label-mono-sm text-[9px] text-text-muted uppercase font-semibold">
                            Metric / Ceiling
                          </span>
                          <span className="font-label-mono text-[11px] text-tertiary font-bold">
                            {activeNode.vram || "9.4 GB / 12.0 GB (78.3%)"}
                          </span>
                        </div>
                      </div>
                      <Link
                        className="px-3 py-1.5 rounded bg-surface-container-high hover:bg-surface-bright text-primary font-label-mono-sm text-[11px] flex items-center justify-center gap-1.5 transition-colors border border-border-dim font-bold self-stretch sm:self-auto"
                        href="/benchmark"
                      >
                        <span className="material-symbols-outlined text-[14px]">tune</span>
                        <span>Adjust Constraints</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ============================================================ */}
          {/* 2. 'FROM PROBLEM → EVIDENCE → SOLUTION' 4-STAGE PIPELINE     */}
          {/* ============================================================ */}
          <section className="w-full py-16 bg-void-base relative border-y border-border-dim">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="font-label-mono-sm text-xs text-primary uppercase tracking-widest flex items-center gap-2 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-radiant animate-pulse" />
                    FOUR-STAGE DETERMINISTIC REASONING ENGINE
                  </div>
                  <h2 className="font-headline-lg text-2xl sm:text-3xl text-text-primary font-bold">
                    From Problem → Evidence → Solution
                  </h2>
                </div>
                <p className="font-body-sm text-sm text-text-muted max-w-md">
                  How our hybrid pipeline decodes unconstrained natural language queries into exact, mathematically constrained deep learning artifacts.
                </p>
              </div>

              {/* 4-Column Pipeline Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Stage 01 */}
                <div className="bg-surface-container-low rounded-xl p-6 flex flex-col justify-between shadow-md relative overflow-hidden group hover:bg-surface-container transition-all border border-border-dim min-h-[340px]">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none" />
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="font-label-mono text-[11px] text-primary bg-void-surface px-2.5 py-1 rounded border border-border-dim font-bold">
                        STAGE 01
                      </span>
                      <span className="material-symbols-outlined text-primary text-[22px]">psychology</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-headline-sm text-lg text-text-primary uppercase font-bold">
                        01. Understand
                      </h3>
                      <span className="font-label-mono-sm text-xs text-cyan-radiant font-semibold">
                        SEMANTIC &amp; CONSTRAINT PARSING
                      </span>
                      <p className="font-body-sm text-xs text-text-muted mt-2 leading-relaxed">
                        Clinical objectives, tensor dimensions, batch constraints, compute ceilings (e.g. 12GB VRAM), and license boundaries are decomposed into rigorous formal predicates.
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 mt-4 bg-void-surface/50 -mx-6 -mb-6 p-4 flex flex-col gap-1.5 border-t border-border-dim/40">
                    <span className="font-label-mono-sm text-[10px] text-text-muted font-semibold">PARSED KEYWORDS</span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-surface-container font-label-mono-sm text-[9px] text-text-primary">
                        Volumetric 3D
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface-container font-label-mono-sm text-[9px] text-text-primary">
                        Dice Metric
                      </span>
                      <span className="px-2 py-0.5 rounded bg-surface-container font-label-mono-sm text-[9px] text-text-primary">
                        &lt;12GB Budget
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stage 02 */}
                <div className="bg-surface-container-low rounded-xl p-6 flex flex-col justify-between shadow-md relative overflow-hidden group hover:bg-surface-container transition-all border border-border-dim min-h-[340px]">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-full pointer-events-none" />
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="font-label-mono text-[11px] text-secondary bg-void-surface px-2.5 py-1 rounded border border-border-dim font-bold">
                        STAGE 02
                      </span>
                      <span className="material-symbols-outlined text-secondary text-[22px]">travel_explore</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-headline-sm text-lg text-text-primary uppercase font-bold">
                        02. Discover
                      </h3>
                      <span className="font-label-mono-sm text-xs text-secondary font-semibold">
                        HYBRID RETRIEVAL VECTOR + BM25
                      </span>
                      <p className="font-body-sm text-xs text-text-muted mt-2 leading-relaxed">
                        Simultaneously scans 15,000+ benchmarked datasets and 46,000+ pretrained neural backbones across dense embedding spaces and symbolic inverted indices.
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 mt-4 bg-void-surface/50 -mx-6 -mb-6 p-4 flex flex-col gap-1.5 border-t border-border-dim/40">
                    <span className="font-label-mono-sm text-[10px] text-text-muted font-semibold">RETRIEVAL STATS</span>
                    <div className="flex justify-between items-center font-label-mono-sm text-[10px]">
                      <span className="text-text-muted">Dense Candidates:</span>
                      <span className="text-secondary font-bold">142 hits</span>
                    </div>
                    <div className="flex justify-between items-center font-label-mono-sm text-[10px]">
                      <span className="text-text-muted">BM25 Metadata:</span>
                      <span className="text-secondary font-bold">38 hits</span>
                    </div>
                  </div>
                </div>

                {/* Stage 03 */}
                <div className="bg-surface-container-low rounded-xl p-6 flex flex-col justify-between shadow-md relative overflow-hidden group hover:bg-surface-container transition-all border border-border-dim min-h-[340px]">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-tertiary/5 rounded-bl-full pointer-events-none" />
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="font-label-mono text-[11px] text-tertiary bg-void-surface px-2.5 py-1 rounded border border-border-dim font-bold">
                        STAGE 03
                      </span>
                      <span className="material-symbols-outlined text-tertiary text-[22px]">verified_user</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-headline-sm text-lg text-text-primary uppercase font-bold">
                        03. Verify
                      </h3>
                      <span className="font-label-mono-sm text-xs text-tertiary font-semibold">
                        VRAM PROFILING &amp; PEER SCORES
                      </span>
                      <p className="font-body-sm text-xs text-text-muted mt-2 leading-relaxed">
                        Eliminates out-of-memory traps through rigorous empirical tensor execution profiling, verifiable license screening, and automated code reproducibility audits.
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 mt-4 bg-void-surface/50 -mx-6 -mb-6 p-4 flex flex-col gap-1.5 border-t border-border-dim/40">
                    <span className="font-label-mono-sm text-[10px] text-text-muted font-semibold">VERIFIED AUDIT</span>
                    <div className="flex justify-between items-center font-label-mono-sm text-[10px]">
                      <span className="text-text-muted">VRAM Footprint:</span>
                      <span className="text-tertiary font-bold">9.4 GB Peak (PASS)</span>
                    </div>
                    <div className="flex justify-between items-center font-label-mono-sm text-[10px]">
                      <span className="text-text-muted">Replication Score:</span>
                      <span className="text-tertiary font-bold">98.4% Bit-Exact</span>
                    </div>
                  </div>
                </div>

                {/* Stage 04 */}
                <div className="bg-surface-container-low rounded-xl p-6 flex flex-col justify-between shadow-md relative overflow-hidden group hover:bg-surface-container transition-all border border-border-dim min-h-[340px]">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-radiant/5 rounded-bl-full pointer-events-none" />
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="font-label-mono text-[11px] text-cyan-radiant bg-void-surface px-2.5 py-1 rounded border border-border-dim font-bold">
                        STAGE 04
                      </span>
                      <span className="material-symbols-outlined text-cyan-radiant text-[22px]">rocket_launch</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-headline-sm text-lg text-text-primary uppercase font-bold">
                        04. Recommend
                      </h3>
                      <span className="font-label-mono-sm text-xs text-cyan-radiant font-semibold">
                        RANKED SYNTHESIZED TRIAD
                      </span>
                      <p className="font-body-sm text-xs text-text-muted mt-2 leading-relaxed">
                        Outputs an orchestrated research ecosystem: primary verified dataset, fitted model weights, peer-reviewed methodology paper, and a step-by-step reproduction roadmap.
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 mt-4 bg-void-surface/50 -mx-6 -mb-6 p-4 flex flex-col gap-1.5 border-t border-border-dim/40">
                    <span className="font-label-mono-sm text-[10px] text-text-muted font-semibold">DELIVERABLE ARTIFACT</span>
                    <div className="flex items-center gap-1.5 text-primary font-label-mono-sm text-[10px] font-bold">
                      <span className="material-symbols-outlined text-[14px]">download_done</span>
                      <span>Complete Reproduction Plan</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* 3. 6-WAY KNOWLEDGE ECOSYSTEM & HORIZON FLOW                  */}
          {/* ============================================================ */}
          <section className="w-full py-16 bg-surface-container-lowest">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
              <div className="flex flex-col gap-1">
                <span className="font-label-mono-sm text-xs text-secondary uppercase tracking-wider font-bold">
                  UNIFIED MULTI-ENTITY ONTOLOGY
                </span>
                <h2 className="font-headline-lg text-2xl sm:text-3xl text-text-primary font-bold">
                  One Problem. An Entire Research Ecosystem.
                </h2>
                <p className="font-body-md text-sm text-text-muted max-w-3xl">
                  Tracing how a single clinical query propagates across the multi-entity knowledge network with verified match confidence scores and automated dependency links.
                </p>
              </div>

              {/* Entity Flow Horizon Container */}
              <div className="w-full bg-void-surface rounded-xl p-5 sm:p-6 shadow-xl overflow-x-auto custom-horizon-scrollbar border border-border-dim">
                <div className="min-w-[980px] flex items-center justify-between relative py-6">
                  {/* Node: User Query */}
                  <div className="w-44 bg-void-elevated p-4 rounded-xl shadow-md flex flex-col gap-1.5 relative z-10 border border-border-dim">
                    <span className="font-label-mono-sm text-[10px] text-cyan-radiant font-bold">
                      01 · USER QUERY
                    </span>
                    <span className="font-headline-sm text-sm text-text-primary font-bold truncate">
                      3D MRI Scan
                    </span>
                    <span className="font-body-sm text-[11px] text-text-muted leading-tight">
                      Tumor + Progression, &lt;12GB VRAM
                    </span>
                    <div className="mt-2 pt-2 bg-surface-container/50 px-2 py-1 rounded flex items-center justify-between border border-border-dim/40">
                      <span className="font-label-mono-sm text-[9px] text-text-muted">STATUS</span>
                      <span className="font-label-mono-sm text-[9px] text-tertiary font-bold">RESOLVED</span>
                    </div>
                  </div>

                  {/* Connector Vector 1 */}
                  <div className="flex-1 flex flex-col items-center justify-center px-2 relative z-0">
                    <span className="font-label-mono-sm text-[10px] text-primary mb-1 font-bold">
                      94% MATCH
                    </span>
                    <div className="w-full h-0.5 bg-gradient-to-r from-primary to-secondary relative">
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-secondary animate-ping" />
                    </div>
                    <span className="font-label-mono-sm text-[9px] text-text-muted mt-1 font-mono">
                      SEMANTIC EMBEDDING
                    </span>
                  </div>

                  {/* Node: Dataset */}
                  <div className="w-44 bg-void-elevated p-4 rounded-xl shadow-md flex flex-col gap-1.5 relative z-10 border border-border-dim">
                    <span className="font-label-mono-sm text-[10px] text-primary font-bold">
                      02 · DATASET
                    </span>
                    <span className="font-headline-sm text-sm text-text-primary font-bold truncate">
                      ADNI-3 Cohort
                    </span>
                    <span className="font-body-sm text-[11px] text-text-muted leading-tight">
                      845 Subjects · 2,248 Scans
                    </span>
                    <div className="mt-2 pt-2 bg-surface-container/50 px-2 py-1 rounded flex items-center justify-between border border-border-dim/40">
                      <span className="font-label-mono-sm text-[9px] text-text-muted">FORMAT</span>
                      <span className="font-label-mono-sm text-[9px] text-primary font-bold">3D NIfTI</span>
                    </div>
                  </div>

                  {/* Connector Vector 2 */}
                  <div className="flex-1 flex flex-col items-center justify-center px-2 relative z-0">
                    <span className="font-label-mono-sm text-[10px] text-secondary mb-1 font-bold">
                      COMPATIBLE
                    </span>
                    <div className="w-full h-0.5 bg-gradient-to-r from-secondary to-purple-bright relative" />
                    <span className="font-label-mono-sm text-[9px] text-text-muted mt-1 font-mono">
                      VOLUMETRIC BACKBONE
                    </span>
                  </div>

                  {/* Node: Model */}
                  <div className="w-44 bg-void-elevated p-4 rounded-xl shadow-md flex flex-col gap-1.5 relative z-10 border border-border-dim">
                    <span className="font-label-mono-sm text-[10px] text-secondary font-bold">
                      03 · ARCHITECTURE
                    </span>
                    <span className="font-headline-sm text-sm text-text-primary font-bold truncate">
                      Swin UNETR
                    </span>
                    <span className="font-body-sm text-[11px] text-text-muted leading-tight">
                      3D Hierarchical Transformer
                    </span>
                    <div className="mt-2 pt-2 bg-surface-container/50 px-2 py-1 rounded flex items-center justify-between border border-border-dim/40">
                      <span className="font-label-mono-sm text-[9px] text-text-muted">PEAK VRAM</span>
                      <span className="font-label-mono-sm text-[9px] text-tertiary font-bold">9.4 GB</span>
                    </div>
                  </div>

                  {/* Connector Vector 3 */}
                  <div className="flex-1 flex flex-col items-center justify-center px-2 relative z-0">
                    <span className="font-label-mono-sm text-[10px] text-purple-bright mb-1 font-bold">
                      CITATION REF
                    </span>
                    <div className="w-full h-0.5 bg-gradient-to-r from-purple-bright to-tertiary relative" />
                    <span className="font-label-mono-sm text-[9px] text-text-muted mt-1 font-mono">
                      EMPIRICAL PROOF
                    </span>
                  </div>

                  {/* Node: Paper */}
                  <div className="w-44 bg-void-elevated p-4 rounded-xl shadow-md flex flex-col gap-1.5 relative z-10 border border-border-dim">
                    <span className="font-label-mono-sm text-[10px] text-purple-bright font-bold">
                      04 · GROUNDING PAPER
                    </span>
                    <span className="font-headline-sm text-sm text-text-primary font-bold truncate">
                      CVPR 2024
                    </span>
                    <span className="font-body-sm text-[11px] text-text-muted leading-tight">
                      Multimodal Neuro Repr.
                    </span>
                    <div className="mt-2 pt-2 bg-surface-container/50 px-2 py-1 rounded flex items-center justify-between border border-border-dim/40">
                      <span className="font-label-mono-sm text-[9px] text-text-muted">ARXIV</span>
                      <span className="font-label-mono-sm text-[9px] text-purple-bright font-bold">2403.09182</span>
                    </div>
                  </div>

                  {/* Connector Vector 4 */}
                  <div className="flex-1 flex flex-col items-center justify-center px-2 relative z-0">
                    <span className="font-label-mono-sm text-[10px] text-tertiary mb-1 font-bold">
                      VERIFIED SOTA
                    </span>
                    <div className="w-full h-0.5 bg-gradient-to-r from-tertiary to-cyan-radiant relative" />
                    <span className="font-label-mono-sm text-[9px] text-text-muted mt-1 font-mono">
                      LEADERBOARD TOP-3
                    </span>
                  </div>

                  {/* Node: Implementation */}
                  <div className="w-44 bg-void-elevated p-4 rounded-xl shadow-md flex flex-col gap-1.5 relative z-10 border border-border-dim">
                    <span className="font-label-mono-sm text-[10px] text-tertiary font-bold">
                      05 · IMPLEMENTATION
                    </span>
                    <span className="font-headline-sm text-sm text-text-primary font-bold truncate">
                      MONAI + PyTorch
                    </span>
                    <span className="font-body-sm text-[11px] text-text-muted leading-tight">
                      Pretrained Checkpoint
                    </span>
                    <div className="mt-2 pt-2 bg-surface-container/50 px-2 py-1 rounded flex items-center justify-between border border-border-dim/40">
                      <span className="font-label-mono-sm text-[9px] text-text-muted">STATUS</span>
                      <span className="font-label-mono-sm text-[9px] text-tertiary font-bold">1-CLICK RUN</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* 4. THREE SCIENTIFIC INTELLIGENCE PREVIEWS                    */}
          {/* ============================================================ */}
          <section className="w-full py-16 bg-void-base border-y border-border-dim">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-label-mono-sm text-xs text-cyan-radiant uppercase tracking-wider font-bold">
                    RETRIEVAL MATCH ARTIFACTS
                  </span>
                  <h2 className="font-headline-lg text-2xl sm:text-3xl text-text-primary font-bold">
                    Scientific Intelligence Previews
                  </h2>
                </div>
                <div className="flex items-center gap-2 font-label-mono-sm text-xs text-text-muted">
                  <span>SORTED BY RELEVANCE &amp; HARDWARE CONSTRAINTS</span>
                </div>
              </div>

              {/* 3-Column Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Panel 1: DATASET */}
                <div className="bg-surface-container rounded-xl overflow-hidden shadow-xl flex flex-col justify-between border border-border-dim">
                  <div className="relative h-44 w-full bg-void-surface overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="ADNI 3D Brain Imaging"
                      className="w-full h-full object-cover opacity-60"
                      src="/stitch-cards/adni-preview.png"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/40 to-transparent" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-void-base/90 font-label-mono-sm text-[10px] text-primary flex items-center gap-1.5 border border-border-dim">
                      <span className="material-symbols-outlined text-[14px]">database</span>
                      <span className="font-bold">PRIMARY DATASET MATCH</span>
                    </div>
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-tertiary/20 text-tertiary font-label-mono text-[11px] font-bold">
                      94% MATCH
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-headline-sm text-base text-text-primary font-bold">
                        ADNI - Alzheimer&apos;s Disease Neuroimaging
                      </h3>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-4 flex-1 justify-between">
                    <div className="flex flex-col gap-3">
                      <p className="font-body-sm text-xs text-text-muted leading-relaxed">
                        Standardized multi-site longitudinal 3D MRI, PET scans, CSF proteomics, and cognitive progression telemetry for clinical stage diagnosis.
                      </p>
                      {/* Metric Badges */}
                      <div className="grid grid-cols-2 gap-2 font-label-mono-sm text-[10px]">
                        <div className="bg-void-surface p-2 rounded flex flex-col border border-border-dim/40">
                          <span className="text-text-muted">Volume Count</span>
                          <span className="text-text-primary font-bold">2,248 Scans</span>
                        </div>
                        <div className="bg-void-surface p-2 rounded flex flex-col border border-border-dim/40">
                          <span className="text-primary font-bold">3D NIfTI / DICOM</span>
                          <span className="text-text-muted">Tensor Format</span>
                        </div>
                        <div className="bg-void-surface p-2 rounded flex flex-col border border-border-dim/40">
                          <span className="text-text-muted">License Type</span>
                          <span className="text-tertiary font-bold">Research DUA</span>
                        </div>
                        <div className="bg-void-surface p-2 rounded flex flex-col border border-border-dim/40">
                          <span className="text-text-muted">Cohort Size</span>
                          <span className="text-text-primary font-bold">845 Subjects</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 flex items-center justify-between font-label-mono-sm text-xs border-t border-border-dim/40">
                      <span className="text-tertiary flex items-center gap-1.5 font-medium">
                        <span className="material-symbols-outlined text-[15px]">check_circle</span>
                        <span>Verified Data Access</span>
                      </span>
                      <Link
                        className="text-primary hover:text-cyan-radiant font-bold flex items-center gap-1 transition-colors"
                        href="/explore?q=ADNI"
                      >
                        <span>View Schema</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Panel 2: MODEL */}
                <div className="bg-surface-container rounded-xl overflow-hidden shadow-xl flex flex-col justify-between border border-border-dim">
                  <div className="relative h-44 w-full bg-void-surface overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="Swin UNETR Attention"
                      className="w-full h-full object-cover opacity-60"
                      src="/stitch-cards/swin-preview.png"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/40 to-transparent" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-void-base/90 font-label-mono-sm text-[10px] text-secondary flex items-center gap-1.5 border border-border-dim">
                      <span className="material-symbols-outlined text-[14px]">neurology</span>
                      <span className="font-bold">PRETRAINED BACKBONE</span>
                    </div>
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-secondary-container/40 text-secondary font-label-mono text-[11px] font-bold">
                      89% MATCH
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-headline-sm text-base text-text-primary font-bold">
                        Swin UNETR 3D Vision Transformer
                      </h3>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-4 flex-1 justify-between">
                    <div className="flex flex-col gap-3">
                      <p className="font-body-sm text-xs text-text-muted leading-relaxed">
                        Hierarchical vision transformer with shifted windows for dense 3D medical image segmentation and volumetric representation extraction.
                      </p>
                      {/* Metric Badges */}
                      <div className="grid grid-cols-2 gap-2 font-label-mono-sm text-[10px]">
                        <div className="bg-void-surface p-2 rounded flex flex-col border border-border-dim/40">
                          <span className="text-text-muted">Peak VRAM</span>
                          <span className="text-tertiary font-bold">9.4 GB (RTX 3060/4070)</span>
                        </div>
                        <div className="bg-void-surface p-2 rounded flex flex-col border border-border-dim/40">
                          <span className="text-text-muted">Accuracy Metric</span>
                          <span className="text-secondary font-bold">Dice: 0.884</span>
                        </div>
                        <div className="bg-void-surface p-2 rounded flex flex-col border border-border-dim/40">
                          <span className="text-text-muted">Parameter Scale</span>
                          <span className="text-text-primary font-bold">62.2M Weights</span>
                        </div>
                        <div className="bg-void-surface p-2 rounded flex flex-col border border-border-dim/40">
                          <span className="text-text-muted">Framework</span>
                          <span className="text-text-primary font-bold">PyTorch / MONAI</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 flex items-center justify-between font-label-mono-sm text-xs border-t border-border-dim/40">
                      <span className="text-tertiary flex items-center gap-1.5 font-medium">
                        <span className="material-symbols-outlined text-[15px]">memory</span>
                        <span>Fits 12GB GPU Budget</span>
                      </span>
                      <Link
                        className="text-secondary hover:text-purple-bright font-bold flex items-center gap-1 transition-colors"
                        href="/benchmark"
                      >
                        <span>Inspect Weights</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Panel 3: PAPER */}
                <div className="bg-surface-container rounded-xl overflow-hidden shadow-xl flex flex-col justify-between border border-border-dim md:col-span-2 lg:col-span-1">
                  <div className="relative h-44 w-full bg-void-surface overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="Paper Schematic"
                      className="w-full h-full object-cover opacity-60"
                      src="/stitch-cards/paper-preview.png"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-surface-container/40 to-transparent" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-void-base/90 font-label-mono-sm text-[10px] text-purple-bright flex items-center gap-1.5 border border-border-dim">
                      <span className="material-symbols-outlined text-[14px]">description</span>
                      <span className="font-bold">PEER-REVIEWED PAPER</span>
                    </div>
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-tertiary/20 text-tertiary font-label-mono text-[11px] font-bold">
                      92% MATCH
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="font-headline-sm text-base text-text-primary font-bold">
                        Multimodal Neuroimaging Representation
                      </h3>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-4 flex-1 justify-between">
                    <div className="flex flex-col gap-3">
                      <p className="font-body-sm text-xs text-text-muted leading-relaxed">
                        Peer-reviewed methodology for fusing longitudinal structural MRI with tabular biomarkers under extreme label scarcity.
                      </p>
                      {/* Metric Badges */}
                      <div className="grid grid-cols-2 gap-2 font-label-mono-sm text-[10px]">
                        <div className="bg-void-surface p-2 rounded flex flex-col border border-border-dim/40">
                          <span className="text-text-muted">Venue</span>
                          <span className="text-primary font-bold">CVPR 2024</span>
                        </div>
                        <div className="bg-void-surface p-2 rounded flex flex-col border border-border-dim/40">
                          <span className="text-text-muted">Total Citations</span>
                          <span className="text-text-primary font-bold">342 Verified</span>
                        </div>
                        <div className="bg-void-surface p-2 rounded flex flex-col border border-border-dim/40">
                          <span className="text-text-muted">Artifact Code</span>
                          <span className="text-tertiary font-bold">Official GitHub</span>
                        </div>
                        <div className="bg-void-surface p-2 rounded flex flex-col border border-border-dim/40">
                          <span className="text-secondary font-bold">98.2% SOTA</span>
                          <span className="text-text-muted">Repro Score</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 flex items-center justify-between font-label-mono-sm text-xs border-t border-border-dim/40">
                      <span className="text-tertiary flex items-center gap-1.5 font-medium">
                        <span className="material-symbols-outlined text-[15px]">lock_open</span>
                        <span>Open Access arXiv</span>
                      </span>
                      <Link
                        className="text-purple-bright hover:text-secondary font-bold flex items-center gap-1 transition-colors"
                        href="/explore?q=Multimodal+Neuroimaging"
                      >
                        <span>Read Abstract</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* Match Breakdown Horizontal Bar Metrics */}
              <div className="bg-surface-container-low rounded-xl p-5 shadow-md flex flex-col gap-3 border border-border-dim">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="font-label-mono text-[11px] text-text-primary uppercase tracking-wider font-bold">
                    COMPOSITE MULTI-OBJECTIVE 94% MATCH BREAKDOWN
                  </span>
                  <span className="font-label-mono-sm text-[11px] text-tertiary font-bold">
                    BALANCED HARMONIC MEAN: 0.942
                  </span>
                </div>
                {/* Composite Horizontal Bar */}
                <div className="w-full h-3.5 rounded bg-void-surface overflow-hidden flex shadow-inner border border-border-dim/50">
                  <div className="h-full bg-primary transition-all hover:opacity-80" style={{ width: "32%" }} title="Semantic Intent Match 32%" />
                  <div className="h-full bg-cyan-radiant transition-all hover:opacity-80" style={{ width: "20%" }} title="Task & Modality Alignment 20%" />
                  <div className="h-full bg-tertiary transition-all hover:opacity-80" style={{ width: "15%" }} title="VRAM & Hardware Budget Fit 15%" />
                  <div className="h-full bg-purple-bright transition-all hover:opacity-80" style={{ width: "14%" }} title="Cross-Entity Graph Cohesion 14%" />
                  <div className="h-full bg-secondary transition-all hover:opacity-80" style={{ width: "19%" }} title="Method Freshness & Benchmark Quality 19%" />
                </div>
                {/* Legend */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1 font-label-mono-sm text-[10px]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
                    <span className="text-text-muted">Semantic Match (32%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-cyan-radiant" />
                    <span className="text-text-muted">Task Alignment (20%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-tertiary" />
                    <span className="text-text-muted">VRAM Fit (15%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-purple-bright" />
                    <span className="text-text-muted">Graph Cohesion (14%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm bg-secondary" />
                    <span className="text-text-muted">Freshness &amp; Q (19%)</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* 5. APPLIED EDGE CASES & TRADE-OFF BENCHMARK MATRIX           */}
          {/* ============================================================ */}
          <section className="w-full py-16 bg-surface-container-lowest">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* Left: Built for Problems That Aren't Simple */}
              <div className="xl:col-span-5 flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <span className="font-label-mono-sm text-xs text-primary uppercase tracking-widest font-bold">
                    CONSTRAINT ENGINEERING
                  </span>
                  <h2 className="font-headline-lg text-2xl sm:text-3xl text-text-primary font-bold">
                    Built for Problems That Aren&apos;t Simple
                  </h2>
                  <p className="font-body-md text-sm text-text-muted leading-relaxed">
                    Standard benchmarks assume limitless clusters and clean labels. Our engine handles asymmetric clinical reality, scarce annotations, and hard local VRAM limits.
                  </p>
                </div>

                <div className="bg-surface-container-low rounded-xl p-5 sm:p-6 shadow-lg flex flex-col gap-4 border border-border-dim">
                  <div className="flex items-center justify-between font-label-mono-sm text-[11px] pb-2 border-b border-border-dim/40">
                    <span className="text-text-primary uppercase font-bold">USER CONSTRAINT PROFILE</span>
                    <span className="text-tertiary font-bold">ALL CONSTRAINTS RESOLVED</span>
                  </div>
                  <div className="flex flex-col gap-2.5 font-label-mono-sm text-[11px]">
                    <div className="bg-void-surface p-3 rounded-lg flex items-center justify-between border border-border-dim/40">
                      <div className="flex flex-col">
                        <span className="text-text-muted text-[10px]">SCIENTIFIC BOTTLENECK</span>
                        <span className="text-text-primary font-bold">Labeled Scans &lt; 400</span>
                      </div>
                      <span className="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
                      <div className="text-right">
                        <span className="text-text-muted text-[10px]">AUTOMATED STRATEGY</span>
                        <span className="text-cyan-radiant font-bold">Self-Supervised Pretraining + CutMix</span>
                      </div>
                    </div>

                    <div className="bg-void-surface p-3 rounded-lg flex items-center justify-between border border-border-dim/40">
                      <div className="flex flex-col">
                        <span className="text-text-muted text-[10px]">HARDWARE CEILING</span>
                        <span className="text-text-primary font-bold">Consumer GPU (≤ 12GB VRAM)</span>
                      </div>
                      <span className="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
                      <div className="text-right">
                        <span className="text-text-muted text-[10px]">AUTOMATED STRATEGY</span>
                        <span className="text-secondary font-bold">Mixed Precision FP16 + Grad Caching</span>
                      </div>
                    </div>

                    <div className="bg-void-surface p-3 rounded-lg flex items-center justify-between border border-border-dim/40">
                      <div className="flex flex-col">
                        <span className="text-text-muted text-[10px]">EHR MULTIMODAL SKEW</span>
                        <span className="text-text-primary font-bold">Missing Longitudinal Followups</span>
                      </div>
                      <span className="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
                      <div className="text-right">
                        <span className="text-text-muted text-[10px]">AUTOMATED STRATEGY</span>
                        <span className="text-primary font-bold">Masked Autoencoder Imputation</span>
                      </div>
                    </div>

                    <div className="bg-void-surface p-3 rounded-lg flex items-center justify-between border border-border-dim/40">
                      <div className="flex flex-col">
                        <span className="text-text-muted text-[10px]">ETHICAL &amp; GOVERNANCE</span>
                        <span className="text-text-primary font-bold">HIPAA / Non-Commercial DUA</span>
                      </div>
                      <span className="material-symbols-outlined text-tertiary text-[18px]">check_circle</span>
                      <div className="text-right">
                        <span className="text-text-muted text-[10px]">AUTOMATED STRATEGY</span>
                        <span className="text-tertiary font-bold">Synthesizable Sandbox Split</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-void-base flex items-center gap-2.5 border border-border-dim/50">
                    <span className="material-symbols-outlined text-primary text-[20px]">psychology_alt</span>
                    <span className="font-body-sm text-xs text-text-muted">
                      Solver generated <strong className="text-text-primary">3 feasible hyperparameter schedules</strong> guaranteed to run without memory overflow.
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Don't Just Find a Model. Understand the Trade-offs. */}
              <div className="xl:col-span-7 flex flex-col gap-6">
                <div className="flex flex-col gap-1.5">
                  <span className="font-label-mono-sm text-xs text-secondary uppercase tracking-widest font-bold">
                    EMPIRICAL BENCHMARK LAB
                  </span>
                  <h2 className="font-headline-lg text-2xl sm:text-3xl text-text-primary font-bold">
                    Don&apos;t Just Find a Model. Understand the Trade-offs.
                  </h2>
                  <p className="font-body-md text-sm text-text-muted leading-relaxed">
                    The top Kaggle model is rarely the right production model. We rank architectures by resource footprint, inference latency, and data appetite.
                  </p>
                </div>

                {/* Benchmark Matrix Table Container */}
                <div className="bg-surface-container-low rounded-xl overflow-hidden shadow-lg border border-border-dim">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-body-sm text-xs">
                      <thead className="bg-surface-container font-label-mono-sm text-[10px] text-text-muted uppercase border-b border-border-dim">
                        <tr>
                          <th className="p-3 sm:p-4">Model Candidate</th>
                          <th className="p-3 sm:p-4">Dice Score</th>
                          <th className="p-3 sm:p-4">Peak VRAM</th>
                          <th className="p-3 sm:p-4">Inference</th>
                          <th className="p-3 sm:p-4">Fit Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-dim/40 font-label-mono-sm text-[11px]">
                        {/* Row 1: Best Fit */}
                        <tr className="bg-void-surface hover:bg-surface-container transition-colors">
                          <td className="p-3 sm:p-4 font-bold text-text-primary">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-cyan-radiant" />
                              <span>Swin UNETR (3D)</span>
                            </div>
                          </td>
                          <td className="p-3 sm:p-4 text-primary font-bold">0.884</td>
                          <td className="p-3 sm:p-4 text-tertiary font-bold">9.4 GB</td>
                          <td className="p-3 sm:p-4 text-text-muted">38ms / scan</td>
                          <td className="p-3 sm:p-4">
                            <span className="px-2.5 py-1 rounded bg-tertiary/20 text-tertiary font-bold">
                              RECOMMENDED FIT
                            </span>
                          </td>
                        </tr>
                        {/* Row 2: Heavy SOTA */}
                        <tr className="bg-void-base hover:bg-surface-container transition-colors">
                          <td className="p-3 sm:p-4 font-bold text-text-primary">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-error" />
                              <span>nnU-Net ResEnc L</span>
                            </div>
                          </td>
                          <td className="p-3 sm:p-4 text-text-primary font-bold">0.897 (+1.3%)</td>
                          <td className="p-3 sm:p-4 text-error font-bold">22.8 GB (OOM)</td>
                          <td className="p-3 sm:p-4 text-text-muted">145ms / scan</td>
                          <td className="p-3 sm:p-4">
                            <span className="px-2.5 py-1 rounded bg-error/20 text-error font-bold">
                              EXCEEDS VRAM
                            </span>
                          </td>
                        </tr>
                        {/* Row 3: Pure CNN Alternative */}
                        <tr className="bg-void-surface hover:bg-surface-container transition-colors">
                          <td className="p-3 sm:p-4 font-bold text-text-primary">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-secondary" />
                              <span>3D UX-Net</span>
                            </div>
                          </td>
                          <td className="p-3 sm:p-4 text-secondary font-bold">0.871</td>
                          <td className="p-3 sm:p-4 text-tertiary font-bold">7.2 GB</td>
                          <td className="p-3 sm:p-4 text-text-muted">26ms / scan</td>
                          <td className="p-3 sm:p-4">
                            <span className="px-2.5 py-1 rounded bg-surface-container-high text-on-surface-variant font-bold border border-border-dim/60">
                              VIABLE LIGHTWEIGHT
                            </span>
                          </td>
                        </tr>
                        {/* Row 4: Classic Baseline */}
                        <tr className="bg-void-base hover:bg-surface-container transition-colors">
                          <td className="p-3 sm:p-4 font-bold text-text-primary">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-text-muted" />
                              <span>V-Net Residual</span>
                            </div>
                          </td>
                          <td className="p-3 sm:p-4 text-text-muted font-bold">0.832</td>
                          <td className="p-3 sm:p-4 text-tertiary font-bold">5.1 GB</td>
                          <td className="p-3 sm:p-4 text-text-muted">14ms / scan</td>
                          <td className="p-3 sm:p-4">
                            <span className="px-2.5 py-1 rounded bg-surface-container-high text-text-muted font-bold border border-border-dim/60">
                              LOW ACCURACY
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="p-3.5 bg-void-surface flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-label-mono-sm text-xs border-t border-border-dim">
                    <span className="text-text-muted font-bold">DECISION ENGINE VERDICT:</span>
                    <span className="text-primary font-bold">
                      Swin UNETR captures 98.5% of peak nnU-Net accuracy while staying within your 12GB ceiling.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* 6. RESEARCH-TO-IMPLEMENTATION ROADMAP & COMPOSER             */}
          {/* ============================================================ */}
          <section className="w-full py-16 bg-void-base border-y border-border-dim">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="font-label-mono-sm text-xs text-tertiary uppercase tracking-wider font-bold">
                    EXECUTION GRAPH
                  </span>
                  <h2 className="font-headline-lg text-2xl sm:text-3xl text-text-primary font-bold">
                    Research-to-Implementation Roadmap
                  </h2>
                </div>
                <button
                  className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-container-high hover:bg-surface-bright text-text-primary font-label-mono text-xs transition-colors border border-border-dim shadow-sm active:scale-95"
                  onClick={handleCopyPipeline}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {copiedScript ? "check" : "code"}
                  </span>
                  <span className="font-bold">{copiedScript ? "Copied Script to Clipboard!" : "Export Python / PyTorch Pipeline"}</span>
                </button>
              </div>

              {/* 8-Step Pipeline Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2.5 relative group hover:bg-surface-container transition-all border border-border-dim">
                  <div className="flex items-center justify-between">
                    <span className="font-label-mono-sm text-[10px] text-primary font-bold">STEP 01</span>
                    <span className="material-symbols-outlined text-text-muted group-hover:text-primary transition-colors text-[18px]">
                      folder_zip
                    </span>
                  </div>
                  <h4 className="font-headline-sm text-sm text-text-primary font-bold">Dataset Prep</h4>
                  <p className="font-body-sm text-xs text-text-muted leading-relaxed">
                    NIfTI affine reorientation to RAS coordinate space with intensity min-max scaling to [0, 1].
                  </p>
                  <div className="font-label-mono-sm text-[9px] text-primary font-bold mt-auto pt-2">
                    MONAI Spacingd(1.0, 1.0, 1.0)
                  </div>
                </div>

                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2.5 relative group hover:bg-surface-container transition-all border border-border-dim">
                  <div className="flex items-center justify-between">
                    <span className="font-label-mono-sm text-[10px] text-primary font-bold">STEP 02</span>
                    <span className="material-symbols-outlined text-text-muted group-hover:text-primary transition-colors text-[18px]">
                      auto_fix_high
                    </span>
                  </div>
                  <h4 className="font-headline-sm text-sm text-text-primary font-bold">Preprocessing</h4>
                  <p className="font-body-sm text-xs text-text-muted leading-relaxed">
                    Brain skull-stripping mask inference via HD-BET + bias field correction with N4ITK.
                  </p>
                  <div className="font-label-mono-sm text-[9px] text-primary font-bold mt-auto pt-2">
                    ANTsPy / N4ITK Pipeline
                  </div>
                </div>

                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2.5 relative group hover:bg-surface-container transition-all border border-border-dim">
                  <div className="flex items-center justify-between">
                    <span className="font-label-mono-sm text-[10px] text-secondary font-bold">STEP 03</span>
                    <span className="material-symbols-outlined text-text-muted group-hover:text-secondary transition-colors text-[18px]">
                      scatter_plot
                    </span>
                  </div>
                  <h4 className="font-headline-sm text-sm text-text-primary font-bold">Embedding</h4>
                  <p className="font-body-sm text-xs text-text-muted leading-relaxed">
                    Windowed 3D patch tokenization (2x2x2) projected into a 768-dimensional latent manifold.
                  </p>
                  <div className="font-label-mono-sm text-[9px] text-secondary font-bold mt-auto pt-2">
                    Shifted-Window Attention
                  </div>
                </div>

                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2.5 relative group hover:bg-surface-container transition-all border border-border-dim">
                  <div className="flex items-center justify-between">
                    <span className="font-label-mono-sm text-[10px] text-secondary font-bold">STEP 04</span>
                    <span className="material-symbols-outlined text-text-muted group-hover:text-secondary transition-colors text-[18px]">
                      hub
                    </span>
                  </div>
                  <h4 className="font-headline-sm text-sm text-text-primary font-bold">Multimodal Fusion</h4>
                  <p className="font-body-sm text-xs text-text-muted leading-relaxed">
                    Cross-attention gate aligning tabular clinical EHR vectors with voxel-level bottleneck tokens.
                  </p>
                  <div className="font-label-mono-sm text-[9px] text-secondary font-bold mt-auto pt-2">
                    CrossAttnGate(Dim=768)
                  </div>
                </div>

                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2.5 relative group hover:bg-surface-container transition-all border border-border-dim">
                  <div className="flex items-center justify-between">
                    <span className="font-label-mono-sm text-[10px] text-tertiary font-bold">STEP 05</span>
                    <span className="material-symbols-outlined text-text-muted group-hover:text-tertiary transition-colors text-[18px]">
                      sync
                    </span>
                  </div>
                  <h4 className="font-headline-sm text-sm text-text-primary font-bold">Training Loop</h4>
                  <p className="font-body-sm text-xs text-text-muted leading-relaxed">
                    Cosine annealing scheduler with warm restarts, mixed-precision FP16, and AdamW.
                  </p>
                  <div className="font-label-mono-sm text-[9px] text-tertiary font-bold mt-auto pt-2">
                    AMP / PyTorch Native
                  </div>
                </div>

                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2.5 relative group hover:bg-surface-container transition-all border border-border-dim">
                  <div className="flex items-center justify-between">
                    <span className="font-label-mono-sm text-[10px] text-tertiary font-bold">STEP 06</span>
                    <span className="material-symbols-outlined text-text-muted group-hover:text-tertiary transition-colors text-[18px]">
                      analytics
                    </span>
                  </div>
                  <h4 className="font-headline-sm text-sm text-text-primary font-bold">Evaluation</h4>
                  <p className="font-body-sm text-xs text-text-muted leading-relaxed">
                    5-Fold Stratified Cross-Validation on volumetric Dice, 95% Hausdorff Distance, and AUROC.
                  </p>
                  <div className="font-label-mono-sm text-[9px] text-tertiary font-bold mt-auto pt-2">
                    Stratified Patient Split
                  </div>
                </div>

                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2.5 relative group hover:bg-surface-container transition-all border border-border-dim">
                  <div className="flex items-center justify-between">
                    <span className="font-label-mono-sm text-[10px] text-cyan-radiant font-bold">
                      STEP 07
                    </span>
                    <span className="material-symbols-outlined text-text-muted group-hover:text-cyan-radiant transition-colors text-[18px]">
                      military_tech
                    </span>
                  </div>
                  <h4 className="font-headline-sm text-sm text-text-primary font-bold">Benchmark</h4>
                  <p className="font-body-sm text-xs text-text-muted leading-relaxed">
                    Direct score validation against MedMNIST 3D &amp; BraTS official evaluation metrics.
                  </p>
                  <div className="font-label-mono-sm text-[9px] text-cyan-radiant font-bold mt-auto pt-2">
                    Automated Score Card
                  </div>
                </div>

                <div className="bg-surface-container-low p-4 rounded-xl flex flex-col gap-2.5 relative group hover:bg-surface-container transition-all border border-border-dim">
                  <div className="flex items-center justify-between">
                    <span className="font-label-mono-sm text-[10px] text-cyan-radiant font-bold">
                      STEP 08
                    </span>
                    <span className="material-symbols-outlined text-text-muted group-hover:text-cyan-radiant transition-colors text-[18px]">
                      output
                    </span>
                  </div>
                  <h4 className="font-headline-sm text-sm text-text-primary font-bold">ONNX Export</h4>
                  <p className="font-body-sm text-xs text-text-muted leading-relaxed">
                    Quantized FP16 TensorRT export packaged in an inference-ready Docker runtime container.
                  </p>
                  <div className="font-label-mono-sm text-[9px] text-cyan-radiant font-bold mt-auto pt-2">
                    ONNX Ops 17 / TRT
                  </div>
                </div>
              </div>

              {/* 'No Direct Match? We Compose One.' Callout Card */}
              <div className="bg-gradient-to-r from-void-elevated via-surface-container to-void-elevated rounded-xl p-5 sm:p-6 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 border border-border-dim">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary shrink-0 border border-secondary/20">
                    <span className="material-symbols-outlined text-[28px]">account_tree</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2 font-label-mono-sm text-[10px] text-secondary font-bold">
                      <span>DYNAMIC MULTI-DATASET COMPOSER</span>
                      <span className="px-1.5 py-0.5 rounded bg-surface-container font-bold text-text-primary border border-border-dim">
                        ACTIVE ENGINE
                      </span>
                    </div>
                    <h3 className="font-headline-sm text-base sm:text-lg text-text-primary font-bold">
                      No Direct Match? We Compose One.
                    </h3>
                    <p className="font-body-sm text-xs sm:text-sm text-text-muted max-w-2xl leading-relaxed">
                      If an exact single-source dataset doesn&apos;t satisfy all clinical endpoints, our composer dynamically synthesizes harmonized cross-dataset splits (e.g. OASIS-3 + ADNI-3 + synthetic BraTS masks) with statistical bias alignment.
                    </p>
                  </div>
                </div>
                <Link
                  className="shrink-0 px-4 py-2 rounded-lg bg-void-surface hover:bg-surface-bright text-secondary font-headline-sm text-xs font-bold tracking-wide uppercase transition-colors shadow-md border border-border-dim flex items-center gap-1.5 self-stretch sm:self-auto justify-center"
                  href="/explore"
                >
                  <span>Launch Dataset Composer</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>
          </section>

          {/* ============================================================ */}
          {/* 7. CINEMATIC CALL TO ACTION SECTION                          */}
          {/* ============================================================ */}
          <section className="w-full py-20 bg-void-surface relative overflow-hidden">
            <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[160px] pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-purple-bright/15 rounded-full blur-[160px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center gap-8 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container font-label-mono-sm text-[11px] text-primary border border-border-dim">
                <span className="w-2 h-2 rounded-full bg-cyan-radiant animate-pulse" />
                <span className="font-bold">LABORATORY-GRADE HIGH THROUGHPUT INDEX</span>
              </div>

              <div className="flex flex-col gap-3 max-w-3xl">
                <h2 className="font-headline-xl text-3xl sm:text-4xl lg:text-5xl text-text-primary uppercase tracking-tight font-extrabold leading-tight">
                  Your Next AI Project Starts With a{" "}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-radiant to-purple-bright">
                    Better Question
                  </span>
                  .
                </h2>
                <p className="font-body-lg text-sm sm:text-base text-text-muted max-w-2xl mx-auto leading-relaxed">
                  Stop scrolling uncurated repositories. Enter your clinical, robotic, or scientific constraints and let our topological graph synthesize the research ecosystem for you.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <Link
                  className="w-full sm:w-auto px-8 py-3 rounded-lg bg-primary hover:bg-cyan-radiant text-on-primary font-headline-sm text-sm font-bold tracking-wide uppercase transition-all shadow-xl hover:shadow-cyan-radiant/25 flex items-center justify-center gap-2"
                  href="/explore"
                >
                  <span>Explore Your Problem →</span>
                </Link>
                <Link
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-surface-container-high hover:bg-surface-bright text-text-primary font-headline-sm text-sm font-bold tracking-wide uppercase transition-colors border border-border-dim text-center"
                  href="/benchmark"
                >
                  Open Benchmark Lab
                </Link>
              </div>

              {/* Live Corpus Telemetry Badges */}
              <div className="w-full pt-8 mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-border-dim/40">
                <div className="flex flex-col items-center">
                  <span className="font-headline-lg text-2xl sm:text-3xl text-primary font-bold">25,400+</span>
                  <span className="font-label-mono-sm text-[11px] text-text-muted mt-1 uppercase font-semibold">
                    Curated Datasets
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-headline-lg text-2xl sm:text-3xl text-secondary font-bold">46,200+</span>
                  <span className="font-label-mono-sm text-[11px] text-text-muted mt-1 uppercase font-semibold">
                    Pretrained Checkpoints
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-headline-lg text-2xl sm:text-3xl text-tertiary font-bold">100%</span>
                  <span className="font-label-mono-sm text-[11px] text-text-muted mt-1 uppercase font-semibold">
                    Open-Access Verified
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="font-headline-lg text-2xl sm:text-3xl text-cyan-radiant font-bold">42ms</span>
                  <span className="font-label-mono-sm text-[11px] text-text-muted mt-1 uppercase font-semibold">
                    Mean Retrieval Latency
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ============================================================ */}
      {/* 8. COMPREHENSIVE PLATFORM FOOTER                             */}
      {/* ============================================================ */}
      <footer className="w-full bg-void-surface border-t border-border-dim">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Col 1: Platform Brand */}
            <div className="lg:col-span-1 flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="font-headline-sm text-base text-text-primary font-bold">
                  AI Dataset Explorer
                </span>
              </div>
              <p className="font-body-sm text-xs text-text-muted leading-relaxed">
                The frontier corpus retrieval, telemetry benchmark, and synthetic dataset orchestration environment for advanced neural models.
              </p>
              <div className="flex items-center gap-2 font-label-mono-sm text-[11px] text-tertiary font-bold">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
                <span>NODE CLUSTER SYNCED · 99.98% SLA</span>
              </div>
            </div>

            {/* Col 2: Platform Links */}
            <div className="flex flex-col gap-2.5">
              <span className="font-label-mono text-xs text-text-primary uppercase tracking-wider font-bold">
                Platform
              </span>
              <nav className="flex flex-col gap-2">
                <Link className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors" href="/explore">
                  Dataset Engine
                </Link>
                <Link className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors" href="/benchmark">
                  Matrix Compare
                </Link>
                <Link className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors" href="/roadmap">
                  Synthetic Pipelines
                </Link>
                <Link className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors" href="/explore">
                  Embedding Vectors
                </Link>
              </nav>
            </div>

            {/* Col 3: Corpus & Benchmarks */}
            <div className="flex flex-col gap-2.5">
              <span className="font-label-mono text-xs text-text-primary uppercase tracking-wider font-bold">
                Corpus &amp; Benchmarks
              </span>
              <nav className="flex flex-col gap-2">
                <Link className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors" href="/explore?q=LLM+Reasoning">
                  LLM Reasoning Sets
                </Link>
                <Link className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors" href="/explore?q=Multimodal+Vision+QA">
                  Multimodal Vision QA
                </Link>
                <Link className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors" href="/explore?q=Code+Math+Frontier">
                  Code &amp; Math Frontier
                </Link>
                <Link className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors" href="/benchmark">
                  Human Preference Evals
                </Link>
              </nav>
            </div>

            {/* Col 4: Engineering & API */}
            <div className="flex flex-col gap-2.5">
              <span className="font-label-mono text-xs text-text-primary uppercase tracking-wider font-bold">
                Engineering &amp; API
              </span>
              <nav className="flex flex-col gap-2">
                <a
                  className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors"
                  href="https://github.com/f25605121-maker/AI-Dataset-Explorer"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Python SDK
                </a>
                <Link className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors" href="/benchmark">
                  GraphQL Telemetry
                </Link>
                <Link className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors" href="/explore">
                  Parquet Streamers
                </Link>
                <a
                  className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors"
                  href="https://huggingface.co"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Hugging Face Bridge
                </a>
              </nav>
            </div>

            {/* Col 5: Organization */}
            <div className="flex flex-col gap-2.5">
              <span className="font-label-mono text-xs text-text-primary uppercase tracking-wider font-bold">
                Organization
              </span>
              <nav className="flex flex-col gap-2">
                <Link className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors" href="/explore">
                  Lab Research Papers
                </Link>
                <Link className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors" href="/benchmark">
                  Safety &amp; Bias Audits
                </Link>
                <Link className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors" href="/login">
                  Institutional Access
                </Link>
                <Link className="font-body-sm text-xs text-on-surface-variant hover:text-primary transition-colors" href="/roadmap">
                  Security Compliance
                </Link>
              </nav>
            </div>
          </div>

          <div className="pt-8 border-t border-border-dim flex flex-col md:flex-row items-center justify-between gap-4 font-label-mono-sm text-[11px] text-text-muted">
            <div>
              © 2026 AI Dataset Explorer Inc. Laboratory Instrumentation &amp; High-Performance Compute Infrastructure.
            </div>
            <div className="flex items-center gap-6">
              <span>SHARD: US-WEST-2B</span>
              <span className="hidden sm:inline">GPU TENSOR POOL: ACTIVE</span>
              <span className="text-primary font-bold">LATENCY: 42MS</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
