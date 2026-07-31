"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, CheckSquare, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserNavButton } from "./components/user-nav-button";
import { NotificationCenter } from "@/components/NotificationCenter";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: "/financials", icon: Wallet, label: "Financials" },
    { href: "/tasks", icon: CheckSquare, label: "Daily System" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#fcfaf7] dark:bg-slate-950 text-slate-800 dark:text-slate-100 antialiased font-sans transition-colors duration-200">
      {/* MOBILE TOP BAR */}
      <div className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-[#e5dec9]/40 dark:border-slate-800/80 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#ff6b35] rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm">
            A
          </div>
          <span className="text-lg font-extrabold text-[#1a1a2e] dark:text-slate-50 tracking-tight">
            Arki<span className="text-[#ff6b35]">.</span>
          </span>
        </div>
        <NotificationCenter />
      </div>

      {/* SIDEBAR - Desktop */}
      <aside className="hidden md:flex w-72 flex-col bg-white dark:bg-slate-900 border-r border-[#e5dec9]/40 dark:border-slate-800/80 p-6 shrink-0 justify-between h-screen sticky top-0 overflow-y-auto">
        <div className="flex flex-col">
          {/* Logo & Notification Bell */}
          <div className="flex items-center justify-between mb-10 px-1">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#ff6b35] rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-[#ff6b35]/25">
                A
              </div>
              <div>
                <span className="text-xl font-extrabold text-[#1a1a2e] dark:text-slate-50 tracking-tight">
                  Arki<span className="text-[#ff6b35]">.</span>
                </span>
                <span className="block text-[9px] font-bold tracking-[0.1em] text-slate-400 dark:text-slate-500 uppercase">
                  Assistant Hub
                </span>
              </div>
            </div>

            <NotificationCenter />
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 border border-transparent",
                    isActive
                      ? "bg-[#ff6b35]/10 text-[#ff6b35] border-[#ff6b35]/20 dark:bg-[#ff6b35]/20 dark:text-[#ff8555]"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-[#ff6b35] dark:text-[#ff8555]" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Area */}
        <div className="border-t border-[#e5dec9]/40 dark:border-slate-800 pt-4">
          <UserNavButton side="right" />
        </div>
      </aside>

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-0">
        <main className="flex-1">{children}</main>
      </div>

      {/* MOBILE NAV - Bottom Floating Bar */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-[#e5dec9]/40 dark:border-slate-800 shadow-lg px-4 py-2 flex justify-around items-center rounded-2xl z-50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-xl transition-all duration-200",
                isActive
                  ? "text-[#ff6b35] dark:text-[#ff8555] font-bold bg-[#ff6b35]/10 dark:bg-[#ff6b35]/20"
                  : "text-slate-400 dark:text-slate-500 font-medium"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] uppercase tracking-wider">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}

        {/* User avatar — opens UserNavButton dropdown upward */}
        <div className="relative">
          <UserNavButton side="top" compact />
        </div>
      </nav>
    </div>
  );
}
