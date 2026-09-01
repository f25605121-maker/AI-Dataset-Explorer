"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

interface DatasetItem {
    id: string;
    name: string;
    title?: string;
    subtitle?: string;
    description?: string;
    url: string;
    creator?: string;
    creatorName?: string;
    ref?: string;
    matchScore?: number;
    relevanceScore?: number;
    scoreBreakdown?: {
        task: number;
        modality: number;
        domain: number;
        subdomain: number;
        target: number;
        metadata: number;
    };
    license?: string;
    sizeBytes?: number;
    datasetSize?: number;
    source?: string;
    matchReason?: string;
    rejected?: boolean;
    rejectionReason?: string;
    downloads?: number;
    tags?: string[];
    modality?: string;
    task?: string;
}

interface ModelItem {
    id: string;
    name?: string;
    pipeline?: string;
    url: string;
    matchScore?: number;
    architecture?: string;
    difficulty?: string;
    recommendation?: string;
    description?: string;
    matchReason?: string;
    task?: string;
    downloads?: number;
}

export default function ExplorePage() {
    const { data: session } = useSession();
    const [searchInput, setSearchInput] = useState("");
    const [submittedQuery, setSubmittedQuery] = useState("");
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    // Search state
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Non-dataset query flag & direct answer
    const [isGeneralQuery, setIsGeneralQuery] = useState(false);
    const [aiDirectAnswer, setAiDirectAnswer] = useState<string | null>(null);

    // Active tab in results view
    const [activeTab, setActiveTab] = useState<'overview' | 'datasets' | 'models' | 'hardware' | 'inspector'>('overview');

    // Dataset & model results
    const [datasets, setDatasets] = useState<DatasetItem[]>([]);
    const [models, setModels] = useState<ModelItem[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [feasibility, setFeasibility] = useState<any>(null);
    const [hardware, setHardware] = useState<any>(null);
    const [apiAudit, setApiAudit] = useState<any>(null);
    const [searchCoverage, setSearchCoverage] = useState<any>(null);
    const [datasetCompatibility, setDatasetCompatibility] = useState<any[]>([]);
    const [labelMapping, setLabelMapping] = useState<any[]>([]);
    const [recommendationCategories, setRecommendationCategories] = useState<any[]>([]);

    // Filters
    const [sourceFilter, setSourceFilter] = useState<'all' | 'kaggle' | 'huggingface'>('all');
    const [selectedCompare, setSelectedCompare] = useState<string[]>([]);
    const [compareModalOpen, setCompareModalOpen] = useState(false);
    const [activeDataset, setActiveDataset] = useState<DatasetItem | null>(null);

    // Anonymous limit
    const [anonSearchCount, setAnonSearchCount] = useState<number>(() => {
        if (typeof window === 'undefined') return 0;
        return parseInt(localStorage.getItem('anon_search_count') || '0', 10);
    });
    const [showSignInGate, setShowSignInGate] = useState(false);

    const latestRequestRef = useRef<string>('');
    const abortControllerRef = useRef<AbortController | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        return () => {
            abortControllerRef.current?.abort();
        };
    }, []);

    // Filter datasets by source
    const filteredDatasets = useMemo(() => {
        if (!datasets) return [];
        return datasets.filter((item) => {
            if (sourceFilter === 'all') return true;
            const src = (item.source || '').toLowerCase();
            if (sourceFilter === 'kaggle') return src === 'kaggle';
            if (sourceFilter === 'huggingface') return src.includes('hugging');
            return true;
        });
    }, [datasets, sourceFilter]);

    // Helpers
    const dsName = (ds: DatasetItem) => ds.title || ds.name || ds.id || 'Unnamed Dataset';
    const dsDescription = (ds: DatasetItem) => ds.subtitle || ds.description || 'No description available.';
    const dsScore = (ds: DatasetItem) => ds.matchScore ?? ds.relevanceScore ?? 0;
    const dsSize = (bytes?: number) => {
        if (!bytes || bytes === 0) return 'Size unstated';
        const mb = bytes / (1024 * 1024);
        if (mb < 1000) return `${mb.toFixed(1)} MB`;
        return `${(mb / 1024).toFixed(1)} GB`;
    };

    const toggleCompare = (id: string) => {
        setSelectedCompare((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id].slice(0, 4)
        );
    };

    const compareList = useMemo(() => {
        return datasets.filter((d) => selectedCompare.includes(d.id || d.ref || d.name));
    }, [datasets, selectedCompare]);

    // Search handler
    const handleSearch = async (queryToSearch: string) => {
        const trimmed = queryToSearch.trim();
        if (!trimmed) return;

        // Anonymous usage check
        if (!session) {
            const count = parseInt(localStorage.getItem('anon_search_count') || '0', 10);
            if (count >= 3) {
                setShowSignInGate(true);
                return;
            }
            const nextCount = count + 1;
            localStorage.setItem('anon_search_count', String(nextCount));
            setAnonSearchCount(nextCount);
        }

        const requestId = crypto.randomUUID();
        latestRequestRef.current = requestId;
        setSubmittedQuery(trimmed);

        abortControllerRef.current?.abort();
        const controller = new AbortController();
        abortControllerRef.current = controller;

        setIsLoading(true);
        setHasSearched(true);
        setError(null);
        setIsGeneralQuery(false);
        setAiDirectAnswer(null);

        try {
            const res = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: trimmed, searchId: requestId }),
                signal: controller.signal,
            });

            const data = await res.json();

            if (requestId !== latestRequestRef.current || controller.signal.aborted) {
                return;
            }

            if (!res.ok || !data.success) {
                setError(data.error?.message || data.error || 'Search encountered an error. Please try again.');
                return;
            }

            const isGen = Boolean(data.isGeneralQuery || data.type === 'general' || data.type === 'greeting' || (!data.datasets?.length && data.answer));
            setIsGeneralQuery(isGen);
            setAiDirectAnswer(data.answer || data.message || data.analysis?.ai_analysis || null);

            setDatasets(data.datasets || []);
            setModels(data.models || []);
            setSummary(data.summary || null);
            setAnalysis(data.analysis || null);
            setFeasibility(data.feasibility || null);
            setHardware(data.hardware || null);
            setApiAudit(data.apiAudit || null);
            setSearchCoverage(data.searchCoverage || null);
            setDatasetCompatibility(data.datasetCompatibility || []);
            setLabelMapping(data.labelMapping || []);
            setRecommendationCategories(data.recommendationCategories || []);

            // If general query, default tab is overview
            if (isGen) {
                setActiveTab('overview');
            }

        } catch (err: any) {
            if (err.name !== 'AbortError' && requestId === latestRequestRef.current) {
                setError(err.message || 'Failed to connect to search service.');
            }
        } finally {
            if (requestId === latestRequestRef.current && !controller.signal.aborted) {
                setIsLoading(false);
            }
        }
    };

    const bestDataset = summary?.bestDataset || (datasets.length > 0 ? datasets[0] : null);
    const bestModel = summary?.bestModel || (models.length > 0 ? models[0] : null);

    return (
        <main className="min-h-screen bg-[#050811] text-slate-100 font-sans selection:bg-emerald-500/30 relative flex flex-col">
            {/* Ambient background glow */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[700px] h-[500px] rounded-full bg-emerald-500/5 blur-[120px]" />
                <div className="absolute top-1/3 right-10 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[150px]" />
                <div className="absolute bottom-10 left-1/3 w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[140px]" />
            </div>

            {/* Header Navigation */}
            <header className="sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between bg-[#070c18]/85 backdrop-blur-xl border-b border-slate-800/80 shadow-sm">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                            ✦
                        </div>
                        <span className="font-bold text-base tracking-tight text-white group-hover:text-emerald-400 transition">
                            AI Dataset Explorer
                        </span>
                    </Link>
                </div>

                {/* Right controls */}
                <div className="flex items-center gap-3">
                    {/* Export button */}
                    {hasSearched && !isLoading && (
                        <button
                            onClick={() => {
                                const report = JSON.stringify({ summary, analysis, feasibility, hardware, datasets, models }, null, 2);
                                const blob = new Blob([report], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `dataset-explorer-analysis-${Date.now()}.json`;
                                a.click();
                                URL.revokeObjectURL(url);
                            }}
                            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition"
                            title="Export results"
                        >
                            <span>📥</span> Export JSON
                        </button>
                    )}

                    {/* Auth Status */}
                    {session?.user ? (
                        <div className="relative">
                            <button
                                onClick={() => setIsProfileOpen(!isProfileOpen)}
                                className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700 hover:border-slate-600 rounded-full pl-2 pr-3 py-1 text-xs transition"
                            >
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-slate-950 font-bold flex items-center justify-center">
                                    {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                                </div>
                                <span className="text-slate-200 font-medium max-w-[120px] truncate">{session.user.name || session.user.email}</span>
                            </button>

                            {isProfileOpen && (
                                <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#0c1424] border border-slate-700 shadow-2xl p-2 z-50">
                                    <div className="px-3 py-2 border-b border-slate-800 text-xs">
                                        <div className="font-semibold text-white truncate">{session.user.name}</div>
                                        <div className="text-slate-400 truncate">{session.user.email}</div>
                                    </div>
                                    <Link href="/settings" className="block px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition mt-1">
                                        Settings
                                    </Link>
                                    <button
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                        className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Link href="/login" className="px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white transition">
                                Sign In
                            </Link>
                            <Link href="/signup" className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </header>

            {/* Main Content Area */}
            <div className="max-w-7xl w-full mx-auto px-4 md:px-8 py-6 flex-1 flex flex-col space-y-6">

                {/* Search Bar Container */}
                <div className="w-full bg-[#0a101f] border border-slate-800/90 rounded-2xl p-4 md:p-5 shadow-xl">
                    <form onSubmit={(e) => { e.preventDefault(); handleSearch(searchInput); }} className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="pt-2.5 pl-1 text-slate-500">
                                {isLoading ? (
                                    <span className="inline-block w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
                                ) : (
                                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                )}
                            </div>

                            <textarea
                                ref={textareaRef}
                                rows={2}
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSearch(searchInput);
                                    }
                                }}
                                placeholder="Ask anything, explore any AI concept, or describe your dataset needs (e.g. 'What is backpropagation?' or 'Coronary artery CT dataset')..."
                                className="w-full bg-transparent text-sm md:text-base text-slate-100 placeholder-slate-500 outline-none resize-none leading-relaxed"
                            />

                            <button
                                type="submit"
                                disabled={isLoading || !searchInput.trim()}
                                className="shrink-0 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-xs md:text-sm transition shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                                {isLoading ? "Processing..." : "Explore"}
                            </button>
                        </div>

                        {/* Quick Prompts */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                            <span className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Try:</span>
                            {[
                                "What is supervised vs unsupervised learning?",
                                "Explain backpropagation algorithm",
                                "Coronary artery segmentation CT",
                                "Real-time vehicle detection video",
                                "How to reverse a string in Python?",
                            ].map((prompt) => (
                                <button
                                    key={prompt}
                                    type="button"
                                    onClick={() => {
                                        setSearchInput(prompt);
                                        handleSearch(prompt);
                                    }}
                                    className="px-2.5 py-1 rounded-md bg-slate-900/80 hover:bg-slate-800 hover:text-emerald-300 text-slate-400 border border-slate-800 transition text-[11px]"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </form>
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-200 text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <span className="text-base">⚠</span>
                            <span>{error}</span>
                        </div>
                        <button
                            onClick={() => handleSearch(submittedQuery)}
                            className="px-3 py-1 rounded-lg bg-rose-900/50 hover:bg-rose-800/50 text-xs font-semibold transition"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Results Section */}
                {hasSearched && (
                    <div className="space-y-6">

                        {/* 4-Card Summary Strip */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                            <div className="p-4 rounded-xl bg-[#090f1d] border border-slate-800/90 shadow-sm">
                                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Inquiry Type</div>
                                <div className="text-sm md:text-base font-bold text-emerald-400 mt-1 capitalize truncate">
                                    {isGeneralQuery ? "General / Conceptual AI" : (summary?.domain || analysis?.domain || "Machine Learning")}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5 capitalize truncate">
                                    {isGeneralQuery ? "Direct Statement Response" : (summary?.task || analysis?.task || "Dataset Discovery")}
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-[#090f1d] border border-slate-800/90 shadow-sm">
                                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Modality & Format</div>
                                <div className="text-sm md:text-base font-bold text-cyan-400 mt-1 capitalize truncate">
                                    {isGeneralQuery ? "Text & Code" : (summary?.dataType || analysis?.data_modality || "Multi-Modal")}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5 truncate">
                                    {isGeneralQuery ? "Knowledge & Explanations" : `Target: ${analysis?.target || "General"}`}
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-[#090f1d] border border-slate-800/90 shadow-sm">
                                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Discovered Items</div>
                                <div className="text-sm md:text-base font-bold text-white mt-1">
                                    {datasets.length} <span className="text-xs font-normal text-slate-400">Datasets</span> · {models.length} <span className="text-xs font-normal text-slate-400">Models</span>
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5">
                                    {isGeneralQuery ? "Direct Answer Mode" : "Sources: Kaggle & Hugging Face"}
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-[#090f1d] border border-slate-800/90 shadow-sm">
                                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Status & Confidence</div>
                                <div className="text-sm md:text-base font-bold text-indigo-400 mt-1">
                                    {isGeneralQuery ? "100% Direct Match" : (feasibility?.feasibility_score ? `${feasibility.feasibility_score}/100 Feasibility` : "Ready")}
                                </div>
                                <div className="text-xs text-slate-400 mt-0.5 truncate">
                                    {isGeneralQuery ? "Conversational AI" : (hardware?.gpu_recommendation || "Compute analyzed")}
                                </div>
                            </div>
                        </div>

                        {/* Navigation Tabs Bar */}
                        <div className="flex items-center justify-between border-b border-slate-800 overflow-x-auto pb-0">
                            <div className="flex gap-2">
                                {[
                                    { key: 'overview', label: isGeneralQuery ? 'AI Direct Response' : 'Overview & AI Rationale', icon: '✦' },
                                    { key: 'datasets', label: `Datasets (${datasets.length})`, icon: '📦' },
                                    { key: 'models', label: `Models (${models.length})`, icon: '🤖' },
                                    { key: 'hardware', label: 'Hardware & Roadmap', icon: '⚡' },
                                    { key: 'inspector', label: 'Query & API Inspector', icon: '🔬' },
                                ].map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key as any)}
                                        className={`flex items-center gap-1.5 px-4 py-3 text-xs md:text-sm font-semibold border-b-2 transition -mb-px shrink-0 ${
                                            activeTab === tab.key
                                                ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5 rounded-t-lg'
                                                : 'border-transparent text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        <span>{tab.icon}</span>
                                        <span>{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Compare Tray quick open */}
                            {selectedCompare.length > 0 && (
                                <button
                                    onClick={() => setCompareModalOpen(true)}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 font-semibold transition shrink-0"
                                >
                                    Compare ({selectedCompare.length}) ↗
                                </button>
                            )}
                        </div>

                        {/* ── TAB 1: OVERVIEW & DIRECT ANSWER ───────────────────────── */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                
                                {/* If it's a general non-dataset statement or has a direct answer */}
                                {aiDirectAnswer && (
                                    <div className="p-6 md:p-7 rounded-2xl bg-gradient-to-br from-[#0c1529] via-[#091021] to-[#070c18] border border-emerald-500/40 shadow-xl space-y-4">
                                        <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                                            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                                {isGeneralQuery ? "AI Assistant Statement Response" : "AI Evidence Synthesis & Rationale"}
                                            </div>
                                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700">
                                                {isGeneralQuery ? "General Knowledge" : "Evidence-Grounded"}
                                            </span>
                                        </div>

                                        <div className="text-sm md:text-base text-slate-100 leading-relaxed whitespace-pre-wrap font-sans">
                                            {aiDirectAnswer}
                                        </div>

                                        {isGeneralQuery && (
                                            <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-400">
                                                <span>Looking for ML datasets on this topic? Try a specific project query:</span>
                                                <button
                                                    onClick={() => {
                                                        const dsPrompt = `${submittedQuery} dataset`;
                                                        setSearchInput(dsPrompt);
                                                        handleSearch(dsPrompt);
                                                    }}
                                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-semibold transition"
                                                >
                                                    🔍 Search datasets for &quot;{submittedQuery.slice(0, 25)}...&quot;
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Top Showcase: Best Dataset & Best Model (if datasets are found) */}
                                {datasets.length > 0 && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                        {/* Best Dataset Card */}
                                        <div className="p-5 rounded-2xl bg-[#090f1d] border border-emerald-500/40 shadow-sm flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wide">
                                                        🏆 Top Recommended Dataset
                                                    </span>
                                                    <span className="text-xs font-bold text-emerald-400">
                                                        Score: {bestDataset ? dsScore(bestDataset) : 0}/100
                                                    </span>
                                                </div>
                                                <h3 className="text-base md:text-lg font-bold text-white mt-3">
                                                    {bestDataset ? dsName(bestDataset) : "No high-confidence dataset match"}
                                                </h3>
                                                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                                                    {bestDataset ? dsDescription(bestDataset) : "Try refining your search query."}
                                                </p>
                                            </div>

                                            {bestDataset && (
                                                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                                                    <span className="text-xs text-slate-400">
                                                        Source: <strong className="text-slate-300">{bestDataset.source || 'Kaggle'}</strong>
                                                    </span>
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setActiveDataset(bestDataset)}
                                                            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                                                        >
                                                            Details
                                                        </button>
                                                        <a
                                                            href={bestDataset.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition flex items-center gap-1"
                                                        >
                                                            Open ↗
                                                        </a>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Best Model Card */}
                                        <div className="p-5 rounded-2xl bg-[#090f1d] border border-cyan-500/40 shadow-sm flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase tracking-wide">
                                                        🤖 Top Compatible Model
                                                    </span>
                                                    <span className="text-xs font-bold text-cyan-400">
                                                        Score: {bestModel ? (bestModel.matchScore ?? 75) : 0}/100
                                                    </span>
                                                </div>
                                                <h3 className="text-base md:text-lg font-bold text-white mt-3 truncate">
                                                    {bestModel ? (bestModel.name || bestModel.id) : "No specific model match"}
                                                </h3>
                                                <div className="text-xs text-slate-300 mt-1">
                                                    Architecture: <strong className="text-emerald-400">{bestModel?.architecture || analysis?.primary_architecture || "Custom"}</strong>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                                                    {bestModel?.description || bestModel?.matchReason || "Pretrained weights on Hugging Face ready for fine-tuning."}
                                                </p>
                                            </div>

                                            {bestModel && (
                                                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                                                    <span className="text-xs text-slate-400">
                                                        Pipeline: <strong className="text-slate-300">{bestModel.pipeline || bestModel.task || 'Model Hub'}</strong>
                                                    </span>
                                                    {bestModel.url && (
                                                        <a
                                                            href={bestModel.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition flex items-center gap-1"
                                                        >
                                                            Hugging Face ↗
                                                        </a>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── TAB 2: DATASETS HUB ───────────────────────────────────── */}
                        {activeTab === 'datasets' && (
                            <div className="space-y-4">
                                {datasets.length === 0 ? (
                                    <div className="p-8 text-center bg-[#090f1d] border border-slate-800 rounded-2xl space-y-3">
                                        <div className="text-3xl">📦</div>
                                        <h3 className="text-base font-bold text-white">No Datasets Requested for this Statement</h3>
                                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                                            Your search was answered as a general statement or concept. To search for datasets, enter a specific project goal or modality (e.g. &quot;Chest X-ray pneumonia dataset&quot;).
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Source filters */}
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex gap-2">
                                                {[
                                                    { key: 'all', label: `All (${datasets.length})` },
                                                    { key: 'kaggle', label: `Kaggle (${datasets.filter(d => (d.source || '').toLowerCase() === 'kaggle').length})` },
                                                    { key: 'huggingface', label: `Hugging Face (${datasets.filter(d => (d.source || '').toLowerCase().includes('hugging')).length})` },
                                                ].map((f) => (
                                                    <button
                                                        key={f.key}
                                                        onClick={() => setSourceFilter(f.key as any)}
                                                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                                                            sourceFilter === f.key
                                                                ? 'bg-emerald-500 text-slate-950'
                                                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                                        }`}
                                                    >
                                                        {f.label}
                                                    </button>
                                                ))}
                                            </div>

                                            <span className="text-xs text-slate-400">
                                                Showing {filteredDatasets.length} datasets
                                            </span>
                                        </div>

                                        {/* Dataset Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {filteredDatasets.map((ds, idx) => {
                                                const isKaggle = (ds.source || '').toLowerCase() === 'kaggle';
                                                const isCompared = selectedCompare.includes(ds.id || ds.ref || ds.name);

                                                return (
                                                    <div
                                                        key={ds.id || idx}
                                                        className={`p-5 rounded-2xl bg-[#090f1d] border transition-all flex flex-col justify-between ${
                                                            ds.rejected
                                                                ? 'border-rose-900/30 opacity-60'
                                                                : 'border-slate-800/90 hover:border-slate-700'
                                                        }`}
                                                    >
                                                        <div>
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                    isKaggle
                                                                        ? 'bg-blue-900/40 text-blue-300 border border-blue-700/40'
                                                                        : 'bg-amber-900/40 text-amber-300 border border-amber-700/40'
                                                                }`}>
                                                                    {ds.source || 'Dataset'}
                                                                </span>

                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-bold text-emerald-400">
                                                                        {dsScore(ds)}% Match
                                                                    </span>
                                                                    <button
                                                                        onClick={() => toggleCompare(ds.id || ds.ref || ds.name)}
                                                                        className={`text-[10px] px-2 py-0.5 rounded border transition font-semibold ${
                                                                            isCompared
                                                                                ? 'bg-indigo-600 text-white border-indigo-500'
                                                                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                                                                        }`}
                                                                    >
                                                                        {isCompared ? '✓ Added' : '+ Compare'}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <h3 className="text-sm md:text-base font-bold text-white mt-2.5">
                                                                {dsName(ds)}
                                                            </h3>
                                                            <p className="text-xs text-slate-400 mt-1.5 line-clamp-3 leading-relaxed">
                                                                {dsDescription(ds)}
                                                            </p>

                                                            <div className="flex flex-wrap gap-2 mt-3 text-[11px] text-slate-400">
                                                                <span className="bg-slate-800/70 px-2 py-0.5 rounded">
                                                                    Modality: <strong className="text-slate-300">{ds.modality || "Unknown"}</strong>
                                                                </span>
                                                                <span className="bg-slate-800/70 px-2 py-0.5 rounded">
                                                                    Size: <strong className="text-slate-300">{dsSize(ds.sizeBytes)}</strong>
                                                                </span>
                                                                {ds.license && (
                                                                    <span className="bg-slate-800/70 px-2 py-0.5 rounded truncate max-w-[120px]">
                                                                        {ds.license}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                                                            <button
                                                                onClick={() => setActiveDataset(ds)}
                                                                className="text-xs text-slate-400 hover:text-slate-200 font-semibold"
                                                            >
                                                                Score Breakdown ▾
                                                            </button>
                                                            {ds.url && (
                                                                <a
                                                                    href={ds.url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                                                                >
                                                                    Open Dataset ↗
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* ── TAB 3: MODELS HUB ─────────────────────────────────────── */}
                        {activeTab === 'models' && (
                            <div className="space-y-4">
                                {models.length === 0 ? (
                                    <div className="p-8 text-center bg-[#090f1d] border border-slate-800 rounded-2xl space-y-3">
                                        <div className="text-3xl">🤖</div>
                                        <h3 className="text-base font-bold text-white">No Models Filtered for this Query</h3>
                                        <p className="text-xs text-slate-400 max-w-md mx-auto">
                                            Try searching with model-specific keywords like &quot;YOLO object detection model&quot; or &quot;BERT sentiment analysis&quot;.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {models.map((m, idx) => (
                                            <div
                                                key={m.id || idx}
                                                className="p-5 rounded-2xl bg-[#090f1d] border border-slate-800/90 hover:border-slate-700 transition flex flex-col justify-between"
                                            >
                                                <div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300 border border-indigo-700/40">
                                                            Hugging Face
                                                        </span>
                                                        <span className="text-xs font-bold text-cyan-400">
                                                            {m.matchScore ?? 70}% Match
                                                        </span>
                                                    </div>

                                                    <h3 className="text-sm md:text-base font-bold text-white mt-2.5 truncate">
                                                        {m.name || m.id}
                                                    </h3>
                                                    <div className="text-xs text-slate-300 mt-1">
                                                        Architecture: <strong className="text-emerald-400">{m.architecture || "Unknown"}</strong>
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                                                        {m.description || m.matchReason || "Open-source pretrained model available on Hugging Face."}
                                                    </p>
                                                </div>

                                                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                                                    <span className="text-xs text-slate-400">
                                                        Task: <strong className="text-slate-300">{m.task || m.pipeline || "ML"}</strong>
                                                    </span>
                                                    {m.url && (
                                                        <a
                                                            href={m.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                                                        >
                                                            Model Card ↗
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── TAB 4: HARDWARE & ROADMAP ─────────────────────────────── */}
                        {activeTab === 'hardware' && (
                            <div className="space-y-6">
                                {/* Hardware Box */}
                                <div className="p-6 rounded-2xl bg-[#090f1d] border border-slate-800 space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-400">
                                        Estimated Hardware & VRAM Requirements
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                        <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800">
                                            <span className="text-slate-400">Recommended GPU</span>
                                            <div className="text-sm font-bold text-white mt-1">
                                                {hardware?.gpu_recommendation || "NVIDIA RTX 3080 / A10G"}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800">
                                            <span className="text-slate-400">Estimated VRAM</span>
                                            <div className="text-sm font-bold text-white mt-1">
                                                {hardware?.vram_estimate || "8GB - 16GB VRAM"}
                                            </div>
                                        </div>
                                        <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800">
                                            <span className="text-slate-400">Estimated Training Time</span>
                                            <div className="text-sm font-bold text-white mt-1">
                                                {hardware?.training_time_estimate || "2 - 6 hours"}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Step-by-Step Roadmap */}
                                <div className="p-6 rounded-2xl bg-[#090f1d] border border-slate-800 space-y-4">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400">
                                        Implementation Roadmap
                                    </h3>
                                    <div className="space-y-3">
                                        {(feasibility?.implementation_steps || [
                                            "1. Download & verify dataset splits and license terms",
                                            "2. Preprocess input data to match expected architecture tensors",
                                            "3. Instantiate pretrained model weights from Hugging Face",
                                            "4. Run baseline evaluation with default hyperparameters",
                                            "5. Fine-tune on target dataset using early stopping",
                                            "6. Quantize / export model for real-time inference",
                                        ]).map((step: string, i: number) => (
                                            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                                                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold flex items-center justify-center shrink-0">
                                                    {i + 1}
                                                </span>
                                                <span className="text-slate-200 mt-0.5">{step}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── TAB 5: QUERY & AUDIT INSPECTOR ───────────────────────── */}
                        {activeTab === 'inspector' && (
                            <div className="p-6 rounded-2xl bg-[#090f1d] border border-slate-800 space-y-6">
                                <div>
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 mb-3">
                                        Structured Query Understanding
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                                            <span className="text-slate-500">Domain</span>
                                            <div className="font-semibold text-white mt-1">{analysis?.domain || "General"}</div>
                                        </div>
                                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                                            <span className="text-slate-500">Task</span>
                                            <div className="font-semibold text-white mt-1">{analysis?.task || "Inquiry"}</div>
                                        </div>
                                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                                            <span className="text-slate-500">Modality</span>
                                            <div className="font-semibold text-white mt-1">{analysis?.data_modality || "Text"}</div>
                                        </div>
                                        <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                                            <span className="text-slate-500">Target</span>
                                            <div className="font-semibold text-white mt-1">{analysis?.target || "General"}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* API Status Cards */}
                                {apiAudit && (
                                    <div>
                                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
                                            Multi-Source API Diagnostic Status
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                            {Object.entries(apiAudit).map(([k, v]: [string, any]) => (
                                                <div key={k} className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                                                    <span className="text-slate-400 capitalize">{k}</span>
                                                    <div className={`font-semibold mt-1 ${v?.success ? 'text-emerald-400' : 'text-amber-400'}`}>
                                                        {v?.status || (v?.success ? 'ONLINE' : 'OFFLINE')}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── DATASET DETAIL MODAL ─────────────────────────────────────── */}
            {activeDataset && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    onClick={(e) => { if (e.target === e.currentTarget) setActiveDataset(null); }}
                >
                    <div className="w-full max-w-xl rounded-2xl bg-[#090f1d] border border-slate-700 shadow-2xl p-6 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 uppercase">
                                    {activeDataset.source || 'Dataset'}
                                </span>
                                <h3 className="text-lg font-bold text-white mt-2">{dsName(activeDataset)}</h3>
                            </div>
                            <button
                                onClick={() => setActiveDataset(null)}
                                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed max-h-36 overflow-y-auto">
                            {dsDescription(activeDataset)}
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2.5 bg-slate-900 rounded-lg">
                                <span className="text-slate-500">Size:</span>
                                <div className="font-semibold text-slate-200 mt-0.5">{dsSize(activeDataset.sizeBytes)}</div>
                            </div>
                            <div className="p-2.5 bg-slate-900 rounded-lg">
                                <span className="text-slate-500">Match Score:</span>
                                <div className="font-semibold text-emerald-400 mt-0.5">{dsScore(activeDataset)}/100</div>
                            </div>
                        </div>

                        {activeDataset.scoreBreakdown && (
                            <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                                <div className="text-slate-400 font-semibold mb-1">Score Breakdown:</div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Task Match:</span>
                                    <span className="text-emerald-400">{activeDataset.scoreBreakdown.task}/30</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Modality Match:</span>
                                    <span className="text-emerald-400">{activeDataset.scoreBreakdown.modality}/20</span>
                                </div>
                                <div className="flex justify-between text-slate-400">
                                    <span>Domain Match:</span>
                                    <span className="text-emerald-400">{activeDataset.scoreBreakdown.domain}/20</span>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-2 pt-3">
                            <button
                                onClick={() => setActiveDataset(null)}
                                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                            >
                                Close
                            </button>
                            {activeDataset.url && (
                                <a
                                    href={activeDataset.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-2 text-center rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold"
                                >
                                    Open on {activeDataset.source || 'Hub'} ↗
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── DATASET COMPARISON MODAL ─────────────────────────────────── */}
            {compareModalOpen && compareList.length >= 2 && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    onClick={(e) => { if (e.target === e.currentTarget) setCompareModalOpen(false); }}
                >
                    <div className="w-full max-w-4xl rounded-2xl bg-[#090f1d] border border-slate-700 shadow-2xl p-6 space-y-5 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                            <div>
                                <h3 className="text-lg font-bold text-white">Dataset Comparison</h3>
                                <p className="text-xs text-slate-400">Comparing {compareList.length} selected datasets side by side</p>
                            </div>
                            <button
                                onClick={() => setCompareModalOpen(false)}
                                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 flex items-center justify-center"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {compareList.map((ds) => (
                                <div key={ds.id || ds.name} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                            {ds.source || 'Dataset'}
                                        </span>
                                        <span className="text-xs font-bold text-emerald-400">
                                            {dsScore(ds)}% Match
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-white line-clamp-1">{dsName(ds)}</h4>
                                    <p className="text-xs text-slate-400 line-clamp-3">{dsDescription(ds)}</p>
                                    <div className="text-xs text-slate-300 pt-2 border-t border-slate-800">
                                        Size: <strong>{dsSize(ds.sizeBytes)}</strong>
                                    </div>
                                    {ds.url && (
                                        <a
                                            href={ds.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block text-center py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-semibold"
                                        >
                                            View ↗
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── SIGN-IN GATE MODAL ───────────────────────────────────────── */}
            {showSignInGate && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowSignInGate(false); }}
                >
                    <div className="w-full max-w-md rounded-2xl bg-[#090f1d] border border-slate-700 p-6 text-center space-y-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold text-xl mx-auto flex items-center justify-center">
                            ✦
                        </div>
                        <h3 className="text-lg font-bold text-white">Create a Free Account</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            You have reached the limit of free anonymous searches. Sign in or create an account for unlimited dataset searches, AI synthesis, and model matching.
                        </p>
                        <div className="flex gap-2 pt-2">
                            <Link
                                href="/login"
                                className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/signup"
                                className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold text-center"
                            >
                                Sign Up Free
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
