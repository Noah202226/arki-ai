"use client";

import { useState, useEffect } from "react";
import { SidebarContent } from "./components/sidebar-content";
import { MobileNav } from "./components/mobile-nav"; // Siguraduhing tama ang path

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  // Pipigilan nito ang hydration mismatch sa pamamagitan ng paghihintay na mag-load sa client
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50/50">
      {/* DESKTOP SIDEBAR - Laging visible sa md pataas, no hydration issues dito */}
      <aside className="hidden md:flex flex-col w-64 border-r shrink-0 bg-card">
        <SidebarContent />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* MOBILE HEADER - Lalabas lang sa screens smaller than md */}
        <header className="flex md:hidden items-center justify-between p-4 border-b bg-card">
          <h2 className="font-bold text-orange-600">Arc Tech</h2>

          {/* Dito ang critical fix: I-render lang ang MobileNav kapag mounted na.
             Ito ay para hindi magreklamo ang Next.js kung may magbago sa HTML 
             attributes ng Sheet (Radix UI) pagdating sa browser.
          */}
          {mounted ? <MobileNav /> : <div className="w-10 h-10" />}
        </header>

        {/* MAIN SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-9xl mx-auto space-y-6">{children}</div>
        </div>
      </main>
    </div>
  );
}
