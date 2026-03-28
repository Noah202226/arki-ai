// components/financials/TransactionHistory.tsx
"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns"; // npm install date-fns
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TransactionHistory() {
  const transactions = useQuery(api.financials.getAllTransactions);
  const removeTransaction = useMutation(api.financials.softDeleteTransaction);

  if (!transactions) return <Loader2 className="animate-spin" />;

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
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900 border-b">
          <tr>
            <th className="p-3 text-left">Description</th>
            <th className="p-3 text-left">Category</th>
            <th className="p-3 text-center">Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr
              key={tx._id}
              className="border-b hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td className="p-3">
                <p className="font-medium">{tx.title}</p>
                <p className="text-[10px] text-muted-foreground uppercase">
                  {format(tx.dueDate, "MMM dd, yyyy")}
                </p>
              </td>
              <td className="p-3 uppercase text-[10px] font-bold tracking-tighter opacity-60">
                {tx.type} - {tx.title}
              </td>

              <td
                className={`p-3 text-right font-mono font-bold ${
                  tx.type === "reversal"
                    ? "text-indigo-600"
                    : tx.type === "income"
                      ? "text-green-600"
                      : "text-red-600"
                }`}
              >
                {tx.type === "reversal"
                  ? "↺"
                  : tx.type === "income"
                    ? "+"
                    : "-"}{" "}
                ₱{tx.amount.toLocaleString()}
              </td>

              <td className="p-3 text-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-400 hover:text-red-600"
                  onClick={() => handleDelete(tx._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
