"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStoredSession } from "@/lib/auth";

export function RedirectHome() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getStoredSession() ? "/dashboard" : "/login");
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="h-10 w-10 rounded-full border-2 border-slate-300 border-t-teal-600" />
    </main>
  );
}
