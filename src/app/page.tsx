"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export default function Home() {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user && role === "admin") {
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [loading, user, role, router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-white/70">
        Preparando el panel...
      </div>
    </div>
  );
}
