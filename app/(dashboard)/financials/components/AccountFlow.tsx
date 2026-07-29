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
import { Id } from "@/convex/_generated/dataModel";

export function AccountFlow({ accountId }: { accountId: Id<"accounts"> }) {
  const transactions = useQuery(api.financials.getTransactionsByAccount, {
    accountId,
  });

  if (!transactions) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3">
        <div className="relative">
          <History className="w-8 h-8 animate-spin-slow opacity-20 text-slate-400 dark:text-slate-600" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-[#ff6b35] rounded-full animate-pulse" />
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse text-slate-400 dark:text-slate-500">
          Syncing Ledger...
        </p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center p-10 border-2 border-dashed rounded-3xl border-slate-100 dark:border-slate-800 flex flex-col items-center gap-3">
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-full">
          <Tag className="w-5 h-5 text-slate-300 dark:text-slate-600" />
        </div>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
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
      {/* Decorative vertical timeline line */}
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
        const isIncome = tx.type === "income";

        return (
          <div key={tx._id} className="relative z-10">
            {/* ── DATE GROUP HEADER ── */}
            {isNewGroup && (
              <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-3 mb-1">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200/70 dark:border-slate-700/60">
                  {currentLabel}
                </span>
              </div>
            )}

            {/* ── TRANSACTION ROW ── */}
            <div
              className={cn(
                "group relative flex items-center justify-between p-3 rounded-2xl transition-all mb-1",
                "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                tx.isDeleted && "opacity-40 grayscale-[0.5]",
              )}
            >
              <div className="flex items-center gap-3.5">
                {/* Icon Badge */}
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 shadow-md",
                    isIncome && !isTransfer && !isReversal
                      ? "bg-emerald-500 text-white shadow-emerald-200/50 dark:shadow-emerald-900/50"
                      : "bg-slate-800 dark:bg-slate-700 text-white shadow-slate-200/50 dark:shadow-slate-900/50",
                    isTransfer && "bg-blue-500 shadow-blue-200/50 dark:shadow-blue-900/50",
                    isReversal && "bg-amber-500 shadow-amber-200/50 dark:shadow-amber-900/50",
                    tx.isDeleted && "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shadow-none",
                  )}
                >
                  {isTransfer ? (
                    <ArrowRightLeft size={15} strokeWidth={2.5} />
                  ) : isIncome ? (
                    <ArrowUpRight size={15} strokeWidth={2.5} />
                  ) : isReversal ? (
                    <AlertCircle size={15} strokeWidth={2.5} />
                  ) : (
                    <ArrowDownRight size={15} strokeWidth={2.5} />
                  )}
                </div>

                {/* Title + Meta */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-bold text-[13px] tracking-tight text-slate-900 dark:text-slate-100",
                        tx.isDeleted && "line-through text-slate-400 dark:text-slate-500",
                      )}
                    >
                      {tx.title}
                    </span>
                    {tx.isDeleted && (
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[7px] font-black px-1.5 py-0.5 rounded tracking-tighter uppercase border border-slate-200 dark:border-slate-700">
                        Voided
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide font-mono">
                      {format(tx.dueDate, "h:mm a")}
                    </span>
                    <span className="text-slate-200 dark:text-slate-700 text-[10px]">·</span>
                    <span
                      className={cn(
                        "text-[9px] font-extrabold uppercase tracking-wide",
                        isIncome
                          ? "text-emerald-500 dark:text-emerald-400"
                          : isTransfer
                          ? "text-blue-500 dark:text-blue-400"
                          : isReversal
                          ? "text-amber-500 dark:text-amber-400"
                          : "text-[#ff6b35] dark:text-[#ff8555]",
                        tx.isDeleted && "text-slate-400 dark:text-slate-500",
                      )}
                    >
                      {tx.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amount + Status */}
              <div className="text-right shrink-0 ml-3">
                <p
                  className={cn(
                    "font-mono font-black text-[13px] tabular-nums",
                    isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200",
                    isReversal && "text-amber-600 dark:text-amber-400",
                    tx.isDeleted && "text-slate-300 dark:text-slate-600",
                  )}
                >
                  {isIncome ? "+" : "-"} ₱
                  {tx.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
                {tx.status && (
                  <p className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-tighter mt-0.5">
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
