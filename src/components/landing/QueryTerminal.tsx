"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Preset {
  label: string;
  icon: string;
  query: string;
  theme: string;
}

const presets: Preset[] = [
  {
    label: "LLM Fine-Tuning",
    icon: "⚡",
    query: "Fine-tune Llama-3 8B with biomedical instruction dataset in QLoRA 4-bit",
    theme: "bg-cyan-950/60 hover:bg-cyan-900/60 border-cyan-400/40 text-cyan-200"
  },
  {
    label: "Vision-Language",
    icon: "👁️",
    query: "Multimodal vision-language reasoning for medical chest radiography with paired CXR reports",
    theme: "bg-indigo-950/60 hover:bg-indigo-900/60 border-indigo-400/40 text-indigo-200"
  },
  {
    label: "Audio Whisper",
    icon: "🎙️",
    query: "Ultra low-latency conversational audio agent using Whisper large-v3 with quantized weights",
    theme: "bg-emerald-950/60 hover:bg-emerald-900/60 border-emerald-400/40 text-emerald-200"
  },
  {
    label: "Medical NLP",
    icon: "🏥",
    query: "Clinical NER and electronic health records de-identification with HIPAA compliant licensing",
    theme: "bg-violet-950/60 hover:bg-violet-900/60 border-violet-400/40 text-violet-200"
  },
  {
    label: "Tabular Risk",
    icon: "📊",
    query: "High-stakes tabular fraud detection XGBoost and TabNet with severe class imbalance",
    theme: "bg-amber-950/60 hover:bg-amber-900/60 border-amber-400/40 text-amber-200"
  }
];

export default function QueryTerminal() {
  const router = useRouter();
  const [query, setQuery] = useState(
    "Multimodal vision-language model for chest X-rays with low-latency FP16 inference"
  );
  const [mode, setMode] = useState<"natural" | "sql" | "python">("natural");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSynthesize = () => {
    setIsSynthesizing(true);
    setTimeout(() => {
      router.push(`/explore?q=${encodeURIComponent(query)}`);
    }, 350);
  };

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-[#131c31]/90 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden">
      {/* Terminal Top Window Header */}
      <div className="bg-[#11192e] px-4 py-3 border-b border-cyan-500/20 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
          <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          <span className="ml-2 font-mono text-xs text-slate-200 flex items-center gap-1.5">
            <span className="text-cyan-300 font-semibold">rag://synthesizer-query-engine</span>
            <span className="text-cyan-600">•</span>
            <span className="text-emerald-300 font-semibold">idle • ready</span>
          </span>
        </div>

        {/* Terminal Query Modes */}
        <div className="flex items-center rounded-lg bg-slate-900 p-0.5 border border-cyan-500/30 text-xs font-mono">
          <button
            type="button"
            onClick={() => setMode("natural")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              mode === "natural"
                ? "bg-cyan-500/30 text-cyan-200 font-bold border border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Natural Language
          </button>
          <button
            type="button"
            onClick={() => setMode("sql")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              mode === "sql"
                ? "bg-cyan-500/30 text-cyan-200 font-bold border border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Vector SQL
          </button>
          <button
            type="button"
            onClick={() => setMode("python")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              mode === "python"
                ? "bg-cyan-500/30 text-cyan-200 font-bold border border-cyan-400/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                : "text-slate-300 hover:text-white"
            }`}
          >
            Python SDK
          </button>
        </div>
      </div>

      {/* Terminal Main Input Body */}
      <div className="p-4 md:p-6 bg-[#0f172a]/95">
        <div className="flex items-start gap-3">
          <span className="font-mono text-cyan-400 text-lg select-none pt-1 font-bold">
            ❯
          </span>
          <div className="flex-1">
            <textarea
              ref={inputRef}
              id="aiTerminalInput"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSynthesize();
                }
              }}
              rows={2}
              aria-label="AI Dataset & Model Search Query"
              placeholder="Describe your model requirement, modal types, or dataset parameters..."
              className="w-full bg-transparent text-white font-mono text-sm md:text-[15px] leading-relaxed placeholder-slate-400 focus:outline-none resize-none font-medium"
            />
          </div>

          <button
            type="button"
            onClick={handleSynthesize}
            disabled={isSynthesizing}
            className="hidden sm:inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-sm font-bold transition-all shadow-[0_0_24px_rgba(6,182,212,0.5)] shrink-0 active:scale-95"
          >
            <span className="text-base">⚡</span>
            <span>{isSynthesizing ? "Synthesizing..." : "Synthesize"}</span>
          </button>
        </div>

        {/* Fast Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-slate-700/80 mt-3">
          <span className="font-mono text-[11px] text-slate-300 font-semibold uppercase tracking-wider mr-1">
            Presets:
          </span>
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setQuery(preset.query);
                inputRef.current?.focus();
              }}
              className={`px-2.5 py-1 rounded-lg border font-mono text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm ${preset.theme}`}
            >
              <span>{preset.icon}</span>
              <span>{preset.label}</span>
            </button>
          ))}
        </div>

        {/* Terminal Live Metrics Bar */}
        <div className="mt-4 pt-3 rounded-xl bg-slate-900/90 border border-cyan-500/20 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-4 text-slate-200">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
              <span>Matched Assets: <strong className="text-cyan-300 font-bold">84 Checkpoints</strong></span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
              <span>VRAM Envelope: <strong className="text-indigo-200 font-bold">14.2 GB (FP16)</strong></span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
              <span>SOTA Alignment: <strong className="text-emerald-300 font-bold">98.4%</strong></span>
            </div>
          </div>

          <Link
            href={`/explore?q=${encodeURIComponent(query)}`}
            className="inline-flex items-center gap-1 text-cyan-300 hover:text-cyan-200 text-xs font-bold transition-colors"
          >
            <span>Open in Explorer Studio</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
