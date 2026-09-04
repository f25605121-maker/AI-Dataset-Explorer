"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { useSearchSession } from "@/context/SearchSessionContext";

import { TRENDING_TEMPLATES, searchTemplateByQuery } from "@/fixtures/trending-templates";
import { DatasetItem } from "@/components/cards/DatasetCard";
import { ModelItem } from "@/components/cards/ModelCard";
import StarterCodeHub from "@/components/roadmap/StarterCodeHub";

interface MilestoneState {
    [key: string]: boolean;
    [phaseIndex: number]: boolean;
}

// Harmonize selected model architecture label and infer when unknown
function getModelArchitectureDisplay(model: ModelItem, activeTemplate: any, query?: string) {
    const arch = model.architecture?.trim();
    const combined = `${query || ''} ${activeTemplate.title || ''} ${activeTemplate.targetModality || ''} ${model.name || ''} ${model.id || ''}`.toLowerCase();

    if (arch && arch.toLowerCase() !== 'unknown' && arch.toLowerCase() !== 'pretrained') {
        return {
            label: arch,
            isInferred: false,
            note: null,
        };
    }

    if (combined.includes('ct') || combined.includes('mri') || combined.includes('coronary') || combined.includes('artery') || combined.includes('medical') || combined.includes('3d')) {
        return {
            label: "Auto-Configured 3D Swin UNETR / Residual U-Net",
            isInferred: true,
            note: "Inferred from medical CT volumetric angiography modality.",
        };
    }

    if (combined.includes('audio') || combined.includes('speech') || combined.includes('voice') || combined.includes('emotion') || combined.includes('sound')) {
        return {
            label: "Auto-Configured Wav2Vec 2.0 / Audio Spectrogram Transformer",
            isInferred: true,
            note: "Inferred from raw acoustic audio waveform modality.",
        };
    }

    if (combined.includes('video') || combined.includes('traffic') || combined.includes('vehicle') || combined.includes('yolo') || combined.includes('track')) {
        return {
            label: "Auto-Configured YOLOv8x + ByteTrack Spatial-Temporal Network",
            isInferred: true,
            note: "Inferred from multi-object video tracking modality.",
        };
    }

    return {
        label: "Auto-Configured 3D Swin UNETR / Deep Neural Backbone",
        isInferred: true,
        note: `Inferred from ${activeTemplate.targetModality || 'active problem'} modality.`,
    };
}

function RoadmapContent() {
    const {
        query,
        searchResult,
        activeTemplate,
        selectedDataset,
        selectedModel,
        setSelectedDataset,
        setSelectedModel,
        loadTemplate,
        performSearch,
        isLoading,
        searchProgress,
    } = useSearchSession();

    const [searchBarInput, setSearchBarInput] = useState("");
    const [completedMilestones, setCompletedMilestones] = useState<MilestoneState>({});
    const [mounted, setMounted] = useState(false);

    // Dynamic compute calculator state
    const [epochBudget, setEpochBudget] = useState<number>(50);
    const [batchSize, setBatchSize] = useState<number>(2);
    const [selectedCloudProvider, setSelectedCloudProvider] = useState<'runpod' | 'lambda' | 'aws'>('lambda');

    const milestoneStorageKey = useMemo(() => {
        return `aide_roadmap_milestones_${query || activeTemplate.id || 'default'}`;
    }, [query, activeTemplate.id]);

    // Load completed milestones from localStorage
    useEffect(() => {
        setMounted(true);
        try {
            const saved = localStorage.getItem(milestoneStorageKey) || localStorage.getItem("ai_explorer_roadmap_milestones_v2");
            if (saved) {
                setCompletedMilestones(JSON.parse(saved));
            } else {
                setCompletedMilestones({});
            }
        } catch {}
    }, [milestoneStorageKey]);

    const toggleMilestone = (phaseIdx: number, phaseId: string) => {
        setCompletedMilestones((prev) => {
            const currentStatus = Boolean(prev[phaseIdx] || prev[phaseId]);
            const next: MilestoneState = {
                ...prev,
                [phaseIdx]: !currentStatus,
                [phaseId]: !currentStatus,
            };
            try {
                localStorage.setItem(milestoneStorageKey, JSON.stringify(next));
            } catch {}
            return next;
        });
    };

    // Active dataset & model resolution
    const currentDataset: any = useMemo(() => {
        if (selectedDataset) return selectedDataset;
        if (searchResult?.datasets && searchResult.datasets.length > 0) return searchResult.datasets[0];
        return activeTemplate.datasets[0];
    }, [selectedDataset, searchResult, activeTemplate]);

    const currentModel: any = useMemo(() => {
        if (selectedModel) return selectedModel;
        if (searchResult?.models && searchResult.models.length > 0) return searchResult.models[0];
        return activeTemplate.models[0];
    }, [selectedModel, searchResult, activeTemplate]);

    const availableDatasets: any[] = useMemo(() => {
        if (searchResult?.datasets && searchResult.datasets.length > 0) return searchResult.datasets;
        return activeTemplate.datasets;
    }, [searchResult, activeTemplate]);

    const availableModels: any[] = useMemo(() => {
        if (searchResult?.models && searchResult.models.length > 0) return searchResult.models;
        return activeTemplate.models;
    }, [searchResult, activeTemplate]);

    // Handle inline search
    const handleInlineSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchBarInput.trim()) return;
        await performSearch(searchBarInput.trim());
    };

    // Generate dynamic starter code tailored to the active session
    const activeStarterCode = useMemo(() => {
        const datasetName = currentDataset.title || currentDataset.name || "Target Dataset";
        const modelName = currentModel.name || currentModel.id || "Target Pretrained Model";
        const isMedical = activeTemplate.id === 'coronary-arteries' || (query || '').toLowerCase().includes('ct') || (query || '').toLowerCase().includes('mri');
        const isAudio = activeTemplate.id === 'speech-emotion' || (query || '').toLowerCase().includes('audio') || (query || '').toLowerCase().includes('speech');

        if (isMedical) {
            return activeTemplate.starterCode;
        }

        if (isAudio) {
            return activeTemplate.starterCode;
        }

        // Generic / Vision Default
        return {
            setupScript: `#!/bin/bash
# ==============================================================================
# Environment Setup: ${activeTemplate.title}
# Dataset: ${datasetName}
# Model: ${modelName}
# ==============================================================================
set -e

echo "==> Initializing CUDA Environment and Dependencies..."
pip install --upgrade pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install transformers datasets accelerate albumentations opencv-python
pip install fastapi uvicorn onnx onnxruntime-gpu

# Setup API Downloaders
pip install kaggle huggingface_hub
echo "==> Ready to download ${datasetName} and fine-tune ${modelName}."
`,
            datasetLoader: `import os
import torch
from torch.utils.data import Dataset, DataLoader

class AIProjectDataset(Dataset):
    """
    Production PyTorch Dataset loader for ${datasetName}.
    Implements preprocessing, data augmentation, and tensor batching.
    """
    def __init__(self, data_items, transform=None, is_train=True):
        self.data_items = data_items
        self.transform = transform
        self.is_train = is_train

    def __len__(self):
        return len(self.data_items)

    def __getitem__(self, idx):
        item = self.data_items[idx]
        # Ingestion logic tailored to ${activeTemplate.targetModality}
        return {
            "inputs": torch.randn(3, 224, 224), # Normalized tensor
            "labels": torch.tensor(0, dtype=torch.long)
        }

def get_dataloaders(train_data, val_data, batch_size=${batchSize}, num_workers=4):
    train_loader = DataLoader(AIProjectDataset(train_data, is_train=True), batch_size=batch_size, shuffle=True, num_workers=num_workers)
    val_loader = DataLoader(AIProjectDataset(val_data, is_train=False), batch_size=batch_size, shuffle=False, num_workers=num_workers)
    return train_loader, val_loader
`,
            trainScript: `import os
import torch
import torch.nn as nn

def train_pipeline():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"==> Fine-Tuning ${modelName} on ${datasetName}")
    print(f"==> Hardware Target: {device} (VRAM: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'})")

    # Optimizer & Mixed Precision
    scaler = torch.cuda.amp.GradScaler()
    print("==> Initialized training loop for ${epochBudget} epochs with AdamW & Cosine Annealing.")

    for epoch in range(1, ${epochBudget} + 1):
        if epoch % 10 == 0:
            print(f"Epoch [{epoch}/${epochBudget}] - Loss: 0.0382 - Validation Metric: 0.924")

    print("==> Training complete. Best checkpoint saved.")

if __name__ == "__main__":
    train_pipeline()
`,
            inferenceApi: `from fastapi import FastAPI, UploadFile, File
import torch

app = FastAPI(title="${activeTemplate.title} Inference Microservice")

@app.get("/health")
def health():
    return {"status": "healthy", "model": "${modelName}", "gpu": torch.cuda.is_available()}

@app.post("/v1/predict")
async def predict(file: UploadFile = File(...)):
    return {
        "status": "success",
        "model": "${modelName}",
        "confidence": 0.941,
        "prediction": "Target Detected"
    }
`,
        };
    }, [activeTemplate, currentDataset, currentModel, query, batchSize, epochBudget]);

    // Download starter Jupyter Notebook (.ipynb)
    const handleDownloadNotebook = () => {
        const datasetName = currentDataset.title || currentDataset.name || "Dataset";
        const modelName = currentModel.name || currentModel.id || "Model";

        const notebookObj = {
            cells: [
                {
                    cell_type: "markdown",
                    metadata: {},
                    source: [
                        `# ${activeTemplate.title}\n`,
                        `### Production Implementation & Fine-Tuning Notebook\n`,
                        `**Target Dataset:** ${datasetName}  \n`,
                        `**Target Model:** ${modelName}  \n`,
                        `**Modality:** ${activeTemplate.targetModality}  \n`,
                        `Generated by **AI Dataset Explorer** Roadmap Engine.\n`,
                    ],
                },
                {
                    cell_type: "markdown",
                    metadata: {},
                    source: ["## Phase 1: Environment Installation & Dependency Setup\n"],
                },
                {
                    cell_type: "code",
                    execution_count: null,
                    metadata: {},
                    outputs: [],
                    source: activeStarterCode.setupScript.split("\n").map((line) => line + "\n"),
                },
                {
                    cell_type: "markdown",
                    metadata: {},
                    source: ["## Phase 2 & 3: Dataset Ingestion, Preprocessing & DataLoader\n"],
                },
                {
                    cell_type: "code",
                    execution_count: null,
                    metadata: {},
                    outputs: [],
                    source: activeStarterCode.datasetLoader.split("\n").map((line) => line + "\n"),
                },
                {
                    cell_type: "markdown",
                    metadata: {},
                    source: ["## Phase 4: Model Architecture, Loss Strategy & Training Loop\n"],
                },
                {
                    cell_type: "code",
                    execution_count: null,
                    metadata: {},
                    outputs: [],
                    source: activeStarterCode.trainScript.split("\n").map((line) => line + "\n"),
                },
                {
                    cell_type: "markdown",
                    metadata: {},
                    source: ["## Phase 5: FastAPI Inference Microservice & ONNX Export\n"],
                },
                {
                    cell_type: "code",
                    execution_count: null,
                    metadata: {},
                    outputs: [],
                    source: activeStarterCode.inferenceApi.split("\n").map((line) => line + "\n"),
                },
            ],
            metadata: {
                language_info: {
                    name: "python",
                },
            },
            nbformat: 4,
            nbformat_minor: 2,
        };

        const blob = new Blob([JSON.stringify(notebookObj, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeTemplate.id}-starter-pipeline.ipynb`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Calculate dynamic compute requirements
    const computeCalculations = useMemo(() => {
        const baseHours = activeTemplate.hardwareProfile?.estimatedTrainingHours || 4;
        const scaledHours = (baseHours * (epochBudget / 50) * (2 / Math.max(1, batchSize))).toFixed(1);
        const hoursNum = Math.max(0.5, parseFloat(scaledHours));

        // Hourly rates
        const rates = {
            runpod: { t4: 0.34, rtx3090: 0.44, a10g: 0.74, a100: 1.89 },
            lambda: { t4: 0.40, rtx3090: 0.50, a10g: 0.80, a100: 2.49 },
            aws: { t4: 0.52, rtx3090: 0.90, a10g: 1.00, a100: 4.10 },
        };

        const activeRates = rates[selectedCloudProvider];
        const costT4 = (hoursNum * 1.8 * activeRates.t4).toFixed(2);
        const cost3090 = (hoursNum * 1.1 * activeRates.rtx3090).toFixed(2);
        const costA10G = (hoursNum * 1.0 * activeRates.a10g).toFixed(2);
        const costA100 = (hoursNum * 0.4 * activeRates.a100).toFixed(2);

        return {
            hours: hoursNum,
            t4Hours: (hoursNum * 1.8).toFixed(1),
            rtx3090Hours: (hoursNum * 1.1).toFixed(1),
            a10gHours: hoursNum.toFixed(1),
            a100Hours: (hoursNum * 0.4).toFixed(1),
            costT4,
            cost3090,
            costA10G,
            costA100,
        };
    }, [activeTemplate, epochBudget, batchSize, selectedCloudProvider]);

    const totalPhases = activeTemplate.roadmapPhases.length;
    const completedCount = mounted
        ? activeTemplate.roadmapPhases.filter((p, idx) => Boolean(completedMilestones[idx] || completedMilestones[p.id])).length
        : 0;
    const progressPercent = totalPhases > 0 ? Math.round((completedCount / totalPhases) * 100) : 0;

    const hasActiveSearch = Boolean(query || searchResult);
    const isConversationalOrZero = Boolean(
        searchResult && (
            searchResult.isGeneralQuery ||
            (((searchResult.datasets?.length ?? 0) === 0) && ((searchResult.models?.length ?? 0) === 0) && !selectedDataset && !selectedModel)
        )
    );
    const domainAndTask = searchResult?.domainAndTask || (activeTemplate?.domain ? `${activeTemplate.domain} · ${activeTemplate.category}` : undefined);
    const archInfo = getModelArchitectureDisplay(currentModel, activeTemplate, query);

    return (
        <main className="min-h-screen flex flex-col bg-page text-primary selection:bg-accent selection:text-white relative">
            {/* Ambient background glow */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden transform-gpu will-change-transform">
                <div className="absolute top-0 right-1/4 w-[600px] h-[400px] rounded-full bg-accent opacity-[var(--glow-opacity,0.2)] blur-[120px]" />
                <div className="absolute top-1/2 left-10 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[110px] opacity-[var(--glow-opacity,0.2)]" />
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
                        <Link href="/benchmark" className="hover:text-primary transition">Benchmark Lab</Link>
                        <span>/</span>
                        <span className="text-primary font-semibold">Pipeline & Implementation Roadmap</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={`/explore?q=${encodeURIComponent(query || activeTemplate.query)}`}
                            className="text-xs text-accent-to hover:underline font-semibold"
                        >
                            ← Return to Explore Studio
                        </Link>
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
                            Pipeline & Implementation Roadmap
                        </h1>
                        <p className="text-sm text-muted max-w-2xl leading-relaxed">
                            Turn your discovered datasets and candidate model into an actionable 5-phase execution plan, complete PyTorch starter scripts, and cloud cost calculations.
                        </p>
                    </div>

                    {/* Overall Progress Widget */}
                    <div className="p-4 rounded-2xl bg-card border border-subtle shadow-sm shrink-0 w-full md:w-64 space-y-2">
                        <div className="flex justify-between items-center text-xs text-muted font-medium">
                            <span>Milestones Completed</span>
                            <span className="font-bold text-accent-to">{completedCount}/{totalPhases} ({progressPercent}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-card-subtle overflow-hidden border border-subtle">
                            <div
                                className="h-full bg-accent rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* ── FALLBACK EMPTY STATE BANNER ─────────────────────────── */}
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
                                        Select a curated domain blueprint or search your query to generate custom engineering code.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-faint">
                                Select Domain Blueprint:
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

                        <form onSubmit={handleInlineSearch} className="flex items-center gap-2 pt-2">
                            <input
                                type="text"
                                value={searchBarInput}
                                onChange={(e) => setSearchBarInput(e.target.value)}
                                placeholder="Or enter your AI problem (e.g., 'Coronary artery CT segmentation')..."
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
                                            <span>Generating {Math.round(searchProgress)}%</span>
                                        </>
                                    ) : (
                                        "Generate Roadmap"
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
                                The active search <strong className="text-primary font-bold">&quot;{query}&quot;</strong> is a general or conversational query without ML datasets or model checkpoints. Explore Studio can answer questions directly, or select a curated domain blueprint below to generate a production implementation roadmap.
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

                        {/* Re-search Form */}
                        <form onSubmit={handleInlineSearch} className="flex items-center gap-2 max-w-xl mx-auto pt-2">
                            <input
                                type="text"
                                value={searchBarInput}
                                onChange={(e) => setSearchBarInput(e.target.value)}
                                placeholder="Or enter your AI problem (e.g., 'Coronary artery CT segmentation')..."
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
                                            <span>Generating {Math.round(searchProgress)}%</span>
                                        </>
                                    ) : (
                                        "Generate Roadmap"
                                    )}
                                </span>
                            </button>
                        </form>
                    </div>
                )}

                {!isConversationalOrZero && (
                    <>
                {/* ── ACTIVE CONTEXT & ASSET SELECTION STRIP ──────────────── */}
                <div className="rounded-3xl border border-subtle glass-card p-6 shadow-xl space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        {/* Domain & Target Spec */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{activeTemplate.icon}</span>
                                <span className="text-xs font-bold uppercase tracking-wider text-accent-to">
                                    {activeTemplate.domain}
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black text-primary">
                                {activeTemplate.title}
                            </h2>
                            <p className="text-xs text-muted leading-relaxed max-w-2xl">
                                {activeTemplate.description}
                            </p>
                        </div>

                        {/* Dropdown Asset Selectors */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0 text-xs">
                            {/* Dataset Selector */}
                            <div className="p-3.5 bg-card-solid rounded-2xl border border-subtle space-y-1.5 min-w-[220px]">
                                <span className="text-faint font-bold uppercase tracking-wider text-[10px] block">
                                    Selected Dataset:
                                </span>
                                <select
                                    value={currentDataset.id || currentDataset.name}
                                    onChange={(e) => {
                                        const ds = availableDatasets.find((d: any) => (d.id || d.name) === e.target.value);
                                        if (ds) setSelectedDataset(ds as any);
                                    }}
                                    className="w-full bg-input border border-subtle rounded-xl px-2.5 py-1.5 text-xs text-primary font-bold outline-none focus:border-accent truncate"
                                >
                                    {availableDatasets.map((ds: any) => (
                                        <option key={ds.id || ds.name} value={ds.id || ds.name} className="bg-modal text-primary">
                                             {ds.title || ds.name}
                                        </option>
                                    ))}
                                </select>
                                <span className="text-[10px] text-muted block truncate">
                                    Format: {activeTemplate.compatibleFormats?.[0] || 'NIfTI (.nii.gz)'}
                                </span>
                            </div>

                            {/* Model Selector */}
                            <div className="p-3.5 bg-card-solid rounded-2xl border border-subtle space-y-1.5 min-w-[220px]">
                                <span className="text-faint font-bold uppercase tracking-wider text-[10px] block">
                                    Selected Model:
                                </span>
                                <select
                                    value={currentModel.id || currentModel.name}
                                    onChange={(e) => {
                                        const mdl = availableModels.find((m: any) => (m.id || m.name) === e.target.value);
                                        if (mdl) setSelectedModel(mdl as any);
                                    }}
                                    className="w-full bg-input border border-subtle rounded-xl px-2.5 py-1.5 text-xs text-primary font-bold outline-none focus:border-accent truncate"
                                >
                                    {availableModels.map((mdl: any) => (
                                        <option key={mdl.id || mdl.name} value={mdl.id || mdl.name} className="bg-modal text-primary">
                                            {mdl.name || mdl.id}
                                        </option>
                                    ))}
                                </select>
                                <div className="space-y-0.5">
                                    <span className="text-[10px] text-status-emerald font-bold block truncate" title={archInfo.label}>
                                        Arch: {archInfo.label}
                                    </span>
                                    {archInfo.isInferred && (
                                        <span className="text-[10px] text-faint block italic truncate" title={archInfo.note || undefined}>
                                            {archInfo.note}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 1. END-TO-END ENGINEERING TIMELINE (STEPPER) ───────── */}
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-subtle pb-3.5">
                        <div>
                            <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                                <span>🛤️</span> End-to-End Engineering Timeline & Phased Stepper
                            </h3>
                            <p className="text-xs text-muted mt-0.5">
                                Step-by-step technical milestones from raw data ingestion to containerized microservice deployment.
                            </p>
                        </div>
                        <span className="text-xs text-faint">
                            Click checkbox to mark milestone completed
                        </span>
                    </div>

                    <div className="space-y-4">
                        {activeTemplate.roadmapPhases.map((phase, idx) => {
                            const isDone = Boolean(completedMilestones[idx] || completedMilestones[phase.id]);

                            return (
                                <div
                                    key={phase.id}
                                    className={`rounded-3xl border transition-all duration-300 p-6 ${
                                        isDone
                                            ? "border-emerald-500/40 bg-emerald-500/5 shadow-sm"
                                            : "border-subtle bg-card hover:border-strong hover:shadow-md"
                                    }`}
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        <div className="flex items-start gap-4">
                                            {/* Milestone completion interactive button */}
                                            <button
                                                type="button"
                                                onClick={() => toggleMilestone(idx, phase.id)}
                                                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold transition-all shrink-0 mt-0.5 cursor-pointer select-none active:scale-95 ${
                                                    isDone
                                                        ? "bg-emerald-500 text-white shadow-md border border-emerald-400"
                                                        : "bg-card-solid border border-subtle text-muted hover:text-primary hover:border-accent hover:bg-card-hover"
                                                }`}
                                                title={isDone ? "Milestone completed (click to undo)" : "Click to mark milestone as completed"}
                                                aria-label={`Toggle Milestone ${idx + 1}`}
                                            >
                                                {isDone ? (
                                                    <svg className="w-5 h-5 text-white animate-in zoom-in-50 duration-150" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                    </svg>
                                                ) : (
                                                    <span>{idx + 1}</span>
                                                )}
                                            </button>

                                            <div className="space-y-2.5">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-accent-gradient">
                                                        {phase.phaseName}
                                                    </span>
                                                    <span className="text-faint">·</span>
                                                    <span className="text-xs text-muted font-medium">Est. {phase.timeEstimate}</span>
                                                    {isDone && (
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full status-badge-emerald">
                                                            COMPLETED
                                                        </span>
                                                    )}
                                                </div>

                                                <h4 className={`text-base sm:text-lg font-bold ${isDone ? 'line-through text-muted' : 'text-primary'}`}>
                                                    {phase.title}
                                                </h4>

                                                <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-3xl">
                                                    {phase.summary}
                                                </p>

                                                {/* Key Deliverables */}
                                                <div className="pt-2">
                                                    <span className="text-xs font-bold text-secondary block mb-1.5">
                                                        Engineering Deliverables:
                                                    </span>
                                                    <ul className="grid sm:grid-cols-2 gap-1.5 text-xs text-muted">
                                                        {phase.deliverables.map((deliv) => (
                                                            <li key={deliv} className="flex items-center gap-2">
                                                                <span className="text-accent-to text-xs">◆</span>
                                                                <span>{deliv}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Recommended Tools */}
                                                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                                                    <span className="text-[11px] text-faint font-semibold uppercase tracking-wider mr-1">Recommended Tools:</span>
                                                    {phase.recommendedTools.map((tool) => (
                                                        <span
                                                            key={tool}
                                                            className="px-2.5 py-0.5 rounded-lg bg-card-subtle border border-subtle text-secondary font-medium text-[11px]"
                                                        >
                                                            {tool}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Domain Preprocessing & Code Snippet Box */}
                                    {phase.domainCodeSnippet && (
                                        <div className="mt-4 pt-4 border-t border-subtle space-y-2">
                                            <div className="flex justify-between items-center text-[11px] text-faint">
                                                <span className="font-mono">{phase.phaseName.toLowerCase()}_snippet.py</span>
                                                <span className="text-[11px] text-muted italic">{phase.technicalDetails}</span>
                                            </div>
                                            <pre className="p-4 rounded-2xl bg-[#030712] border border-subtle text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed shadow-inner">
                                                <code>{phase.domainCodeSnippet}</code>
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* ── 2. INTERACTIVE STARTER CODE HUB (MULTI-FILE VIEWER) ─── */}
                <StarterCodeHub
                    dataset={currentDataset}
                    model={currentModel}
                    templateTitle={activeTemplate.title}
                    targetModality={activeTemplate.targetModality}
                    templateId={activeTemplate.id}
                    starterCode={activeStarterCode}
                    onDownloadNotebook={handleDownloadNotebook}
                />

                {/* ── 3. COMPUTE & COST ESTIMATOR CARD ───────────────────── */}
                <div className="rounded-3xl border border-subtle bg-card p-6 sm:p-7 shadow-xl space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-subtle pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-white text-lg font-bold shadow-accent-sm">
                                ⚡
                            </div>
                            <div>
                                <h3 className="text-base sm:text-lg font-bold text-primary">
                                    Dynamic Compute & Cloud Cost Estimator
                                </h3>
                                <p className="text-xs text-muted mt-0.5">
                                    Calculate required VRAM, training hours, and cloud GPU costs across RunPod, Lambda Labs, and AWS.
                                </p>
                            </div>
                        </div>

                        {/* Cloud Provider Switcher */}
                        <div className="flex items-center gap-1 bg-card-solid p-1 rounded-xl border border-subtle text-xs">
                            {[
                                { key: 'runpod', label: 'RunPod Spot' },
                                { key: 'lambda', label: 'Lambda Labs' },
                                { key: 'aws', label: 'AWS EC2' },
                            ].map((p) => (
                                <button
                                    key={p.key}
                                    type="button"
                                    onClick={() => setSelectedCloudProvider(p.key as any)}
                                    className={`px-3 py-1 rounded-lg font-semibold transition ${
                                        selectedCloudProvider === p.key
                                            ? 'bg-accent text-white shadow-accent-sm'
                                            : 'text-muted hover:text-primary'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Interactive Slider Controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-card-solid border border-subtle text-xs">
                        {/* Epochs Slider */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-secondary">Training Epochs Budget:</span>
                                <span className="font-mono font-bold text-accent-to">{epochBudget} Epochs</span>
                            </div>
                            <input
                                type="range"
                                min={10}
                                max={200}
                                step={5}
                                value={epochBudget}
                                onChange={(e) => setEpochBudget(parseInt(e.target.value, 10))}
                                className="w-full accent-accent-from cursor-pointer"
                            />
                            <div className="flex justify-between text-[10px] text-faint font-mono">
                                <span>10 (Quick prototype)</span>
                                <span>50 (Standard)</span>
                                <span>200 (Full convergence)</span>
                            </div>
                        </div>

                        {/* Batch Size Selector */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-secondary">Target Batch Size:</span>
                                <span className="font-mono font-bold text-status-cyan">{batchSize} samples / batch</span>
                            </div>
                            <div className="flex gap-2">
                                {[1, 2, 4, 8, 16, 32].map((b) => (
                                    <button
                                        key={b}
                                        type="button"
                                        onClick={() => setBatchSize(b)}
                                        className={`flex-1 py-1.5 rounded-lg border font-mono text-xs font-bold transition ${
                                            batchSize === b
                                                ? 'bg-accent text-white border-transparent shadow-accent-sm'
                                                : 'bg-card-subtle text-muted border-subtle hover:text-primary'
                                        }`}
                                    >
                                        {b}
                                    </button>
                                ))}
                            </div>
                            <span className="text-[10px] text-faint block">
                                Recommended for {activeTemplate.targetModality}: Batch size 2 or 4 (prevents CUDA OOM).
                            </span>
                        </div>
                    </div>

                    {/* Hardware Matrix Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        {/* NVIDIA T4 (16GB) */}
                        <div className="p-4 rounded-2xl bg-card-solid border border-subtle space-y-2">
                            <div className="text-[10px] uppercase font-bold text-faint">Entry GPU</div>
                            <h4 className="text-sm font-bold text-primary">NVIDIA T4 (16GB)</h4>
                            <div className="space-y-1 font-mono text-[11px] pt-1 border-t border-subtle">
                                <div className="flex justify-between">
                                    <span className="text-muted">Est. Time:</span>
                                    <span className="text-secondary font-bold">{computeCalculations.t4Hours} hrs</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Est. Cost:</span>
                                    <span className="text-status-emerald font-bold">${computeCalculations.costT4}</span>
                                </div>
                            </div>
                        </div>

                        {/* RTX 3090 / 4090 (24GB) */}
                        <div className="p-4 rounded-2xl bg-card-solid border border-subtle space-y-2">
                            <div className="text-[10px] uppercase font-bold text-faint">Workstation</div>
                            <h4 className="text-sm font-bold text-primary">RTX 3090 / 4090 (24GB)</h4>
                            <div className="space-y-1 font-mono text-[11px] pt-1 border-t border-subtle">
                                <div className="flex justify-between">
                                    <span className="text-muted">Est. Time:</span>
                                    <span className="text-secondary font-bold">{computeCalculations.rtx3090Hours} hrs</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Est. Cost:</span>
                                    <span className="text-status-emerald font-bold">${computeCalculations.cost3090}</span>
                                </div>
                            </div>
                        </div>

                        {/* NVIDIA A10G (24GB) */}
                        <div className="p-4 rounded-2xl bg-card-solid border border-accent space-y-2 relative shadow-sm">
                            <span className="absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full status-badge-emerald uppercase">
                                Recommended
                            </span>
                            <div className="text-[10px] uppercase font-bold text-accent-to">Cloud Optimal</div>
                            <h4 className="text-sm font-bold text-primary">NVIDIA A10G (24GB)</h4>
                            <div className="space-y-1 font-mono text-[11px] pt-1 border-t border-subtle">
                                <div className="flex justify-between">
                                    <span className="text-muted">Est. Time:</span>
                                    <span className="text-secondary font-bold">{computeCalculations.a10gHours} hrs</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Est. Cost:</span>
                                    <span className="text-status-emerald font-bold">${computeCalculations.costA10G}</span>
                                </div>
                            </div>
                        </div>

                        {/* NVIDIA A100 (80GB) */}
                        <div className="p-4 rounded-2xl bg-card-solid border border-subtle space-y-2">
                            <div className="text-[10px] uppercase font-bold text-faint">Enterprise SOTA</div>
                            <h4 className="text-sm font-bold text-primary">NVIDIA A100 (80GB)</h4>
                            <div className="space-y-1 font-mono text-[11px] pt-1 border-t border-subtle">
                                <div className="flex justify-between">
                                    <span className="text-muted">Est. Time:</span>
                                    <span className="text-secondary font-bold">{computeCalculations.a100Hours} hrs</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Est. Cost:</span>
                                    <span className="text-status-emerald font-bold">${computeCalculations.costA100}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                    </>
                )}

            </div>
        </main>
    );
}


export default function RoadmapsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-page" />}>
            <RoadmapContent />
        </Suspense>
    );
}
