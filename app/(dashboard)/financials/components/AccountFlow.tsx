"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { isToday, isYesterday, format } from "date-fns";
import {
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  History,
  AlertCircle,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AccountFlow({ accountId }: { accountId: any }) {
  const transactions = useQuery(api.financials.getTransactionsByAccount, {
    accountId,
  });

  if (!transactions) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
        <div className="relative">
          <History className="w-8 h-8 animate-spin-slow opacity-20" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
          Syncing Ledger...
        </p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center p-10 border-2 border-dashed rounded-3xl border-slate-100 flex flex-col items-center gap-3">
        <div className="bg-slate-50 p-3 rounded-full">
          <Tag className="w-5 h-5 text-slate-300" />
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Clean Slate — No Activity
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
    return format(timestamp, "MMM dd, yyyy");
  };

  return (
    <div className="relative space-y-0.5 px-2">
      {/* Decorative vertical line */}
      <div className="absolute left-[27px] top-4 bottom-4 w-[1px] bg-slate-100 dark:bg-slate-800 z-0" />

      {sortedTransactions.map((tx, index) => {
        const currentLabel = getGroupLabel(tx.dueDate);
        const previousLabel =
          index > 0
            ? getGroupLabel(sortedTransactions[index - 1].dueDate)
            : null;
        const isNewGroup = currentLabel !== previousLabel;

        const isTransfer = tx.category?.toLowerCase().includes("transfer");
        const isReversal =
          tx.type === "reversal" ||
          tx.title?.toLowerCase().includes("correction");

        return (
          <div key={tx._id} className="relative z-10">
            {isNewGroup && (
              <div className="sticky top-0 z-20 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md py-4 mb-2">
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] bg-slate-50 dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800">
                  {currentLabel}
                </span>
              </div>
            )}

            <div
              className={cn(
                "group relative flex items-center justify-between p-3 rounded-2xl transition-all hover:bg-slate-50 dark:hover:bg-slate-900/80 mb-1",
                tx.isDeleted && "opacity-40 grayscale-[0.5]",
              )}
            >
              <div className="flex items-center gap-4">
                {/* Modern Icon Design */}
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
                    tx.type === "income"
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200/50"
                      : "bg-slate-900 text-white shadow-lg shadow-slate-200/50",
                    isTransfer && "bg-blue-500 shadow-blue-200/50",
                    isReversal && "bg-amber-500 shadow-amber-200/50",
                    tx.isDeleted && "bg-slate-200 text-slate-500 shadow-none",
                  )}
                >
                  {isTransfer ? (
                    <ArrowRightLeft size={16} strokeWidth={3} />
                  ) : tx.type === "income" ? (
                    <ArrowUpRight size={16} strokeWidth={3} />
                  ) : isReversal ? (
                    <AlertCircle size={16} strokeWidth={3} />
                  ) : (
                    <ArrowDownRight size={16} strokeWidth={3} />
                  )}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-black text-[13px] tracking-tight text-slate-800 dark:text-slate-100",
                        tx.isDeleted && "line-through text-slate-500",
                      )}
                    >
                      {tx.title}
                    </span>
                    {tx.isDeleted && (
                      <span className="bg-slate-100 text-slate-500 text-[7px] font-black px-1 py-0.5 rounded tracking-tighter uppercase">
                        Voided
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                      {format(tx.dueDate, "h:mm a")}
                    </span>
                    <span className="text-[10px] text-slate-200">/</span>
                    <span className="text-[9px] font-bold text-blue-500/70 uppercase tracking-wide">
                      {tx.category}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p
                  className={cn(
                    "font-mono font-black text-[14px]",
                    tx.type === "income"
                      ? "text-emerald-600"
                      : "text-slate-900 dark:text-white",
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
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">
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
