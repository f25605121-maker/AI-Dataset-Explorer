"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-subtle bg-card-subtle mt-auto relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Column 1: Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group inline-flex">
              <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-xs shadow-accent-sm">
                ✦
              </div>
              <span className="font-bold text-lg tracking-tight text-primary">
                AI Dataset Explorer
              </span>
            </Link>
            <p className="text-sm text-muted max-w-md leading-relaxed">
              A curated platform for discovering datasets, compatible AI architectures, research papers, hardware feasibility benchmarks, and actionable project roadmaps.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Discovery Engines Online
              </span>
            </div>
          </div>

          {/* Column 2: Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-faint">Platform</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li>
                <Link href="/explore" className="hover:text-primary transition">Explore Studio</Link>
              </li>
              <li>
                <Link href="/benchmark" className="hover:text-primary transition">Benchmark & Compare Lab</Link>
              </li>
              <li>
                <Link href="/roadmap" className="hover:text-primary transition">Pipeline & Implementation Roadmap</Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-primary transition">Settings & Preferences</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Data Sources & Ecosystem */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-faint">Data Sources</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <span className="text-blue-400 font-bold text-xs">K</span> Kaggle Datasets
              </li>
              <li className="flex items-center gap-2">
                <span>🤗</span> Hugging Face Hub
              </li>
              <li className="flex items-center gap-2">
                <span className="text-rose-400 font-bold text-xs">a</span> arXiv Research
              </li>
              <li className="flex items-center gap-2">
                <span>🔬</span> PubMed & OpenAlex
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-subtle flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-faint">
          <p>© {new Date().getFullYear()} AI Dataset Explorer. All rights reserved.</p>
          <p className="flex items-center gap-2">
            <span>Crafted for AI builders, researchers & engineers</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
