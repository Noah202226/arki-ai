"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, CheckSquare, Settings, Loader2 } from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();

  const navItems = [
    { href: "/financials", icon: Wallet, label: "Financials" },
    { href: "/tasks", icon: CheckSquare, label: "Daily System" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="flex min-h-screen bg-[#fcfaf7] text-slate-800 antialiased font-sans">
      {/* SIDEBAR - Desktop */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-r border-[#e5dec9]/40 p-6 shrink-0 justify-between">
        <div className="flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="w-9 h-9 bg-[#ff6b35] rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-[#ff6b35]/25">
              A
            </div>
            <div>
              <span className="text-xl font-extrabold text-[#1a1a2e] tracking-tight">
                Arki<span className="text-[#ff6b35]">.</span>
              </span>
              <span className="block text-[9px] font-bold tracking-[0.1em] text-slate-400 uppercase">
                Assistant Hub
              </span>
            </div>
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
                      ? "bg-[#ff6b35]/8 text-[#ff6b35] border-[#ff6b35]/10"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-[#ff6b35]" : "text-slate-400 group-hover:text-slate-600")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Area */}
        <div className="border-t border-[#e5dec9]/40 pt-4 flex items-center justify-between">
          {isLoaded ? (
            <div className="flex items-center gap-3 w-full">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-9 h-9 rounded-xl border border-slate-100",
                  },
                }}
              />
              <div className="flex flex-col truncate">
                <span className="text-sm font-bold text-[#1a1a2e] truncate">
                  {user?.fullName || "User Account"}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {user?.primaryEmailAddress?.emailAddress}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 w-full animate-pulse">
              <div className="w-9 h-9 bg-slate-100 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-slate-100 rounded w-2/3" />
                <div className="h-2.5 bg-slate-100 rounded w-1/2" />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Page Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 md:pb-0">
        <main className="flex-1">{children}</main>
      </div>

      {/* MOBILE NAV - Bottom Floating Bar */}
      <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md border border-[#e5dec9]/40 shadow-lg px-4 py-2 flex justify-around items-center rounded-2xl z-50">
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
                  ? "text-[#ff6b35] font-bold bg-[#ff6b35]/8"
                  : "text-slate-400 font-medium"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] uppercase tracking-wider">{item.label.split(" ")[0]}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
