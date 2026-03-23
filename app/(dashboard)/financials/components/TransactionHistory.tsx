// components/financials/TransactionHistory.tsx
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns"; // npm install date-fns

export function TransactionHistory() {
  const transactions = useQuery(api.financials.getTransactions);

  if (!transactions) return <div>Loading history...</div>;

  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 dark:bg-slate-900 border-b">
          <tr>
            <th className="p-3 text-left">Description</th>
            <th className="p-3 text-left">Category</th>
            <th className="p-3 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx._id} className="border-b">
              <td className="p-3">
                <p className="font-medium">{tx.title}</p>
                <p className="text-xs text-muted-foreground">
                  {format(tx._creationTime, "MMM dd, yyyy")}
                </p>
              </td>
              <td className="p-3 uppercase text-xs font-semibold tracking-wider">
                {tx.type}
              </td>
              <td
                className={`p-3 text-right font-bold ${
                  tx.type === "income" ? "text-green-600" : "text-red-600"
                }`}
              >
                {tx.type === "income" ? "+" : "-"} ₱{tx.amount.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
