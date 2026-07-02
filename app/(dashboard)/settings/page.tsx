"use client";

import { useState } from "react";
import { CategorySettings } from "@/app/(dashboard)/dashboard/components/CategorySettings";
import { QuickChipsSettings } from "@/app/(dashboard)/dashboard/components/QuickChipsSettings";
import { cn } from "@/lib/utils";
import { Tag, Zap } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"categories" | "chips">("categories");

  return (
    <div className="space-y-8 pb-10 max-w-4xl mx-auto px-4 sm:px-6">
      <div className="border-b border-[#e5dec9]/40 pb-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#1a1a2e]">Settings</h1>
        <p className="text-slate-500 mt-1">
          Configure your application preferences, manage data labels, and customize shortcuts.
        </p>

        {/* Tab Headers */}
        <div className="flex gap-2 mt-6 border-b border-slate-200/65">
          <button
            onClick={() => setActiveTab("categories")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all duration-200",
              activeTab === "categories"
                ? "border-[#ff6b35] text-[#ff6b35]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <Tag className="w-4 h-4" />
            Categories
          </button>
          <button
            onClick={() => setActiveTab("chips")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all duration-200",
              activeTab === "chips"
                ? "border-[#ff6b35] text-[#ff6b35]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <Zap className="w-4 h-4" />
            Quick Chips
          </button>
        </div>
      </div>

      <section className="mt-6">
        {activeTab === "categories" ? (
          <CategorySettings />
        ) : (
          <QuickChipsSettings />
        )}
      </section>
    </div>
  );
}
