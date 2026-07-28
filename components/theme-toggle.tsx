"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

interface ThemeToggleProps {
  variant?: "buttons" | "dropdown-item";
  className?: string;
}

export function ThemeToggle({ variant = "buttons", className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={cn("flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-fit", className)}>
        <div className="w-8 h-8 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 animate-pulse" />
        <div className="w-8 h-8 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 animate-pulse" />
        <div className="w-8 h-8 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 animate-pulse" />
      </div>
    );
  }

  const themes = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className={cn("flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 w-fit", className)}>
      {themes.map((t) => {
        const Icon = t.icon;
        const isActive = theme === t.value;
        return (
          <button
            key={t.value}
            onClick={() => setTheme(t.value)}
            title={`Switch to ${t.label} mode`}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]/40",
              isActive
                ? "bg-white dark:bg-slate-700 text-[#ff6b35] dark:text-[#ff6b35] shadow-xs"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/40 dark:hover:bg-slate-700/40"
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="capitalize">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
