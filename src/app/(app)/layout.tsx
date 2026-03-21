"use client";

import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { RequireAdmin } from "@/components/require-admin";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAdmin>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar />
          <main className="flex-1 space-y-8 px-6 py-8 md:px-10">
            {children}
          </main>
        </div>
      </div>
    </RequireAdmin>
  );
}
