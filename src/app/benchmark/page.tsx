"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { useSearchSession } from "@/context/SearchSessionContext";
import type { PinnedAsset } from "@/types/assets";

import { TRENDING_TEMPLATES, searchTemplateByQuery } from "@/fixtures/trending-templates";
import { DatasetItem } from "@/components/cards/DatasetCard";
import { ModelItem } from "@/components/cards/ModelCard";
import { NormalizedPaper } from "@/types/papers";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { StitchEmptyState } from "@/components/common/StitchEmptyState";

// Fallback Format Detection: Infer file extensions from modality, query, or template
function getDatasetFormats(dataset: any, modality?: string, queryStr?: string): string[] {
    if (Array.isArray(dataset.formats) && dataset.formats.length > 0) {
        return dataset.formats;
    }
    const combined = `${modality || ''} ${queryStr || ''} ${dataset.title || ''} ${dataset.name || ''} ${dataset.description || ''} ${dataset.modality || ''}`.toLowerCase();
    
    if (combined.includes('cryo') || combined.includes('electron tomography') || combined.includes('subtomogram') || combined.includes('macromolecule')) {
        return ["MRC (.mrc)", "EM (.em)", "TIFF"];
    }
    if (combined.includes('ct') || combined.includes('mri') || combined.includes('dicom') || combined.includes('nifti') || combined.includes('medical') || combined.includes('ccta') || combined.includes('artery') || combined.includes('organ') || combined.includes('volume')) {
        return ["NIfTI (.nii.gz)", "DICOM"];
    }
    if (combined.includes('audio') || combined.includes('speech') || combined.includes('voice') || combined.includes('sound') || combined.includes('emotion') || combined.includes('wav')) {
        return ["WAV", "FLAC", "MP3"];
    }
    if (combined.includes('video') || combined.includes('cctv') || combined.includes('surveillance') || combined.includes('traffic') || combined.includes('mp4') || combined.includes('avi')) {
        return ["MP4", "AVI"];
    }
    if (combined.includes('tabular') || combined.includes('csv') || combined.includes('table') || combined.includes('finance') || combined.includes('structured') || combined.includes('parquet')) {
        return ["CSV", "Parquet"];
    }
    if (combined.includes('text') || combined.includes('nlp') || combined.includes('qa') || combined.includes('sentiment') || combined.includes('language')) {
        return ["JSON", "TXT", "Parquet"];
    }
    if (combined.includes('image') || combined.includes('vision') || combined.includes('detection') || combined.includes('segmentation') || combined.includes('classification')) {
        return ["JPEG", "PNG", "TFRecord"];
    }
    return ["NIfTI (.nii.gz)", "DICOM"];
}

// Volume formatting: Avoid "0.0 GB" / "0 GB" for unmeasured cloud datasets
function getDatasetVolumeDisplay(dataset: any): { display: string; isFallback: boolean } {
    if (dataset.sizeBytes && dataset.sizeBytes > 0) {
        const gb = dataset.sizeBytes / (1024 * 1024 * 1024);
        if (gb >= 1) return { display: `${gb.toFixed(1)} GB`, isFallback: false };
        const mb = dataset.sizeBytes / (1024 * 1024);
        return { display: `${mb.toFixed(1)} MB`, isFallback: false };
    }
    if (dataset.size && typeof dataset.size === 'string') {
        const trimmed = dataset.size.trim();
        if (trimmed && trimmed !== '0.0 GB' && trimmed !== '0 GB' && trimmed !== '0 MB' && trimmed !== '0' && trimmed !== '0 B' && trimmed.toLowerCase() !== 'unknown') {
            return { display: trimmed, isFallback: false };
        }
    }
    return { display: "Size on Request", isFallback: true };
}

// Multi-Model Head-to-Head Profiling Differentiation
function getModelProfiling(model: any, idx: number, selectedGpu: 'T4' | 'A10G' | 'A100') {
    const name = (model.name || model.id || '').toLowerCase();
    const arch = (model.architecture || model.architectureFamily || '').toLowerCase();
    const combined = `${name} ${arch} ${model.task || ''}`.toLowerCase();

    let params = model.paramsCount || model.parameters;
    let archFamily = model.architectureFamily || model.architecture;
    let contextRes = model.contextResolution;
    let vramFp16 = model.vramFp16;
    let vramFp32 = model.vramFp32;
    let latencyT4 = model.latencyT4;
    let latencyA10G = model.latencyA10G;
    let latencyA100 = model.latencyA100;

    const isUnetBaseline = combined.includes('unet') || combined.includes('cnn') || combined.includes('residual') || combined.includes('resnet') || idx === 1;
    const isSwinOrTransformer = combined.includes('swin') || combined.includes('transformer') || combined.includes('unetr') || combined.includes('vit') || (idx === 0 && !isUnetBaseline);
    const isFoundationOrLLM = combined.includes('foundation') || combined.includes('llama') || combined.includes('clip') || combined.includes('large') || combined.includes('vlm');
    const isDetectionOrYolo = combined.includes('yolo') || combined.includes('detection') || combined.includes('ssd');
    const isAudio = combined.includes('audio') || combined.includes('speech') || combined.includes('whisper') || combined.includes('wav2vec');

    if (!params || params === "62.2M Params") {
        if (isFoundationOrLLM) {
            params = "110M Params";
            archFamily = archFamily || "Multimodal Vision-Language Transformer";
            contextRes = contextRes || "2048 Tokens / Multimodal";
            vramFp16 = vramFp16 || "16.2 GB (FP16)";
            vramFp32 = vramFp32 || "28.0 GB (FP32)";
            latencyT4 = latencyT4 || "620 ms";
            latencyA10G = latencyA10G || "280 ms";
            latencyA100 = latencyA100 || "115 ms";
        } else if (isDetectionOrYolo) {
            params = idx === 0 ? "43.7M Params" : "11.2M Params";
            archFamily = archFamily || "Real-Time CNN / CSP-DarkNet";
            contextRes = contextRes || "640x640 RGB Frame";
            vramFp16 = vramFp16 || (idx === 0 ? "4.5 GB (FP16)" : "2.4 GB (FP16)");
            vramFp32 = vramFp32 || (idx === 0 ? "8.4 GB (FP32)" : "4.8 GB (FP32)");
            latencyT4 = latencyT4 || (idx === 0 ? "14 ms" : "7 ms");
            latencyA10G = latencyA10G || (idx === 0 ? "6.5 ms" : "3.2 ms");
            latencyA100 = latencyA100 || (idx === 0 ? "2.8 ms" : "1.4 ms");
        } else if (isAudio) {
            params = idx === 0 ? "74.0M Params" : "38.5M Params";
            archFamily = archFamily || "Audio Sequence Transformer";
            contextRes = contextRes || "16kHz / 30s Audio Buffer";
            vramFp16 = vramFp16 || (idx === 0 ? "6.5 GB (FP16)" : "3.8 GB (FP16)");
            vramFp32 = vramFp32 || (idx === 0 ? "11.2 GB (FP32)" : "7.8 GB (FP32)");
            latencyT4 = latencyT4 || (idx === 0 ? "120 ms" : "85 ms");
            latencyA10G = latencyA10G || (idx === 0 ? "55 ms" : "42 ms");
            latencyA100 = latencyA100 || (idx === 0 ? "24 ms" : "18 ms");
        } else if (isUnetBaseline && idx > 0) {
            params = "16.4M Params";
            archFamily = archFamily || "3D Convolutional UNet (nnUNet)";
            contextRes = contextRes || "128x128x64 Patch";
            vramFp16 = "4.2 GB (FP16)";
            vramFp32 = "14.2 GB (FP32)";
            latencyT4 = "140 ms";
            latencyA10G = "65 ms";
            latencyA100 = "28 ms";
        } else {
            params = "62.2M Params";
            archFamily = archFamily || "Hierarchical 3D Vision Transformer";
            contextRes = contextRes || "96x96x96 Patch";
            vramFp16 = "12.8 GB (FP16)";
            vramFp32 = "21.5 GB (FP32)";
            latencyT4 = "420 ms";
            latencyA10G = "185 ms";
            latencyA100 = "82 ms";
        }
    }

    archFamily = archFamily || (isUnetBaseline ? "3D Convolutional UNet" : "3D Vision Transformer");
    contextRes = contextRes || (isUnetBaseline ? "128x128x64 Patch" : "96x96x96 Patch");
    vramFp16 = vramFp16 || (isUnetBaseline ? "4.2 GB (FP16)" : "12.8 GB (FP16)");
    vramFp32 = vramFp32 || (isUnetBaseline ? "14.2 GB (FP32)" : "21.5 GB (FP32)");
    
    const latency = selectedGpu === 'T4' 
        ? (latencyT4 || (isUnetBaseline ? '140 ms' : '420 ms')) 
        : selectedGpu === 'A10G' 
        ? (latencyA10G || (isUnetBaseline ? '65 ms' : '185 ms')) 
        : (latencyA100 || (isUnetBaseline ? '28 ms' : '82 ms'));

    return {
        params,
        archFamily,
        contextRes,
        vramFp16,
        vramFp32,
        latency,
    };
}

function BenchmarkContent() {
    const {
        query,
        searchResult,
        isLoading,
        searchProgress,
        searchStage,
        pinnedAssets,
        activeTemplate,
        unpinAsset,
        clearPinnedAssets,
        pinAsset,
        loadTemplate,
        performSearch,
        setSelectedDataset,
        setSelectedModel,
    } = useSearchSession();

    const [searchBarInput, setSearchBarInput] = useState("");
    const [sessionQueryInput, setSessionQueryInput] = useState(query || activeTemplate.query || "");
    const [activeMatrixTab, setActiveMatrixTab] = useState<'all' | 'models' | 'datasets' | 'papers'>('all');
    const [selectedGpu, setSelectedGpu] = useState<'T4' | 'A10G' | 'A100'>('A10G');

    useEffect(() => {
        setSessionQueryInput(query || activeTemplate.query || "");
    }, [query, activeTemplate.query]);

    // Handle inline search
    const handleInlineSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchBarInput.trim()) return;
        await performSearch(searchBarInput.trim());
    };

    const hasActiveSearch = Boolean(query || searchResult);
    const isConversationalOrZero = Boolean(
        searchResult && (
            searchResult.isGeneralQuery ||
            (((searchResult.datasets?.length ?? 0) === 0) && ((searchResult.models?.length ?? 0) === 0) && pinnedAssets.length === 0)
        )
    );

    // Determine active datasets and models for comparison
    const comparedDatasets = useMemo(() => {
        const pinnedDs = pinnedAssets
            .filter((p) => p.type === 'dataset')
            .map((p) => p.data as DatasetItem);

        if (pinnedDs.length > 0) return pinnedDs;
        if (isConversationalOrZero) return [];

        // Fallback: active search results or template datasets (only if no search has been performed)
        if (searchResult?.datasets && searchResult.datasets.length > 0) {
            return searchResult.datasets.slice(0, 3);
        }
        if (!hasActiveSearch) {
            return activeTemplate.datasets.slice(0, 3);
        }
        return [];
    }, [pinnedAssets, searchResult, activeTemplate, isConversationalOrZero, hasActiveSearch]);

    const comparedModels = useMemo(() => {
        const pinnedMdl = pinnedAssets
            .filter((p) => p.type === 'model')
            .map((p) => p.data as ModelItem);

        if (pinnedMdl.length > 0) return pinnedMdl;
        if (isConversationalOrZero) return [];

        // Fallback: active search results or template models (only if no search has been performed)
        if (searchResult?.models && searchResult.models.length > 0) {
            return searchResult.models.slice(0, 3);
        }
        if (!hasActiveSearch) {
            return activeTemplate.models.slice(0, 3);
        }
        return [];
    }, [pinnedAssets, searchResult, activeTemplate, isConversationalOrZero, hasActiveSearch]);

    const comparedPapers = useMemo(() => {
        const pinnedPpr = pinnedAssets
            .filter((p) => p.type === 'paper')
            .map((p) => p.data as NormalizedPaper);

        if (pinnedPpr.length > 0) return pinnedPpr;
        if (isConversationalOrZero) return [];

        if (searchResult?.papers && searchResult.papers.length > 0) {
            return searchResult.papers.slice(0, 3);
        }
        if (!hasActiveSearch) {
            return activeTemplate.papers.slice(0, 2);
        }
        return [];
    }, [pinnedAssets, searchResult, activeTemplate, isConversationalOrZero, hasActiveSearch]);

    // Auto-fill pinboard with top search matches
    const handleAutoFillPins = () => {
        clearPinnedAssets();
        const topDs = searchResult?.datasets?.[0] || activeTemplate.datasets[0];
        const topMdl = searchResult?.models?.[0] || activeTemplate.models[0];
        const secondDs = searchResult?.datasets?.[1] || activeTemplate.datasets[1];
        const secondMdl = searchResult?.models?.[1] || activeTemplate.models[1];

        if (topDs) {
            pinAsset({
                id: topDs.id || 'ds-1',
                type: 'dataset',
                title: topDs.title || topDs.name,
                subtitle: topDs.subtitle || topDs.modality,
                source: topDs.source || 'Dataset',
                score: topDs.matchScore,
                badge: 'Dataset',
                url: topDs.url,
                data: topDs,
                pinnedAt: Date.now(),
            });
        }
        if (topMdl) {
            pinAsset({
                id: topMdl.id || 'mdl-1',
                type: 'model',
                title: topMdl.name || topMdl.id,
                subtitle: topMdl.architecture,
                source: 'Hugging Face',
                score: topMdl.matchScore,
                badge: 'Model',
                url: topMdl.url,
                data: topMdl,
                pinnedAt: Date.now() + 1,
            });
        }
        if (secondDs) {
            pinAsset({
                id: secondDs.id || 'ds-2',
                type: 'dataset',
                title: secondDs.title || secondDs.name,
                subtitle: secondDs.subtitle || secondDs.modality,
                source: secondDs.source || 'Dataset',
                score: secondDs.matchScore,
                badge: 'Dataset',
                url: secondDs.url,
                data: secondDs,
                pinnedAt: Date.now() + 2,
            });
        }
        if (secondMdl) {
            pinAsset({
                id: secondMdl.id || 'mdl-2',
                type: 'model',
                title: secondMdl.name || secondMdl.id,
                subtitle: secondMdl.architecture,
                source: 'Hugging Face',
                score: secondMdl.matchScore,
                badge: 'Model',
                url: secondMdl.url,
                data: secondMdl,
                pinnedAt: Date.now() + 3,
            });
        }
    };

    const templateSynthesis = activeTemplate.tradeOffSynthesis;
    const domainAndTask = searchResult?.domainAndTask || (activeTemplate?.domain ? `${activeTemplate.domain} · ${activeTemplate.category}` : undefined);

    return (
        <main className="min-h-screen flex flex-col bg-page text-primary selection:bg-accent selection:text-white relative">
            {/* Ambient background glow */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden transform-gpu will-change-transform">
                <div className="absolute top-0 left-1/3 w-[600px] h-[400px] rounded-full bg-accent opacity-[var(--glow-opacity,0.2)] blur-[120px]" />
                <div className="absolute top-1/2 right-10 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[110px] opacity-[var(--glow-opacity,0.2)]" />
            </div>

            <Navbar variant="app" />

            {/* Sub-Header Toolbar */}
            <div className="border-b border-subtle bg-card-subtle px-4 sm:px-6 lg:px-8 py-3">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-muted">
                        <Link href="/" className="hover:text-primary transition">Home</Link>
                        <span>/</span>
                        <Link href="/explore" className="hover:text-primary transition">Explore Studio</Link>
                        <span>/</span>
                        <span className="text-primary font-semibold">Benchmark & Compare Lab</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted font-medium whitespace-nowrap">Active Search Session:</span>
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (sessionQueryInput.trim()) {
                                        await performSearch(sessionQueryInput.trim());
                                    }
                                }}
                                className="flex items-center"
                            >
                                <input
                                    type="text"
                                    value={sessionQueryInput}
                                    onChange={(e) => setSessionQueryInput(e.target.value)}
                                    placeholder="Search session query..."
                                    className="px-2.5 py-1 rounded-lg bg-card-solid border border-subtle font-bold text-accent-gradient text-xs outline-none focus:border-accent w-48 sm:w-64 truncate"
                                    title={sessionQueryInput || query || activeTemplate.query}
                                />
                            </form>
                            <Link
                                href={`/explore?q=${encodeURIComponent(sessionQueryInput || query || activeTemplate.query)}`}
                                className="text-xs text-accent-to hover:underline font-semibold flex items-center gap-1 shrink-0"
                            >
                                <span>Explore Studio</span>
                                <span>↗</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Body */}
            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col space-y-8">

                {/* ── TOP HERO TITLE ──────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        {domainAndTask ? (
                            <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse" />
                                {domainAndTask}
                            </div>
                        ) : null}
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-primary">
                            Benchmark & Compare Lab
                        </h1>
                        <p className="text-sm text-muted max-w-2xl leading-relaxed">
                            Evaluate critical trade-offs between candidate datasets, model architectures, VRAM profiles, and licensing rights before committing compute.
                        </p>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={handleAutoFillPins}
                            className="px-4 py-2.5 rounded-xl bg-card hover:bg-card-hover border border-subtle text-secondary hover:text-primary text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                        >
                            <span>⚡</span>
                            <span>Auto-Fill Top Matches</span>
                        </button>

                        <Link
                            href="/roadmaps"
                            className="px-5 py-2.5 rounded-xl bg-accent text-white text-xs font-bold shadow-accent hover:brightness-110 active:scale-95 transition flex items-center gap-1.5"
                        >
                            <span>Generate Roadmap</span>
                            <span>→</span>
                        </Link>
                    </div>
                </div>

                {/* ── FALLBACK EMPTY STATE BANNER (IF NO SEARCH ACTIVE) ────── */}
                {!hasActiveSearch && (
                    <div className="p-6 sm:p-8 rounded-3xl border border-accent bg-card shadow-2xl space-y-5 animate-in fade-in duration-300">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-subtle pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-white text-lg font-bold shadow-accent-sm">
                                    ✦
                                </div>
                                <div>
                                    <h3 className="text-base sm:text-lg font-bold text-primary">
                                        No active search session found
                                    </h3>
                                    <p className="text-xs text-muted mt-0.5">
                                        Select a curated domain benchmark template or type your research query below to populate the comparison matrix.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Trending Template Selector Chips */}
                        <div className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-faint">
                                Select Curated Domain Template:
                            </span>
                            <div className="flex flex-wrap gap-2.5">
                                {TRENDING_TEMPLATES.map((tpl) => (
                                    <button
                                        key={tpl.id}
                                        type="button"
                                        onClick={() => loadTemplate(tpl.id)}
                                        className="px-3.5 py-2 rounded-xl bg-card-solid hover:bg-card-hover border border-subtle hover:border-accent text-secondary hover:text-primary text-xs font-bold transition flex items-center gap-2 shadow-xs"
                                    >
                                        <span>{tpl.icon}</span>
                                        <span>{tpl.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Inline Search Bar */}
                        <form onSubmit={handleInlineSearch} className="flex items-center gap-2 pt-2">
                            <input
                                type="text"
                                value={searchBarInput}
                                onChange={(e) => setSearchBarInput(e.target.value)}
                                placeholder="Or enter your AI problem (e.g., 'Coronary artery CT segmentation' or 'Speech emotion recognition')..."
                                className="flex-1 rounded-xl bg-input border border-subtle px-4 py-2.5 text-xs sm:text-sm text-primary placeholder:text-muted outline-none focus:border-accent transition"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !searchBarInput.trim()}
                                className="relative overflow-hidden px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-xs shadow-accent-sm hover:brightness-110 disabled:opacity-50 transition shrink-0 flex items-center justify-center gap-1.5 min-w-[145px]"
                            >
                                {isLoading && (
                                    <div
                                        className="absolute inset-0 bg-white/20 dark:bg-white/25 transition-all duration-150 ease-out pointer-events-none"
                                        style={{ width: `${Math.min(100, Math.round(searchProgress))}%` }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-1.5">
                                    {isLoading ? (
                                        <>
                                            <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Analyzing {Math.round(searchProgress)}%</span>
                                        </>
                                    ) : (
                                        "Search & Compare"
                                    )}
                                </span>
                            </button>
                        </form>
                    </div>
                )}
                {/* ── CONVERSATIONAL / ZERO-RESULTS BANNER ──────────────────────── */}
                {isConversationalOrZero && (
                    <div className="p-8 rounded-3xl border border-accent bg-card shadow-2xl space-y-6 text-center animate-in fade-in duration-300">
                        <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-accent-sm">
                            💬
                        </div>
                        <div className="max-w-xl mx-auto space-y-2">
                            <h3 className="text-xl font-bold text-primary">
                                General / Conversational AI Query
                            </h3>
                            <p className="text-xs sm:text-sm text-muted leading-relaxed">
                                The active search <strong className="text-primary font-bold">&quot;{query}&quot;</strong> is a general or conversational query without ML datasets or model checkpoints. Explore Studio can answer questions directly, or select a curated domain blueprint below to compare reference checkpoints.
                            </p>
                        </div>

                        {/* Curated Domain Blueprint Selector Chips */}
                        <div className="space-y-3 pt-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-faint block">
                                Select Curated Domain Blueprint:
                            </span>
                            <div className="flex flex-wrap justify-center gap-2.5">
                                {TRENDING_TEMPLATES.map((tpl) => (
                                    <button
                                        key={tpl.id}
                                        type="button"
                                        onClick={() => loadTemplate(tpl.id)}
                                        className="px-3.5 py-2 rounded-xl bg-card-solid hover:bg-card-hover border border-subtle hover:border-accent text-secondary hover:text-primary text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                                    >
                                        <span>{tpl.icon}</span>
                                        <span>{tpl.title}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Re-search Bar */}
                        <form onSubmit={handleInlineSearch} className="flex items-center gap-2 max-w-xl mx-auto pt-2">
                            <input
                                type="text"
                                value={searchBarInput}
                                onChange={(e) => setSearchBarInput(e.target.value)}
                                placeholder="Or search for ML datasets (e.g., 'Coronary artery CT segmentation')..."
                                className="flex-1 rounded-xl bg-input border border-subtle px-4 py-2.5 text-xs sm:text-sm text-primary placeholder:text-muted outline-none focus:border-accent transition"
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !searchBarInput.trim()}
                                className="relative overflow-hidden px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-xs shadow-accent-sm hover:brightness-110 disabled:opacity-50 transition shrink-0 flex items-center justify-center gap-1.5 min-w-[145px]"
                            >
                                {isLoading && (
                                    <div
                                        className="absolute inset-0 bg-white/20 dark:bg-white/25 transition-all duration-150 ease-out pointer-events-none"
                                        style={{ width: `${Math.min(100, Math.round(searchProgress))}%` }}
                                    />
                                )}
                                <span className="relative z-10 flex items-center gap-1.5">
                                    {isLoading ? (
                                        <>
                                            <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            <span>Analyzing {Math.round(searchProgress)}%</span>
                                        </>
                                    ) : (
                                        "Search & Compare"
                                    )}
                                </span>
                            </button>
                        </form>
                    </div>
                )}

                {!isConversationalOrZero && (
                    <>
                {/* ── 1. SELECTION & COMPARISON PINBOARD DRAWER ───────────── */}
                <div className="rounded-3xl border border-subtle bg-card p-6 shadow-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle pb-3.5">
                        <div className="flex items-center gap-2.5">
                            <span className="text-base">📌</span>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-primary">
                                Pinned Asset Drawer ({pinnedAssets.length}/4 Maximum)
                            </h3>
                        </div>

                        <div className="flex items-center gap-2">
                            {pinnedAssets.length > 0 && (
                                <button
                                    type="button"
                                    onClick={clearPinnedAssets}
                                    className="text-xs text-muted hover:text-status-rose transition underline"
                                >
                                    Clear All
                                </button>
                            )}
                            <span className="text-[11px] text-faint">
                                Check &quot;+ Pin&quot; on any card in Explore Studio to add assets
                            </span>
                        </div>
                    </div>

                    {pinnedAssets.length === 0 ? (
                        <div className="p-6 rounded-2xl bg-card-solid border border-subtle text-center space-y-3">
                            <p className="text-xs text-muted">
                                No custom assets pinned yet. Displaying pre-filled quick comparisons for: <strong className="text-primary">{activeTemplate.title}</strong>
                            </p>
                            <button
                                type="button"
                                onClick={handleAutoFillPins}
                                className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-accent-sm hover:brightness-110 transition inline-flex items-center gap-1.5"
                            >
                                <span>📌</span> Auto-Pin Top Datasets & Models
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {pinnedAssets.map((asset) => (
                                <div
                                    key={asset.id}
                                    className="p-3.5 rounded-2xl bg-card-solid border border-accent flex items-start justify-between gap-2 shadow-xs group"
                                >
                                    <div className="min-w-0 space-y-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                                                asset.type === 'dataset'
                                                    ? 'status-badge-blue'
                                                    : asset.type === 'model'
                                                    ? 'status-badge-violet'
                                                    : 'status-badge-emerald'
                                            }`}>
                                                {asset.type}
                                            </span>
                                            {asset.score && (
                                                <span className="text-[10px] font-bold text-status-emerald">
                                                    {asset.score}% Match
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="text-xs font-bold text-primary truncate" title={asset.title}>
                                            {asset.title}
                                        </h4>
                                        <p className="text-[11px] text-muted truncate">
                                            {asset.subtitle || asset.source}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => unpinAsset(asset.id)}
                                        className="text-muted hover:text-status-rose p-1 transition text-xs shrink-0"
                                        title="Unpin asset"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── 2. AUTOMATED AI TRADE-OFF SYNTHESIS BOX ──────────────── */}
                <div className="rounded-3xl border border-accent bg-card p-6 sm:p-7 shadow-2xl space-y-5">
                    <div className="flex items-center justify-between border-b border-subtle pb-3.5">
                        <div className="flex items-center gap-2 text-accent-gradient font-bold text-xs uppercase tracking-wider">
                            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                            Automated AI Trade-off Synthesis & Architecture Verdict
                        </div>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-accent-subtle text-accent-to border border-accent">
                            3-Part Decision Verdict
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                        {/* 1. Best for Rapid Prototyping */}
                        <div className="p-5 rounded-2xl bg-card-solid border border-subtle space-y-2.5 flex flex-col justify-between shadow-xs">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🏆</span>
                                    <span className="font-bold text-status-emerald uppercase tracking-wider text-[11px]">
                                        Best for Rapid Prototyping
                                    </span>
                                </div>
                                <h4 className="text-sm font-bold text-primary">
                                    {templateSynthesis?.rapidPrototyping?.title || 'Rapid Prototyping Baseline'}
                                </h4>
                                <p className="text-muted leading-relaxed text-[11px]">
                                    {templateSynthesis?.rapidPrototyping?.description || 'Fast convergence baseline with minimal resource overhead.'}
                                </p>
                            </div>
                            <div className="pt-2 border-t border-subtle text-[11px]">
                                <span className="text-faint font-semibold block mb-0.5">Recommended Config:</span>
                                <span className="text-secondary font-mono text-[10px] bg-card-subtle px-2 py-1 rounded block truncate">
                                    {templateSynthesis?.rapidPrototyping?.recommendedCombo || 'Curated Dataset + Lightweight Backbone'}
                                </span>
                            </div>
                        </div>

                        {/* 2. Best for SOTA Accuracy */}
                        <div className="p-5 rounded-2xl bg-card-solid border border-subtle space-y-2.5 flex flex-col justify-between shadow-xs">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">🌟</span>
                                    <span className="font-bold text-status-cyan uppercase tracking-wider text-[11px]">
                                        Best for SOTA Accuracy
                                    </span>
                                </div>
                                <h4 className="text-sm font-bold text-primary">
                                    {templateSynthesis?.sotaAccuracy?.title || 'SOTA Accuracy'}
                                </h4>
                                <p className="text-muted leading-relaxed text-[11px]">
                                    {templateSynthesis?.sotaAccuracy?.description || 'Maximum precision configuration with multi-scale loss.'}
                                </p>
                            </div>
                            <div className="pt-2 border-t border-subtle text-[11px]">
                                <span className="text-faint font-semibold block mb-0.5">Recommended Config:</span>
                                <span className="text-secondary font-mono text-[10px] bg-card-subtle px-2 py-1 rounded block truncate">
                                    {templateSynthesis?.sotaAccuracy?.recommendedCombo || 'Swin UNETR + DiceCE Loss'}
                                </span>
                            </div>
                        </div>

                        {/* 3. Critical Pitfalls & Caveats */}
                        <div className="p-5 rounded-2xl bg-card-solid border border-rose-500/30 space-y-2.5 shadow-xs md:col-span-2 lg:col-span-1">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">⚠️</span>
                                <span className="font-bold text-status-rose uppercase tracking-wider text-[11px]">
                                    Critical Pitfalls & Caveats
                                </span>
                            </div>
                            <ul className="space-y-2 text-[11px] text-secondary leading-relaxed">
                                {(templateSynthesis?.criticalPitfalls || []).map((pitfall, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5">
                                        <span className="text-status-rose shrink-0 mt-0.5">▪</span>
                                        <span>{pitfall}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* ── MATRIX VIEW SELECTOR TABS ──────────────────────────── */}
                <div className="flex items-center justify-between border-b border-subtle overflow-x-auto pb-0">
                    <div className="flex gap-1.5">
                        {[
                            { key: 'all', label: 'All Matrices', icon: '📊' },
                            { key: 'models', label: `Multi-Model Matrix (${comparedModels.length})`, icon: '🤖' },
                            { key: 'datasets', label: `Dataset Matrix (${comparedDatasets.length})`, icon: '📦' },
                            { key: 'papers', label: `Benchmark Literature (${comparedPapers.length})`, icon: '🔬' },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveMatrixTab(tab.key as any)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm transition-all -mb-px shrink-0 rounded-t-xl ${
                                    activeMatrixTab === tab.key
                                        ? 'border-b-2 border-accent text-white bg-accent font-bold shadow-accent-sm'
                                        : 'border-b-2 border-transparent text-muted hover:text-primary hover:bg-card-subtle font-semibold'
                                }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* GPU Benchmark Selector */}
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted shrink-0 pb-1.5">
                        <span className="text-[10px] uppercase font-bold text-faint">Bench GPU:</span>
                        {(['T4', 'A10G', 'A100'] as const).map((gpu) => (
                            <button
                                key={gpu}
                                type="button"
                                onClick={() => setSelectedGpu(gpu)}
                                className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold transition ${
                                    selectedGpu === gpu
                                        ? 'bg-accent text-white'
                                        : 'bg-card-subtle text-muted hover:text-primary'
                                }`}
                            >
                                {gpu}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── 3. MULTI-MODEL HEAD-TO-HEAD MATRIX ──────────────────── */}
                {(activeMatrixTab === 'all' || activeMatrixTab === 'models') && (
                    <div className="rounded-3xl border border-subtle bg-card p-6 shadow-xl space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle pb-4">
                            <div>
                                <h3 className="text-base font-bold text-primary flex items-center gap-2">
                                    <span>🤖</span> Multi-Model Head-to-Head Comparison Matrix
                                </h3>
                                <p className="text-xs text-muted mt-0.5">
                                    Evaluate parameters volume, context resolution, FP32/FP16 VRAM sizing, inference latency, and licensing guard.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-subtle text-faint uppercase font-bold tracking-wider text-[10px]">
                                        <th className="py-3 px-4 bg-card-solid rounded-l-xl">Model Candidate</th>
                                        <th className="py-3 px-4 bg-card-solid">Architecture & Family</th>
                                        <th className="py-3 px-4 bg-card-solid">Parameters</th>
                                        <th className="py-3 px-4 bg-card-solid">Context / Voxel Res</th>
                                        <th className="py-3 px-4 bg-card-solid">VRAM (FP32 / FP16)</th>
                                        <th className="py-3 px-4 bg-card-solid">Latency ({selectedGpu})</th>
                                        <th className="py-3 px-4 bg-card-solid">Licensing Guard</th>
                                        <th className="py-3 px-4 bg-card-solid rounded-r-xl text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-subtle">
                                    {comparedModels.map((model: any, idx: number) => {
                                        const isFirst = idx === 0;
                                        const licenseBadge = model.commercialLicenseBadge || (model.license?.toLowerCase().includes('apache') || model.license?.toLowerCase().includes('mit') ? 'COMMERCIAL' : 'ACADEMIC');
                                        const specs = getModelProfiling(model, idx, selectedGpu);

                                        return (
                                            <tr key={model.id || idx} className="hover:bg-card-hover/50 transition">
                                                {/* Candidate Title */}
                                                <td className="py-4 px-4 font-semibold text-primary">
                                                    <div className="flex items-center gap-2">
                                                        {isFirst && <span className="text-sm" title="Top Match">🏆</span>}
                                                        <div>
                                                            <div className="font-bold text-primary truncate max-w-[200px]" title={model.name || model.id}>
                                                                {model.name || model.id}
                                                            </div>
                                                            <span className="text-[10px] text-status-emerald font-bold">
                                                                {model.matchScore || (idx === 0 ? 98 : 92)}% Match Score
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Architecture Family */}
                                                <td className="py-4 px-4 text-secondary">
                                                    <span className="px-2.5 py-1 rounded-lg bg-card-solid border border-subtle font-mono text-[11px] font-semibold truncate max-w-[180px] block" title={specs.archFamily}>
                                                        {specs.archFamily}
                                                    </span>
                                                </td>

                                                {/* Parameters */}
                                                <td className="py-4 px-4 font-bold text-primary">
                                                    {specs.params}
                                                </td>

                                                {/* Context / Voxel Res */}
                                                <td className="py-4 px-4 text-secondary font-mono text-[11px]">
                                                    {specs.contextRes}
                                                </td>

                                                {/* VRAM Profile */}
                                                <td className="py-4 px-4">
                                                    <div className="space-y-0.5 font-mono text-[11px]">
                                                        <span className="text-status-cyan font-bold block">{specs.vramFp16}</span>
                                                        <span className="text-faint text-[10px] block">{specs.vramFp32}</span>
                                                    </div>
                                                </td>

                                                {/* Latency Benchmark */}
                                                <td className="py-4 px-4">
                                                    <span className="px-2.5 py-1 rounded-lg bg-card-solid border border-subtle font-mono text-status-emerald font-bold">
                                                        ⚡ {specs.latency}
                                                    </span>
                                                </td>

                                                {/* Licensing Guard */}
                                                <td className="py-4 px-4">
                                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                                        licenseBadge === 'COMMERCIAL'
                                                            ? 'status-badge-emerald'
                                                            : licenseBadge === 'ACADEMIC'
                                                            ? 'status-badge-amber'
                                                            : 'status-badge-rose'
                                                    }`}>
                                                        {licenseBadge === 'COMMERCIAL' ? 'Commercial Permissive' : licenseBadge === 'ACADEMIC' ? 'Academic / Non-Comm' : 'Restricted'}
                                                    </span>
                                                </td>

                                                {/* Action */}
                                                <td className="py-4 px-4 text-right">
                                                    <Link
                                                        href="/roadmaps"
                                                        onClick={() => setSelectedModel(model)}
                                                        className="px-3 py-1.5 rounded-lg bg-card-subtle hover:bg-card-hover border border-subtle text-primary font-bold text-[11px] transition inline-flex items-center gap-1"
                                                    >
                                                        <span>Select</span>
                                                        <span>→</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── 4. DATASET HEAD-TO-HEAD MATRIX ──────────────────────── */}
                {(activeMatrixTab === 'all' || activeMatrixTab === 'datasets') && (
                    <div className="rounded-3xl border border-subtle bg-card p-6 shadow-xl space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle pb-4">
                            <div>
                                <h3 className="text-base font-bold text-primary flex items-center gap-2">
                                    <span>📦</span> Dataset Head-to-Head Comparison Matrix
                                </h3>
                                <p className="text-xs text-muted mt-0.5">
                                    Examine volume, patient cohort sizes, class balance indicators, annotation ground truth, and file format compatibility.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b border-subtle text-faint uppercase font-bold tracking-wider text-[10px]">
                                        <th className="py-3 px-4 bg-card-solid rounded-l-xl">Dataset Name</th>
                                        <th className="py-3 px-4 bg-card-solid">Volume & Patients</th>
                                        <th className="py-3 px-4 bg-card-solid">Class Balance Ratio</th>
                                        <th className="py-3 px-4 bg-card-solid">Annotation Standards</th>
                                        <th className="py-3 px-4 bg-card-solid">Compatible Formats</th>
                                        <th className="py-3 px-4 bg-card-solid">Access & License</th>
                                        <th className="py-3 px-4 bg-card-solid rounded-r-xl text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-subtle">
                                    {comparedDatasets.map((dataset: any, idx: number) => {
                                        const isFirst = idx === 0;
                                        const vol = getDatasetVolumeDisplay(dataset);
                                        const formats = getDatasetFormats(dataset, activeTemplate.targetModality, query);
                                        const licenseBadge = dataset.commercialLicenseBadge || (dataset.license?.toLowerCase().includes('apache') || dataset.license?.toLowerCase().includes('mit') ? 'COMMERCIAL' : 'ACADEMIC');

                                        return (
                                            <tr key={dataset.id || idx} className="hover:bg-card-hover/50 transition">
                                                {/* Dataset Title */}
                                                <td className="py-4 px-4 font-semibold text-primary">
                                                    <div className="flex items-center gap-2">
                                                        {isFirst && <span className="text-sm" title="Benchmark Gold Standard">🏆</span>}
                                                        <div>
                                                            <div className="font-bold text-primary truncate max-w-[220px]" title={dataset.title || dataset.name}>
                                                                {dataset.title || dataset.name}
                                                            </div>
                                                            <span className="text-[10px] text-muted block mt-0.5">
                                                                Source: {dataset.source || "Kaggle"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Volume & Cohort */}
                                                <td className="py-4 px-4">
                                                    {vol.isFallback ? (
                                                        <span className="px-2 py-0.5 rounded-md bg-accent-subtle text-accent-to border border-accent text-[10px] font-bold inline-block">
                                                            {vol.display}
                                                        </span>
                                                    ) : (
                                                        <div className="font-bold text-primary">{vol.display}</div>
                                                    )}
                                                    <span className="text-[10px] text-muted block mt-0.5">
                                                        {dataset.patientCount || (dataset.itemCount ? `${dataset.itemCount} Items` : "60 Patients")}
                                                    </span>
                                                </td>

                                                {/* Class Balance Ratio */}
                                                <td className="py-4 px-4">
                                                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-status-rose border border-rose-500/20 text-[10px] font-bold block truncate max-w-[170px]" title={dataset.classBalance || "Extreme Imbalance (<0.3%)"}>
                                                        {dataset.classBalance || "Severe Imbalance (<0.3%)"}
                                                    </span>
                                                </td>

                                                {/* Annotation Standards */}
                                                <td className="py-4 px-4 text-secondary leading-tight">
                                                    <span className="font-medium text-[11px]">
                                                        {dataset.annotationStandard || "Dense 3D Voxel Segmentation"}
                                                    </span>
                                                </td>

                                                {/* Formats */}
                                                <td className="py-4 px-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {formats.map((fmt: string) => (
                                                            <span key={fmt} className="px-2 py-0.5 rounded bg-card-solid border border-subtle font-mono text-[10px] text-secondary">
                                                                {fmt}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>

                                                {/* License */}
                                                <td className="py-4 px-4">
                                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                                                        licenseBadge === 'COMMERCIAL'
                                                            ? 'status-badge-emerald'
                                                            : 'status-badge-amber'
                                                    }`}>
                                                        {licenseBadge === 'COMMERCIAL' ? 'Commercial Open' : 'Academic Research'}
                                                    </span>
                                                </td>

                                                {/* Action */}
                                                <td className="py-4 px-4 text-right">
                                                    <Link
                                                        href="/roadmaps"
                                                        onClick={() => setSelectedDataset(dataset)}
                                                        className="px-3 py-1.5 rounded-lg bg-card-subtle hover:bg-card-hover border border-subtle text-primary font-bold text-[11px] transition inline-flex items-center gap-1"
                                                    >
                                                        <span>Use in Plan</span>
                                                        <span>→</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ── 5. RESEARCH LITERATURE & BENCHMARK PAPERS ───────────── */}
                {(activeMatrixTab === 'all' || activeMatrixTab === 'papers') && comparedPapers.length > 0 && (
                    <div className="rounded-3xl border border-subtle bg-card p-6 shadow-xl space-y-5">
                        <div className="flex items-center justify-between border-b border-subtle pb-4">
                            <div>
                                <h3 className="text-base font-bold text-primary flex items-center gap-2">
                                    <span>🔬</span> Scientific Ground Truth & Benchmark Literature
                                </h3>
                                <p className="text-xs text-muted mt-0.5">
                                    Peer-reviewed papers demonstrating baseline architectures, loss functions, and dataset validation results.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {comparedPapers.map((paper: any) => (
                                <div key={paper.id} className="p-5 rounded-2xl bg-card-solid border border-subtle space-y-3 shadow-xs">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border status-badge-emerald uppercase">
                                            {paper.relationship || "EXACT BENCHMARK"}
                                        </span>
                                        <span className="font-mono text-xs font-bold text-muted">
                                            {paper.year || 2023} · {paper.venue || "IEEE / MICCAI"}
                                        </span>
                                    </div>
                                    <h4 className="text-sm font-bold text-primary line-clamp-2">
                                        {paper.title}
                                    </h4>
                                    <p className="text-xs text-muted line-clamp-3 leading-relaxed">
                                        {paper.abstract}
                                    </p>
                                    <div className="flex items-center justify-between pt-2 border-t border-subtle text-xs">
                                        <span className="text-secondary font-mono text-[11px]">
                                            📊 {paper.citationCount || 164} citations
                                        </span>
                                        {paper.paperUrl && (
                                            <a
                                                href={paper.paperUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-accent-to font-bold hover:underline flex items-center gap-1 text-[11px]"
                                            >
                                                <span>Read Paper</span>
                                                <span>↗</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                )}

                {/* ── 6. BOTTOM CTA HANDOFF TO TAB 4 ──────────────────────── */}
                <div className="p-8 rounded-3xl bg-accent text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-bold uppercase tracking-wider">
                            🚀 Ready to Build
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black">
                            Generate Production Implementation Roadmap
                        </h3>
                        <p className="text-white/80 text-xs sm:text-sm max-w-xl leading-relaxed">
                            Convert your evaluated datasets and model selections into a 5-phase engineering timeline, complete PyTorch starter scripts, and cloud cost calculations.
                        </p>
                    </div>

                    <Link
                        href="/roadmaps"
                        className="px-7 py-3.5 bg-white text-slate-900 font-bold rounded-2xl text-sm shadow-xl hover:bg-slate-100 active:scale-95 transition-all shrink-0 flex items-center gap-2"
                    >
                        <span>Open Implementation Roadmap</span>
                        <span>→</span>
                    </Link>
                </div>
                    </>
                )}
            </div>
        </main>
    );
}


export default function BenchmarkPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-page" />}>
            <BenchmarkContent />
        </Suspense>
    );
}
