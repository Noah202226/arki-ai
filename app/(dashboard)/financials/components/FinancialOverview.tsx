"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CalendarClock,
  TrendingUp,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Wallet,
  Info,
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

  if (
    summary === undefined ||
    transactions === undefined ||
    credits === undefined
  ) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
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

  const calculateData = (range: { start: Date; end: Date }) => {
    // Collect breakdown items
    const breakdown: { name: string; amount: number }[] = [];

    // 1. Manual pending bills
    const financialsDueList = transactions.filter(
      (t) =>
        t.status === "pending" && isWithinInterval(new Date(t.dueDate), range),
    );
    financialsDueList.forEach((t) =>
      breakdown.push({ name: t.title, amount: t.amount }),
    );

    // 2. Credits
    const creditsDueList = credits
      .filter((c) => c.remainingBalance > 0)
      .filter((c) => isDueInRange(c.dueDate, range.start, range.end));

    creditsDueList.forEach((c) => {
      const installment = c.monthlyInstallment || c.remainingBalance;
      const toPay = Math.min(installment, c.remainingBalance);
      breakdown.push({ name: c.creditorName, amount: toPay });
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
      breakdown: breakdown.sort((a, b) => b.amount - a.amount), // Sort by highest amount
    };
  };

  const week = calculateData(rangeWeek);
  const month = calculateData(rangeMonth);
  const nextMonth = calculateData(rangeNextMonth);

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
      color: "border-l-red-500",
      description: "Immediate obligations",
    },
    {
      title: "This Month",
      due: month.due,
      paid: month.paid,
      breakdown: month.breakdown,
      icon: Wallet,
      color: "border-l-orange-500",
      description: "Monthly budget target",
    },
    {
      title: "Next Month",
      due: nextMonth.due,
      paid: nextMonth.paid,
      breakdown: nextMonth.breakdown,
      icon: CalendarClock,
      color: "border-l-blue-500",
      description: "Forecasted load",
    },
    {
      title: "Total Lifetime",
      due: credits.reduce((sum, c) => sum + c.remainingBalance, 0),
      paid: transactions
        .filter((t) => t.status === "completed" || t.status === "paid")
        .reduce((sum, t) => sum + t.amount, 0),
      breakdown: [],
      icon: TrendingUp,
      color: "border-l-slate-900 dark:border-l-white",
      description: "Total debt vs total paid",
      isDark: true,
    },
  ];

  return (
    <TooltipProvider>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className={cn(
              "border-l-4 shadow-sm transition-all hover:shadow-md relative overflow-hidden",
              stat.color,
              stat.isDark &&
                "bg-slate-900 text-white dark:bg-white dark:text-slate-900",
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[11px] font-black uppercase tracking-wider opacity-70">
                {stat.title}
              </CardTitle>
              <stat.icon
                className={cn("h-4 w-4", !stat.isDark && "text-slate-400")}
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[10px] font-bold opacity-50 uppercase">
                    To Pay
                  </p>
                  {stat.breakdown.length > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 opacity-40 hover:opacity-100 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="p-3 bg-white text-slate-900 border shadow-xl"
                      >
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase border-b pb-1">
                            Breakdown
                          </p>
                          <div className="space-y-1.5">
                            {stat.breakdown.map((item, i) => (
                              <div
                                key={i}
                                className="flex justify-between gap-4 text-[11px]"
                              >
                                <span className="font-medium text-slate-500">
                                  {item.name}
                                </span>
                                <span className="font-bold font-mono">
                                  {formatPHP(item.amount)}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="border-t pt-1 flex justify-between gap-4 text-[11px] font-black">
                            <span>TOTAL</span>
                            <span className="text-orange-600">
                              {formatPHP(stat.due)}
                            </span>
                          </div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
                <div className="text-xl font-black font-mono">
                  {formatPHP(stat.due)}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-dashed border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-bold text-green-600 uppercase flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Paid
                  </p>
                  <span className="text-[10px] font-bold opacity-60">
                    {stat.due + stat.paid > 0
                      ? ((stat.paid / (stat.due + stat.paid)) * 100).toFixed(0)
                      : 0}
                    %
                  </span>
                </div>
                <div className="text-lg font-bold text-green-600 font-mono">
                  {formatPHP(stat.paid)}
                </div>
              </div>

              <p
                className={cn(
                  "text-[9px] mt-2 opacity-60 italic",
                  !stat.isDark && "text-muted-foreground",
                )}
              >
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
}
