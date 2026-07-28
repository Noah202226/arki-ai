"use client";

import { useState } from "react";
import { CategorySettings } from "@/app/(dashboard)/dashboard/components/CategorySettings";
import { QuickChipsSettings } from "@/app/(dashboard)/dashboard/components/QuickChipsSettings";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { Tag, Zap, SunMoon } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"appearance" | "categories" | "chips">("appearance");

  return (
    <div className="space-y-8 pb-10 w-full max-w-9xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
      <div className="border-b border-[#e5dec9]/40 dark:border-slate-800 pb-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#1a1a2e] dark:text-slate-50">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Configure your application preferences, manage data labels, and customize shortcuts.
        </p>

        {/* Tab Headers */}
        <div className="flex gap-2 mt-6 border-b border-slate-200/65 dark:border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab("appearance")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all duration-200 shrink-0",
              activeTab === "appearance"
                ? "border-[#ff6b35] text-[#ff6b35] dark:text-[#ff8555]"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <SunMoon className="w-4 h-4" />
            Appearance
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all duration-200 shrink-0",
              activeTab === "categories"
                ? "border-[#ff6b35] text-[#ff6b35] dark:text-[#ff8555]"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <Tag className="w-4 h-4" />
            Categories
          </button>
          <button
            onClick={() => setActiveTab("chips")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all duration-200 shrink-0",
              activeTab === "chips"
                ? "border-[#ff6b35] text-[#ff6b35] dark:text-[#ff8555]"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <Zap className="w-4 h-4" />
            Quick Chips
          </button>
        </div>
      </div>

      <section className="mt-6">
        {activeTab === "appearance" ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-[#1a1a2e] dark:text-slate-100 flex items-center gap-2">
                <SunMoon className="w-5 h-5 text-[#ff6b35]" />
                Interface Theme
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Customize how Arki looks on your device. Choose between light, dark, or system preference mode.
              </p>
            </div>

            <div className="pt-2">
              <ThemeToggle className="p-1.5 rounded-2xl" />
            </div>
          </div>
        ) : activeTab === "categories" ? (
          <CategorySettings />
        ) : (
          <QuickChipsSettings />
        )}
      </section>
    </div>
  );
}
