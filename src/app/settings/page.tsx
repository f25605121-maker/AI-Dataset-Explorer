"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useState, useEffect, useCallback } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { useTheme } from "@/context/ThemeContext";
import type { Theme, Accent } from "@/context/ThemeContext";

// ── tiny toast hook ────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info";
interface Toast { id: number; msg: string; type: ToastType }

function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const show = (msg: string, type: ToastType = "success") => {
        const id = Date.now();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
    };
    return { toasts, show };
}

// ── usage interfaces ──────────────────────────────────────────────────────
interface RequestLogEntry {
    id: string;
    timestamp: number;
    dateKey: string;
    querySnippet: string;
    type: 'dataset' | 'general' | 'hybrid' | 'assistant' | 'other';
    tokensUsed: number;
    status: 'success' | 'rate_limited' | 'quota_exceeded';
}

interface DailyHistoryItem {
    date: string;
    label: string;
    count: number;
    tokens: number;
}

interface UserUsageData {
    identifier: string;
    planTier: string;
    planName: string;
    todayCount: number;
    dailyLimit: number;
    remainingRequestsToday: number;
    usedPercentage: number;
    totalLifetimeRequests: number;
    totalLifetimeTokens: number;
    dailyTokensToday: number;
    dailyTokenLimit: number;
    remainingTokensToday: number;
    resetHours: number;
    dailyHistory: DailyHistoryItem[];
    recentRequests: RequestLogEntry[];
    categoryBreakdown: {
        datasetSearches: number;
        generalAiInquiries: number;
        researchAndHybrid: number;
    };
    averageDailyRequests: number;
    memberSince: string;
}

// ── helpers ───────────────────────────────────────────────────────────────
const LS_BIO       = "settings_bio";
const LS_NAME      = "settings_display_name";
const LS_NOTIFS    = "settings_notifications";

function formatRelativeTime(timestamp: number): string {
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return "Just now";
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function useLocalState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [val, setVal] = useState<T>(initial);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        if (hydrated) return;
        try {
            const s = localStorage.getItem(key);
            if (s) setVal(JSON.parse(s) as T);
        } catch {}
        setHydrated(true);
    }, [key, hydrated]);

    useEffect(() => {
        if (!hydrated) return;
        try { localStorage.setItem(key, JSON.stringify(val)); }
        catch {}
    }, [key, val, hydrated]);

    return [val, setVal];
}

// ── component ─────────────────────────────────────────────────────────────
export default function SettingsPage() {
    const { session } = useAuthGuard();
    const { toasts, show }  = useToast();

    const [activeTab, setActiveTab] = useState("Profile");
    const { theme, accent, setTheme: applyTheme, setAccent: applyAccent } = useTheme();
    
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    // Usage & Requests state
    const [usage, setUsage] = useState<UserUsageData | null>(null);
    const [usageLoading, setUsageLoading] = useState(false);

    const fetchUsage = useCallback(async (quiet = false) => {
        if (!quiet) setUsageLoading(true);
        try {
            const res = await fetch('/api/user/usage');
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.usage) {
                    setUsage(data.usage);
                }
            }
        } catch (err) {
            console.error('Failed to load user usage analytics:', err);
        } finally {
            if (!quiet) setUsageLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsage(true);
    }, [fetchUsage]);

    // Profile state
    const [displayName, setDisplayName] = useLocalState<string>(LS_NAME, "");
    const [bio,         setBio]         = useLocalState<string>(LS_BIO,  "");
    const [isSaving,    setIsSaving]    = useState(false);

    useEffect(() => {
        if (session?.user?.name && !displayName) setDisplayName(session.user.name);
    }, [session?.user?.name]); // eslint-disable-line react-hooks/exhaustive-deps

    // Notifications state
    type NotifKey = "weekly" | "datasets" | "roadmaps" | "security" | "announcements";
    const defaultNotifs: Record<NotifKey, boolean> = {
        weekly: true, datasets: true, roadmaps: false, security: true, announcements: false,
    };
    const [notifs, setNotifs] = useLocalState<Record<NotifKey, boolean>>(LS_NOTIFS, defaultNotifs);
    const [notifSaving, setNotifSaving] = useState(false);

    // Password state
    const [pwCurrent, setPwCurrent] = useState("");
    const [pwNew,     setPwNew]     = useState("");
    const [pwConfirm, setPwConfirm] = useState("");
    const [pwSaving,  setPwSaving]  = useState(false);

    const userInitial = mounted ? (displayName?.charAt(0) || session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || "U") : "U";
    const userName    = mounted ? (displayName || session?.user?.name || "Anonymous") : "Anonymous";
    const userEmail   = mounted ? (session?.user?.email || "") : "";

    const tabs = [
        { id: "Profile",       icon: "👤", label: "Profile"            },
        { id: "Usage",         icon: "📊", label: "Usage & Requests"   },
        { id: "Appearance",    icon: "🎨", label: "Appearance"         },
        { id: "Notifications", icon: "🔔", label: "Notifications"      },
        { id: "API Keys",      icon: "🔑", label: "API Keys"           },
        { id: "Security",      icon: "🛡️", label: "Security"           },
    ];

    const handleProfileSave = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            show("Profile saved successfully");
        }, 800);
    };

    const handleRefreshUsage = async () => {
        await fetchUsage(false);
        show("Usage analytics refreshed", "success");
    };

    const handleExportUsage = () => {
        if (!usage) {
            show("No usage metrics available to export.", "info");
            return;
        }
        try {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(usage, null, 2));
            const downloadAnchor = document.createElement("a");
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `ai_dataset_explorer_usage_${new Date().toISOString().split("T")[0]}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            show("Usage analytics report exported as JSON", "success");
        } catch {
            show("Failed to export usage analytics.", "error");
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("Permanently delete your account? This cannot be undone.")) return;
        try {
            show("Account deletion requires server support. You have been signed out.", "info");
            await new Promise(r => setTimeout(r, 1500));
            signOut({ callbackUrl: "/login" });
        } catch {
            show("Failed to delete account. Please try again.", "error");
        }
    };

    const handleNotifSave = () => {
        setNotifSaving(true);
        setTimeout(() => {
            setNotifSaving(false);
            show("Notification preferences saved");
        }, 600);
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!pwCurrent) { show("Enter your current password", "error"); return; }
        if (pwNew.length < 8) { show("New password must be at least 8 characters", "error"); return; }
        if (pwNew !== pwConfirm) { show("New passwords do not match", "error"); return; }
        if (!userEmail) { show("No account email found", "error"); return; }

        setPwSaving(true);
        try {
            // Fetch CSRF token
            const csrfRes = await fetch('/api/csrf');
            const csrfData = await csrfRes.json();
            const csrfToken = csrfData.csrfToken || '';

            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-csrf-token': csrfToken,
                },
                body: JSON.stringify({
                    currentPassword: pwCurrent,
                    newPassword: pwNew,
                }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                show(data.message || "Password updated successfully. Other active sessions have been invalidated.", "success");
                setPwCurrent(""); setPwNew(""); setPwConfirm("");
            } else {
                show(data.error || "Failed to update password.", "error");
            }
        } catch {
            show("Network error while updating password.", "error");
        } finally {
            setPwSaving(false);
        }
    };

    const handleCopyKey = (key: string) => {
        navigator.clipboard.writeText(key)
            .then(() => show("API key copied to clipboard"))
            .catch(() => show("Copy failed — please copy manually", "error"));
    };

    const handleRevokeKey = () => {
        if (!window.confirm("Revoke this API key? It will stop working immediately.")) return;
        show("Key revocation requires server support (not yet implemented)", "info");
    };

    return (
        <main className="min-h-screen flex flex-col bg-page text-primary selection:bg-accent selection:text-white relative">
            {/* Toast container */}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id}
                        className={`flex items-center gap-3 px-5 py-3 rounded-2xl border text-sm font-semibold shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-3 fade-in duration-200 pointer-events-auto
                            ${t.type === "success" ? "status-badge-emerald bg-modal"
                            : t.type === "error"   ? "status-badge-rose bg-modal"
                            :                        "bg-modal border-subtle text-primary"}`}>
                        <span className="font-bold">{t.type === "success" ? "✓" : t.type === "error" ? "✕" : "ℹ"}</span>
                        <span>{t.msg}</span>
                    </div>
                ))}
            </div>

            {/* Navbar */}
            <Navbar variant="app" />

            {/* Sub-Header Toolbar */}
            <div className="border-b border-subtle bg-card-subtle px-4 sm:px-6 lg:px-8 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted">
                        <Link href="/" className="hover:text-primary transition">Home</Link>
                        <span>/</span>
                        <span className="text-primary font-semibold">Settings & Preferences</span>
                    </div>
                </div>
            </div>

            {/* Page Body */}
            <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
                
                {/* Heading */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-white text-lg shadow-accent">
                            ⚙
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary">Settings</h1>
                    </div>
                    <p className="text-sm text-muted ml-[52px]">Manage your account profile, appearance, notifications, and security keys.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-8">

                    {/* Sidebar Tabs (Positioned on Right Side) */}
                    <aside className="space-y-1 order-1 md:order-2">
                        <div className="rounded-3xl border border-subtle bg-card p-4 mb-4 flex items-center gap-3.5 shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-accent text-white font-black text-lg flex items-center justify-center shrink-0 shadow-accent-sm">
                                {userInitial}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-primary truncate">{userName}</p>
                                <p className="text-xs text-muted truncate">{userEmail || "Local session"}</p>
                            </div>
                        </div>

                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-2xl transition-all ${
                                    activeTab === tab.id
                                        ? "bg-accent text-white shadow-accent"
                                        : "text-muted hover:text-primary hover:bg-card-hover border border-transparent"
                                }`}
                            >
                                <span className="text-base">{tab.icon}</span>
                                <span>{tab.label}</span>
                                {activeTab === tab.id && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />}
                            </button>
                        ))}

                        <div className="pt-4 border-t border-subtle mt-4">
                            <button
                                onClick={() => signOut({ callbackUrl: "/login" })}
                                className="w-full text-left flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-2xl text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition"
                            >
                                <span className="text-base">🚪</span>
                                <span>Sign Out</span>
                            </button>
                        </div>
                    </aside>

                    {/* Main Settings Panel */}
                    <div className="space-y-6 min-w-0 order-2 md:order-1">

                        {/* ══ PROFILE ══ */}
                        {activeTab === "Profile" && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="rounded-3xl border border-subtle glass-card p-6 sm:p-8 shadow-xl">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-2 h-6 rounded-full bg-accent" />
                                        <h2 className="text-lg font-bold text-primary">Account Profile</h2>
                                    </div>

                                    <form className="space-y-6" onSubmit={handleProfileSave}>
                                        {/* Avatar row */}
                                        <div className="flex items-center gap-5 p-5 rounded-2xl bg-card-solid border border-subtle">
                                            <div className="relative shrink-0">
                                                <div className="w-20 h-20 rounded-2xl bg-accent flex items-center justify-center text-white font-black text-3xl shadow-accent">
                                                    {userInitial}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-page" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-primary mb-0.5">{userName}</p>
                                                <p className="text-xs text-muted mb-3">{userEmail || "Local developer profile"}</p>
                                                <label className="text-xs px-3.5 py-1.5 rounded-xl border border-subtle bg-card hover:bg-card-hover text-secondary font-semibold cursor-pointer inline-block transition">
                                                    Change Avatar
                                                    <input type="file" className="hidden" accept="image/*"
                                                        onChange={e => {
                                                            if (e.target.files?.[0]) {
                                                                show("Avatar upload requires cloud storage. File: " + e.target.files[0].name, "info");
                                                                e.target.value = "";
                                                            }
                                                        }} />
                                                </label>
                                            </div>
                                        </div>

                                        {/* Name + Email */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                                                    Display Name
                                                </label>
                                                <input
                                                    type="text"
                                                    value={displayName}
                                                    onChange={e => setDisplayName(e.target.value)}
                                                    className="w-full rounded-2xl border border-subtle bg-input px-4 py-3 text-sm text-primary outline-none focus:border-accent transition shadow-sm"
                                                    placeholder="Your display name"
                                                />
                                                <p className="text-[11px] text-faint mt-1.5">Saved locally in your browser.</p>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
                                                    Email Address
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="email"
                                                        value={userEmail}
                                                        disabled
                                                        className="w-full rounded-2xl border border-subtle bg-card-subtle px-4 py-3 text-sm text-muted outline-none cursor-not-allowed"
                                                    />
                                                    <span className="absolute right-3 top-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-card border border-subtle text-faint">
                                                        LOCKED
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-faint mt-1.5">Email cannot be changed.</p>
                                            </div>
                                        </div>

                                        {/* Bio */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">Bio</label>
                                            <textarea
                                                rows={3}
                                                value={bio}
                                                onChange={e => setBio(e.target.value)}
                                                className="w-full rounded-2xl border border-subtle bg-input px-4 py-3 text-sm text-primary outline-none focus:border-accent transition resize-none shadow-sm"
                                                placeholder="Tell us about yourself, research focus, or AI projects..."
                                            />
                                            <p className="text-[11px] text-faint mt-1">{bio.length}/300 characters</p>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-3 gap-4">
                                            {[
                                                { label: "Searches Today", value: usage ? `${usage.todayCount} / ${usage.dailyLimit}` : "0 / 50", icon: "⚡" },
                                                { label: "Total Requests", value: usage ? `${usage.totalLifetimeRequests}` : "0",                 icon: "📊" },
                                                { label: "Member Since",   value: usage?.memberSince ? (usage.memberSince.includes(',') ? usage.memberSince.split(',')[1]?.trim() : usage.memberSince) : "2026", icon: "📅" },
                                            ].map(({ label, value, icon }) => (
                                                <div key={label} className="rounded-2xl p-4 bg-card-solid border border-subtle text-center">
                                                    <div className="text-xl mb-1">{icon}</div>
                                                    <div className="text-base font-black text-primary truncate">{value}</div>
                                                    <div className="text-[11px] text-muted uppercase tracking-wider mt-0.5">{label}</div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Save */}
                                        <div className="flex justify-end items-center gap-4 pt-4 border-t border-subtle">
                                            <button
                                                type="submit"
                                                disabled={isSaving}
                                                className="px-6 py-2.5 rounded-2xl text-sm font-bold text-white bg-accent shadow-accent hover:brightness-110 active:scale-95 transition disabled:opacity-50"
                                            >
                                                {isSaving ? "Saving…" : "Save Changes"}
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Danger Zone */}
                                <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 sm:p-7 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-6 rounded-full bg-rose-500" />
                                        <h2 className="text-base font-bold text-rose-400">Danger Zone</h2>
                                    </div>
                                    <p className="text-xs sm:text-sm text-muted">
                                        Permanently delete your account and all associated preferences. This action cannot be undone.
                                    </p>
                                    <button
                                        onClick={handleDeleteAccount}
                                        className="text-xs px-4 py-2.5 rounded-xl border border-rose-500/30 text-status-rose hover:bg-rose-500/10 transition font-bold"
                                    >
                                        🗑 Delete Account
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ══ USAGE & REQUESTS ══ */}
                        {activeTab === "Usage" && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                {/* Header Card */}
                                <div className="rounded-3xl border border-subtle glass-card p-6 sm:p-8 shadow-xl space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-white text-lg shadow-accent">
                                                    📊
                                                </div>
                                                <div>
                                                    <h2 className="text-xl font-bold text-primary">Usage & Request Analytics</h2>
                                                    <p className="text-xs text-muted">Monitor your daily search quotas and lifetime cumulative request volume.</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2.5 self-start sm:self-auto">
                                            <button
                                                onClick={handleRefreshUsage}
                                                disabled={usageLoading}
                                                className="px-3.5 py-2 rounded-xl border border-subtle bg-card hover:bg-card-hover text-xs font-bold text-secondary flex items-center gap-2 transition disabled:opacity-50"
                                            >
                                                <span className={`text-sm ${usageLoading ? 'animate-spin inline-block' : ''}`}>🔄</span>
                                                <span>{usageLoading ? 'Syncing…' : 'Refresh'}</span>
                                            </button>
                                            <button
                                                onClick={handleExportUsage}
                                                className="px-3.5 py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-accent hover:brightness-110 active:scale-95 transition flex items-center gap-2"
                                            >
                                                <span>📥</span>
                                                <span>Export JSON</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* ── TWO MAIN WAYS (Hero Grid) ── */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* WAY 1: Daily Requests */}
                                        <div className="rounded-2xl p-5 sm:p-6 bg-card-solid border border-subtle flex flex-col justify-between relative overflow-hidden group hover:border-strong transition">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
                                            <div>
                                                <div className="flex items-center justify-between gap-2 mb-3">
                                                    <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                                        Way 1 · Daily Requests
                                                    </span>
                                                    <span className="text-xs font-semibold text-muted">
                                                        Resets in ~{usage?.resetHours ?? 24}h
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Searches in One Day (Today)</p>
                                                <div className="flex items-baseline gap-2 mb-3">
                                                    <span className="text-4xl sm:text-5xl font-black text-primary tracking-tight">
                                                        {usage?.todayCount ?? 0}
                                                    </span>
                                                    <span className="text-base font-semibold text-muted">
                                                        / {usage?.dailyLimit ?? 50} limit
                                                    </span>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="space-y-1.5 mb-4">
                                                    <div className="w-full h-2.5 rounded-full bg-card-subtle overflow-hidden border border-subtle">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${
                                                                (usage?.usedPercentage ?? 0) >= 90
                                                                    ? "bg-rose-500"
                                                                    : (usage?.usedPercentage ?? 0) >= 60
                                                                    ? "bg-amber-500"
                                                                    : "bg-gradient-to-r from-emerald-500 to-cyan-500"
                                                            }`}
                                                            style={{ width: `${Math.min(100, Math.max(4, usage?.usedPercentage ?? 0))}%` }}
                                                        />
                                                    </div>
                                                    <div className="flex justify-between text-[11px] text-muted font-medium">
                                                        <span>{usage?.usedPercentage ?? 0}% quota used today</span>
                                                        <span className="font-bold text-primary">{usage?.remainingRequestsToday ?? 50} remaining</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Daily Metadata Pills */}
                                            <div className="pt-3 border-t border-subtle grid grid-cols-2 gap-2 text-xs">
                                                <div className="rounded-xl p-2.5 bg-card-subtle border border-subtle/60">
                                                    <p className="text-[10px] text-muted uppercase font-bold">Daily Tokens</p>
                                                    <p className="text-xs font-bold text-primary mt-0.5">{usage?.dailyTokensToday?.toLocaleString() ?? 0} / {(usage?.dailyTokenLimit ?? 50000).toLocaleString()}</p>
                                                </div>
                                                <div className="rounded-xl p-2.5 bg-card-subtle border border-subtle/60">
                                                    <p className="text-[10px] text-muted uppercase font-bold">Active Tier</p>
                                                    <p className="text-xs font-bold text-accent-gradient mt-0.5 truncate">{usage?.planName || "Community Free"}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* WAY 2: Overall Total Requests */}
                                        <div className="rounded-2xl p-5 sm:p-6 bg-card-solid border border-subtle flex flex-col justify-between relative overflow-hidden group hover:border-strong transition">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
                                            <div>
                                                <div className="flex items-center justify-between gap-2 mb-3">
                                                    <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                                        Way 2 · Overall Requests
                                                    </span>
                                                    <span className="text-xs font-semibold text-muted">
                                                        Lifetime All-Time
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-muted uppercase tracking-wider mb-1">Total Requests Overall</p>
                                                <div className="flex items-baseline gap-2 mb-3">
                                                    <span className="text-4xl sm:text-5xl font-black text-primary tracking-tight">
                                                        {usage?.totalLifetimeRequests ?? 0}
                                                    </span>
                                                    <span className="text-base font-semibold text-muted">
                                                        all-time queries
                                                    </span>
                                                </div>

                                                <p className="text-xs text-muted leading-relaxed mb-4">
                                                    Total cumulative multi-source searches across Kaggle datasets, Hugging Face models, arXiv papers, and AI intelligence pipelines.
                                                </p>
                                            </div>

                                            {/* Overall Metadata Pills */}
                                            <div className="pt-3 border-t border-subtle grid grid-cols-2 gap-2 text-xs">
                                                <div className="rounded-xl p-2.5 bg-card-subtle border border-subtle/60">
                                                    <p className="text-[10px] text-muted uppercase font-bold">Lifetime Tokens</p>
                                                    <p className="text-xs font-bold text-primary mt-0.5">{usage?.totalLifetimeTokens ? usage.totalLifetimeTokens.toLocaleString() : 0} tokens</p>
                                                </div>
                                                <div className="rounded-xl p-2.5 bg-card-subtle border border-subtle/60">
                                                    <p className="text-[10px] text-muted uppercase font-bold">Daily Average</p>
                                                    <p className="text-xs font-bold text-primary mt-0.5">~{usage?.averageDailyRequests ?? 0} req / active day</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── 7-DAY SEARCH ACTIVITY BAR CHART ── */}
                                    <div className="rounded-2xl p-5 sm:p-6 bg-card-solid border border-subtle space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-bold text-primary">Recent 7-Day Activity Trend</h3>
                                                <p className="text-xs text-muted">Daily distribution of searches performed across the past week.</p>
                                            </div>
                                            <span className="text-xs font-bold text-accent-gradient hidden sm:inline-block">
                                                Active Session Window
                                            </span>
                                        </div>

                                        {/* Bars */}
                                        <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-6 pb-2 items-end min-h-[140px]">
                                            {(() => {
                                                const history = usage?.dailyHistory || [];
                                                const maxVal = Math.max(1, ...history.map(h => h.count));
                                                return history.map((item, idx) => {
                                                    const isToday = idx === history.length - 1;
                                                    const pct = Math.max(10, Math.round((item.count / maxVal) * 100));
                                                    return (
                                                        <div key={item.date} className="flex flex-col items-center gap-2 group">
                                                            {/* Count label */}
                                                            <span className={`text-[10px] font-bold transition ${
                                                                item.count > 0 ? 'text-primary font-black scale-105' : 'text-faint'
                                                            }`}>
                                                                {item.count}
                                                            </span>

                                                            {/* Bar container */}
                                                            <div className="w-full h-24 sm:h-28 rounded-xl bg-card-subtle flex items-end p-1 border border-subtle/40 group-hover:border-strong transition">
                                                                <div
                                                                    className={`w-full rounded-lg transition-all duration-300 ${
                                                                        isToday
                                                                            ? "bg-gradient-to-t from-accent to-cyan-400 shadow-accent-sm"
                                                                            : item.count > 0
                                                                            ? "bg-accent/60 group-hover:bg-accent/80"
                                                                            : "bg-transparent"
                                                                    }`}
                                                                    style={{ height: `${item.count > 0 ? pct : 6}%` }}
                                                                />
                                                            </div>

                                                            {/* Date label */}
                                                            <span className={`text-[10px] sm:text-[11px] font-semibold truncate ${
                                                                isToday ? 'text-accent font-bold' : 'text-muted'
                                                            }`}>
                                                                {item.label}
                                                            </span>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>

                                    {/* ── REQUEST CATEGORY BREAKDOWN ── */}
                                    <div className="rounded-2xl p-5 sm:p-6 bg-card-solid border border-subtle space-y-4">
                                        <h3 className="text-sm font-bold text-primary">Query Category Distribution</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {[
                                                {
                                                    label: "Dataset Discovery",
                                                    count: usage?.categoryBreakdown?.datasetSearches ?? 0,
                                                    icon: "📦",
                                                    desc: "Kaggle & Hugging Face datasets",
                                                    color: "bg-emerald-500",
                                                },
                                                {
                                                    label: "General AI & Concepts",
                                                    count: usage?.categoryBreakdown?.generalAiInquiries ?? 0,
                                                    icon: "🧠",
                                                    desc: "Direct explanations & architecture queries",
                                                    color: "bg-accent",
                                                },
                                                {
                                                    label: "Research & Benchmarks",
                                                    count: usage?.categoryBreakdown?.researchAndHybrid ?? 0,
                                                    icon: "📑",
                                                    desc: "Papers, hardware profiling & roadmaps",
                                                    color: "bg-cyan-500",
                                                },
                                            ].map(cat => {
                                                const total = (usage?.totalLifetimeRequests || 1);
                                                const percent = Math.round((cat.count / Math.max(1, total)) * 100);
                                                return (
                                                    <div key={cat.label} className="p-4 rounded-xl bg-card-subtle border border-subtle">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="text-lg">{cat.icon}</span>
                                                            <span className="text-xs font-bold text-primary">{cat.label}</span>
                                                        </div>
                                                        <div className="flex items-baseline justify-between mb-2">
                                                            <span className="text-lg font-black text-primary">{cat.count}</span>
                                                            <span className="text-xs text-muted">{percent}%</span>
                                                        </div>
                                                        <div className="w-full h-1.5 rounded-full bg-card overflow-hidden">
                                                            <div className={`h-full rounded-full ${cat.color}`} style={{ width: `${percent}%` }} />
                                                        </div>
                                                        <p className="text-[10px] text-faint mt-2">{cat.desc}</p>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* ── RECENT REQUEST ACTIVITY LOG ── */}
                                    <div className="rounded-2xl p-5 sm:p-6 bg-card-solid border border-subtle space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="text-sm font-bold text-primary">Recent Request History</h3>
                                                <p className="text-xs text-muted">Real-time log of your most recent search inquiries.</p>
                                            </div>
                                            <span className="text-xs text-muted font-mono">
                                                {usage?.recentRequests?.length || 0} recorded
                                            </span>
                                        </div>

                                        {(!usage?.recentRequests || usage.recentRequests.length === 0) ? (
                                            <div className="p-8 text-center rounded-2xl bg-card-subtle border border-dashed border-subtle">
                                                <span className="text-3xl block mb-2">🔍</span>
                                                <p className="text-sm font-bold text-primary">No recent queries yet</p>
                                                <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                                                    Head over to Explore Studio to search datasets, fine-tuned models, or AI concepts and view live activity here.
                                                </p>
                                                <Link
                                                    href="/explore"
                                                    className="inline-block mt-4 text-xs font-bold px-4 py-2 rounded-xl bg-accent text-white shadow-accent hover:brightness-110 transition"
                                                >
                                                    Open Explore Studio →
                                                </Link>
                                            </div>
                                        ) : (
                                            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                                                {usage.recentRequests.map(req => (
                                                    <div
                                                        key={req.id}
                                                        className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-card-subtle border border-subtle hover:border-strong transition"
                                                    >
                                                        <div className="min-w-0 flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-sm shrink-0">
                                                                {req.type === 'dataset' ? '📦' : req.type === 'general' ? '🧠' : '📑'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-primary truncate max-w-md">
                                                                    {req.querySnippet || 'Dataset search inquiry'}
                                                                </p>
                                                                <div className="flex items-center gap-2 mt-0.5">
                                                                    <span className="text-[10px] text-muted">{formatRelativeTime(req.timestamp)}</span>
                                                                    <span className="text-[10px] text-faint">·</span>
                                                                    <span className="text-[10px] uppercase font-bold text-accent-gradient">
                                                                        {req.type === 'dataset' ? 'Dataset Search' : req.type === 'general' ? 'General AI' : req.type}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="text-[11px] font-mono text-muted px-2 py-0.5 rounded-md bg-card border border-subtle">
                                                                {req.tokensUsed} tokens
                                                            </span>
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                                                ✓ Success
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ══ APPEARANCE ══ */}
                        {activeTab === "Appearance" && (
                            <div className="rounded-3xl border border-subtle glass-card p-6 sm:p-8 shadow-xl space-y-8 animate-in fade-in duration-200">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-2 h-6 rounded-full bg-accent" />
                                        <h2 className="text-lg font-bold text-primary">Appearance & Theme</h2>
                                    </div>
                                    <p className="text-sm text-muted">Customise the look, theme, and color accents of your workspace.</p>
                                </div>

                                {/* Theme Mode */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-3">Theme Mode</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { id: "dark",   label: "Dark Mode",   bg: "#050811" },
                                            { id: "light",  label: "Light Mode",  bg: "#f8fafc" },
                                            { id: "system", label: "System Sync", bg: "linear-gradient(135deg,#050811 50%,#f8fafc 50%)" },
                                        ].map(t => (
                                            <button
                                                key={t.id}
                                                onClick={() => { applyTheme(t.id as Theme); show(`Theme set to ${t.label}`); }}
                                                className={`rounded-2xl p-4 border text-center transition-all ${
                                                    theme === t.id
                                                        ? "border-accent bg-accent-subtle shadow-accent-sm"
                                                        : "border-subtle bg-card-solid hover:border-strong"
                                                }`}
                                            >
                                                <div className="w-full h-12 rounded-xl mb-2.5 border border-subtle" style={{ background: t.bg }} />
                                                <span className={`text-xs font-bold ${theme === t.id ? "text-accent-to" : "text-secondary"}`}>{t.label}</span>
                                                {theme === t.id && <span className="block text-[10px] text-accent-gradient font-bold mt-0.5">Active</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Accent Color */}
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-3">Accent Color</label>
                                    <div className="flex gap-4 flex-wrap">
                                        {[
                                            { id: "violet-cyan",  color: "linear-gradient(135deg,#8B5CF6,#06B6D4)", label: "Violet / Cyan"  },
                                            { id: "emerald",      color: "linear-gradient(135deg,#10B981,#06B6D4)", label: "Emerald / Cyan" },
                                            { id: "amber-rose",   color: "linear-gradient(135deg,#F59E0B,#EF4444)", label: "Amber / Rose"    },
                                            { id: "blue-violet",  color: "linear-gradient(135deg,#3B82F6,#8B5CF6)", label: "Blue / Violet"   },
                                        ].map(a => (
                                            <button
                                                key={a.id}
                                                onClick={() => { applyAccent(a.id as Accent); show(`Accent set to ${a.label}`); }}
                                                title={a.label}
                                                className={`w-12 h-12 rounded-2xl border-2 transition-all flex items-center justify-center ${
                                                    accent === a.id
                                                        ? "border-primary scale-110 shadow-accent ring-2 ring-accent"
                                                        : "border-subtle hover:scale-105 opacity-80 hover:opacity-100"
                                                }`}
                                                style={{ background: a.color }}
                                            >
                                                {accent === a.id && <span className="text-white text-sm font-black">✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-[11px] text-faint mt-3">
                                        Your theme and accent selection updates dynamically across all pages and persist in browser storage.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* ══ NOTIFICATIONS ══ */}
                        {activeTab === "Notifications" && (
                            <div className="rounded-3xl border border-subtle glass-card p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in duration-200">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="w-2 h-6 rounded-full bg-accent" />
                                        <h2 className="text-lg font-bold text-primary">Notification Preferences</h2>
                                    </div>
                                    <p className="text-sm text-muted">
                                        Configure what announcements, new dataset alerts, and security digests you receive.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {([
                                        { key: "weekly",        label: "Weekly Intelligence Digest", desc: "Curated weekly digest of trending datasets and fine-tuned models."   },
                                        { key: "datasets",      label: "New Dataset Match Alerts",   desc: "Alerts when new datasets matching your interest domains appear."     },
                                        { key: "roadmaps",      label: "Roadmap Updates",            desc: "Notifications for new AI domain implementation guides."             },
                                        { key: "security",      label: "Security & Account Alerts",  desc: "Critical authentication and security notifications."                 },
                                        { key: "announcements", label: "Product Announcements",      desc: "Major feature releases and toolchain updates."                      },
                                    ] as const).map(item => (
                                        <div key={item.key} className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-card-solid border border-subtle">
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-primary">{item.label}</p>
                                                <p className="text-xs text-muted mt-0.5 leading-relaxed">{item.desc}</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={notifs[item.key]}
                                                    onChange={e => setNotifs(prev => ({ ...prev, [item.key]: e.target.checked }))}
                                                />
                                                <div className="w-11 h-6 bg-card-subtle rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent border border-subtle" />
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <button
                                        onClick={handleNotifSave}
                                        disabled={notifSaving}
                                        className="px-6 py-2.5 rounded-2xl text-sm font-bold text-white bg-accent shadow-accent hover:brightness-110 active:scale-95 transition disabled:opacity-50"
                                    >
                                        {notifSaving ? "Saving…" : "Save Preferences"}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ══ API KEYS ══ */}
                        {activeTab === "API Keys" && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="rounded-3xl border border-subtle glass-card p-6 sm:p-8 shadow-xl space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-6 rounded-full bg-amber-400" />
                                            <h2 className="text-lg font-bold text-primary">API Keys</h2>
                                        </div>
                                        <button
                                            onClick={() => show("Key generation requires a server-side /api/keys endpoint (not yet implemented)", "info")}
                                            className="text-xs px-4 py-2 rounded-xl bg-accent text-white font-bold shadow-accent hover:brightness-110 transition"
                                        >
                                            + Generate Key
                                        </button>
                                    </div>
                                    <p className="text-sm text-muted">
                                        Use programmatic keys to query the discovery endpoints from your Python scripts or pipeline runners.
                                    </p>

                                    <div className="space-y-3">
                                        {[
                                            { name: "Production Key", key: "sk_prod_*********************", created: "Aug 2026", used: "Just now" },
                                        ].map((k, i) => (
                                            <div key={i} className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-card-solid border border-subtle">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-bold text-primary">{k.name}</span>
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Active</span>
                                                    </div>
                                                    <p className="text-xs font-mono text-muted">{k.key}</p>
                                                    <p className="text-[11px] text-faint mt-1">Created {k.created} · Last used {k.used}</p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        onClick={() => handleCopyKey(k.key)}
                                                        className="text-xs px-3 py-1.5 rounded-xl border border-subtle bg-card hover:bg-card-hover text-secondary font-semibold transition"
                                                    >
                                                        Copy
                                                    </button>
                                                    <button
                                                        onClick={handleRevokeKey}
                                                        className="text-xs px-3 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 font-semibold transition"
                                                    >
                                                        Revoke
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ══ SECURITY ══ */}
                        {activeTab === "Security" && (
                            <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="rounded-3xl border border-subtle glass-card p-6 sm:p-8 shadow-xl space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-6 rounded-full bg-accent" />
                                        <h2 className="text-lg font-bold text-primary">Change Password</h2>
                                    </div>

                                    <form onSubmit={handlePasswordChange} className="space-y-5">
                                        {[
                                            { label: "Current Password", val: pwCurrent, setter: setPwCurrent, placeholder: "Your current password"  },
                                            { label: "New Password",     val: pwNew,     setter: setPwNew,     placeholder: "Min. 8 characters"       },
                                            { label: "Confirm Password", val: pwConfirm, setter: setPwConfirm, placeholder: "Repeat your new password" },
                                        ].map(f => (
                                            <div key={f.label}>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">{f.label}</label>
                                                <input
                                                    type="password"
                                                    value={f.val}
                                                    onChange={e => f.setter(e.target.value)}
                                                    placeholder={f.placeholder}
                                                    className="w-full rounded-2xl border border-subtle bg-input px-4 py-3 text-sm text-primary outline-none focus:border-accent transition shadow-sm"
                                                />
                                            </div>
                                        ))}

                                        {pwNew.length > 0 && (
                                            <div className="space-y-1.5">
                                                <div className="flex gap-1.5">
                                                    {[1,2,3,4].map(n => (
                                                        <div key={n} className={`flex-1 h-1.5 rounded-full transition-all ${
                                                            pwNew.length >= n * 3
                                                                ? n <= 1 ? "bg-rose-500"
                                                                : n <= 2 ? "bg-amber-500"
                                                                : n <= 3 ? "bg-cyan-500"
                                                                :          "bg-emerald-500"
                                                                : "bg-card-subtle"}`} />
                                                    ))}
                                                </div>
                                                <p className="text-[11px] text-muted">
                                                    {pwNew.length < 4 ? "Too short" : pwNew.length < 7 ? "Weak" : pwNew.length < 10 ? "Fair" : "Strong password"}
                                                    {pwNew !== pwConfirm && pwConfirm.length > 0 && <span className="text-rose-400 ml-3">Passwords do not match</span>}
                                                </p>
                                            </div>
                                        )}

                                        <div className="pt-2 flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={pwSaving}
                                                className="px-6 py-2.5 rounded-2xl text-sm font-bold text-white bg-accent shadow-accent hover:brightness-110 active:scale-95 transition disabled:opacity-50"
                                            >
                                                {pwSaving ? "Updating…" : "Update Password"}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </main>
    );
}
