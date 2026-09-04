"use client";

import React, { useState, useMemo } from "react";
import { Paper } from "@/types/assets";
import { ResearchLandscapeSummary, ResearchSynthesisSummary } from "@/types/search";
import PaperCard from "@/components/cards/PaperCard";
import PaperDetailModal from "@/components/modals/PaperDetailModal";

export interface LiteratureListProps {
  papers: Paper[];
  researchLandscape?: ResearchLandscapeSummary | null;
  researchSynthesis?: ResearchSynthesisSummary | null;
}

export function LiteratureList({
  papers,
  researchLandscape,
  researchSynthesis,
}: LiteratureListProps) {
  const [paperFilter, setPaperFilter] = useState<
    | "all"
    | "latest"
    | "most_relevant"
    | "most_cited"
    | "exact_dataset"
    | "exact_model"
    | "directly_related"
    | "open_access"
    | "preprint"
  >("all");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<any | null>(null);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    papers.forEach((p) => {
      if (typeof p.year === "number") years.add(p.year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [papers]);

  const filteredPapers = useMemo(() => {
    if (!papers) return [];
    let list = [...papers];

    if (selectedYear !== null) {
      list = list.filter((p) => p.year === selectedYear);
    }

    switch (paperFilter) {
      case "latest":
        list.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
      case "most_relevant":
        list.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
        break;
      case "most_cited":
        list.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));
        break;
      case "exact_dataset":
        list = list.filter((p) => p.relationship === "EXACT_DATASET");
        break;
      case "exact_model":
        list = list.filter((p) => p.relationship === "EXACT_MODEL");
        break;
      case "directly_related":
        list = list.filter((p) => p.relationship === "DIRECTLY_RELATED");
        break;
      case "open_access":
        list = list.filter((p) => p.openAccess);
        break;
      case "preprint":
        list = list.filter((p) => p.isPreprint);
        break;
      case "all":
      default:
        break;
    }

    return list;
  }, [papers, paperFilter, selectedYear]);

  return (
    <div className="space-y-6">
      {/* Research Landscape Header if available */}
      {researchLandscape && (
        <div className="p-6 rounded-3xl bg-card border border-subtle space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white text-sm shadow-accent-sm">
                🔬
              </div>
              <div>
                <h3 className="text-base font-bold text-primary">
                  Research Landscape & Scientific Maturity
                </h3>
                <p className="text-xs text-muted">
                  Indexed across Semantic Scholar, arXiv, OpenAlex & PubMed
                </p>
              </div>
            </div>

            <span className="text-xs font-bold px-3 py-1 rounded-full border status-badge-emerald uppercase tracking-wider">
              {researchLandscape.researchMaturity}
            </span>
          </div>

          <p className="text-xs text-secondary leading-relaxed">{researchLandscape.maturityReason}</p>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-card rounded-2xl border border-subtle">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-faint font-bold uppercase tracking-wider mr-1 text-[10px]">Filter:</span>
          {[
            { key: "all", label: "All Papers" },
            { key: "most_relevant", label: "Most Relevant" },
            { key: "most_cited", label: "Most Cited" },
            { key: "latest", label: "Latest" },
            { key: "exact_dataset", label: "Exact Dataset" },
            { key: "open_access", label: "Open Access (OA)" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setPaperFilter(f.key as any)}
              className={`px-3 py-1.5 rounded-xl transition text-xs font-semibold ${
                paperFilter === f.key
                  ? "bg-accent text-white shadow-accent-sm font-bold"
                  : "bg-card-subtle text-muted hover:text-primary hover:bg-card-hover"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {availableYears.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted text-[11px]">Year:</span>
            <select
              value={selectedYear ?? ""}
              onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="bg-card-subtle border border-subtle rounded-xl px-2.5 py-1 text-xs text-primary outline-none"
            >
              <option value="">All Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Papers Grid */}
      {filteredPapers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPapers.map((paper) => (
            <PaperCard key={paper.id} paper={paper as any} onOpenDetails={(p) => setSelectedPaper(p)} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl bg-card border border-subtle text-muted space-y-2">
          <p className="text-sm font-bold text-primary">No research papers match the selected filter.</p>
          <p className="text-xs">Try selecting &quot;All Papers&quot; to see all discovered scholarly publications.</p>
        </div>
      )}

      {/* Paper Detail Modal */}
      {selectedPaper && (
        <PaperDetailModal
          onClose={() => setSelectedPaper(null)}
          paper={selectedPaper as any}
        />
      )}
    </div>
  );
}

export default LiteratureList;
