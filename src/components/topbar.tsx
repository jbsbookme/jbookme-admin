"use client";

import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ThemeToggle } from "@/components/theme-toggle";

export function Topbar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-black/40 px-6 py-4">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
          JBookme Admin
        </p>
        <h1 className="text-2xl font-semibold text-white">Panel principal</h1>
      </div>
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <button
          type="button"
          onClick={() => signOut(auth)}
          className="rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:border-white/30 hover:text-white"
        >
          Cerrar sesion
        </button>
      </div>
    </header>
  );
}
