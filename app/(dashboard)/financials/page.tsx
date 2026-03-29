"use client";

import { FinancialOverview } from "@/app/(dashboard)/financials/components/FinancialOverview";
import { AccountList } from "@/app/(dashboard)/financials/components/AccountList";
import { AddTransactionDialog } from "@/app/(dashboard)/financials/components/AddTransactionDialog";
import { TransactionHistory } from "@/app/(dashboard)/financials/components/TransactionHistory";
import { CreditTracker } from "@/app/(dashboard)/financials/components/CreditTracker"; // Bagong Import
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

export default function FinancialsPage() {
  console.log("checkig");
  return (
    <div className="space-y-8 pb-10 max-w-400 mx-auto">
      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Financials</h1>
          <p className="text-slate-500 mt-1">
            Manage your cash flow, credits, and obligations in one place.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex border-slate-300"
          >
            <FileText className="w-4 h-4 mr-2" /> Export Reports
          </Button>
          <AddTransactionDialog />
        </div>
      </div>

      {/* 2. Top Stats - Overview Cards */}
      <section>
        <FinancialOverview />
      </section>

      {/* 3. Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Transaction History (7/12 space) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Account/Wallet List */}
          <section className="space-y-4">
            <AccountList />
          </section>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden">
            <section className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
              <CreditTracker />
            </section>
          </div>
        </div>

        {/* RIGHT COLUMN: Credits & Wallets (5/12 space) */}
        <div className="lg:col-span-7 space-y-8">
          {/* Credit Monitoring Section (The Excel Replacement) */}
          <div className="p-6 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="font-bold text-lg">Transaction History</h3>
            <span className="text-xs text-slate-500 font-medium bg-white dark:bg-slate-900 px-2 py-1 rounded border">
              Recent 30 days
            </span>
          </div>
          <div className="p-0">
            <TransactionHistory />
          </div>
        </div>
      </div>
    </div>
  );
}
