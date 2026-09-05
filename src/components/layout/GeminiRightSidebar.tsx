"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRecentSearches, RecentSearchItem } from "@/hooks/useRecentSearches";
import { QuickSettingsModal } from "@/components/modals/QuickSettingsModal";

export interface GeminiSidebarProps {
    currentQuery?: string;
    onSelectSearch?: (query: string) => void;
    onNewSearch?: () => void;
    isOpenMobile?: boolean;
    onCloseMobile?: () => void;
    className?: string;
}

export function GeminiSidebar({
    currentQuery = "",
    onSelectSearch,
    onNewSearch,
    isOpenMobile = false,
    onCloseMobile,
    className = "",
}: GeminiSidebarProps) {
    const { data: session } = useSession();
    const { recentSearches, removeSearch, clearAllSearches } = useRecentSearches();

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);

    const userInitial = session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "G";
    const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "Guest Explorer";

    const handleItemClick = (query: string, isMobile = false) => {
        if (isMobile && onCloseMobile) {
            onCloseMobile();
        }
        if (onSelectSearch) {
            onSelectSearch(query);
        }
    };

    const handleNewSearchClick = (isMobile = false) => {
        if (isMobile && onCloseMobile) {
            onCloseMobile();
        }
        if (onNewSearch) {
            onNewSearch();
        }
    };

    const renderContent = (isMobile = false) => {
        const collapsed = !isMobile && isCollapsed;

        return (
            <div className="flex flex-col h-full overflow-hidden bg-slate-950/95">
                {/* ── Top Header Section ── */}
                <div className="p-3.5 border-b border-slate-800/70 flex items-center justify-between gap-2 shrink-0">
                    {!collapsed ? (
                        <>
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-cyan-400 flex items-center justify-center text-white text-xs font-black shadow-md shadow-purple-500/25 shrink-0">
                                    ✦
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="font-extrabold text-xs text-white tracking-tight truncate">
                                        Explore Studio
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-medium truncate">
                                        Research Workspace
                                    </span>
                                </div>
                            </div>

                            {/* Collapse or Close button */}
                            {isMobile ? (
                                <button
                                    type="button"
                                    onClick={onCloseMobile}
                                    className="w-8 h-8 rounded-xl hover:bg-slate-850 text-slate-400 hover:text-white flex items-center justify-center transition shrink-0"
                                    title="Close menu"
                                    aria-label="Close menu"
                                >
                                    ✕
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsCollapsed(true)}
                                    className="w-8 h-8 rounded-xl hover:bg-slate-850 text-slate-400 hover:text-white flex items-center justify-center transition shrink-0"
                                    title="Collapse sidebar"
                                    aria-label="Collapse sidebar"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="2" />
                                        <path d="M9 4v16" strokeWidth="2" />
                                        <path d="M14 10l-2 2m0 0l2 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </button>
                            )}
                        </>
                    ) : (
                        <div className="w-full flex justify-center">
                            {/* Expand button */}
                            <button
                                type="button"
                                onClick={() => setIsCollapsed(false)}
                                className="w-9 h-9 rounded-xl hover:bg-slate-850 text-slate-400 hover:text-white flex items-center justify-center transition"
                                title="Expand sidebar"
                                aria-label="Expand sidebar"
                            >
                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth="2" />
                                    <path d="M9 4v16" strokeWidth="2" />
                                    <path d="M12 10l2 2m0 0l-2 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Action Button (+ New search) ── */}
                <div className="p-3 border-b border-slate-800/70 shrink-0">
                    {!collapsed ? (
                        <button
                            type="button"
                            onClick={() => handleNewSearchClick(isMobile)}
                            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600/20 via-indigo-600/15 to-purple-900/10 hover:from-purple-600/30 hover:to-indigo-600/25 border border-purple-500/30 hover:border-purple-500/50 text-white text-xs font-semibold transition-all duration-200 group shadow-sm shadow-purple-950/20"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-purple-400 text-sm group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300">
                                    ✦
                                </span>
                                <span className="font-bold tracking-tight">New exploration</span>
                            </div>
                            <kbd className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-900/80 border border-slate-700/60 text-slate-400 font-mono">
                                ⌘K
                            </kbd>
                        </button>
                    ) : (
                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={() => handleNewSearchClick(isMobile)}
                                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600/20 to-indigo-600/20 hover:from-purple-600/30 hover:to-indigo-600/30 border border-purple-500/30 text-purple-400 flex items-center justify-center transition shadow-sm"
                                title="New exploration"
                            >
                                ✦
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Recents Section List ── */}
                {!collapsed ? (
                    <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 min-h-0 custom-scrollbar">
                        <div className="flex items-center justify-between px-2 pb-2">
                            <div className="flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    Recents
                                </span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-850 text-slate-400 font-mono font-bold">
                                    {recentSearches.length}
                                </span>
                            </div>
                            {recentSearches.length > 0 && (
                                <button
                                    type="button"
                                    onClick={clearAllSearches}
                                    className="text-[10px] font-medium text-slate-500 hover:text-rose-400 transition flex items-center gap-1"
                                    title="Clear all search history"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>

                        {recentSearches.length === 0 ? (
                            <div className="px-3 py-8 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
                                <span className="text-xl opacity-40">🕒</span>
                                <span>No recent explorations yet</span>
                            </div>
                        ) : (
                            recentSearches.map((item: RecentSearchItem) => {
                                const isActive = currentQuery && item.query.toLowerCase() === currentQuery.toLowerCase();
                                return (
                                    <div
                                        key={item.id}
                                        className={`group relative flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-all duration-150 cursor-pointer ${
                                            isActive
                                                ? "bg-purple-950/40 border border-purple-500/40 text-white font-semibold shadow-sm shadow-purple-950/30"
                                                : "text-slate-300 hover:bg-slate-900/80 hover:text-white border border-transparent hover:border-slate-800/60"
                                        }`}
                                        onClick={() => handleItemClick(item.query, isMobile)}
                                    >
                                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-1.5">
                                            <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] shrink-0 ${
                                                isActive ? "bg-purple-500/20 text-purple-300" : "bg-slate-850 text-slate-400 group-hover:text-slate-200"
                                            }`}>
                                                💬
                                            </span>
                                            <span className="truncate flex-1 text-xs" title={item.query}>
                                                {item.query}
                                            </span>
                                        </div>

                                        {/* Hover delete button */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeSearch(item.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition shrink-0"
                                            title="Remove from history"
                                            aria-label="Remove search"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto py-2 flex flex-col items-center space-y-1.5">
                        {recentSearches.slice(0, 8).map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleItemClick(item.query, isMobile)}
                                className="w-10 h-10 rounded-xl hover:bg-slate-850 text-slate-400 hover:text-white flex items-center justify-center text-xs transition border border-transparent hover:border-slate-800"
                                title={item.query}
                            >
                                💬
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Bottom Section: Profile & Settings ── */}
                <div className="p-3 border-t border-slate-800/70 bg-slate-950/95 mt-auto shrink-0">
                    {!collapsed ? (
                        session?.user ? (
                            <div
                                onClick={() => setSettingsModalOpen(true)}
                                className="flex items-center justify-between gap-2.5 p-2 rounded-2xl bg-slate-900/70 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 cursor-pointer transition-all duration-200 group shadow-md"
                                title="Open Profile & Settings"
                            >
                                {/* Profile Info */}
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    <div className="relative shrink-0">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-purple-600/30 group-hover:scale-105 transition-transform">
                                            {userInitial}
                                        </div>
                                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-xs" />
                                    </div>
                                    <div className="min-w-0 flex-1 flex flex-col justify-center">
                                        <span className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                                            {userName}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium truncate">
                                            {(session.user as any)?.role === 'ADMIN' ? 'Super Admin' : (session.user as any)?.email || 'Active Account'}
                                        </span>
                                    </div>
                                </div>

                                {/* Settings Gear Icon (⚙) at the far right */}
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSettingsModalOpen(true);
                                    }}
                                    className="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-400 group-hover:text-white flex items-center justify-center transition-all duration-300 group-hover:rotate-45 shrink-0"
                                    title="Settings & Preferences"
                                    aria-label="Settings"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                                        />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between gap-2 p-1">
                                <Link
                                    href="/login?redirect_to=/explore"
                                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-purple-600/20 to-indigo-600/20 hover:from-purple-600/30 hover:to-indigo-600/30 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 hover:text-white text-xs font-bold transition-all shadow-sm"
                                >
                                    <span>Sign in to account</span>
                                    <span className="text-xs">→</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setSettingsModalOpen(true)}
                                    className="w-9 h-9 rounded-xl hover:bg-slate-900 border border-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition shrink-0"
                                    title="Settings & Preferences"
                                    aria-label="Settings"
                                >
                                    ⚙
                                </button>
                            </div>
                        )
                    ) : (
                        session?.user ? (
                            <div className="flex flex-col items-center space-y-2">
                                <button
                                    type="button"
                                    onClick={() => setSettingsModalOpen(true)}
                                    className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-purple-600/30 hover:scale-110 transition-transform"
                                    title={`${userName} - Click for Settings`}
                                >
                                    {userInitial}
                                    <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSettingsModalOpen(true)}
                                    className="w-8 h-8 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-white flex items-center justify-center transition"
                                    title="Settings & Preferences"
                                >
                                    ⚙
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center space-y-2">
                                <Link
                                    href="/login?redirect_to=/explore"
                                    className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 flex items-center justify-center text-xs font-bold transition border border-purple-500/30"
                                    title="Sign In"
                                >
                                    🔑
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setSettingsModalOpen(true)}
                                    className="w-8 h-8 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-white flex items-center justify-center transition"
                                    title="Settings & Preferences"
                                >
                                    ⚙
                                </button>
                            </div>
                        )
                    )}
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Desktop Docked Sidebar (on LEFT side) */}
            <aside
                aria-label="Recent Searches & Settings Sidebar"
                className={`transition-all duration-300 ease-in-out border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-xl hidden md:flex flex-col z-30 shrink-0 select-none ${
                    isCollapsed ? "w-16" : "w-[290px] sm:w-[310px]"
                } ${className}`}
            >
                {renderContent(false)}
            </aside>

            {/* Mobile Slide-over Drawer (slides from LEFT) */}
            {isOpenMobile && (
                <div className="fixed inset-0 z-50 md:hidden flex justify-start">
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onCloseMobile} />
                    <aside
                        aria-label="Recent Searches & Settings Sidebar"
                        className="relative w-[310px] max-w-[85vw] h-full bg-slate-950 border-r border-slate-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200"
                    >
                        {renderContent(true)}
                    </aside>
                </div>
            )}

            {/* Quick Settings Modal */}
            <QuickSettingsModal
                isOpen={settingsModalOpen}
                onClose={() => setSettingsModalOpen(false)}
            />
        </>
    );
}

// Backward-compatible alias
export const GeminiRightSidebar = GeminiSidebar;
export default GeminiSidebar;
