"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarClock,
  TrendingUp,
  AlertCircle,
  Loader2,
  Wallet,
  Info,
  ArrowUpRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addMonths,
  isWithinInterval,
} from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";

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

export function FinancialOverview() {
  const summary = useQuery(api.financials.getFinancialSummary);
  const transactions = useQuery(api.financials.getTransactions);
  const credits = useQuery(api.credits.getCreditSummary);

  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  if (
    summary === undefined ||
    transactions === undefined ||
    credits === undefined
  ) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500/40" />
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
    const breakdown: { name: string; amount: number }[] = [];

    const financialsDueList = transactions.filter(
      (t) =>
        t.status === "pending" && isWithinInterval(new Date(t.dueDate), range),
    );
    financialsDueList.forEach((t) =>
      breakdown.push({ name: t.title, amount: t.amount }),
    );

    credits.forEach((c) => {
      if (c.remainingBalance <= 0) return;

      if (isDueInRange(c.dueDate, range.start, range.end)) {
        const installment = c.monthlyInstallment || c.remainingBalance;
        const currentDue = Math.min(installment, c.remainingBalance);

        if (isNextMonthForecast) {
          const projectedBalanceAfterThisMonth =
            c.remainingBalance - currentDue;
          if (projectedBalanceAfterThisMonth > 0) {
            const nextMonthDue = Math.min(
              installment,
              projectedBalanceAfterThisMonth,
            );
            breakdown.push({ name: c.creditorName, amount: nextMonthDue });
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
            breakdown.push({ name: c.creditorName, amount: remainingToPay });
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
      breakdown: breakdown.sort((a, b) => b.amount - a.amount),
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
      lightAccent: "bg-rose-50 dark:bg-rose-950/30",
      textColor: "text-rose-600 dark:text-rose-400",
      description: "Immediate obligations",
    },
    {
      title: "This Month",
      due: month.due,
      paid: month.paid,
      breakdown: month.breakdown,
      icon: Wallet,
      accent: "bg-amber-500",
      lightAccent: "bg-amber-50 dark:bg-amber-950/30",
      textColor: "text-amber-600 dark:text-amber-400",
      description: "Monthly budget target",
    },
    {
      title: "Next Month",
      due: nextMonth.due,
      paid: nextMonth.paid,
      breakdown: nextMonth.breakdown,
      icon: CalendarClock,
      accent: "bg-blue-500",
      lightAccent: "bg-blue-50 dark:bg-blue-950/30",
      textColor: "text-blue-600 dark:text-blue-400",
      description: "Forecasted load",
    },
    {
      title: "Lifetime",
      due: credits.reduce((sum, c) => sum + c.remainingBalance, 0),
      paid: transactions
        .filter((t) => t.status === "completed" || t.status === "paid")
        .reduce((sum, t) => sum + t.amount, 0),
      breakdown: [],
      icon: TrendingUp,
      accent: "bg-slate-900 dark:bg-white",
      isDark: true,
      description: "Total debt vs total paid",
    },
  ];

  return (
    <TooltipProvider skipDelayDuration={0} delayDuration={0}>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className={cn(
              "group relative overflow-hidden border-none shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 rounded-[24px]",
              stat.isDark
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-white dark:bg-slate-950",
            )}
          >
            {/* Top Accent Strip */}
            <div
              className={cn("absolute top-0 left-0 right-0 h-1", stat.accent)}
            />

            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div
                  className={cn(
                    "p-2 rounded-xl",
                    stat.isDark
                      ? "bg-white/10 dark:bg-slate-100"
                      : stat.lightAccent,
                  )}
                >
                  <stat.icon
                    className={cn(
                      "h-4 w-4",
                      stat.isDark
                        ? "text-white dark:text-slate-900"
                        : stat.textColor,
                    )}
                  />
                </div>

                {/* Progress Mini Pill */}
                <div
                  className={cn(
                    "px-2 py-0.5 rounded-full text-[9px] font-black tracking-tighter flex items-center gap-1",
                    stat.isDark
                      ? "bg-white/10 text-emerald-400"
                      : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30",
                  )}
                >
                  {stat.due + stat.paid > 0
                    ? ((stat.paid / (stat.due + stat.paid)) * 100).toFixed(0)
                    : 0}
                  %
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-40">
                    {stat.title}
                  </p>
                  {stat.breakdown.length > 0 && (
                    <Tooltip
                      open={activeTooltip === stat.title}
                      onOpenChange={(open) => {
                        if (open) setActiveTooltip(stat.title);
                        else setActiveTooltip(null);
                      }}
                      delayDuration={0}
                    >
                      <TooltipTrigger asChild>
                        <button
                          className="p-1 -m-1 cursor-help outline-none touch-manipulation"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setActiveTooltip(
                              activeTooltip === stat.title ? null : stat.title,
                            );
                          }}
                        >
                          <Info className="h-3 w-3 opacity-30 hover:opacity-100 transition-opacity" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent
                        side="bottom"
                        align="start"
                        // Prevent the tooltip from closing immediately when clicking inside it
                        onPointerDownOutside={(e) => {
                          if (activeTooltip === stat.title) {
                            // Optional: handle closing here if needed
                          }
                        }}
                        className="w-64 p-4 rounded-2xl shadow-2xl border border-slate-100 bg-white dark:bg-slate-900 dark:border-slate-800 z-50"
                      >
                        <p className="text-[10px] font-black uppercase mb-2 text-slate-400 border-b border-slate-50 dark:border-slate-800 pb-1">
                          Breakdown
                        </p>
                        <div className="space-y-1.5">
                          {stat.breakdown.map((item, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center text-[10px]"
                            >
                              <span className="text-slate-500 font-medium truncate max-w-30">
                                {item.name}
                              </span>
                              <span className="font-bold font-mono text-slate-900 dark:text-white">
                                {formatPHP(item.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>

                <h3 className="text-xl font-black font-mono tracking-tight">
                  {formatPHP(stat.due)}
                </h3>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-50 dark:border-white/5 flex items-end justify-between">
                <div>
                  <p className="text-[9px] font-bold uppercase opacity-40 mb-0.5">
                    Already Paid
                  </p>
                  <p
                    className={cn(
                      "text-sm font-bold font-mono",
                      stat.isDark ? "text-emerald-400" : "text-emerald-500",
                    )}
                  >
                    {formatPHP(stat.paid)}
                  </p>
                </div>
                <div
                  className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center transition-transform group-hover:rotate-12",
                    stat.isDark
                      ? "bg-white/5"
                      : "bg-slate-50 dark:bg-slate-900",
                  )}
                >
                  <ArrowUpRight className="h-3 w-3 opacity-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}
