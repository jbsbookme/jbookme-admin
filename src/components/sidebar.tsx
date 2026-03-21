"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Shop", href: "/shop" },
  { label: "Barbers", href: "/barbers" },
  { label: "Services", href: "/services" },
  { label: "Gallery", href: "/gallery" },
  { label: "Bookings", href: "/bookings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 flex-col border-r border-white/10 bg-black/40 px-6 py-8 md:flex">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
          <span className="text-lg font-semibold">JB</span>
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/40">
            Admin
          </p>
          <p className="text-lg font-semibold text-white">JBookme</p>
        </div>
      </div>

      <nav className="mt-10 flex flex-col gap-2">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-emerald-400/20 text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                  : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-xs text-white/60">
        Administracion exclusiva para el equipo interno.
      </div>
    </aside>
  );
}
