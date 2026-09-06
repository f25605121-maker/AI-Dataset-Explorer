"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/context/ThemeContext";
import { useSearchSession } from "@/hooks/useSearchSession";

export interface NavbarProps {
  className?: string;
  variant?: "landing" | "app";
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function Navbar({ className = "", variant = "app", onToggleSidebar, isSidebarOpen }: NavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const { pinnedAssets } = useSearchSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [profileMenuOpen]);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const handleSignOut = async () => {
    setProfileMenuOpen(false);
    setMobileMenuOpen(false);
    try {
      localStorage.removeItem("aide_recent_searches_guest");
      localStorage.removeItem("aide_session_u_guest_query_v3");
      localStorage.removeItem("aide_session_u_guest_results_v3");
      localStorage.removeItem("aide_session_u_guest_pinned_v3");
    } catch {}
    await signOut({ callbackUrl: "/" });
  };

  const userInitial = session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U";
  const userName = session?.user?.name || session?.user?.email || "User";
  const userEmail = session?.user?.email || "";

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/explore", label: "Explore Studio" },
    { href: "/benchmark", label: "Benchmark & Compare Lab", badge: pinnedAssets.length > 0 ? pinnedAssets.length : null },
    { href: "/roadmap", label: "Pipeline & Implementation Roadmap" },
  ];

  return (
    <header className={`sticky top-0 z-50 w-full glass-nav transition-colors duration-200 isolate ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center text-white font-bold text-sm shadow-accent-sm group-hover:scale-105 transition-transform duration-200">
            ✦
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-primary group-hover:text-accent-to transition">
              AI Dataset Explorer
            </span>
            <span className="text-[10px] text-muted -mt-1 font-mono hidden sm:block">
              Discovery · Benchmarks · Roadmaps
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-card-subtle p-1.5 rounded-full border border-subtle">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname?.startsWith(link.href)) ||
              (link.href === "/roadmap" && pathname?.startsWith("/roadmaps")) ||
              (link.href === "/benchmark" && pathname?.startsWith("/search"));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-accent text-white shadow-accent-sm font-bold"
                    : "text-muted hover:text-primary hover:bg-card-hover"
                }`}
              >
                <span>{link.label}</span>
                {typeof link.badge === 'number' && (
                  <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-white font-mono text-[10px] font-bold">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right controls: Theme toggle + Auth / Profile + Mobile trigger */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl border border-subtle bg-card hover:bg-card-hover text-secondary flex items-center justify-center transition-all duration-200"
            title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? (
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Sidebar Toggle Button (if provided) */}
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className={`w-9 h-9 rounded-xl border border-subtle bg-card hover:bg-card-hover text-secondary hover:text-white flex items-center justify-center transition-all duration-200 ${
                isSidebarOpen ? "bg-accent/20 border-accent/40 text-white" : ""
              }`}
              title="Toggle recent searches & settings panel"
              aria-label="Toggle recent searches sidebar"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="2" />
                <path d="M15 4v16" strokeWidth="2" />
              </svg>
            </button>
          )}

          {/* Auth Controls & Get Started Option */}
          {!session?.user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="hidden sm:inline-flex px-3.5 py-1.5 text-xs font-semibold text-secondary hover:text-primary hover:bg-card-hover border border-transparent hover:border-subtle rounded-xl transition"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-accent text-white shadow-accent-sm hover:brightness-110 active:scale-95 transition flex items-center gap-1.5"
              >
                <span>Get Started</span>
                <span className="text-xs font-bold">→</span>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/explore"
                className="hidden sm:inline-flex px-4 py-1.5 text-xs font-bold rounded-xl bg-accent text-white shadow-accent-sm hover:brightness-110 active:scale-95 transition items-center gap-1.5"
              >
                <span>Get Started</span>
                <span className="text-xs font-bold">→</span>
              </Link>

              {/* Profile Avatar & Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center shadow-accent-sm hover:brightness-110 active:scale-95 transition border border-white/20"
                  title={`Signed in as ${userName}`}
                  aria-label="User profile"
                  aria-expanded={profileMenuOpen}
                >
                  {userInitial.toUpperCase()}
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl glass-card border border-subtle shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2.5 border-b border-subtle">
                      <p className="text-xs font-bold text-primary truncate">{userName}</p>
                      <p className="text-[11px] text-muted truncate">{userEmail}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/explore"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-secondary hover:text-primary hover:bg-card-hover transition"
                      >
                        <span>✦</span>
                        <span>Explore Studio</span>
                      </Link>
                      <Link
                        href="/benchmark"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-secondary hover:text-primary hover:bg-card-hover transition"
                      >
                        <span>⚖️</span>
                        <span>Benchmark Lab</span>
                      </Link>
                      <Link
                        href="/roadmap"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-secondary hover:text-primary hover:bg-card-hover transition"
                      >
                        <span>🛠️</span>
                        <span>Pipeline Roadmap</span>
                      </Link>
                      <Link
                        href="/settings"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-secondary hover:text-primary hover:bg-card-hover transition"
                      >
                        <span>⚙</span>
                        <span>Settings & Preferences</span>
                      </Link>
                    </div>
                    <div className="pt-1 border-t border-subtle">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 transition"
                      >
                        <span>🚪</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-xl border border-subtle bg-card hover:bg-card-hover text-secondary flex items-center justify-center transition"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-card border-b border-subtle px-4 pt-2 pb-6 space-y-3 animate-in fade-in slide-in-from-top-3 duration-200">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition ${
                    isActive
                      ? "bg-accent text-white shadow-accent-sm"
                      : "text-secondary hover:text-primary hover:bg-card-hover"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-secondary hover:text-primary hover:bg-card-hover rounded-xl transition"
            >
              Settings & Preferences
            </Link>
          </nav>

          {/* Mobile Auth / Get Started Options */}
          <div className="pt-3 border-t border-subtle flex flex-col gap-2">
            <Link
              href={session?.user ? "/explore" : "/signup"}
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center px-4 py-2.5 text-sm font-bold rounded-xl bg-accent text-white shadow-accent-sm hover:brightness-110 transition"
            >
              Get Started →
            </Link>
            {!session?.user ? (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center px-4 py-2 text-sm font-semibold text-secondary hover:text-primary hover:bg-card-hover rounded-xl border border-subtle transition"
              >
                Sign In
              </Link>
            ) : (
              <div className="flex items-center justify-between px-2 pt-2">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-primary truncate">{userName}</span>
                  <span className="text-[11px] text-muted truncate">{userEmail}</span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-3 py-1 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
