"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { isToday, isYesterday, format } from "date-fns";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  History,
  Ban,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AccountFlow({ accountId }: { accountId: any }) {
  const transactions = useQuery(api.financials.getTransactionsByAccount, {
    accountId,
  });

  if (!transactions) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-2">
        <History className="w-8 h-8 animate-pulse" />
        <p className="text-xs font-medium uppercase tracking-widest">
          Loading history...
        </p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center p-8 border-2 border-dashed rounded-2xl border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          No Activity Yet
        </p>
      </div>
    );
  }

  const sortedTransactions = [...transactions].sort(
    (a, b) => b.dueDate - a.dueDate,
  );

  const getGroupLabel = (timestamp: number) => {
    if (isToday(timestamp)) return "Today";
    if (isYesterday(timestamp)) return "Yesterday";
    return format(timestamp, "MMMM dd, yyyy");
  };

  return (
    <div className="relative space-y-1">
      {sortedTransactions.map((tx, index) => {
        const currentLabel = getGroupLabel(tx.dueDate);
        const previousLabel =
          index > 0
            ? getGroupLabel(sortedTransactions[index - 1].dueDate)
            : null;
        const isNewGroup = currentLabel !== previousLabel;

        // Determine Icon and Style based on Type
        const isTransfer = tx.category?.toLowerCase().includes("transfer");
        const isReversal =
          tx.type === "reversal" ||
          tx.title?.toLowerCase().includes("correction");

        return (
          <div key={tx._id} className="group">
            {isNewGroup && (
              <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-3 px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  {currentLabel}
                </span>
              </div>
            )}

            <div
              className={cn(
                "relative flex items-center justify-between p-3 rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-900/50",
                tx.isDeleted && "opacity-50 grayscale",
              )}
            >
              <div className="flex items-center gap-4">
                {/* Icon Container */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm",
                    tx.type === "income"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-rose-50 text-rose-600",
                    isTransfer && "bg-indigo-50 text-indigo-600",
                    isReversal && "bg-amber-50 text-amber-600",
                  )}
                >
                  {isTransfer ? (
                    <ArrowRightLeft size={18} />
                  ) : tx.type === "income" ? (
                    <ArrowUpRight size={18} />
                  ) : (
                    <ArrowDownRight size={18} />
                  )}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-bold text-sm tracking-tight text-slate-700 dark:text-slate-200",
                        tx.isDeleted && "line-through text-slate-400",
                      )}
                    >
                      {tx.title}
                    </span>
                    {tx.isDeleted && (
                      <span className="bg-red-100 text-red-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">
                        Voided
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
                    {format(tx.dueDate, "hh:mm a")} • {tx.category}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <p
                  className={cn(
                    "font-mono font-black text-sm",
                    tx.type === "income" ? "text-emerald-600" : "text-rose-600",
                    isReversal && "text-amber-600",
                    tx.isDeleted && "text-slate-400",
                  )}
                >
                  {tx.type === "income" ? "+" : "-"} ₱
                  {tx.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
                {tx.status && (
                  <p className="text-[9px] font-bold text-slate-300 uppercase italic">
                    {tx.status}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
