"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/context/ThemeContext";
import type { Theme, Accent } from "@/context/ThemeContext";

interface QuickSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function QuickSettingsModal({ isOpen, onClose }: QuickSettingsModalProps) {
    const { data: session } = useSession();
    const { theme, accent, setTheme, setAccent } = useTheme();

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const userInitial = session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "G";
    const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "Guest Explorer";
    const userEmail = session?.user?.email || "Sign in to sync your preferences";

    const accents: { id: Accent; label: string; preview: string }[] = [
        { id: "violet-cyan", label: "Violet Cyan", preview: "from-violet-500 to-cyan-500" },
        { id: "emerald", label: "Emerald", preview: "from-emerald-500 to-teal-400" },
        { id: "blue-violet", label: "Blue Violet", preview: "from-blue-500 to-indigo-500" },
        { id: "amber-rose", label: "Amber Rose", preview: "from-amber-500 to-rose-500" },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
            {/* Backdrop click */}
            <div className="fixed inset-0" onClick={onClose} />

            {/* Modal Box */}
            <div className="relative w-full max-w-md rounded-3xl border border-subtle bg-slate-900 shadow-2xl p-6 z-10 overflow-hidden space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-subtle pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center font-bold text-sm border border-purple-500/30">
                            ⚙
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-primary">Settings & Preferences</h3>
                            <p className="text-xs text-muted">Customize workspace and appearance</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-card hover:bg-card-hover border border-subtle text-muted hover:text-primary flex items-center justify-center transition"
                        aria-label="Close"
                    >
                        ✕
                    </button>
                </div>

                {/* Profile Summary Card (No Pro badge) */}
                <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-950/60 border border-subtle">
                    <div className="w-11 h-11 rounded-full bg-purple-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-lg shadow-purple-600/30">
                        {userInitial}
                    </div>
                    <div className="min-w-0 flex-1">
                        <span className="text-sm font-bold text-white block truncate">{userName}</span>
                        <p className="text-xs text-muted truncate mt-0.5">{userEmail}</p>
                    </div>
                </div>

                {/* Appearance Settings */}
                <div className="space-y-4">
                    {/* Theme Mode */}
                    <div>
                        <label className="text-xs font-semibold text-muted block mb-2">Theme Mode</label>
                        <div className="grid grid-cols-3 gap-2">
                            {(["dark", "light", "system"] as Theme[]).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTheme(t)}
                                    className={`py-2 px-3 rounded-xl text-xs font-semibold border capitalize transition ${
                                        theme === t
                                            ? "border-accent bg-accent/20 text-white font-bold"
                                            : "border-subtle bg-card hover:bg-card-hover text-secondary"
                                    }`}
                                >
                                    {t === "dark" ? "🌙 Dark" : t === "light" ? "☀️ Light" : "💻 System"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Accent Gradient */}
                    <div>
                        <label className="text-xs font-semibold text-muted block mb-2">Accent Gradient</label>
                        <div className="grid grid-cols-2 gap-2">
                            {accents.map((acc) => (
                                <button
                                    key={acc.id}
                                    type="button"
                                    onClick={() => setAccent(acc.id)}
                                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-medium transition ${
                                        accent === acc.id
                                            ? "border-accent bg-accent/20 text-white font-bold"
                                            : "border-subtle bg-card hover:bg-card-hover text-secondary"
                                    }`}
                                >
                                    <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${acc.preview} shrink-0`} />
                                    <span>{acc.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="pt-3 border-t border-subtle flex items-center justify-between gap-3">
                    <Link
                        href="/settings"
                        onClick={onClose}
                        className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                    >
                        <span>Open full settings</span>
                        <span>↗</span>
                    </Link>

                    {session ? (
                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition"
                        >
                            Sign Out
                        </button>
                    ) : (
                        <Link
                            href="/login"
                            onClick={onClose}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-primary hover:bg-card-hover border border-subtle transition"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default QuickSettingsModal;
