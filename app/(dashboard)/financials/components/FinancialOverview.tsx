"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarClock, TrendingUp, AlertCircle, Loader2 } from "lucide-react";

export function FinancialOverview() {
  const summary = useQuery(api.financials.getFinancialSummary);

  // loading is undefined, not logged in or error is null
  if (summary === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // Kung null ang summary (dahil walang user), huwag muna mag-render ng kahit ano
  if (!summary) return null;

  const formatPHP = (amount: number) =>
    new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(amount);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* 1. THIS WEEK */}
      <Card className="border-l-4 border-l-red-500 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Due This Week</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPHP(summary.thisWeek.total)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {summary.thisWeek.items.length} pending items to pay
          </p>
        </CardContent>
      </Card>

      {/* 2. NEXT MONTH */}
      <Card className="border-l-4 border-l-blue-500 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Next Month Forecast
          </CardTitle>
          <CalendarClock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPHP(summary.nextMonth.total)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Planned subscriptions & bills
          </p>
        </CardContent>
      </Card>

      {/* 3. TOTAL LOAD */}
      <Card className="border-l-4 border-l-slate-800 dark:border-l-slate-200 shadow-sm bg-slate-900 text-white dark:bg-white dark:text-slate-900">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium opacity-80">
            Total Liability
          </CardTitle>
          <TrendingUp className="h-4 w-4 opacity-80" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatPHP(summary.grandTotal)}
          </div>
          <p className="text-xs opacity-60 mt-1">Short-term financial load</p>
        </CardContent>
      </Card>
    </div>
  );
}
