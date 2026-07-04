"use client";

import { useState } from "react";
import { FinancialOverview } from "@/app/(dashboard)/financials/components/FinancialOverview";
import { AccountList } from "@/app/(dashboard)/financials/components/AccountList";
import { AddTransactionDialog } from "@/app/(dashboard)/financials/components/AddTransactionDialog";
import { TransactionHistory } from "@/app/(dashboard)/financials/components/TransactionHistory";
import { CreditTracker } from "@/app/(dashboard)/financials/components/CreditTracker";
import { PayrollTracker } from "@/app/(dashboard)/financials/components/payroll-tracker";
import { SubscriptionTracker } from "@/app/(dashboard)/financials/components/SubscriptionTracker";
import { Button } from "@/components/ui/button";
import { FileText, Wallet, Calendar, ShieldAlert, History, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";

type TabId = "all" | "wallets" | "payroll" | "credits" | "subscriptions" | "transactions";

export default function FinancialsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("all");

  const tabs = [
    { id: "all", label: "Show All", icon: FileText },
    { id: "wallets", label: "Wallets", icon: Wallet },
    { id: "payroll", label: "Expected Income", icon: Calendar },
    { id: "credits", label: "Credits", icon: ShieldAlert },
    { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
    { id: "transactions", label: "History", icon: History },
  ] as const;

  return (
    <div className="min-h-screen bg-[#f5f2ed]">
      {/* 1. HEADER — bold two-panel navy block */}
      <header className="bg-[#1a1a2e] flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-stretch">
          <div className="flex-1 px-4 sm:px-8 py-6 sm:py-7 border-b sm:border-b-0 sm:border-r border-white/[0.08]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#ff6b35]" />
              <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-white/30">
                Personal Finance Hub
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-none mb-1">
              Your <span className="text-[#ff6b35]">Financials</span>
            </h1>
            <p className="text-sm text-white/35 mt-2">
              Cash flow, credits, and obligations — all in one place.
            </p>
          </div>
          <div className="flex sm:flex-col justify-start sm:justify-center gap-2.5 px-4 sm:px-6 py-4 sm:py-5 bg-[#13132a]">
            <Button
              variant="outline"
              className="bg-white/[0.06] border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80 rounded-lg text-xs font-semibold"
            >
              <FileText className="w-3.5 h-3.5 mr-2" /> Export Reports
            </Button>
            <AddTransactionDialog />
          </div>
        </div>
        <div className="border-t border-white/[0.06]">
          <FinancialOverview />
        </div>
      </header>

      {/* 2. MOBILE ONLY TAB BAR */}
      <div className="lg:hidden sticky top-0 bg-[#f5f2ed]/90 backdrop-blur-md border-b border-[#e0dbd4] px-4 py-2.5 z-40 overflow-x-auto flex gap-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 border",
                isActive
                  ? "bg-[#ff6b35] text-white border-transparent shadow-sm"
                  : "bg-white text-slate-600 border-[#e0dbd4] hover:bg-slate-50"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. MAIN BODY — tabs on mobile, side-by-side grids on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-[#e0dbd4]">
        {/* LEFT COLUMN */}
        <div
          className={cn(
            "bg-[#f5f2ed] flex flex-col divide-y divide-[#e0dbd4]",
            activeTab !== "all" && "divide-y-0"
          )}
        >
          {/* Section 1: Accounts */}
          <section
            className={cn(
              "p-4 sm:p-6",
              activeTab !== "all" && activeTab !== "wallets" && "hidden lg:block"
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#1a1a2e]">
                <span className="w-[3px] h-[14px] rounded-sm bg-[#ff6b35]" />
                Accounts &amp; Wallets
              </h2>
            </div>
            <AccountList />
          </section>

          {/* Section 2: Expected Income */}
          <section
            className={cn(
              "p-4 sm:p-6",
              activeTab !== "all" && activeTab !== "payroll" && "hidden lg:block"
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#1a1a2e]">
                <span className="w-[3px] h-[14px] rounded-sm bg-[#ff6b35]" />
                Expected Income
              </h2>
            </div>
            <PayrollTracker />
          </section>

          {/* Section 3: Credits */}
          <section
            className={cn(
              "p-4 sm:p-6",
              activeTab !== "all" && activeTab !== "credits" && "hidden lg:block"
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#1a1a2e]">
                <span className="w-[3px] h-[14px] rounded-sm bg-[#ff6b35]" />
                Credit Tracker
              </h2>
            </div>
            <CreditTracker />
          </section>

          {/* Section 4: Subscriptions */}
          <section
            className={cn(
              "p-4 sm:p-6",
              activeTab !== "all" && activeTab !== "subscriptions" && "hidden lg:block"
            )}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#1a1a2e]">
                <span className="w-[3px] h-[14px] rounded-sm bg-[#ff6b35]" />
                Subscription Monitoring
              </h2>
            </div>
            <SubscriptionTracker />
          </section>
        </div>

        {/* RIGHT COLUMN */}
        <div
          className={cn(
            "bg-white border-t lg:border-t-0 border-[#e0dbd4] sticky top-0 h-screen flex flex-col",
            activeTab !== "all" && activeTab !== "transactions" && "hidden lg:flex"
          )}
        >
          <div className="flex items-center justify-between px-4 sm:px-6 pt-5 pb-4 border-b border-[#e0dbd4] shrink-0">
            <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#1a1a2e]">
              <span className="w-[3px] h-[14px] rounded-sm bg-[#ff6b35]" />
              Transaction History
            </h2>
            <span className="text-[10px] font-bold tracking-[0.08em] bg-[#f5f2ed] border border-[#e0dbd4] text-[#888] px-3 py-1 rounded-md">
              LAST 3 DAYS / TOP 50
            </span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <TransactionHistory />
          </div>
        </div>
      </div>
    </div>
  );
}
