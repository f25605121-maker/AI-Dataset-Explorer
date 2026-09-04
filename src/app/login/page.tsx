"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";

function LoginContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const callbackUrl = searchParams?.get("callbackUrl") || "/explore";
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    return (
        <main className="min-h-screen bg-page text-primary flex items-center justify-center p-4 relative overflow-hidden">
            {/* Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent opacity-15 blur-[140px]" />
                <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border-subtle)_1px,transparent_1px),linear-gradient(to_bottom,var(--border-subtle)_1px,transparent_1px)] bg-[size:32px_32px] opacity-15" />
            </div>

            <div className="relative w-full max-w-md z-10 space-y-6">
                
                {/* Brand Header */}
                <Link href="/" className="flex justify-center items-center gap-3 group transition-transform hover:scale-105">
                    <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-white font-bold text-base shadow-accent">
                        ✦
                    </div>
                    <span className="text-xl font-bold tracking-tight text-primary">
                        AI Dataset Explorer
                    </span>
                </Link>

                {/* Glassmorphic Card */}
                <div className="rounded-3xl border border-strong glass-card p-7 sm:p-8 shadow-2xl space-y-6">
                    <div className="text-center space-y-1">
                        <h1 className="text-2xl font-black text-primary">Welcome Back</h1>
                        <p className="text-xs text-muted">Sign in to your account to continue exploring</p>
                    </div>

                    <form
                        className="space-y-4"
                        onSubmit={async (e) => {
                            e.preventDefault();
                            setError(null);
                            setIsLoading(true);
                            try {
                                const res = await signIn("credentials", { redirect: false, email, password });
                                if (res && (res as any).error) {
                                    const errorCode = (res as any).error;
                                    const errorMessages: Record<string, string> = {
                                        CredentialsSignin: "Invalid email or password. Please check your credentials and try again.",
                                        SessionRequired: "Please sign in to access this page.",
                                        OAuthSignin: "There was a problem signing in with your provider. Please try again.",
                                        OAuthCallback: "There was a problem verifying your account. Please try again.",
                                        OAuthCreateAccount: "Could not create your account. Please try again.",
                                        EmailCreateAccount: "Could not create your account. Please try again.",
                                        Callback: "An authentication error occurred. Please try again.",
                                        OAuthAccountNotLinked: "This email is already linked to another sign-in method.",
                                        EmailSignin: "The sign-in email could not be sent. Please try again.",
                                        Default: "Something went wrong. Please try again.",
                                    };
                                    setError(errorMessages[errorCode] || errorMessages.Default);
                                } else {
                                    router.push(callbackUrl);
                                }
                            } catch {
                                setError("Unable to connect. Please check your internet connection and try again.");
                            } finally {
                                setIsLoading(false);
                            }
                        }}
                    >
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2" htmlFor="email">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                className="w-full rounded-2xl border border-subtle bg-input px-4 py-3 text-sm text-primary outline-none focus:border-accent transition shadow-sm"
                                placeholder="researcher@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted" htmlFor="password">
                                    Password
                                </label>
                                <span className="text-xs text-muted">Min. 8 chars</span>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    className="w-full rounded-2xl border border-subtle bg-input pl-4 pr-16 py-3 text-sm text-primary outline-none focus:border-accent transition shadow-sm"
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-3 text-xs font-bold text-muted hover:text-primary transition"
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-2xl bg-accent px-4 py-3.5 text-sm font-bold text-white shadow-accent transition hover:brightness-110 active:scale-95 disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                    <span>Signing In...</span>
                                </>
                            ) : (
                                <span>Sign In →</span>
                            )}
                        </button>
                    </form>

                    {error && (
                        <div className="flex items-start gap-2.5 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300">
                            <span className="text-base leading-none">⚠</span>
                            <p>{error}</p>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-faint">
                        <div className="h-px flex-1 bg-border-subtle" />
                        <span className="px-3">OR CONTINUE WITH</span>
                        <div className="h-px flex-1 bg-border-subtle" />
                    </div>

                    <div>
                        <button
                            onClick={() => signIn("google", { callbackUrl })}
                            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-subtle bg-card-solid hover:bg-card-hover px-4 py-3 text-xs sm:text-sm font-bold text-primary transition shadow-sm"
                        >
                            <span className="text-base">G</span> Continue with Google
                        </button>
                    </div>
                </div>

                <p className="text-center text-xs text-muted">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="font-bold text-primary hover:text-accent-to transition underline-offset-4 hover:underline">
                        Sign up for free
                    </Link>
                </p>
            </div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-page" />}>
            <LoginContent />
        </Suspense>
    );
}
