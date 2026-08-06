"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Wallet, CheckSquare, Settings, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserNavButton } from "./components/user-nav-button";
import { NotificationCenter } from "@/components/NotificationCenter";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();

  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen bg-[#fcfaf7] dark:bg-[#090d16] flex flex-col items-center justify-center p-6 text-slate-800 dark:text-slate-100 transition-colors duration-200">
        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-300">
          {/* Animated App Icon with Glowing Ring */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-[#ff6b35]/20 blur-xl animate-pulse" />
            <img
              src="/android-chrome-512x512.png"
              alt="Arki Icon"
              className="w-20 h-20 relative z-10 rounded-2xl shadow-2xl shadow-[#ff6b35]/30 animate-pulse duration-1000"
            />
            <div className="absolute -bottom-2 -right-2 z-20 bg-slate-900 dark:bg-slate-100 text-[#ff6b35] dark:text-[#ff6b35] p-1.5 rounded-full shadow-lg">
              <Loader2 className="w-4 h-4 animate-spin text-[#ff6b35]" />
            </div>
          </div>

          {/* Branded Title & Loading Message */}
          <div className="text-center space-y-1">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              Arki<span className="text-[#ff6b35]">.</span>
            </h2>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 animate-pulse">
              Initializing Assistant Hub...
            </p>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: "/financials", icon: Wallet, label: "Financials" },
    { href: "/tasks", icon: CheckSquare, label: "Daily System" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#fcfaf7] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 antialiased font-sans transition-colors duration-200 relative">
      {/* Top Accent Loading Indicator */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-[#ff6b35] animate-pulse shadow-md shadow-[#ff6b35]/50" />
      )}

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
      <aside className="hidden md:flex w-52 flex-col bg-white dark:bg-slate-900 border-r border-[#e5dec9]/40 dark:border-slate-800/80 p-4 shrink-0 justify-between h-screen sticky top-0 overflow-y-auto shadow-sm">
        <div className="flex flex-col space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-[#ff6b35] rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md shadow-[#ff6b35]/25 shrink-0">
                A
              </div>
              <div className="leading-tight">
                <span className="text-base font-extrabold text-[#1a1a2e] dark:text-slate-50 tracking-tight block">
                  Arki<span className="text-[#ff6b35]">.</span>
                </span>
                <span className="text-[8px] font-bold tracking-[0.1em] text-slate-400 dark:text-slate-500 uppercase block">
                  Assistant Hub
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (!isActive) setIsNavigating(true);
                  }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl font-extrabold text-xs transition-all duration-200 border border-transparent",
                    isActive
                      ? "bg-[#ff6b35]/10 text-[#ff6b35] border-[#ff6b35]/20 dark:bg-[#ff6b35]/20 dark:text-[#ff8555] shadow-xs"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-[#ff6b35] dark:text-[#ff8555]" : "text-slate-400 dark:text-slate-500")} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Area */}
        <div className="border-t border-[#e5dec9]/40 dark:border-slate-800 pt-3">
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
