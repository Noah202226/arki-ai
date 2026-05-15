"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import {
  Loader2,
  Trash2,
  RotateCcw,
  Ban,
  Tag,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function TransactionHistory() {
  const transactions = useQuery(api.financials.getAllTransactions);
  const categories = useQuery(api.categories.getCategories, {});
  const removeTransaction = useMutation(api.financials.softDeleteTransaction);

  if (!transactions || !categories)
    return (
      <div className="flex justify-center items-center p-20">
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />
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

  const sortedTransactions = [...transactions].sort(
    (a, b) => b.dueDate - a.dueDate,
  );

  const groupedTransactions = sortedTransactions.reduce(
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
    <div className="w-full space-y-10 max-h-[85vh] overflow-y-auto px-1 md:px-4 custom-scrollbar">
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
          <div key={date} className="space-y-5">
            {/* ENHANCED STICKY HEADER */}
            <div className="sticky top-0 z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md py-3 px-2 flex items-end justify-between border-b-2 border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-xs md:text-sm font-black uppercase tracking-[0.25em] text-indigo-600 dark:text-indigo-400">
                  {getGroupLabel(date)}
                </h3>
                <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-tighter">
                  {groupTx.length}{" "}
                  {groupTx.length === 1 ? "Transaction" : "Transactions"}
                </p>
              </div>

              <div className="flex flex-col items-end gap-0.5">
                {dailyIncome > 0 && (
                  <span className="text-xs md:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    +{formatPHP(dailyIncome)}
                  </span>
                )}
                {dailyExpense > 0 && (
                  <span className="text-xs md:text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                    -{formatPHP(dailyExpense)}
                  </span>
                )}
              </div>
            </div>

            {/* TRANSACTIONS LIST */}
            <div className="grid gap-4">
              {groupTx.map((tx) => {
                const isReversal = tx.type === "reversal";
                const isDeleted = !!tx.isDeleted;
                const isIncome = tx.type === "income";
                const categoryMatch = categories.find(
                  (c) => c.name.toLowerCase() === tx.category?.toLowerCase(),
                );
                const catColor = categoryMatch?.color || "#64748b";

                return (
                  <div
                    key={tx._id}
                    className={cn(
                      "group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 md:p-6 rounded-3xl border-2 transition-all duration-300",
                      "hover:shadow-xl hover:scale-[1.01] cursor-pointer active:scale-95",
                      isDeleted
                        ? "bg-slate-50/50 opacity-50 grayscale border-slate-100"
                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800",
                      isReversal && "border-indigo-100 bg-indigo-50/20",
                    )}
                  >
                    {/* LEFT SECTION: ICON & TITLE */}
                    <div className="flex items-center gap-5 w-full sm:w-auto">
                      <div
                        className={cn(
                          "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                          isIncome
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-rose-50 text-rose-600",
                          isDeleted &&
                            "bg-slate-200 text-slate-400 shadow-none",
                        )}
                        style={
                          !isDeleted && categoryMatch
                            ? {
                                backgroundColor: `${catColor}15`,
                                color: catColor,
                              }
                            : {}
                        }
                      >
                        {isIncome ? (
                          <ArrowDownLeft className="w-7 h-7" />
                        ) : (
                          <ArrowUpRight className="w-7 h-7" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4
                            className={cn(
                              "text-base md:text-lg font-black text-slate-900 dark:text-white leading-tight truncate",
                              isDeleted && "line-through text-slate-400",
                            )}
                          >
                            {tx.title}
                          </h4>
                          {isReversal && (
                            <Badge className="bg-indigo-600 text-white border-none text-[10px] font-black px-2 py-0.5 uppercase">
                              REVERSAL
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">
                            {format(tx.dueDate, "hh:mm a")}
                          </span>
                          <span
                            className="md:hidden text-[10px] font-black uppercase px-2 py-0.5 rounded-md border"
                            style={{
                              color: catColor,
                              borderColor: `${catColor}30`,
                            }}
                          >
                            {tx.category}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* MIDDLE SECTION: DESKTOP CATEGORY */}
                    <div className="hidden md:flex items-center justify-center px-6">
                      <div
                        className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black border-2 uppercase tracking-widest transition-colors"
                        style={{
                          borderColor: `${catColor}25`,
                          color: catColor,
                          backgroundColor: `${catColor}08`,
                        }}
                      >
                        <Tag className="w-3.5 h-3.5" />
                        {categoryMatch?.name || tx.category || "General"}
                      </div>
                    </div>

                    {/* RIGHT SECTION: AMOUNT & DELETE */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-none border-slate-100 dark:border-slate-800">
                      <div className="text-left sm:text-right">
                        <p
                          className={cn(
                            "font-mono font-black text-xl md:text-2xl tracking-tighter",
                            isIncome
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-600 dark:text-rose-400",
                            isDeleted && "text-slate-300",
                          )}
                        >
                          {isIncome ? "+" : "-"}₱
                          {tx.amount.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isDeleted && !isReversal ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(tx._id);
                            }}
                            className="h-11 w-11 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all border border-slate-100 dark:border-slate-800"
                          >
                            <Trash2 className="h-5 h-5" />
                          </Button>
                        ) : (
                          <div className="h-11 w-11 flex items-center justify-center">
                            <RotateCcw className="h-5 w-5 text-slate-300" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {transactions.length === 0 && (
        <div className="py-32 text-center border-4 border-dashed rounded-[40px] border-slate-100 dark:border-slate-900">
          <p className="text-slate-400 text-lg font-bold">
            Your ledger is currently empty.
          </p>
        </div>
      )}
    </div>
  );
}
