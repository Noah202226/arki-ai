"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Wallet, Coins, ShieldCheck, AlertCircle, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

export function AccountSummaryHeaderWidget() {
  const accounts = useQuery(api.accounts.getAccounts);
  const credits = useQuery(api.credits.getCreditSummary);

  if (accounts === undefined || credits === undefined) {
    return (
      <div className="grid grid-cols-2 gap-2 p-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-white/5 rounded-xl" />
        ))}
      </div>
    );
  }

  const totalCombined = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const usableLiquid = accounts
    .filter((a) => !a.isSavings)
    .reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalSavings = accounts
    .filter((a) => a.isSavings)
    .reduce((sum, a) => sum + (a.balance || 0), 0);

  const totalRemainingDebt = credits.reduce(
    (sum, c) => sum + c.remainingBalance,
    0
  );
  const netDifference = totalCombined - totalRemainingDebt;

  const metrics = [
    {
      title: "Total Combined Assets",
      subtitle: "Sum of all your wallets",
      amount: totalCombined,
      icon: Wallet,
      accent: "border-l-4 border-blue-500",
      textColor: "text-slate-100",
    },
    {
      title: "Usable Liquid Assets",
      subtitle: "Ready-to-use cash",
      amount: usableLiquid,
      icon: Coins,
      accent: "border-l-4 border-emerald-500",
      textColor: "text-emerald-400",
    },
    {
      title: "Total Savings Amount",
      subtitle: "Locked / Invested funds",
      amount: totalSavings,
      icon: ShieldCheck,
      accent: "border-l-4 border-indigo-500",
      textColor: "text-indigo-400",
    },
    {
      title: "Total Remaining Balance",
      subtitle: "Pending credit obligations",
      amount: totalRemainingDebt,
      icon: AlertCircle,
      accent: "border-l-4 border-amber-500",
      textColor: "text-amber-400",
    },
    {
      title: "Assets Less Credit Balance",
      subtitle: "True financial difference",
      amount: netDifference,
      icon: Scale,
      accent: cn("border-l-4", netDifference >= 0 ? "border-emerald-500" : "border-rose-500"),
      textColor: netDifference >= 0 ? "text-emerald-400" : "text-rose-400",
    },
  ];

  return (
    <div className="bg-[#1a1a2e] p-4 sm:p-5 flex flex-col justify-center h-full border-t lg:border-t-0 border-white/[0.06]">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[10px] font-extrabold uppercase text-white/40 tracking-wider flex items-center gap-1.5">
          <Wallet className="w-3.5 h-3.5 text-[#ff6b35]" /> Wallet &amp; Debt Balance Overview
        </span>
        <span className="text-[10px] font-mono font-bold text-white/50">
          {accounts.length} {accounts.length === 1 ? "Account" : "Accounts"}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
        {metrics.map((m, i) => (
          <div
            key={i}
            className={cn(
              "bg-white/[0.04] hover:bg-white/[0.07] transition-colors p-3 rounded-xl border border-white/[0.06] flex flex-col justify-between min-w-0 space-y-1",
              m.accent,
              i === 4 && "col-span-2 lg:col-span-1"
            )}
          >
            <p className="text-[9px] font-extrabold uppercase text-white/40 leading-none truncate">
              {m.title}
            </p>

            <p className={cn("text-xs sm:text-sm font-mono font-extrabold truncate leading-tight", m.textColor)}>
              ₱{m.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>

            <p className="text-[8px] text-white/30 truncate leading-none">
              {m.subtitle}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
