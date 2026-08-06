"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  CalendarClock,
  TrendingUp,
  AlertCircle,
  Loader2,
  Wallet,
  Info,
  CreditCard,
  Search,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  isWithinInterval,
  format,
} from "date-fns";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTransactionStore } from "@/app/store/use-transaction-store";

const isDueInRange = (
  dueDateValue: number,
  rangeStart: Date,
  rangeEnd: Date,
) => {
  const dueDay =
    dueDateValue > 31 ? new Date(dueDateValue).getDate() : dueDateValue;
  const date1 = new Date(
    rangeStart.getFullYear(),
    rangeStart.getMonth(),
    dueDay,
  );
  const date2 = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), dueDay);
  return (
    isWithinInterval(date1, { start: rangeStart, end: rangeEnd }) ||
    isWithinInterval(date2, { start: rangeStart, end: rangeEnd })
  );
};

interface BreakdownItem {
  creditId?: Id<"credits">;
  name: string;
  amount: number;
  dueDate?: number;
  category?: string;
  type: "credit" | "transaction";
}

export function FinancialOverview() {
  const summary = useQuery(api.financials.getFinancialSummary);
  const transactions = useQuery(api.financials.getTransactions);
  const credits = useQuery(api.credits.getCreditSummary);
  const { onOpen: openTransactionModal } = useTransactionStore();

  const [selectedStatTitle, setSelectedStatTitle] = useState<string | null>(null);
  const [modalSearchQuery, setModalSearchQuery] = useState("");

  if (
    summary === undefined ||
    transactions === undefined ||
    credits === undefined
  ) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08] border-b border-white/[0.08]">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 space-y-3 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-white/10 rounded" />
              <div className="h-5 w-12 bg-white/10 rounded-full" />
            </div>
            <div className="h-7 w-28 bg-white/20 rounded" />
            <div className="h-3 w-32 bg-white/10 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const now = new Date();
  const rangeWeek = { start: startOfWeek(now), end: endOfWeek(now) };
  const rangeMonth = { start: startOfMonth(now), end: endOfMonth(now) };
  const rangeNextMonth = {
    start: startOfMonth(addMonths(now, 1)),
    end: endOfMonth(addMonths(now, 1)),
  };

  const calculateData = (
    range: { start: Date; end: Date },
    isNextMonthForecast = false,
  ) => {
    const breakdown: BreakdownItem[] = [];

    const financialsDueList = transactions.filter(
      (t) =>
        t.status === "pending" && isWithinInterval(new Date(t.dueDate), range),
    );
    financialsDueList.forEach((t) =>
      breakdown.push({
        name: t.title,
        amount: t.amount,
        dueDate: t.dueDate,
        category: t.category,
        type: "transaction",
      }),
    );

    credits.forEach((c) => {
      if (c.remainingBalance <= 0) return;

      if (isDueInRange(c.dueDate, range.start, range.end)) {
        const installment = c.monthlyInstallment || c.remainingBalance;
        const currentDue = Math.min(installment, c.remainingBalance);

        // Compute actual due date timestamp for display
        const dueDay = c.dueDate > 31 ? new Date(c.dueDate).getDate() : c.dueDate;
        const actualDueDate = new Date(
          range.start.getFullYear(),
          range.start.getMonth(),
          Math.min(dueDay, 28)
        ).getTime();

        if (isNextMonthForecast) {
          const projectedBalanceAfterThisMonth =
            c.remainingBalance - currentDue;
          if (projectedBalanceAfterThisMonth > 0) {
            const nextMonthDue = Math.min(
              installment,
              projectedBalanceAfterThisMonth,
            );
            breakdown.push({
              creditId: c._id as Id<"credits">,
              name: c.creditorName,
              amount: nextMonthDue,
              dueDate: actualDueDate,
              category: c.category,
              type: "credit",
            });
          }
        } else {
          const alreadyPaidForThisInThisRange = transactions
            .filter(
              (t) =>
                (t.status === "completed" || t.status === "paid") &&
                t.title.toLowerCase().includes(c.creditorName.toLowerCase()) &&
                isWithinInterval(new Date(t.dueDate), range),
            )
            .reduce((sum, t) => sum + t.amount, 0);

          const remainingToPay = Math.max(
            0,
            currentDue - alreadyPaidForThisInThisRange,
          );

          if (remainingToPay > 0) {
            breakdown.push({
              creditId: c._id as Id<"credits">,
              name: c.creditorName,
              amount: remainingToPay,
              dueDate: actualDueDate,
              category: c.category,
              type: "credit",
            });
          }
        }
      }
    });

    const totalDue = breakdown.reduce((sum, item) => sum + item.amount, 0);

    const financialsPaid = transactions
      .filter(
        (t) =>
          (t.status === "completed" || t.status === "paid") &&
          isWithinInterval(new Date(t.dueDate), range),
      )
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      due: totalDue,
      paid: financialsPaid,
      breakdown: breakdown.sort((a, b) => {
        const timeA = a.dueDate || Infinity;
        const timeB = b.dueDate || Infinity;
        if (timeA !== timeB) {
          return timeA - timeB; // Nearest due date first!
        }
        return b.amount - a.amount; // Secondary tie-breaker: higher amount first
      }),
    };
  };

  const week = calculateData(rangeWeek);
  const month = calculateData(rangeMonth);
  const nextMonth = calculateData(rangeNextMonth, true);

  const formatPHP = (amount: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      maximumFractionDigits: 0,
    }).format(amount);

  const stats = [
    {
      title: "This Week",
      due: week.due,
      paid: week.paid,
      breakdown: week.breakdown,
      icon: AlertCircle,
      accent: "bg-rose-500",
      textColor: "text-rose-400",
      description: "Immediate obligations due this week",
    },
    {
      title: "This Month",
      due: month.due,
      paid: month.paid,
      breakdown: month.breakdown,
      icon: Wallet,
      accent: "bg-amber-500",
      textColor: "text-[#ff6b35]",
      description: "Monthly budget target and installments",
    },
    {
      title: "Next Month",
      due: nextMonth.due,
      paid: nextMonth.paid,
      breakdown: nextMonth.breakdown,
      icon: CalendarClock,
      accent: "bg-blue-500",
      textColor: "text-blue-400",
      description: "Forecasted load for upcoming month",
    },
    {
      title: "Lifetime",
      due: credits.reduce((sum, c) => sum + c.remainingBalance, 0),
      paid: transactions
        .filter((t) => t.status === "completed" || t.status === "paid")
        .reduce((sum, t) => sum + t.amount, 0),
      breakdown: [],
      icon: TrendingUp,
      accent: "bg-slate-300 dark:bg-slate-200",
      textColor: "text-slate-300",
      description: "Total debt vs total paid across lifetime",
    },
  ];

  const activeStat = stats.find((s) => s.title === selectedStatTitle);

  const filteredModalBreakdown = activeStat
    ? activeStat.breakdown.filter(
      (b) =>
        b.name.toLowerCase().includes(modalSearchQuery.toLowerCase()) ||
        (b.category && b.category.toLowerCase().includes(modalSearchQuery.toLowerCase()))
    )
    : [];

  const handlePayNow = (item: BreakdownItem) => {
    setSelectedStatTitle(null);
    if (item.type === "credit") {
      openTransactionModal(
        `Payment for ${item.name}`,
        "Debt Payment",
        item.creditId || null,
        item.amount
      );
    } else {
      openTransactionModal(
        item.name,
        item.category || "General",
        null,
        item.amount
      );
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-white/[0.06]">
        {stats.map((stat) => (
          <div
            key={stat.title}
            onClick={() => {
              if (stat.breakdown.length > 0) {
                setSelectedStatTitle(stat.title);
                setModalSearchQuery("");
              }
            }}
            className={cn(
              "group relative bg-[#1a1a2e] px-6 py-5 hover:bg-[#1f1f38] transition-colors duration-200",
              stat.breakdown.length > 0 && "cursor-pointer"
            )}
          >
            {/* Accent top bar */}
            <div
              className={cn(
                "absolute top-0 left-0 right-0 h-[2px]",
                stat.accent,
              )}
            />

            <div className="flex items-center justify-between mb-3">
              {/* Icon */}
              <div className="p-1.5 rounded-lg bg-white/[0.06]">
                <stat.icon className="h-3.5 w-3.5 text-white/50" />
              </div>
              {/* % pill */}
              <div className="px-2 py-0.5 rounded-full text-[9px] font-black tracking-tighter bg-white/[0.06] text-emerald-400 flex items-center gap-1">
                {stat.due + stat.paid > 0
                  ? ((stat.paid / (stat.due + stat.paid)) * 100).toFixed(0)
                  : 0}
                %
              </div>
            </div>

            <div className="flex items-center justify-between gap-1.5 mb-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/40">
                {stat.title}
              </p>
              {stat.breakdown.length > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStatTitle(stat.title);
                    setModalSearchQuery("");
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#ff6b35]/20 hover:bg-[#ff6b35]/30 text-[9px] font-extrabold text-[#ff6b35] border border-[#ff6b35]/30 transition-all"
                >
                  <Info className="h-3 w-3" />
                  <span>{stat.breakdown.length} due</span>
                </button>
              )}
            </div>

            <h3 className="text-xl font-black font-mono tracking-tight text-white mb-3">
              {formatPHP(stat.due)}
            </h3>

            <div className="pt-3 border-t border-white/[0.06] flex justify-between items-center">
              <div>
                <p className="text-[9px] font-bold uppercase text-white/25 mb-0.5">
                  Already Paid
                </p>
                <p className="text-sm font-bold font-mono text-emerald-400">
                  {formatPHP(stat.paid)}
                </p>
              </div>
              {stat.breakdown.length > 0 && (
                <span className="text-[10px] font-bold text-slate-400 group-hover:text-[#ff6b35] transition-colors flex items-center gap-0.5">
                  View Details <ExternalLink className="w-3 h-3" />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* EXPANDED DETAILED DIALOG MODAL */}
      {activeStat && (
        <Dialog
          open={!!selectedStatTitle}
          onOpenChange={(open) => {
            if (!open) setSelectedStatTitle(null);
          }}
        >
          <DialogContent className="w-[94vw] sm:max-w-[92vw] lg:max-w-6xl xl:max-w-7xl max-h-[90vh] bg-slate-900 border-slate-800 text-slate-100 p-4 sm:p-6 shadow-2xl rounded-2xl flex flex-col">
            <DialogHeader className="border-b border-slate-800 pb-4 shrink-0">
              <div className="flex items-center justify-between pr-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-[#ff6b35]/15 text-[#ff6b35]">
                    <activeStat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <DialogTitle className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                      {activeStat.title} Obligations
                    </DialogTitle>
                    <DialogDescription className="text-xs font-semibold text-slate-400">
                      {activeStat.description}
                    </DialogDescription>
                  </div>
                </div>

                <Badge variant="outline" className="text-xs font-mono font-bold bg-[#ff6b35]/10 text-[#ff6b35] border-[#ff6b35]/30 px-3 py-1 shrink-0">
                  {filteredModalBreakdown.length} {filteredModalBreakdown.length === 1 ? "Item" : "Items"}
                </Badge>
              </div>

              {/* Summary Stats Strip inside Dialog */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-4">
                <div className="bg-slate-800/60 p-2.5 sm:p-3 rounded-xl border border-slate-700/50">
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 mb-0.5">Remaining Due</p>
                  <p className="text-sm sm:text-lg font-black font-mono text-rose-400">{formatPHP(activeStat.due)}</p>
                </div>
                <div className="bg-slate-800/60 p-2.5 sm:p-3 rounded-xl border border-slate-700/50">
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 mb-0.5">Settled Paid</p>
                  <p className="text-sm sm:text-lg font-black font-mono text-emerald-400">{formatPHP(activeStat.paid)}</p>
                </div>
                <div className="bg-slate-800/60 p-2.5 sm:p-3 rounded-xl border border-slate-700/50">
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400 mb-0.5">Scheduled Items</p>
                  <p className="text-sm sm:text-lg font-black font-mono text-amber-400">{activeStat.breakdown.length} total</p>
                </div>
              </div>
            </DialogHeader>

            {/* Search Filter inside Modal */}
            <div className="py-3 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <Input
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  placeholder="Search by creditor name or category..."
                  className="pl-9 bg-slate-800/70 border-slate-700 text-slate-100 placeholder:text-slate-500 rounded-xl h-10 text-xs focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                />
              </div>
            </div>

            {/* Detailed Items Responsive Grid List */}
            <div className="flex-1 overflow-y-auto pr-1">
              {filteredModalBreakdown.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <CheckCircle2 className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs font-bold">No obligations matching your search</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredModalBreakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-800/50 hover:bg-slate-800/90 border border-slate-700/60 transition-all flex flex-col justify-between space-y-3 shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-extrabold text-white leading-snug break-words">
                            {item.name}
                          </h4>
                          {item.category && (
                            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#ff6b35]/15 text-[#ff6b35] border border-[#ff6b35]/30 shrink-0">
                              {item.category}
                            </span>
                          )}
                        </div>

                        {item.dueDate && (
                          <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
                            <CalendarClock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Due: {format(new Date(item.dueDate), "MMM dd, yyyy")}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-700/60 pt-3">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-slate-400 block leading-none mb-1">
                            Amount Due
                          </span>
                          <span className="text-base font-black font-mono text-amber-400">
                            {formatPHP(item.amount)}
                          </span>
                        </div>

                        <Button
                          type="button"
                          onClick={() => handlePayNow(item)}
                          className="bg-[#ff6b35] hover:bg-[#e05a2b] text-white font-extrabold text-xs px-4 h-9 rounded-xl shadow-lg shadow-[#ff6b35]/20 flex items-center gap-1.5 transition-all shrink-0"
                        >
                          <CreditCard className="w-3.5 h-3.5" /> Pay Now
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
