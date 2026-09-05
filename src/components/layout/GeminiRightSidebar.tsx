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
            <div className="flex flex-col h-full overflow-hidden">
                {/* ── Top Header Section ── */}
                <div className="p-3 border-b border-slate-800/60 flex items-center justify-between gap-2 shrink-0">
                    {!collapsed ? (
                        <>
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-500 via-indigo-500 to-cyan-400 flex items-center justify-center text-white text-xs font-black shadow-sm shrink-0">
                                    ✦
                                </div>
                                <span className="font-bold text-sm text-white tracking-tight truncate">
                                    Gemini Explorer
                                </span>
                            </div>

                            {/* Collapse or Close button */}
                            {isMobile ? (
                                <button
                                    type="button"
                                    onClick={onCloseMobile}
                                    className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition shrink-0"
                                    title="Close menu"
                                    aria-label="Close menu"
                                >
                                    ✕
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => setIsCollapsed(true)}
                                    className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition shrink-0"
                                    title="Collapse sidebar (left)"
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
                                className="w-9 h-9 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
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
                <div className="p-3 border-b border-slate-800/60 shrink-0">
                    {!collapsed ? (
                        <button
                            type="button"
                            onClick={() => handleNewSearchClick(isMobile)}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition group shadow-sm"
                        >
                            <span className="text-base text-purple-400 group-hover:scale-110 transition-transform">
                                ✦
                            </span>
                            <span>New search</span>
                        </button>
                    ) : (
                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={() => handleNewSearchClick(isMobile)}
                                className="w-10 h-10 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-purple-400 flex items-center justify-center transition"
                                title="New search"
                            >
                                ✦
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Recents Section List ── */}
                {!collapsed ? (
                    <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1 min-h-0 custom-scrollbar">
                        <div className="flex items-center justify-between px-2 pb-1.5">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Recents
                            </span>
                            {recentSearches.length > 0 && (
                                <button
                                    type="button"
                                    onClick={clearAllSearches}
                                    className="text-[10px] text-slate-500 hover:text-rose-400 transition"
                                    title="Clear all search history"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {recentSearches.length === 0 ? (
                            <div className="px-3 py-6 text-center text-xs text-slate-500">
                                No recent searches yet
                            </div>
                        ) : (
                            recentSearches.map((item: RecentSearchItem) => {
                                const isActive = currentQuery && item.query.toLowerCase() === currentQuery.toLowerCase();
                                return (
                                    <div
                                        key={item.id}
                                        className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-xs transition cursor-pointer ${
                                            isActive
                                                ? "bg-slate-800 text-white font-semibold"
                                                : "text-slate-300 hover:bg-slate-900 hover:text-white"
                                        }`}
                                        onClick={() => handleItemClick(item.query, isMobile)}
                                    >
                                        <span className="truncate flex-1 pr-2" title={item.query}>
                                            {item.query}
                                        </span>

                                        {/* Hover delete button */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeSearch(item.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 rounded transition shrink-0"
                                            title="Delete search"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto py-2 flex flex-col items-center space-y-1">
                        {recentSearches.slice(0, 8).map((item) => (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleItemClick(item.query, isMobile)}
                                className="w-10 h-10 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs transition"
                                title={item.query}
                            >
                                💬
                            </button>
                        ))}
                    </div>
                )}

                {/* ── Bottom Section: Profile & Settings ── */}
                <div className="p-3 border-t border-slate-800/80 bg-slate-950/95 mt-auto shrink-0">
                    {!collapsed ? (
                        session?.user ? (
                            <div
                                onClick={() => setSettingsModalOpen(true)}
                                className="flex items-center justify-between gap-2.5 p-1.5 rounded-xl hover:bg-slate-900/80 cursor-pointer transition group"
                                title="Open Profile & Settings"
                            >
                                {/* Profile Info */}
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-md shadow-purple-600/30 group-hover:scale-105 transition-transform">
                                        {userInitial}
                                    </div>
                                    <div className="min-w-0 flex flex-col justify-center">
                                        <span className="text-xs font-bold text-white truncate group-hover:text-purple-300 transition-colors">
                                            {userName}
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
                                    className="w-8 h-8 rounded-xl hover:bg-slate-800 text-slate-400 group-hover:text-white flex items-center justify-center transition shrink-0"
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
                                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-semibold transition shadow-sm"
                                >
                                    <span>Sign in to account</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setSettingsModalOpen(true)}
                                    className="w-8 h-8 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition shrink-0"
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
                        )
                    ) : (
                        session?.user ? (
                            <div className="flex flex-col items-center space-y-2">
                                <button
                                    type="button"
                                    onClick={() => setSettingsModalOpen(true)}
                                    className="w-8 h-8 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-md shadow-purple-600/30 hover:scale-110 transition-transform"
                                    title={`${userName} - Click for Settings`}
                                >
                                    {userInitial}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSettingsModalOpen(true)}
                                    className="w-8 h-8 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
                                    title="Settings & Preferences"
                                >
                                    ⚙
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center space-y-2">
                                <Link
                                    href="/login?redirect_to=/explore"
                                    className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 flex items-center justify-center text-xs font-bold transition"
                                    title="Sign In"
                                >
                                    🔑
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setSettingsModalOpen(true)}
                                    className="w-8 h-8 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
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
                aria-label="Gemini Recent Searches & Settings Sidebar"
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
                        aria-label="Gemini Recent Searches & Settings Sidebar"
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
