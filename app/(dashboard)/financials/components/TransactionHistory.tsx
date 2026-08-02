"use client";

import { useRef, useEffect, useState } from "react";
import { useMutation, useQuery, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import {
  Loader2,
  Trash2,
  RotateCcw,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Wallet,
  RefreshCw,
  PenLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export function TransactionHistory() {
  const { results: transactions, status, loadMore } = usePaginatedQuery(
    api.financials.getPaginatedTransactions,
    {},
    { initialNumItems: 50 }
  );
  const categories = useQuery(api.categories.getCategories, {});
  const accounts = useQuery(api.accounts.getAccounts, {});
  const removeTransaction = useMutation(api.financials.softDeleteTransaction);

  const [txToDelete, setTxToDelete] = useState<{ id: Id<"financials">; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const confirmDelete = async () => {
    if (!txToDelete) return;
    setIsDeleting(true);
    try {
      await removeTransaction({ id: txToDelete.id });
      toast.success("Transaction voided.");
      setTxToDelete(null);
    } catch {
      toast.error("Failed to delete transaction.");
    } finally {
      setIsDeleting(false);
    }
  };

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
    <div className="w-full divide-y divide-slate-100 dark:divide-slate-800">
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
            <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#ff6b35]">
                  {getGroupLabel(date)}
                </span>
                <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                  · {groupTx.length} {groupTx.length === 1 ? "txn" : "txns"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {dailyIncome > 0 && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    +₱{dailyIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                )}
                {dailyExpense > 0 && (
                  <span className="text-[11px] font-bold text-rose-500 dark:text-rose-400 font-mono">
                    -₱{dailyExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            </div>

            {/* TRANSACTION ROWS */}
            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {groupTx.map((tx) => {
                const isReversal = tx.type === "reversal";
                const isDeleted = !!tx.isDeleted;
                const isIncome = tx.type === "income";
                const categoryMatch = categories.find(
                  (c) => c.name.toLowerCase() === tx.category?.toLowerCase(),
                );
                const catColor = categoryMatch?.color || "#94a3b8";
                const account = accounts?.find((a) => a._id === tx.accountId);

                const isAutoRecurring =
                  (tx.frequency && tx.frequency !== "one-time") ||
                  tx.title.startsWith("Recurring Expense:") ||
                  tx.title.startsWith("Daily Retainer:") ||
                  tx.title.startsWith("Subscription:") ||
                  tx.title.startsWith("Client Retainer:");

                return (
                  <div
                    key={tx._id}
                    className={cn(
                      "group flex items-center gap-3 px-4 py-3 transition-colors duration-150",
                      isDeleted
                        ? "opacity-40 grayscale"
                        : "hover:bg-slate-50/70 dark:hover:bg-slate-800/50",
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
                            "text-sm font-semibold text-slate-800 dark:text-slate-100 truncate leading-tight",
                            isDeleted && "line-through text-slate-400 dark:text-slate-500",
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
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {format(tx.dueDate, "hh:mm a")}
                        </span>

                        {/* RECURRING AUTO VS MANUAL BADGE */}
                        {isAutoRecurring ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border shrink-0 bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 flex items-center gap-1">
                            <RefreshCw className="w-2.5 h-2.5 text-purple-500" /> Recurring Auto
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md border shrink-0 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-slate-700/60 flex items-center gap-1">
                            <PenLine className="w-2.5 h-2.5 text-slate-400" /> Manual Input
                          </span>
                        )}

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
                        {account && (
                          <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700/60">
                            <Wallet className="w-2.5 h-2.5 text-slate-400" />
                            {account.accountName}
                          </span>
                        )}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setTxToDelete({ id: tx._id, title: tx.title });
                          }}
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                          title="Void / Delete Transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : isReversal ? (
                        <RotateCcw className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
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

      {/* SHADCN DELETE CONFIRMATION DIALOG MODAL */}
      <Dialog open={!!txToDelete} onOpenChange={(open) => !open && setTxToDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl p-6">
          <DialogHeader className="space-y-2">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-lg font-extrabold text-slate-900 dark:text-slate-50">
              Void Transaction?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Are you sure you want to void <strong className="text-slate-700 dark:text-slate-200">&quot;{txToDelete?.title}&quot;</strong>? This action will revert the corresponding account balance.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              onClick={() => setTxToDelete(null)}
              disabled={isDeleting}
              className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold shadow-md shadow-rose-600/20 gap-2"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {isDeleting ? "Voiding..." : "Void Transaction"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
