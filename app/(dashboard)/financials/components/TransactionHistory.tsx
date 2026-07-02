"use client";

import { useRef, useEffect } from "react";
import { useMutation, useQuery, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import {
  Loader2,
  Trash2,
  RotateCcw,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function TransactionHistory() {
  const { results: transactions, status, loadMore } = usePaginatedQuery(
    api.financials.getPaginatedTransactions,
    {},
    { initialNumItems: 50 }
  );
  const categories = useQuery(api.categories.getCategories, {});
  const removeTransaction = useMutation(api.financials.softDeleteTransaction);

  // Only show transactions from the last 3 days on the initial visible set
  const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
  const recentTransactions = transactions?.filter(
    (tx) => tx.dueDate >= threeDaysAgo
  );
  // If we have fetched enough that recent slice < 50, show all fetched
  const displayTransactions =
    recentTransactions && recentTransactions.length < 50
      ? transactions
      : recentTransactions ?? transactions;

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (status !== "CanLoadMore") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore(30);
        }
      },
      { threshold: 0.1 }
    );

    const element = loadMoreRef.current;
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [status, loadMore]);

  if (transactions === undefined || categories === undefined)
    return (
      <div className="flex justify-center items-center p-20">
        <Loader2 className="animate-spin text-[#ff6b35] w-10 h-10" />
      </div>
    );

  const handleDelete = async (id: any) => {
    const ok = confirm("Are you sure? This will revert the account balance.");
    if (ok) {
      try {
        await removeTransaction({ id });
        toast.success("Transaction voided.");
      } catch (error) {
        toast.error("Failed to delete.");
      }
    }
  };

  const formatPHP = (amount: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
    }).format(amount);

  const groupedTransactions = (displayTransactions ?? []).reduce(
    (groups, tx) => {
      const date = format(tx.dueDate, "MMMM dd, yyyy");
      if (!groups[date]) groups[date] = [];
      groups[date].push(tx);
      return groups;
    },
    {} as Record<string, typeof transactions>,
  );

  const getGroupLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return dateStr;
  };

  return (
    <div className="w-full divide-y divide-slate-100">
      {Object.entries(groupedTransactions).map(([date, groupTx]) => {
        const dailyIncome = groupTx
          .filter(
            (t) =>
              t.type === "income" &&
              !t.isDeleted &&
              t.category?.toLowerCase() !== "transfer",
          )
          .reduce((sum, t) => sum + t.amount, 0);

        const dailyExpense = groupTx
          .filter(
            (t) =>
              (t.type === "expense" || t.type === "payment") &&
              !t.isDeleted &&
              t.category?.toLowerCase() !== "transfer",
          )
          .reduce((sum, t) => sum + t.amount, 0);

        return (
          <div key={date}>
            {/* DATE GROUP HEADER */}
            <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm flex items-center justify-between px-4 py-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#ff6b35]">
                  {getGroupLabel(date)}
                </span>
                <span className="text-[10px] font-semibold text-slate-400">
                  · {groupTx.length} {groupTx.length === 1 ? "txn" : "txns"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {dailyIncome > 0 && (
                  <span className="text-[11px] font-bold text-emerald-600 font-mono">
                    +₱{dailyIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                )}
                {dailyExpense > 0 && (
                  <span className="text-[11px] font-bold text-rose-500 font-mono">
                    -₱{dailyExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </div>

            {/* TRANSACTION ROWS */}
            <div className="divide-y divide-slate-50">
              {groupTx.map((tx) => {
                const isReversal = tx.type === "reversal";
                const isDeleted = !!tx.isDeleted;
                const isIncome = tx.type === "income";
                const categoryMatch = categories.find(
                  (c) => c.name.toLowerCase() === tx.category?.toLowerCase(),
                );
                const catColor = categoryMatch?.color || "#94a3b8";

                return (
                  <div
                    key={tx._id}
                    className={cn(
                      "group flex items-center gap-3 px-4 py-3 transition-colors duration-150",
                      isDeleted
                        ? "opacity-40 grayscale"
                        : "hover:bg-slate-50/70",
                    )}
                  >
                    {/* ICON */}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
                      )}
                      style={{
                        backgroundColor: isDeleted ? "#f1f5f9" : `${catColor}18`,
                        color: isDeleted ? "#94a3b8" : catColor,
                      }}
                    >
                      {isIncome
                        ? <ArrowDownLeft className="w-4 h-4" />
                        : <ArrowUpRight className="w-4 h-4" />
                      }
                    </div>

                    {/* TITLE + META */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <p
                          className={cn(
                            "text-sm font-semibold text-slate-800 truncate leading-tight",
                            isDeleted && "line-through text-slate-400",
                          )}
                        >
                          {tx.title}
                        </p>
                        {isReversal && (
                          <span className="shrink-0 text-[9px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded">
                            REV
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {format(tx.dueDate, "hh:mm a")}
                        </span>
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border shrink-0"
                          style={{
                            color: catColor,
                            borderColor: `${catColor}30`,
                            backgroundColor: `${catColor}08`,
                          }}
                        >
                          {categoryMatch?.name || tx.category || "General"}
                        </span>
                      </div>
                    </div>

                    {/* AMOUNT */}
                    <p
                      className={cn(
                        "font-mono font-bold text-sm tabular-nums shrink-0",
                        isIncome ? "text-emerald-600" : "text-rose-500",
                        isDeleted && "text-slate-300",
                      )}
                    >
                      {isIncome ? "+" : "-"}₱{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>

                    {/* DELETE */}
                    <div className="shrink-0 w-7">
                      {!isDeleted && !isReversal ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(tx._id); }}
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : isReversal ? (
                        <RotateCcw className="w-3.5 h-3.5 text-slate-300" />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* INFINITE SCROLL TARGET */}
      {status === "CanLoadMore" && (
        <div ref={loadMoreRef} className="py-6 flex items-center justify-center">
          <Loader2 className="animate-spin text-[#ff6b35] w-6 h-6" />
        </div>
      )}
      {status === "LoadingMore" && (
        <div className="py-6 flex items-center justify-center">
          <Loader2 className="animate-spin text-[#ff6b35] w-6 h-6 animate-pulse" />
        </div>
      )}

      {transactions.length === 0 && status !== "LoadingFirstPage" && (
        <div className="py-32 text-center border-4 border-dashed rounded-[40px] border-slate-100 dark:border-slate-900">
          <p className="text-slate-400 text-lg font-bold">
            No transactions yet.
          </p>
          <p className="text-slate-300 text-sm mt-2">
            Showing last 3 days · scroll for older entries
          </p>
        </div>
      )}
    </div>
  );
}
