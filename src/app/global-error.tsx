"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-3xl bg-neutral-900 border border-neutral-800 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-lg font-bold text-neutral-100">Fatal Application Error</h2>
          <p className="text-xs text-neutral-400">
            {error.message || "A critical runtime error occurred."}
          </p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 rounded-xl bg-neutral-100 text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Reload Explorer
          </button>
        </div>
      </body>
    </html>
  );
}
