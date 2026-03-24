"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { isToday, isYesterday, format } from "date-fns";

export function AccountFlow({ accountId }: { accountId: any }) {
  const transactions = useQuery(api.financials.getTransactionsByAccount, {
    accountId,
  });

  if (!transactions) return <div>Loading account history...</div>;

  // --- SORT DATA FIRST ---
  // b.dueDate - a.dueDate para sa Descending (Latest first)
  const sortedTransactions = [...transactions].sort(
    (a, b) => b.dueDate - a.dueDate,
  );

  const getGroupLabel = (timestamp: number) => {
    if (isToday(timestamp)) return "Today";
    if (isYesterday(timestamp)) return "Yesterday";
    return format(timestamp, "MMMM dd, yyyy");
  };

  return (
    <div className="space-y-2">
      {sortedTransactions.map((tx, index) => {
        const currentLabel = getGroupLabel(tx.dueDate);
        const previousLabel =
          index > 0
            ? getGroupLabel(sortedTransactions[index - 1].dueDate)
            : null;

        return (
          <div key={tx._id}>
            {/* Ipakita lang ang Date Header kung nagbago ang petsa */}
            {currentLabel !== previousLabel && (
              <div className="bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-500 uppercase sticky top-0">
                {currentLabel}
              </div>
            )}
            <div className="flex justify-between p-3 border-b items-center">
              <div className="flex flex-col">
                <span className="font-medium text-sm">{tx.title}</span>
                <span className="text-[10px] text-slate-500 uppercase tracking-wide">
                  {format(tx.dueDate, "MMM dd, yyyy • hh:mm a")}
                </span>
              </div>
              <div className="text-right">
                <p
                  className={`font-bold text-sm ${tx.type === "income" ? "text-green-600" : "text-red-600"}`}
                >
                  {tx.type === "income" ? "+" : "-"} ₱
                  {tx.amount.toLocaleString()}
                </p>
                <p className="text-[9px] text-slate-400 uppercase">
                  {tx.category}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
