"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BenchmarkPage from "@/app/benchmark/page";

function SearchRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const q = searchParams?.get("q");

    useEffect(() => {
        if (q) {
            router.replace(`/benchmark?q=${encodeURIComponent(q)}`);
        }
    }, [q, router]);

    return <BenchmarkPage />;
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-page" />}>
            <SearchRedirect />
        </Suspense>
    );
}
