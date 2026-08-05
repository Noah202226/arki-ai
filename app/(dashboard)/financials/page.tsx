"use client";

import { useState, useEffect } from "react";
import { FinancialOverview } from "@/app/(dashboard)/financials/components/FinancialOverview";
import { AccountSummaryHeaderWidget } from "@/app/(dashboard)/financials/components/AccountSummaryHeaderWidget";
import { AccountList } from "@/app/(dashboard)/financials/components/AccountList";
import { AddTransactionDialog } from "@/app/(dashboard)/financials/components/AddTransactionDialog";
import { TransactionHistory } from "@/app/(dashboard)/financials/components/TransactionHistory";
import { CreditTracker } from "@/app/(dashboard)/financials/components/CreditTracker";
import { PayrollTracker } from "@/app/(dashboard)/financials/components/payroll-tracker";
import { SubscriptionTracker } from "@/app/(dashboard)/financials/components/SubscriptionTracker";
import { LifestyleCostCalculator } from "@/app/(dashboard)/financials/components/LifestyleCostCalculator";
import { FinancialAnalytics } from "@/app/(dashboard)/financials/components/FinancialAnalytics";
import { BudgetLimitsWidget } from "@/app/(dashboard)/financials/components/BudgetLimitsWidget";
import { NotificationCenter } from "@/components/NotificationCenter";
import {
  Wallet,
  Calendar,
  ShieldAlert,
  History,
  Compass,
  BarChart3,
  Layers,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type TabId =
  | "overview"
  | "credits"
  | "wallets"
  | "lifestyle"
  | "income-subs"
  | "transactions"
  | "all";

export default function FinancialsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const tabs = [
    { id: "overview", label: "Overview & Analytics", icon: BarChart3 },
    { id: "credits", label: "Credits & BNPL", icon: ShieldAlert },
    { id: "wallets", label: "Wallets & Accounts", icon: Wallet },
    { id: "lifestyle", label: "Cost of Living", icon: Compass },
    { id: "income-subs", label: "Income & Subscriptions", icon: Calendar },
    { id: "transactions", label: "Transaction History", icon: History },
    { id: "all", label: "All-in-One Grid", icon: Layers },
  ] as const;

  return (
    <div className="min-h-screen bg-[#f5f2ed] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* 1. HEADER — bold two-panel navy block */}
      <header className="bg-[#1a1a2e] flex flex-col">
        {/* TOP ROW: Title on left, Live Clock + Notifications + Add Transaction on right */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-4 sm:px-8 py-4 border-b border-white/[0.08] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#ff6b35] animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/40">
                Personal Finance Hub
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-none">
              Your <span className="text-[#ff6b35]">Financials</span>
            </h1>
            <p className="text-[11px] text-white/40 mt-1">
              Cash flow, credits, and obligations — all in one place.
            </p>
          </div>

          {/* HEADER RIGHT: Live Date & Time + Notifications + Add Transaction */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
            {now && (
              <div className="px-3.5 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white flex items-center gap-2.5 shadow-sm">
                <Clock className="w-4 h-4 text-[#ff6b35] shrink-0" />
                <div className="text-left leading-tight">
                  <span className="text-xs font-mono font-bold text-white block">
                    {format(now, "hh:mm:ss a")}
                  </span>
                  <span className="text-[9px] font-bold text-white/40 block uppercase tracking-wider">
                    {format(now, "EEEE, MMM dd")}
                  </span>
                </div>
              </div>
            )}

            <div className="p-2 rounded-xl bg-white/[0.05] border border-white/10 text-white flex items-center justify-center">
              <NotificationCenter />
            </div>

            <AddTransactionDialog />
          </div>
        </div>

        {/* LOWER ROW: 2-COLUMN GRID (Financial Overview on Left, Account Summary Metrics on Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 border-b border-white/[0.08] divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08]">
          <div className="lg:col-span-7">
            <FinancialOverview />
          </div>
          <div className="lg:col-span-5">
            <AccountSummaryHeaderWidget />
          </div>
        </div>
      </header>

      {/* 2. SUB-NAVIGATION TAB BAR (DESKTOP + MOBILE) */}
      <div className="sticky top-0 bg-[#1a1a2e] border-b border-white/[0.08] px-4 sm:px-8 py-3 z-40 overflow-x-auto flex items-center gap-2 scrollbar-none shadow-md">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all duration-200 border shrink-0",
                isActive
                  ? "bg-[#ff6b35] text-white border-[#ff6b35] shadow-lg shadow-[#ff6b35]/20 scale-[1.02]"
                  : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-[#ff6b35]")} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 3. TAB-BASED VIEW CONTENT */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* TAB 1: OVERVIEW & ANALYTICS */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-in fade-in-50 duration-200">
            {/* LEFT COLUMN: Financial Analytics Charts & Budget Caps */}
            <div className="xl:col-span-7 space-y-8">
              <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="flex items-center gap-2.5 text-base font-extrabold text-slate-900 dark:text-slate-100">
                    <span className="w-1.5 h-4 rounded-full bg-[#ff6b35]" />
                    Financial Analytics &amp; Cash Flow Charts
                  </h2>
                </div>
                <FinancialAnalytics />
              </section>

              <BudgetLimitsWidget />
            </div>

            {/* RIGHT COLUMN: Recent Transaction Activity ALWAYS ON TOP RIGHT */}
            <div className="xl:col-span-5 space-y-8">
              <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="flex items-center gap-2.5 text-base font-extrabold text-slate-900 dark:text-slate-100">
                    <span className="w-1.5 h-4 rounded-full bg-[#ff6b35]" />
                    Recent Transaction Activity
                  </h2>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2.5 py-1 rounded-lg">
                    TOP 50 RECENT
                  </span>
                </div>
                <TransactionHistory />
              </section>
            </div>
          </div>
        )}

        {/* TAB 2: CREDITS & BNPL */}
        {activeTab === "credits" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="flex items-center gap-2.5 text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    <span className="w-1.5 h-5 rounded-full bg-[#ff6b35]" />
                    Credit Cards, BNPL &amp; Micro-Loans
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                    Manage SPayLater, LazPayLater, Billease, Gloan, Maya Credit &amp; OLA Micro-Loans.
                  </p>
                </div>
              </div>
              <CreditTracker />
            </section>
          </div>
        )}

        {/* TAB 3: WALLETS & ACCOUNTS */}
        {activeTab === "wallets" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="flex items-center gap-2.5 text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    <span className="w-1.5 h-5 rounded-full bg-[#ff6b35]" />
                    Accounts &amp; Cash Wallets
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                    Real-time balances for GCash, Maya, Bank Accounts, and Cash Wallets.
                  </p>
                </div>
              </div>
              <AccountList />
            </section>
          </div>
        )}

        {/* TAB 4: COST OF LIVING */}
        {activeTab === "lifestyle" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h2 className="flex items-center gap-2.5 text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    <span className="w-1.5 h-5 rounded-full bg-[#ff6b35]" />
                    Lifestyle &amp; Daily Cost of Living
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                    Calculate daily consumption rates and track net income surplus vs runway.
                  </p>
                </div>
              </div>
              <LifestyleCostCalculator />
            </section>
          </div>
        )}

        {/* TAB 5: INCOME & SUBSCRIPTIONS */}
        {activeTab === "income-subs" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-in fade-in-50 duration-200">
            <div className="xl:col-span-6 space-y-8">
              <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="flex items-center gap-2.5 text-base font-extrabold text-slate-900 dark:text-slate-100">
                    <span className="w-1.5 h-4 rounded-full bg-[#ff6b35]" />
                    Expected Payroll &amp; Income
                  </h2>
                </div>
                <PayrollTracker />
              </section>
            </div>

            <div className="xl:col-span-6 space-y-8">
              <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <h2 className="flex items-center gap-2.5 text-base font-extrabold text-slate-900 dark:text-slate-100">
                    <span className="w-1.5 h-4 rounded-full bg-[#ff6b35]" />
                    Subscription Monitoring
                  </h2>
                </div>
                <SubscriptionTracker />
              </section>
            </div>
          </div>
        )}

        {/* TAB 6: TRANSACTIONS */}
        {activeTab === "transactions" && (
          <div className="space-y-6 animate-in fade-in-50 duration-200">
            <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="flex items-center gap-2.5 text-lg font-extrabold text-slate-900 dark:text-slate-100">
                  <span className="w-1.5 h-5 rounded-full bg-[#ff6b35]" />
                  Transaction History Logs
                </h2>
              </div>
              <TransactionHistory />
            </section>
          </div>
        )}

        {/* TAB 7: ALL-IN-ONE GRID (UNIFIED VIEW FOR POWER USERS) */}
        {activeTab === "all" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start animate-in fade-in-50 duration-200">
            {/* LEFT COLUMN */}
            <div className="xl:col-span-6 space-y-8">
              <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <h2 className="flex items-center gap-2.5 text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="w-1.5 h-4 rounded-full bg-[#ff6b35]" />
                  Lifestyle &amp; Cost of Living
                </h2>
                <LifestyleCostCalculator />
              </section>

              <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <h2 className="flex items-center gap-2.5 text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="w-1.5 h-4 rounded-full bg-[#ff6b35]" />
                  Accounts &amp; Wallets
                </h2>
                <AccountList />
              </section>

              <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <h2 className="flex items-center gap-2.5 text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="w-1.5 h-4 rounded-full bg-[#ff6b35]" />
                  Expected Income
                </h2>
                <PayrollTracker />
              </section>

              <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <h2 className="flex items-center gap-2.5 text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="w-1.5 h-4 rounded-full bg-[#ff6b35]" />
                  Credit Tracker
                </h2>
                <CreditTracker />
              </section>

              <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <h2 className="flex items-center gap-2.5 text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="w-1.5 h-4 rounded-full bg-[#ff6b35]" />
                  Subscription Monitoring
                </h2>
                <SubscriptionTracker />
              </section>
            </div>

            {/* RIGHT COLUMN */}
            <div className="xl:col-span-6 space-y-8">
              <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <h2 className="flex items-center gap-2.5 text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="w-1.5 h-4 rounded-full bg-[#ff6b35]" />
                  Transaction Analytics &amp; Reports
                </h2>
                <FinancialAnalytics />
              </section>

              <section className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
                <h2 className="flex items-center gap-2.5 text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <span className="w-1.5 h-4 rounded-full bg-[#ff6b35]" />
                  Transaction History
                </h2>
                <TransactionHistory />
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
