"use client";

import React, { useState } from "react";
import { DatasetItem } from "@/components/cards/DatasetCard";
import { ModelItem } from "@/components/cards/ModelCard";

interface StarterCodeHubProps {
    dataset: DatasetItem;
    model: ModelItem;
    templateTitle?: string;
    targetModality?: string;
    templateId?: string;
    starterCode: {
        setupScript: string;
        datasetLoader: string;
        trainScript: string;
        inferenceApi: string;
    };
    onDownloadNotebook?: () => void;
}

// Lightweight syntax highlighter for Python and Bash code
function renderHighlightedCode(code: string) {
    const lines = code.split("\n");

    return lines.map((line, lineIdx) => {
        // Comment detection
        const commentIdx = line.indexOf("#");
        let codePart = line;
        let commentPart = "";

        if (commentIdx !== -1) {
            codePart = line.substring(0, commentIdx);
            commentPart = line.substring(commentIdx);
        }

        // Tokenize codePart: match strings, keywords, decorators, numbers, identifiers
        const tokenRegex = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|@\w+(?:\.\w+)*|\b(?:import|from|as|def|class|return|if|else|elif|for|in|while|try|except|finally|with|async|await|None|True|False|self|raise|yield|pass|break|continue|set|echo|pip|export|chmod|mkdir|cd|rm)\b|\b\d+(?:\.\d+)?\b|[a-zA-Z_]\w*|[^\s\w"']+|\s+)/g;

        const tokens: React.ReactNode[] = [];
        let match;
        let tokenKey = 0;

        if (codePart) {
            while ((match = tokenRegex.exec(codePart)) !== null) {
                const token = match[0];
                if (token.startsWith('"') || token.startsWith("'")) {
                    tokens.push(
                        <span key={tokenKey++} className="text-emerald-300">
                            {token}
                        </span>
                    );
                } else if (token.startsWith("@")) {
                    tokens.push(
                        <span key={tokenKey++} className="text-purple-400 font-semibold">
                            {token}
                        </span>
                    );
                } else if (/^(?:import|from|as|def|class|return|if|else|elif|for|in|while|try|except|finally|with|async|await|self|raise|yield|pass|break|continue|set|echo|pip|export|chmod|mkdir|cd|rm)$/.test(token)) {
                    tokens.push(
                        <span key={tokenKey++} className="text-cyan-400 font-bold">
                            {token}
                        </span>
                    );
                } else if (/^(?:None|True|False)$/.test(token)) {
                    tokens.push(
                        <span key={tokenKey++} className="text-amber-400 font-semibold">
                            {token}
                        </span>
                    );
                } else if (/^\d+(?:\.\d+)?$/.test(token)) {
                    tokens.push(
                        <span key={tokenKey++} className="text-orange-300 font-mono">
                            {token}
                        </span>
                    );
                } else if (/^(?:torch|nn|F|DataLoader|Dataset|FastAPI|UploadFile|File|GradScaler|AdamW|CosineAnnealingLR|MONAI|SwinUNETR|UNet|Compose|LoadImaged|EnsureChannelFirstd|Spacingd|Orientationd|RandCropByPosNegLabeld|DiceLoss|DiceMetric|sliding_window_inference)$/.test(token)) {
                    tokens.push(
                        <span key={tokenKey++} className="text-blue-300 font-semibold">
                            {token}
                        </span>
                    );
                } else {
                    tokens.push(<span key={tokenKey++}>{token}</span>);
                }
            }
        }

        return (
            <div key={lineIdx} className="table-row">
                <span className="table-cell select-none pr-4 text-right font-mono text-[11px] text-slate-600 w-8">
                    {lineIdx + 1}
                </span>
                <span className="table-cell">
                    {tokens}
                    {commentPart && (
                        <span className="text-slate-500 italic">{commentPart}</span>
                    )}
                </span>
            </div>
        );
    });
}

export default function StarterCodeHub({
    dataset,
    model,
    templateTitle = "Pipeline Starter Blueprint",
    targetModality = "Multimodal Deep Learning",
    templateId = "starter-pipeline",
    starterCode,
    onDownloadNotebook,
}: StarterCodeHubProps) {
    const [activeTab, setActiveTab] = useState<'setup' | 'loader' | 'train' | 'inference'>('loader');
    const [copied, setCopied] = useState(false);

    const tabs = [
        { key: 'setup' as const, filename: 'setup_and_download.sh', icon: '⚡' },
        { key: 'loader' as const, filename: 'dataset_loader.py', icon: '📦' },
        { key: 'train' as const, filename: 'train.py', icon: '🚀' },
        { key: 'inference' as const, filename: 'inference_fastapi.py', icon: '🌐' },
    ];

    const currentCode = activeTab === 'setup'
        ? starterCode.setupScript
        : activeTab === 'loader'
        ? starterCode.datasetLoader
        : activeTab === 'train'
        ? starterCode.trainScript
        : starterCode.inferenceApi;

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(currentCode);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // fallback
        }
    };

    const handleDownload = () => {
        if (onDownloadNotebook) {
            onDownloadNotebook();
            return;
        }

        const datasetName = dataset.title || dataset.name || "Dataset";
        const modelName = model.name || model.id || "Model";

        const notebookObj = {
            cells: [
                {
                    cell_type: "markdown",
                    metadata: {},
                    source: [
                        `# ${templateTitle}\n`,
                        `### Production Implementation & Fine-Tuning Notebook\n`,
                        `**Target Dataset:** ${datasetName}  \n`,
                        `**Target Model:** ${modelName}  \n`,
                        `**Modality:** ${targetModality}  \n`,
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
                    source: starterCode.setupScript.split("\n").map((line) => line + "\n"),
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
                    source: starterCode.datasetLoader.split("\n").map((line) => line + "\n"),
                },
                {
                    cell_type: "markdown",
                    metadata: {},
                    source: ["## Phase 4: Model Architecture, Loss Strategy & Training Loop (MONAI / PyTorch)\n"],
                },
                {
                    cell_type: "code",
                    execution_count: null,
                    metadata: {},
                    outputs: [],
                    source: starterCode.trainScript.split("\n").map((line) => line + "\n"),
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
                    source: starterCode.inferenceApi.split("\n").map((line) => line + "\n"),
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
        a.download = `${templateId}-starter-pipeline.ipynb`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="rounded-3xl border border-subtle bg-card p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-subtle pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-white text-lg font-bold shadow-accent-sm">
                        💻
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
                            <span>Production-Ready Starter Code Hub</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full status-badge-emerald uppercase">
                                Ready to Run
                            </span>
                        </h3>
                        <p className="text-xs text-muted mt-0.5">
                            Tailored scripts configured for <strong className="text-secondary font-semibold">{dataset.title || dataset.name}</strong> &amp; <strong className="text-secondary font-semibold">{model.name || model.id}</strong>.
                        </p>
                    </div>
                </div>

                {/* Download Jupyter Notebook button */}
                <div className="flex flex-wrap items-center gap-2.5">
                    <button
                        type="button"
                        onClick={handleDownload}
                        className="px-4 py-2.5 rounded-xl bg-accent text-white text-xs font-bold shadow-accent-sm hover:brightness-110 active:scale-95 transition flex items-center gap-1.5"
                    >
                        <span>📥</span>
                        <span>Download Starter Jupyter Notebook (.ipynb)</span>
                    </button>
                </div>
            </div>

            {/* File Selector Tabs */}
            <div className="flex items-center justify-between gap-2 border-b border-subtle overflow-x-auto pb-0">
                <div className="flex gap-1.5">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-mono transition-all -mb-px rounded-t-xl shrink-0 ${
                                activeTab === tab.key
                                    ? "bg-[#030712] text-cyan-300 font-bold border-t border-x border-subtle shadow-sm"
                                    : "text-muted hover:text-primary hover:bg-card-subtle font-medium"
                            }`}
                        >
                            <span>{tab.icon}</span>
                            <span>{tab.filename}</span>
                        </button>
                    ))}
                </div>

                {/* Copy Code button */}
                <button
                    type="button"
                    onClick={handleCopy}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition mb-1 shrink-0 flex items-center gap-1.5 ${
                        copied
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "bg-card-subtle hover:bg-card-hover border-subtle text-secondary hover:text-primary"
                    }`}
                >
                    <span>{copied ? "✓" : "📋"}</span>
                    <span>{copied ? "Copied!" : "Copy Code"}</span>
                </button>
            </div>

            {/* Dark Code Display Box with line numbers and syntax highlighting */}
            <div className="rounded-2xl bg-[#030712] border border-subtle p-5 overflow-x-auto max-h-[500px] shadow-inner font-mono text-xs text-slate-200">
                <div className="table w-full">
                    {renderHighlightedCode(currentCode)}
                </div>
            </div>
        </div>
    );
}
