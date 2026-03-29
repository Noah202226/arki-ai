"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { toast } from "sonner";
import { Loader2, Trash2, RotateCcw, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function TransactionHistory() {
  const transactions = useQuery(api.financials.getAllTransactions);
  const removeTransaction = useMutation(api.financials.softDeleteTransaction);

  if (!transactions)
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-slate-400" />
      </div>
    );

  const handleDelete = async (id: any) => {
    const ok = confirm("Are you sure? This will revert the account balance.");
    if (ok) {
      try {
        await removeTransaction({ id });
        toast.success("Transaction deleted and balance reverted.");
      } catch (error) {
        toast.error("Failed to delete transaction.");
      }
    }
  };

  return (
    <div className="rounded-md border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900 border-b">
          <tr>
            <th className="p-3 text-left font-semibold">Description</th>
            <th className="p-3 text-left font-semibold">Category</th>
            <th className="p-3 text-right font-semibold">Amount</th>
            <th className="p-3 text-center font-semibold">Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => {
            const isReversal = tx.type === "reversal";
            const isDeleted = tx.isDeleted; // Assumes your schema has this field

            return (
              <tr
                key={tx._id}
                className={cn(
                  "border-b transition-colors",
                  isReversal
                    ? "bg-indigo-50/30 dark:bg-indigo-950/10"
                    : "hover:bg-slate-50/50",
                  isDeleted && "opacity-50 grayscale bg-slate-100/50",
                )}
              >
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn("font-medium", isDeleted && "line-through")}
                    >
                      {tx.title}
                    </p>
                    {isReversal && (
                      <Badge
                        variant="secondary"
                        className="text-[9px] h-4 bg-indigo-100 text-indigo-700 border-indigo-200"
                      >
                        REVERSED
                      </Badge>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground uppercase">
                    {format(tx.dueDate, "MMM dd, yyyy")}
                  </p>
                </td>

                <td className="p-3 uppercase text-[10px] font-bold tracking-tighter opacity-60">
                  {tx.type} - {tx.title}
                </td>

                <td
                  className={cn(
                    "p-3 text-right font-mono font-bold",
                    isReversal
                      ? "text-indigo-600"
                      : tx.type === "income"
                        ? "text-green-600"
                        : "text-red-600",
                    isDeleted && "text-slate-400",
                  )}
                >
                  {isReversal ? "↺" : tx.type === "income" ? "+" : "-"} ₱
                  {tx.amount.toLocaleString()}
                </td>

                <td className="p-3 text-center">
                  {/* Hide delete button if it's already a reversal or already deleted */}
                  {!isReversal && !isDeleted ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(tx._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="flex justify-center">
                      {isReversal ? (
                        <span title="Reversal entry" className="cursor-help">
                          <RotateCcw className="h-4 w-4 text-indigo-300" />
                        </span>
                      ) : (
                        <span title="Deleted" className="cursor-help">
                          <Ban className="h-4 w-4 text-slate-300" />
                        </span>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {transactions.length === 0 && (
        <div className="p-8 text-center text-muted-foreground text-sm">
          No transactions found.
        </div>
      )}
    </div>
  );
}
