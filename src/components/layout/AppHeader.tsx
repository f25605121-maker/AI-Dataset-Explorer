"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";

export interface AppHeaderProps {
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
  showSearchCount?: boolean;
}

export function AppHeader({ breadcrumbs, actions, showSearchCount = true }: AppHeaderProps) {
  const { data: session } = useSession();

  return (
    <div className="border-b border-subtle bg-card-subtle px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Breadcrumb path */}
        <div className="flex items-center gap-2 text-xs text-muted">
          <Link href="/" className="hover:text-primary transition">Home</Link>
          {breadcrumbs?.map((b, idx) => (
            <React.Fragment key={idx}>
              <span>/</span>
              {b.href ? (
                <Link href={b.href} className="hover:text-primary transition">{b.label}</Link>
              ) : (
                <span className="text-primary font-semibold">{b.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Right side controls / actions */}
        <div className="flex items-center gap-3">
          {actions}
          <ThemeToggle />
          {session ? (
            <span className="text-[11px] text-muted hidden sm:inline-block">
              <strong className="text-status-emerald font-bold">✓ Active</strong> · {(session.user as any)?.planTier === 'pro' ? 'Pro Plan' : 'Standard'}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default AppHeader;
