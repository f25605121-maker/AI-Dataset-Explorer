"use client";

import { useState } from "react";
import Link from "next/link";

interface SearchResult {
    success: boolean;
    intent?: string;
    summary?: {
        projectTitle?: string;
        domain?: string;
        task?: string;
        dataType?: string;
        datasetsFound?: number;
        modelsFound?: number;
        bestDataset?: any;
        bestModel?: any;
    };
    results?: {
        kaggle: any[];
        hfDatasets: any[];
        hfModels: any[];
    };
    datasets?: any[];
    models?: any[];
    analysis?: any;
    feasibility?: any;
    hardware?: any;
    apiAudit?: any;
    error?: any;
}

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<SearchResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState<'datasets' | 'models' | 'analysis'>('datasets');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch("/api/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: query.trim() }),
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                setError(data.error?.message || data.error || "Search failed. Please try again.");
            } else {
                setResult(data);
            }
        } catch (err: any) {
            setError(err.message || "Failed to reach search service.");
        } finally {
            setIsLoading(false);
        }
    };

    const datasets = result?.datasets || [];
    const models = result?.models || [];
    const summary = result?.summary;
    const analysis = result?.analysis;
    const hardware = result?.hardware;
    const feasibility = result?.feasibility;

    return (
        <main className="min-h-screen p-6 md:p-10 bg-[#060b14] text-slate-100 font-sans selection:bg-emerald-500/30">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-6">
                    <div>
                        <Link href="/" className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1">
                            ← Home
                        </Link>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-2 text-white">
                            AI Search Workflow
                        </h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Multi-source dataset & model discovery powered by Kaggle, Hugging Face, and AI Synthesis.
                        </p>
                    </div>
                    <Link
                        href="/explore"
                        className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                    >
                        Switch to Explore Studio →
                    </Link>
                </div>

                {/* Search Input (Step 1) */}
                <form onSubmit={handleSearch} className="space-y-3">
                    <div className="relative flex items-center">
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="e.g. Real-time vehicle detection and tracking in CCTV video or Brain tumor MRI segmentation..."
                            className="w-full bg-[#0b1322] border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-5 py-4 text-base text-white placeholder-slate-500 outline-none transition pr-32 shadow-lg"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !query.trim()}
                            className="absolute right-2.5 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-medium rounded-lg text-sm transition shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                "Run Search"
                            )}
                        </button>
                    </div>

                    {/* Quick suggestion chips */}
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                        <span>Try:</span>
                        {[
                            "Coronary artery segmentation CT dataset",
                            "Vehicle detection and tracking in CCTV video",
                            "Chest X-ray pneumonia classification",
                            "Speech emotion recognition wav audio",
                        ].map((sample) => (
                            <button
                                key={sample}
                                type="button"
                                onClick={() => setQuery(sample)}
                                className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-md transition"
                            >
                                {sample}
                            </button>
                        ))}
                    </div>
                </form>

                {/* Error Banner */}
                {error && (
                    <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 text-sm">
                        {error}
                    </div>
                )}

                {/* Results Section */}
                {result && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Summary & Feasibility Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="p-4 rounded-xl bg-[#0b1322] border border-slate-800">
                                <div className="text-xs text-slate-400 font-medium">Domain & Task</div>
                                <div className="text-base font-semibold text-emerald-400 mt-1 capitalize">
                                    {summary?.domain || "General"}
                                </div>
                                <div className="text-xs text-slate-300 mt-0.5 capitalize">
                                    {summary?.task || "Machine Learning"}
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-[#0b1322] border border-slate-800">
                                <div className="text-xs text-slate-400 font-medium">Modality</div>
                                <div className="text-base font-semibold text-cyan-400 mt-1 capitalize">
                                    {summary?.dataType || "Multi-modal"}
                                </div>
                                <div className="text-xs text-slate-300 mt-0.5">
                                    Intent: {result.intent || "DATASET_SEARCH"}
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-[#0b1322] border border-slate-800">
                                <div className="text-xs text-slate-400 font-medium">Total Discovered</div>
                                <div className="text-base font-semibold text-white mt-1">
                                    {datasets.length} Datasets · {models.length} Models
                                </div>
                                <div className="text-xs text-slate-300 mt-0.5">
                                    Sources: Kaggle & Hugging Face
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-[#0b1322] border border-slate-800">
                                <div className="text-xs text-slate-400 font-medium">Feasibility / VRAM</div>
                                <div className="text-base font-semibold text-indigo-400 mt-1">
                                    {feasibility?.feasibility_score ? `${feasibility.feasibility_score}/100` : "Available"}
                                </div>
                                <div className="text-xs text-slate-300 mt-0.5">
                                    GPU: {hardware?.gpu_recommendation || "NVIDIA 8GB+"}
                                </div>
                            </div>
                        </div>

                        {/* AI Rationale & Synthesis (Step 6) */}
                        {analysis?.ai_analysis && (
                            <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-950/20 to-slate-900 border border-emerald-800/40">
                                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm mb-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    AI Evidence Synthesis & Rationale
                                </div>
                                <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                                    {analysis.ai_analysis}
                                </div>
                            </div>
                        )}

                        {/* Navigation Tabs */}
                        <div className="flex gap-4 border-b border-slate-800">
                            <button
                                onClick={() => setSelectedTab('datasets')}
                                className={`pb-3 text-sm font-semibold transition border-b-2 ${
                                    selectedTab === 'datasets'
                                        ? 'border-emerald-500 text-emerald-400'
                                        : 'border-transparent text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Datasets ({datasets.length})
                            </button>
                            <button
                                onClick={() => setSelectedTab('models')}
                                className={`pb-3 text-sm font-semibold transition border-b-2 ${
                                    selectedTab === 'models'
                                        ? 'border-emerald-500 text-emerald-400'
                                        : 'border-transparent text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Models ({models.length})
                            </button>
                            <button
                                onClick={() => setSelectedTab('analysis')}
                                className={`pb-3 text-sm font-semibold transition border-b-2 ${
                                    selectedTab === 'analysis'
                                        ? 'border-emerald-500 text-emerald-400'
                                        : 'border-transparent text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Architecture & Hardware Specs
                            </button>
                        </div>

                        {/* Datasets View */}
                        {selectedTab === 'datasets' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {datasets.map((d: any, idx: number) => (
                                    <div
                                        key={d.id || idx}
                                        className="p-5 rounded-xl bg-[#0b1322] border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                    d.source?.toLowerCase() === 'kaggle'
                                                        ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
                                                        : 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50'
                                                }`}>
                                                    {d.source || 'Dataset'}
                                                </span>
                                                <span className="text-xs font-semibold text-emerald-400">
                                                    Match: {d.matchScore ?? 0}/100
                                                </span>
                                            </div>
                                            <h3 className="text-base font-bold text-white mt-2">
                                                {d.name || d.id}
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                                                {d.description || "No description provided."}
                                            </p>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                                            <span className="text-xs text-slate-400">
                                                Modality: <strong className="text-slate-300">{d.modality || "Unknown"}</strong>
                                            </span>
                                            {d.url && (
                                                <a
                                                    href={d.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                                >
                                                    View Dataset ↗
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Models View */}
                        {selectedTab === 'models' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {models.map((m: any, idx: number) => (
                                    <div
                                        key={m.id || idx}
                                        className="p-5 rounded-xl bg-[#0b1322] border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300 border border-indigo-700/50">
                                                    Hugging Face
                                                </span>
                                                <span className="text-xs font-semibold text-indigo-400">
                                                    Score: {m.matchScore ?? 0}/100
                                                </span>
                                            </div>
                                            <h3 className="text-base font-bold text-white mt-2">
                                                {m.name || m.id}
                                            </h3>
                                            <div className="text-xs text-slate-300 mt-1">
                                                Architecture: <strong className="text-emerald-400">{m.architecture || "Unknown"}</strong>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-2 line-clamp-3">
                                                {m.description || m.matchReason || "No model card description."}
                                            </p>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                                            <span className="text-xs text-slate-400">
                                                Task: <strong className="text-slate-300">{m.task || "Unknown"}</strong>
                                            </span>
                                            {m.url && (
                                                <a
                                                    href={m.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                                >
                                                    View Model ↗
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Analysis & Specs View */}
                        {selectedTab === 'analysis' && (
                            <div className="p-6 rounded-xl bg-[#0b1322] border border-slate-800 space-y-6">
                                <div>
                                    <h3 className="text-base font-bold text-white mb-2">Hardware Requirements</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                        <div className="p-3 bg-slate-900 rounded-lg">
                                            <span className="text-slate-400">GPU:</span>
                                            <div className="font-semibold text-slate-200 mt-1">{hardware?.gpu_recommendation || "NVIDIA RTX 3080 / A10G"}</div>
                                        </div>
                                        <div className="p-3 bg-slate-900 rounded-lg">
                                            <span className="text-slate-400">Estimated VRAM:</span>
                                            <div className="font-semibold text-slate-200 mt-1">{hardware?.vram_estimate || "8GB - 16GB"}</div>
                                        </div>
                                        <div className="p-3 bg-slate-900 rounded-lg">
                                            <span className="text-slate-400">Training Time:</span>
                                            <div className="font-semibold text-slate-200 mt-1">{hardware?.training_time_estimate || "2-6 hours on GPU"}</div>
                                        </div>
                                    </div>
                                </div>

                                {feasibility?.implementation_steps && (
                                    <div>
                                        <h3 className="text-base font-bold text-white mb-2">Recommended Implementation Steps</h3>
                                        <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300">
                                            {feasibility.implementation_steps.map((step: string, i: number) => (
                                                <li key={i}>{step}</li>
                                            ))}
                                        </ol>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
