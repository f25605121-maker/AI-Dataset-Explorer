"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export interface UseAuthGuardOptions {
    redirectTo?: string;
    requiredRole?: string;
}

/**
 * useAuthGuard
 * 
 * Defense-in-depth client-side route guard.
 * If the user's session expires or is missing on a protected view,
 * automatically redirects them to /login with the target route preserved
 * in the redirect_to query parameter.
 */
export function useAuthGuard(options: UseAuthGuardOptions = {}) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            const currentPath = typeof window !== "undefined"
                ? `${window.location.pathname}${window.location.search}`
                : "/settings";

            const isSafe = currentPath.startsWith("/") && !currentPath.startsWith("//") && !currentPath.includes("\\");
            const safeRedirect = isSafe ? currentPath : "/explore";

            const destination = options.redirectTo || `/login?redirect_to=${encodeURIComponent(safeRedirect)}`;
            router.push(destination);
        }
    }, [status, router, options.redirectTo]);

    return {
        session,
        status,
        isLoading: status === "loading",
        isAuthenticated: status === "authenticated",
    };
}
