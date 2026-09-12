"use client";

import React from "react";

export interface StitchEmptyStateProps {
  category: "datasets" | "models" | "papers" | "error" | "general";
  query?: string;
  modality?: string;
  domain?: string;
  onRelaxQuery?: (newQuery: string) => void;
  onRetry?: () => void;
  errorMessage?: string;
  title?: string;
  description?: string;
}

export function StitchEmptyState({
  category,
  query = "",
  modality,
  domain,
  onRelaxQuery,
  onRetry,
  errorMessage,
  title,
  description,
}: StitchEmptyStateProps) {
  const isCryoModality =
    /cryo|tomography|subtomogram|macromolecule/i.test(query) ||
    /cryo/i.test(modality || "");

  // Niche modality relaxed query chips
  const relaxedChips = isCryoModality
    ? [
        { label: "cryo-et", query: "cryo-et" },
        { label: "cryo-em", query: "cryo-em" },
        { label: "electron tomography", query: "electron tomography" },
        { label: "macromolecule structural", query: "macromolecule structural" },
        { label: "subtomogram", query: "subtomogram" },
      ]
    : [
        { label: "Broaden Modality", query: query.replace(/\b(3d|4d|sparse|high-res)\b/gi, "").trim() || "medical imaging" },
        { label: "Benchmark Datasets", query: `${query.split(" ").slice(0, 2).join(" ")} benchmark` },
        { label: "Deep Learning Checkpoints", query: `${query.split(" ").slice(0, 2).join(" ")} deep learning` },
      ];

  // External specialized scientific repositories
  const specializedArchives = [
    {
      name: "EMPIAR",
      desc: "Electron Microscopy Public Image Archive (raw 2D/3D micrographs & tilt-series)",
      url: `https://www.ebi.ac.uk/empiar/search/?q=${encodeURIComponent(query || "cryo")}`,
      badge: "Primary Raw Data",
    },
    {
      name: "EMDataBank",
      desc: "Unified Global Data Resource for 3D Electron Microscopy density maps",
      url: `https://www.emdataresource.org/`,
      badge: "3D Densities",
    },
    {
      name: "BioImage Archive",
      desc: "EMBL-EBI open reference biological images and tomograms",
      url: `https://www.ebi.ac.uk/bioimage-archive/?query=${encodeURIComponent(query || "cryo-et")}`,
      badge: "Bio-Imaging",
    },
    {
      name: "Zenodo Open Science",
      desc: "CERN & EU Open Science research datasets and models",
      url: `https://zenodo.org/search?q=${encodeURIComponent(query || "structural biology")}`,
      badge: "Open Science",
    },
  ];

  if (category === "error") {
    return (
      <div className="p-8 sm:p-10 rounded-3xl bg-card/60 border border-red-500/20 backdrop-blur-xl shadow-lg text-center space-y-5 my-4">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto text-2xl">
          ⚠️
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-[11px] font-mono text-red-400 font-semibold uppercase tracking-wider">
            Upstream API Exception
          </div>
          <h3 className="text-lg font-bold text-primary">
            {title || "Search Service Degraded"}
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            {errorMessage ||
              description ||
              "An external data provider (Kaggle or Hugging Face) timed out or encountered an upstream network issue. Local caching is preserving existing search context."}
          </p>
        </div>

        {onRetry && (
          <button
            onClick={onRetry}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-inverse text-xs font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry Query
          </button>
        )}
      </div>
    );
  }

  if (category === "datasets") {
    return (
      <div className="p-5 sm:p-6 lg:p-7 rounded-3xl bg-card/70 border border-subtle backdrop-blur-xl shadow-sm space-y-6">
        {/* Header with status badges */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-subtle pb-4 sm:pb-5">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center text-xl sm:text-2xl shrink-0 mt-0.5">
              🔬
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-semibold uppercase tracking-wider whitespace-nowrap">
                  No Direct Results
                </span>
                {domain && (
                  <span className="px-2 py-0.5 rounded-full bg-card-subtle border border-subtle text-muted text-[10px] font-mono font-medium truncate max-w-[120px] sm:max-w-[200px]">
                    {domain.split("/").pop()}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-primary">
                {title || "No qualifying dataset found"}
              </h3>
              <p className="text-xs text-muted leading-relaxed break-words max-w-xl">
                {isCryoModality
                  ? "Niche sub-cellular and microscopy modalities (such as Cryo-EM and Cryo-ET) rarely have large consumer volumes on standard Kaggle search due to multi-gigabyte tomogram files and strict token matching."
                  : description || "The exact combination of tokens produced 0 results on indexed repositories. Relaxing search keywords or exploring primary archives will reveal relevant assets."}
              </p>
            </div>
          </div>

          {onRelaxQuery && (
            <button
              onClick={() => onRelaxQuery(isCryoModality ? "cryo-et" : query.split(" ")[0] || "imaging")}
              className="px-3.5 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:opacity-90 transition-all shrink-0 flex items-center gap-1.5 shadow-sm self-start md:self-center"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Auto-Relax Filters
            </button>
          )}
        </div>

        {/* Relaxed High-Recall Query Suggestions */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <span>💡</span> High-Recall Relaxed Query Chips
            </h4>
            <span className="text-[11px] text-muted">Click any chip to search</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {relaxedChips.map((chip) => (
              <button
                key={chip.label}
                onClick={() => onRelaxQuery && onRelaxQuery(chip.query)}
                className="px-3.5 py-1.5 rounded-xl border border-accent/20 bg-accent/5 hover:bg-accent/15 hover:border-accent/40 text-accent text-xs font-medium transition-all flex items-center gap-1.5 group"
              >
                <svg className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Specialized Scientific Repositories */}
        {isCryoModality && (
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <span>🏛️</span> Specialized Structural Biology Repositories
            </h4>
            <p className="text-[11px] text-muted">
              For sub-cellular tomography and macromolecular structures, the scientific community primarily deposits data in curated institutional archives:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {specializedArchives.map((archive) => (
                <a
                  key={archive.name}
                  href={archive.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 rounded-2xl border border-subtle bg-card hover:bg-card-hover transition-colors flex items-start justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary group-hover:text-accent transition-colors">
                        {archive.name}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-card-hover border border-subtle text-muted">
                        {archive.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted leading-tight">
                      {archive.desc}
                    </p>
                  </div>
                  <svg className="w-4 h-4 text-muted group-hover:text-primary transition-colors shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (category === "models") {
    return (
      <div className="p-8 sm:p-10 rounded-3xl bg-card/70 border border-subtle backdrop-blur-xl shadow-sm space-y-6 my-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-subtle pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-2xl shrink-0">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono font-semibold uppercase tracking-wider">
                  No Direct Fine-Tuned Checkpoints
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-primary mt-1">
                {title || "Architectural Baseline Required"}
              </h3>
              <p className="text-xs text-muted mt-0.5 max-w-xl">
                Specialized sub-cellular and 3D tasks rarely have pre-packaged end-to-end checkpoints on Hugging Face. The standard paradigm is initializing from a general 3D vision backbone and fine-tuning.
              </p>
            </div>
          </div>

          {onRelaxQuery && (
            <button
              onClick={() => onRelaxQuery("swin unetr 3d")}
              className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:opacity-90 transition-all shrink-0 flex items-center gap-1.5"
            >
              Search 3D Backbones
            </button>
          )}
        </div>

        {/* Recommended 3D Backbones */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <span>⚡</span> Recommended Foundational Backbones for Transfer Learning
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl border border-subtle bg-card space-y-1.5">
              <div className="text-xs font-bold text-primary">Swin UNETR (MONAI)</div>
              <p className="text-[11px] text-muted">
                Shifted-window 3D self-attention transformer optimal for volumetric tomogram dense segmentation.
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-subtle bg-card space-y-1.5">
              <div className="text-xs font-bold text-primary">nnU-Net ResEnc M</div>
              <p className="text-[11px] text-muted">
                Self-configuring residual 3D U-Net backbone with robust anisotropic spacing handling.
              </p>
            </div>
            <div className="p-4 rounded-2xl border border-subtle bg-card space-y-1.5">
              <div className="text-xs font-bold text-primary">ViT-3D / Masked Autoencoders</div>
              <p className="text-[11px] text-muted">
                Self-supervised pretraining on unannotated tomogram volumes before supervised fine-tuning.
              </p>
            </div>
          </div>
        </div>

        {/* Hugging Face link */}
        <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs text-muted">Explore foundational vision backbones:</span>
          <a
            href={`https://huggingface.co/models?search=${encodeURIComponent(query || "swin-unetr")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
          >
            Browse Hugging Face Hub Directly &rarr;
          </a>
        </div>
      </div>
    );
  }

  // category === 'papers'
  return (
    <div className="p-8 sm:p-10 rounded-3xl bg-card/70 border border-subtle backdrop-blur-xl shadow-sm space-y-6 my-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-subtle pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-2xl shrink-0">
            📑
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-mono font-semibold uppercase tracking-wider">
                Literature Discovery
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-primary mt-1">
              {title || "No Scholarly Papers Directly Matched"}
            </h3>
            <p className="text-xs text-muted mt-0.5 max-w-xl">
              {description ||
                "Exact keyword intersection yielded 0 indexed papers. Broaden your search or query specialized biomedical preprint indices directly."}
            </p>
          </div>
        </div>

        {onRelaxQuery && (
          <button
            onClick={() => onRelaxQuery(isCryoModality ? "cryo-electron tomography" : query.split(" ")[0] || "deep learning")}
            className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold hover:opacity-90 transition-all shrink-0"
          >
            Broaden Literature Query
          </button>
        )}
      </div>

      {/* External Paper Search Engines */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
          <span>🔍</span> Query Scholarly Portals Directly
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href={`https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(query || "cryo-electron tomography")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl border border-subtle bg-card hover:bg-card-hover transition-colors flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-bold text-primary group-hover:text-accent">PubMed</div>
              <div className="text-[11px] text-muted">Biomedical & life sciences literature</div>
            </div>
            <span className="text-muted group-hover:text-primary">&rarr;</span>
          </a>
          <a
            href={`https://arxiv.org/search/?query=${encodeURIComponent(query || "cryo-et")}&searchtype=all`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl border border-subtle bg-card hover:bg-card-hover transition-colors flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-bold text-primary group-hover:text-accent">arXiv (cs.CV / q-bio)</div>
              <div className="text-[11px] text-muted">Computer vision & quantitative biology</div>
            </div>
            <span className="text-muted group-hover:text-primary">&rarr;</span>
          </a>
          <a
            href={`https://www.semanticscholar.org/search?q=${encodeURIComponent(query || "cryo-et")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl border border-subtle bg-card hover:bg-card-hover transition-colors flex items-center justify-between group"
          >
            <div>
              <div className="text-xs font-bold text-primary group-hover:text-accent">Semantic Scholar</div>
              <div className="text-[11px] text-muted">AI-powered scientific citation graph</div>
            </div>
            <span className="text-muted group-hover:text-primary">&rarr;</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export default StitchEmptyState;
