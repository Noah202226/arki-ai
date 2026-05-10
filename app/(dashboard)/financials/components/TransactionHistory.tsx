"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
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
  const categories = useQuery(api.categories.getCategories, {}); // Fetch your new categories
  const removeTransaction = useMutation(api.financials.softDeleteTransaction);

  if (!transactions || !categories)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-indigo-500 w-8 h-8" />
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

  const sortedTransactions = [...transactions].sort(
    (a, b) => b.dueDate - a.dueDate,
  );

  return (
    <div className="space-y-3 max-h-screen overflow-y-auto pr-2 custom-scrollbar">
      {sortedTransactions.map((tx, index) => {
        const isReversal = tx.type === "reversal";
        const isDeleted = !!tx.isDeleted;
        const isIncome = tx.type === "income";

        // Find the specific category details (match by name or ID)
        const categoryMatch = categories.find(
          (c) => c.name.toLowerCase() === tx.category?.toLowerCase(),
        );
        const catColor = categoryMatch?.color || "#94a3b8";

        return (
          <div
            key={tx._id}
            className={cn(
              "group relative flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 hover:shadow-md",
              isDeleted ? "bg-slate-50/50 opacity-60 grayscale" : "bg-white",
              isReversal && "border-indigo-200 bg-indigo-50/30",
            )}
          >
            {/* 1. ICON & DESCRIPTION */}
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  isIncome
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-rose-100 text-rose-600",
                  isDeleted && "bg-slate-200 text-slate-400",
                )}
                style={
                  !isDeleted && categoryMatch
                    ? { backgroundColor: `${catColor}20`, color: catColor }
                    : {}
                }
              >
                {isIncome ? (
                  <ArrowDownLeft className="w-5 h-5" />
                ) : (
                  <ArrowUpRight className="w-5 h-5" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4
                    className={cn(
                      "font-bold text-slate-800",
                      isDeleted && "line-through text-slate-400",
                    )}
                  >
                    {tx.title}
                  </h4>
                  {isReversal && (
                    <Badge className="bg-indigo-500/10 text-indigo-600 border-none text-[9px] px-1.5 h-4">
                      REVERSAL
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    {format(tx.dueDate, "MMM dd • hh:mm a")}
                  </span>
                  {isDeleted && (
                    <span className="text-[9px] text-rose-500 font-black uppercase flex items-center gap-0.5">
                      <Ban className="w-3 h-3" /> Voided
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 2. CATEGORY PILL */}
            <div className="hidden md:flex items-center">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider"
                style={{
                  borderColor: `${catColor}40`,
                  color: catColor,
                  backgroundColor: `${catColor}10`,
                }}
              >
                <Tag className="w-3 h-3" />
                {categoryMatch?.name || tx.category || "General"}
              </div>
            </div>

            {/* 3. AMOUNT & ACTIONS */}
            <div className="flex items-center gap-6">
              <div className="text-right">
                <p
                  className={cn(
                    "font-mono font-black text-lg",
                    isIncome ? "text-emerald-600" : "text-rose-600",
                    isDeleted && "text-slate-400",
                  )}
                >
                  {isIncome ? "+" : "-"}₱
                  {tx.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div className="w-8">
                {!isDeleted && !isReversal ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(tx._id)}
                    className="opacity-0 group-hover:opacity-100 h-8 w-8 text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <RotateCcw className="h-4 w-4 text-slate-200" />
                )}
              </div>
            </div>
          </div>
        );
      })}

      {transactions.length === 0 && (
        <div className="py-20 text-center border-2 border-dashed rounded-3xl">
          <p className="text-slate-400 font-medium">
            No transactions found for this period.
          </p>
        </div>
      )}
    </div>
  );
}
