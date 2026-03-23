"use client";

import { UserButton } from "@clerk/nextjs";
import { Authenticated } from "convex/react";
import Link from "next/link";
import {
  Wallet,
  CheckSquare,
  ShieldCheck,
  LayoutDashboard,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-blue-600">My Assistant</h1>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link
            href="/financials"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-200"
          >
            <Wallet className="w-5 h-5" /> Financials
          </Link>
          <Link
            href="/tasks"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-200"
          >
            <CheckSquare className="w-5 h-5" /> Tasks
          </Link>
          <Link
            href="/credentials"
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-200 opacity-50"
          >
            <ShieldCheck className="w-5 h-5" /> Credentials (Soon)
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <Authenticated>
            <div className="flex items-center gap-3 px-2">
              <UserButton />
              <span className="text-sm font-medium">My Profile</span>
            </div>
          </Authenticated>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
