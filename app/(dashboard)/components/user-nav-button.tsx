"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, ChevronsUpDown, SunMoon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

interface UserNavButtonProps {
  /** Called after logout action is triggered (e.g. to close a mobile sheet) */
  onAction?: () => void;
  /** Which side the dropdown opens toward */
  side?: "top" | "right" | "bottom" | "left";
  /** Compact mode: just avatar + label, for mobile bottom nav */
  compact?: boolean;
}

export function UserNavButton({ onAction, side = "top", compact = false }: UserNavButtonProps) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  const handleLogout = async () => {
    onAction?.();
    await signOut({ redirectUrl: "/" });
  };

  const initials =
    user?.fullName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase() ?? "??";

  const avatar = isLoaded && user?.imageUrl ? (
    <img
      src={user.imageUrl}
      alt={user.fullName ?? "User"}
      className={compact ? "w-7 h-7 rounded-lg object-cover border border-slate-100 dark:border-slate-800" : "w-8 h-8 rounded-lg object-cover border border-slate-100 dark:border-slate-800 shrink-0"}
    />
  ) : (
    <div className={compact
      ? "w-7 h-7 rounded-lg bg-gradient-to-br from-[#ff6b35] to-orange-400 flex items-center justify-center text-white text-[10px] font-bold"
      : "w-8 h-8 rounded-lg bg-gradient-to-br from-[#ff6b35] to-orange-400 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm shadow-[#ff6b35]/20"
    }>
      {isLoaded ? initials : ""}
    </div>
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          /* ── Compact trigger: avatar + "Me" label, styled like other bottom nav tabs ── */
          <button className="flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-xl text-slate-400 hover:text-[#ff6b35] dark:hover:text-[#ff8555] transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]/40">
            {avatar}
            <span className="text-[9px] uppercase tracking-wider font-medium">Me</span>
          </button>
        ) : (
          /* ── Full trigger: avatar + name/email + chevron, for desktop sidebar ── */
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all duration-200 group outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]/40">
            {avatar}

            {/* Name + email */}
            <div className="flex flex-col text-left truncate flex-1 min-w-0">
              {isLoaded ? (
                <>
                  <span className="text-sm font-bold text-[#1a1a2e] dark:text-slate-100 truncate leading-tight">
                    {user?.fullName || "User Account"}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                    {user?.primaryEmailAddress?.emailAddress}
                  </span>
                </>
              ) : (
                <div className="space-y-1 animate-pulse">
                  <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-24" />
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-32" />
                </div>
              )}
            </div>

            {/* Chevron indicator */}
            <ChevronsUpDown className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 shrink-0 transition-colors" />
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        side={side}
        align="end"
        sideOffset={8}
        className="w-72 rounded-2xl p-2 shadow-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
      >
        {/* Profile header */}
        <DropdownMenuLabel className="p-0">
          <div className="flex items-center gap-3 px-3 py-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl mb-2">
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.fullName ?? "User"}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ff6b35] to-orange-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {initials}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-[#1a1a2e] dark:text-slate-100 truncate">
                {user?.fullName || "User Account"}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-400 truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        {/* Theme Switcher section inside dropdown */}
        <div className="px-3 py-2 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <SunMoon className="w-3.5 h-3.5 text-[#ff6b35]" />
              Theme
            </span>
          </div>
          <ThemeToggle className="w-full justify-between" />
        </div>

        <DropdownMenuSeparator className="my-1.5 bg-slate-100 dark:bg-slate-800" />

        {/* Account Settings */}
        <DropdownMenuItem
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-800 focus:text-slate-900 dark:focus:text-slate-100"
          onSelect={() => onAction?.()}
          disabled
        >
          <Settings className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          Account Settings
          <span className="ml-auto text-[9px] font-bold uppercase tracking-wider text-slate-300 dark:text-slate-600">
            Soon
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-1.5 bg-slate-100 dark:bg-slate-800" />

        {/* Logout */}
        <DropdownMenuItem
          onSelect={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-500 dark:text-red-400 cursor-pointer focus:bg-red-50 dark:focus:bg-red-950/40 focus:text-red-600 dark:focus:text-red-300"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
