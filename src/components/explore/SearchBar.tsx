"use client";

import React, { useRef, useState, useEffect } from "react";

export interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  onSearch: (query: string) => void;
  isLoading?: boolean;
  searchProgress?: number;
  searchStage?: string;
  placeholder?: string;
  presetQueries?: string[];
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  isLoading = false,
  searchProgress,
  searchStage,
  placeholder = "Describe your project, AI problem, or dataset needs (e.g., 'Real-time vehicle detection in CCTV video' or 'Coronary artery segmentation CT dataset')...",
  presetQueries = [
    "Coronary artery CT segmentation",
    "Vehicle tracking in CCTV video",
    "Chest X-ray pneumonia classification",
    "Explain backpropagation vs Adam optimizer",
  ],
}: SearchBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [internalProgress, setInternalProgress] = useState(0);

  // Fallback internal progress ticker if searchProgress is not provided
  useEffect(() => {
    if (!isLoading) {
      setInternalProgress(0);
      return;
    }
    if (searchProgress !== undefined) {
      return;
    }

    setInternalProgress(10);
    const interval = setInterval(() => {
      setInternalProgress((prev) => {
        if (prev < 90) return prev + Math.random() * 4 + 1;
        if (prev < 96) return prev + 0.2;
        return 96;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isLoading, searchProgress]);

  const effectiveProgress = searchProgress !== undefined ? searchProgress : internalProgress;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading && value.trim()) {
      onSearch(value.trim());
    }
  };

  return (
    <div className="w-full rounded-3xl border border-subtle glass-card p-5 sm:p-6 shadow-xl relative">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="pt-2 text-accent-from">
            {isLoading ? (
              <span className="inline-block w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>

          <textarea
            ref={textareaRef}
            rows={2}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm sm:text-base text-primary placeholder:text-muted outline-none resize-none leading-relaxed"
          />

          <div className="flex items-center gap-2 shrink-0">
            {value && (
              <button
                type="button"
                onClick={() => onChange("")}
                className="p-2 text-muted hover:text-primary transition"
                title="Clear input"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading || !value.trim()}
              className="relative overflow-hidden px-6 py-2.5 rounded-xl bg-accent hover:brightness-110 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all shadow-accent disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 min-w-[145px]"
            >
              {isLoading && (
                <div
                  className="absolute inset-0 bg-white/20 dark:bg-white/25 transition-all duration-150 ease-out pointer-events-none"
                  style={{ width: `${Math.min(100, Math.round(effectiveProgress))}%` }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {isLoading ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing {Math.round(effectiveProgress)}%</span>
                  </>
                ) : (
                  "Explore"
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Progress Bar during Search */}
        {isLoading && (
          <div className="w-full space-y-1.5 pt-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-accent font-semibold text-[11px] sm:text-xs">
                <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span>{searchStage || "Analyzing query & domain constraints..."}</span>
              </span>
              <span className="font-mono text-[11px] sm:text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                {Math.round(effectiveProgress)}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-card-subtle rounded-full overflow-hidden border border-subtle">
              <div
                className="h-full bg-gradient-to-r from-accent via-accent-from to-accent-to transition-all duration-150 ease-out rounded-full shadow-sm"
                style={{ width: `${Math.min(100, Math.round(effectiveProgress))}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Prompts & Shortcuts */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-subtle text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-faint text-[11px] font-bold uppercase tracking-wider mr-1">Quick Try:</span>
            {presetQueries.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  onChange(prompt);
                  onSearch(prompt);
                }}
                className="px-2.5 py-1 rounded-lg bg-card-subtle hover:bg-card-hover text-muted hover:text-primary border border-subtle transition text-[11px]"
              >
                {prompt}
              </button>
            ))}
          </div>
          <span className="text-[11px] text-faint hidden md:inline-block">
            Press <kbd className="px-1.5 py-0.5 rounded bg-card-subtle border border-subtle font-mono text-[10px]">Enter</kbd> to search · <kbd className="px-1.5 py-0.5 rounded bg-card-subtle border border-subtle font-mono text-[10px]">Shift+Enter</kbd> for newline
          </span>
        </div>
      </form>
    </div>
  );
}

export default SearchBar;
