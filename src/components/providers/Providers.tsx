"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/context/ThemeContext";
import { SearchSessionProvider } from "@/context/SearchSessionContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider refetchOnWindowFocus={false}>
            <ThemeProvider>
                <SearchSessionProvider>
                    {children}
                </SearchSessionProvider>
            </ThemeProvider>
        </SessionProvider>
    );
}
