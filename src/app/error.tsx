"use client";

import React, { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Router Error Boundary]", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-8 rounded-3xl bg-card border border-red-500/20 backdrop-blur-xl text-center space-y-5 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto text-2xl">
          ⚠️
        </div>
        <div className="space-y-2">
          <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-mono font-semibold uppercase tracking-wider">
            Application Error Shield
          </span>
          <h2 className="text-xl font-bold text-primary">Explore Studio Encountered an Error</h2>
          <p className="text-xs text-muted leading-relaxed">
            {error.message || "An unexpected error occurred while rendering the page. State has been preserved where possible."}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-primary text-primary-inverse text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
          >
            Try Again
          </button>
          <a
            href="/explore"
            className="px-4 py-2.5 rounded-xl border border-subtle bg-card hover:bg-card-hover text-xs text-muted font-medium transition-colors"
          >
            Reset Search
          </a>
        </div>

        {error.digest && (
          <p className="text-[10px] font-mono text-muted/60">
            Error digest: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
