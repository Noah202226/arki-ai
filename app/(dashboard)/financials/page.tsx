"use client";

import { FinancialOverview } from "@/app/(dashboard)/financials/components/FinancialOverview";
import { AccountList } from "@/app/(dashboard)/financials/components/AccountList";
import { AddTransactionDialog } from "@/app/(dashboard)/financials/components/AddTransactionDialog";
import { TransactionHistory } from "@/app/(dashboard)/financials/components/TransactionHistory";
import { CreditTracker } from "@/app/(dashboard)/financials/components/CreditTracker";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default function FinancialsPage() {
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

      {/* 3. MAIN BODY — stacks on mobile, side-by-side on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-[#e0dbd4]">
        {/* LEFT COLUMN */}
        <div className="bg-[#f5f2ed] flex flex-col divide-y divide-[#e0dbd4]">
          <section className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#1a1a2e]">
                <span className="w-[3px] h-[14px] rounded-sm bg-[#ff6b35]" />
                Accounts &amp; Wallets
              </h2>
              <span className="text-xs text-[#ff6b35] font-semibold cursor-pointer">
                + Add
              </span>
            </div>
            <AccountList />
          </section>

          <section className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#1a1a2e]">
                <span className="w-[3px] h-[14px] rounded-sm bg-[#ff6b35]" />
                Credit Tracker
              </h2>
              <span className="text-xs text-[#ff6b35] font-semibold cursor-pointer">
                Manage
              </span>
            </div>
            <CreditTracker />
          </section>
        </div>

        {/* RIGHT COLUMN — sits below on mobile */}
        <div className="bg-white p-4 sm:p-6 border-t lg:border-t-0 border-[#e0dbd4]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#1a1a2e]">
              <span className="w-[3px] h-[14px] rounded-sm bg-[#ff6b35]" />
              Transaction History
            </h2>
            <span className="text-[10px] font-bold tracking-[0.08em] bg-[#f5f2ed] border border-[#e0dbd4] text-[#888] px-3 py-1 rounded-md">
              PAST 30 DAYS
            </span>
          </div>
          <TransactionHistory />
        </div>
      </div>
    </div>
  );
}
