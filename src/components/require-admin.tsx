"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || role !== "admin")) {
      router.replace("/login");
    }
  }, [loading, user, role, router]);

  if (loading || !user || role !== "admin") {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-white/70">
          Verificando acceso...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
