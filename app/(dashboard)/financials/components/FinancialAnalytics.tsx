"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { format, subDays, startOfDay } from "date-fns";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Lucide Icons
import {
  BarChart as LucideBarChart,
  PieChart as LucidePieChart,
  LineChart as LucideLineChart,
  DollarSign as LucideDollarSign,
  Calendar as LucideCalendar,
  ArrowUpRight as LucideArrowUpRight,
  ArrowDownLeft as LucideArrowDownLeft,
  Percent as LucidePercent,
  Sparkles as LucideSparkles,
  ShoppingBag,
  TrendingUp as LucideTrendingUp,
  TrendingDown as LucideTrendingDown,
  Activity,
} from "lucide-react";

type TimeRange = "7d" | "30d" | "90d" | "all";
type ViewMode = "overview" | "lines" | "bars" | "breakdown";

const CATEGORY_COLORS: Record<string, string> = {
  food: "#f59e0b",
  dining: "#f59e0b",
  utilities: "#3b82f6",
  bills: "#3b82f6",
  subscriptions: "#8b5cf6",
  salary: "#10b981",
  income: "#10b981",
  debt: "#ef4444",
  credit: "#ef4444",
  loan: "#ef4444",
  credentials: "#ef4444",
  freelance: "#14b8a6",
  transfer: "#64748b",
  shopping: "#ec4899",
  entertainment: "#a855f7",
  transport: "#06b6d4",
};

const DEFAULT_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // rose
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#64748b", // slate
];

export function FinancialAnalytics() {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredLineIndex, setHoveredLineIndex] = useState<number | null>(null);

  const transactions = useQuery(api.financials.getTransactions) || [];
  const categories = useQuery(api.categories.getCategories, {}) || [];

  const isTransferTx = (tx: { title?: string; category?: string }) => {
    const cat = (tx.category || "").toLowerCase().trim();
    const title = (tx.title || "").toLowerCase().trim();
    return (
      cat === "transfer" ||
      cat === "starting balance" ||
      title.includes("transfer to") ||
      title.includes("transfer from") ||
      title.includes("initial balance")
    );
  };

  const isCredentialsTx = (tx: { title?: string; category?: string }) => {
    const cat = (tx.category || "").toLowerCase().trim();
    const title = (tx.title || "").toLowerCase().trim();
    return (
      cat === "credentials" ||
      cat === "credential" ||
      cat === "credit disbursement" ||
      cat === "loan proceed" ||
      title.includes("credentials") ||
      title.includes("loan proceed") ||
      title.includes("disbursement")
    );
  };

  // Filter transactions based on time range (excluding internal wallet transfers)
  const filteredTransactions = useMemo(() => {
    const active = transactions.filter((tx) => !tx.isDeleted && !isTransferTx(tx));

    if (timeRange === "all") return active;

    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    const cutoff = subDays(startOfDay(new Date()), days).getTime();

    return active.filter((tx) => tx.dueDate >= cutoff);
  }, [transactions, timeRange]);

  // Overall Financial KPI Calculations (Differentiating Organic Earned Income vs Credentials/Loan Inflow)
  const metrics = useMemo(() => {
    let organicIncome = 0;
    let credentialsIncome = 0;
    let totalExpense = 0;

    filteredTransactions.forEach((tx) => {
      if (tx.type === "income") {
        if (isCredentialsTx(tx)) {
          credentialsIncome += tx.amount;
        } else {
          organicIncome += tx.amount;
        }
      } else if (tx.type === "expense" || tx.type === "payment") {
        totalExpense += tx.amount;
      }
    });

    const totalIncome = organicIncome; // Real Organic Revenue
    const netCashflow = organicIncome - totalExpense;
    const savingsRate =
      organicIncome > 0 ? Math.round(((organicIncome - totalExpense) / organicIncome) * 100) : 0;

    return { organicIncome, credentialsIncome, totalIncome, totalExpense, netCashflow, savingsRate };
  }, [filteredTransactions]);

  // Category Breakdown for Donut / Pie Chart & Ranking
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, { name: string; amount: number; color: string; count: number }> = {};

    filteredTransactions.forEach((tx) => {
      if (tx.type !== "expense") return;
      const catName = tx.category || "General";
      const key = catName.toLowerCase();

      if (!map[key]) {
        const match = categories.find((c) => c.name.toLowerCase() === key);
        const color =
          match?.color ||
          CATEGORY_COLORS[key] ||
          DEFAULT_COLORS[Object.keys(map).length % DEFAULT_COLORS.length];
        map[key] = { name: catName, amount: 0, color, count: 0 };
      }

      map[key].amount += tx.amount;
      map[key].count += 1;
    });

    const items = Object.values(map).sort((a, b) => b.amount - a.amount);
    const totalSpent = items.reduce((sum, item) => sum + item.amount, 0);

    return items.map((item) => ({
      ...item,
      percentage: totalSpent > 0 ? Math.round((item.amount / totalSpent) * 100) : 0,
    }));
  }, [filteredTransactions, categories]);

  // Daily/Periodic Cashflow Data for Bar & Line Charts
  const chartData = useMemo(() => {
    const map: Record<string, { label: string; income: number; expense: number; dateTs: number }> = {};

    filteredTransactions.forEach((tx) => {
      if (isCredentialsTx(tx)) return;

      const dateKey = format(tx.dueDate, "yyyy-MM-dd");
      const dateLabel = format(tx.dueDate, "MMM dd");

      if (!map[dateKey]) {
        map[dateKey] = { label: dateLabel, income: 0, expense: 0, dateTs: tx.dueDate };
      }

      if (tx.type === "income") {
        map[dateKey].income += tx.amount;
      } else if (tx.type === "expense" || tx.type === "payment") {
        map[dateKey].expense += tx.amount;
      }
    });

    const sorted = Object.values(map).sort((a, b) => a.dateTs - b.dateTs);

    if (sorted.length > 14) {
      return sorted.slice(sorted.length - 14);
    }
    return sorted;
  }, [filteredTransactions]);

  const maxChartValue = useMemo(() => {
    let max = 0;
    chartData.forEach((d) => {
      if (d.income > max) max = d.income;
      if (d.expense > max) max = d.expense;
    });
    return max || 1;
  }, [chartData]);

  // Trend Slope / Growth Rate calculation
  const trendAnalysis = useMemo(() => {
    if (chartData.length < 2) {
      return { incomeTrend: 0, expenseTrend: 0, incomeUp: true, expenseUp: false };
    }

    const mid = Math.floor(chartData.length / 2);
    const firstHalf = chartData.slice(0, mid);
    const secondHalf = chartData.slice(mid);

    const firstHalfIncome = firstHalf.reduce((sum, d) => sum + d.income, 0);
    const secondHalfIncome = secondHalf.reduce((sum, d) => sum + d.income, 0);

    const firstHalfExpense = firstHalf.reduce((sum, d) => sum + d.expense, 0);
    const secondHalfExpense = secondHalf.reduce((sum, d) => sum + d.expense, 0);

    const incomeTrend =
      firstHalfIncome > 0
        ? Math.round(((secondHalfIncome - firstHalfIncome) / firstHalfIncome) * 100)
        : secondHalfIncome > 0
        ? 100
        : 0;

    const expenseTrend =
      firstHalfExpense > 0
        ? Math.round(((secondHalfExpense - firstHalfExpense) / firstHalfExpense) * 100)
        : secondHalfExpense > 0
        ? 100
        : 0;

    return {
      incomeTrend,
      expenseTrend,
      incomeUp: incomeTrend >= 0,
      expenseUp: expenseTrend >= 0,
    };
  }, [chartData]);

  // SVG Line Chart Coordinate Points Calculation
  const lineCoords = useMemo(() => {
    if (chartData.length === 0) return { incomePoints: "", expensePoints: "", points: [] };

    const svgWidth = 500;
    const svgHeight = 160;
    const paddingX = 25;
    const paddingY = 20;

    const usableWidth = svgWidth - paddingX * 2;
    const usableHeight = svgHeight - paddingY * 2;

    const stepX = chartData.length > 1 ? usableWidth / (chartData.length - 1) : usableWidth;

    const points = chartData.map((d, idx) => {
      const x = paddingX + idx * stepX;
      const incomeY = svgHeight - paddingY - (d.income / maxChartValue) * usableHeight;
      const expenseY = svgHeight - paddingY - (d.expense / maxChartValue) * usableHeight;
      return { x, incomeY, expenseY, label: d.label, income: d.income, expense: d.expense };
    });

    const incomePoints = points.map((p) => `${p.x},${p.incomeY}`).join(" ");
    const expensePoints = points.map((p) => `${p.x},${p.expenseY}`).join(" ");

    // Create closed polygon paths for subtle area gradient fills
    const firstX = points[0]?.x || paddingX;
    const lastX = points[points.length - 1]?.x || svgWidth - paddingX;
    const bottomY = svgHeight - paddingY;

    const incomeArea = `${firstX},${bottomY} ${incomePoints} ${lastX},${bottomY}`;
    const expenseArea = `${firstX},${bottomY} ${expensePoints} ${lastX},${bottomY}`;

    return { incomePoints, expensePoints, incomeArea, expenseArea, points };
  }, [chartData, maxChartValue]);

  const totalExpenseAmount = useMemo(() => {
    return categoryBreakdown.reduce((sum, c) => sum + c.amount, 0);
  }, [categoryBreakdown]);

  const donutSegments = useMemo(() => {
    let cumulativePercent = 0;

    return categoryBreakdown.map((item) => {
      const startPercent = cumulativePercent;
      cumulativePercent += item.percentage;
      return {
        ...item,
        startPercent,
        endPercent: cumulativePercent,
      };
    });
  }, [categoryBreakdown]);

  return (
    <div className="w-full space-y-6">
      {/* ── TOP CONTROLS & TIMEFRAME SELECTOR ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#ff6b35]/10 text-[#ff6b35]">
            <LucideLineChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              Transaction Analytics &amp; Visual Reports
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive Income/Expense Trend Lines, Cash Flow Bars &amp; Category Breakdown
            </p>
          </div>
        </div>

        {/* View Mode & Timeframe Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* View Mode selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setViewMode("overview")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                viewMode === "overview" ? "bg-white dark:bg-slate-900 text-[#ff6b35] shadow-xs" : "text-slate-500"
              )}
              title="Overview View"
            >
              Overview
            </button>
            <button
              onClick={() => setViewMode("lines")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                viewMode === "lines" ? "bg-white dark:bg-slate-900 text-[#ff6b35] shadow-xs" : "text-slate-500"
              )}
              title="Line Trend Chart"
            >
              <LucideLineChart className="w-3.5 h-3.5" /> Trend Line
            </button>
            <button
              onClick={() => setViewMode("bars")}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1",
                viewMode === "bars" ? "bg-white dark:bg-slate-900 text-[#ff6b35] shadow-xs" : "text-slate-500"
              )}
              title="Cash Flow Bar Chart"
            >
              <LucideBarChart className="w-3.5 h-3.5" /> Bar Chart
            </button>
          </div>

          {/* Timeframe Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            {(["7d", "30d", "90d", "all"] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 capitalize",
                  timeRange === range
                    ? "bg-[#ff6b35] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                )}
              >
                {range === "all" ? "All" : range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI METRICS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Real Organic Earned Income */}
        <Card className="p-3.5 rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
              Earned Revenue
            </span>
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <LucideArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 truncate">
              ₱{metrics.organicIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[9px] text-slate-400 mt-1">Salary, freelance &amp; sales</p>
        </Card>

        {/* Credentials / Borrowed Loan Inflow */}
        <Card className="p-3.5 rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
              Credentials Inflow
            </span>
            <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-500 shrink-0">
              <LucideDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-xl font-black font-mono text-indigo-400 truncate">
              ₱{metrics.credentialsIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[9px] text-indigo-400/80 mt-1 font-bold">Borrowed loan proceeds</p>
        </Card>

        {/* Total Expense */}
        <Card className="p-3.5 rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
              Total Expenses
            </span>
            <div className="p-1.5 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
              <LucideArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <p className="text-xl font-black font-mono text-rose-500 truncate">
              ₱{metrics.totalExpense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <p className="text-[9px] text-slate-400 mt-1">Outflow &amp; debt payments</p>
        </Card>

        {/* Net Organic Cashflow */}
        <Card className="p-3.5 rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate">
              Net Organic Flow
            </span>
            <div
              className={cn(
                "p-1.5 rounded-xl shrink-0",
                metrics.netCashflow >= 0
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-rose-500/10 text-rose-500"
              )}
            >
              <LucideDollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p
              className={cn(
                "text-xl font-black font-mono truncate",
                metrics.netCashflow >= 0
                  ? "text-slate-900 dark:text-slate-50"
                  : "text-rose-500"
              )}
            >
              {metrics.netCashflow >= 0 ? "+" : ""}₱
              {metrics.netCashflow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[9px] text-slate-400 mt-1">Earned minus expenses</p>
          </div>
        </Card>

        {/* Savings Margin */}
        <Card className="p-4 rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Savings Margin
            </span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <LucidePercent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-2xl font-black font-mono text-purple-600 dark:text-purple-400">
              {metrics.savingsRate}%
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Retained of total income</p>
          </div>
        </Card>
      </div>

      {/* ── NEW: INCOME & EXPENSE LINE TREND CHART CARD ── */}
      {(viewMode === "overview" || viewMode === "lines") && (
        <Card className="p-6 rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <LucideLineChart className="w-4 h-4 text-indigo-500" />
                Income vs. Expense Growth Trend Line
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Trajectory lines showing whether your income and expenses are increasing or decreasing over time
              </p>
            </div>

            {/* Legend & Trend Indicators */}
            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30 inline-block" />
                <span className="text-slate-700 dark:text-slate-300 font-bold">Income Line</span>
                {trendAnalysis.incomeTrend !== 0 && (
                  <span
                    className={cn(
                      "text-[9px] font-extrabold px-1 rounded",
                      trendAnalysis.incomeUp ? "text-emerald-600 bg-emerald-50" : "text-rose-500 bg-rose-50"
                    )}
                  >
                    {trendAnalysis.incomeUp ? "↑" : "↓"}
                    {Math.abs(trendAnalysis.incomeTrend)}%
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full bg-rose-500 ring-2 ring-rose-500/30 inline-block" />
                <span className="text-slate-700 dark:text-slate-300 font-bold">Expense Line</span>
                {trendAnalysis.expenseTrend !== 0 && (
                  <span
                    className={cn(
                      "text-[9px] font-extrabold px-1 rounded",
                      !trendAnalysis.expenseUp ? "text-emerald-600 bg-emerald-50" : "text-rose-500 bg-rose-50"
                    )}
                  >
                    {trendAnalysis.expenseUp ? "↑" : "↓"}
                    {Math.abs(trendAnalysis.expenseTrend)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* SVG LINE GRAPH */}
          {chartData.length === 0 ? (
            <div className="h-52 flex flex-col items-center justify-center text-slate-400 text-xs">
              <Activity className="w-8 h-8 mb-2 opacity-50 text-indigo-500 animate-pulse" />
              No transaction data recorded for this timeframe.
            </div>
          ) : (
            <div className="relative mt-4 pt-2">
              <div className="w-full overflow-x-auto">
                <div className="min-w-[450px]">
                  <svg viewBox="0 0 500 160" className="w-full h-48 overflow-visible">
                    <defs>
                      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal Grid lines */}
                    <line x1="20" y1="20" x2="480" y2="20" stroke="currentColor" strokeDasharray="3 3" className="text-slate-200 dark:text-slate-800" />
                    <line x1="20" y1="80" x2="480" y2="80" stroke="currentColor" strokeDasharray="3 3" className="text-slate-200 dark:text-slate-800" />
                    <line x1="20" y1="140" x2="480" y2="140" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />

                    {/* Area Fills */}
                    {lineCoords.incomeArea && (
                      <polygon points={lineCoords.incomeArea} fill="url(#incomeGradient)" />
                    )}
                    {lineCoords.expenseArea && (
                      <polygon points={lineCoords.expenseArea} fill="url(#expenseGradient)" />
                    )}

                    {/* Income Polyline */}
                    {lineCoords.incomePoints && (
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={lineCoords.incomePoints}
                      />
                    )}

                    {/* Expense Polyline */}
                    {lineCoords.expensePoints && (
                      <polyline
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={lineCoords.expensePoints}
                      />
                    )}

                    {/* Interactive Data Points (Nodes) */}
                    {lineCoords.points.map((pt, i) => (
                      <g key={pt.label + i} className="group cursor-pointer">
                        {/* Income node */}
                        <circle
                          cx={pt.x}
                          cy={pt.incomeY}
                          r={hoveredLineIndex === i ? 6 : 4}
                          fill="#10b981"
                          stroke="#ffffff"
                          strokeWidth="2"
                          onMouseEnter={() => setHoveredLineIndex(i)}
                          onMouseLeave={() => setHoveredLineIndex(null)}
                          className="transition-all duration-200 hover:r-7"
                        />
                        {/* Expense node */}
                        <circle
                          cx={pt.x}
                          cy={pt.expenseY}
                          r={hoveredLineIndex === i ? 6 : 4}
                          fill="#ef4444"
                          stroke="#ffffff"
                          strokeWidth="2"
                          onMouseEnter={() => setHoveredLineIndex(i)}
                          onMouseLeave={() => setHoveredLineIndex(null)}
                          className="transition-all duration-200 hover:r-7"
                        />
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              {/* X-AXIS LABELS */}
              <div className="flex justify-between px-4 mt-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono">
                {lineCoords.points.map((p, idx) => (
                  <span key={p.label + idx} className="truncate text-center">
                    {p.label}
                  </span>
                ))}
              </div>

              {/* Hover Tooltip Popup for Line Nodes */}
              {hoveredLineIndex !== null && lineCoords.points[hoveredLineIndex] && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900 text-white dark:bg-slate-800 text-xs shadow-xl border border-slate-700 flex items-center justify-between animate-in fade-in">
                  <div className="font-bold text-slate-300">
                    Date: <span className="text-white font-mono">{lineCoords.points[hoveredLineIndex].label}</span>
                  </div>
                  <div className="flex gap-4 font-mono">
                    <span className="text-emerald-400 font-bold">
                      Income: +₱{lineCoords.points[hoveredLineIndex].income.toLocaleString()}
                    </span>
                    <span className="text-rose-400 font-bold">
                      Expense: -₱{lineCoords.points[hoveredLineIndex].expense.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* ── CHARTS SECTION (BAR + PIE SIDE BY SIDE) ── */}
      {(viewMode === "overview" || viewMode === "bars" || viewMode === "breakdown") && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* BAR CHART: INCOME vs EXPENSE */}
          {(viewMode === "overview" || viewMode === "bars") && (
            <Card
              className={cn(
                "p-6 rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between",
                viewMode === "bars" ? "lg:col-span-12" : "lg:col-span-7"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <LucideBarChart className="w-4 h-4 text-[#ff6b35]" />
                      Cash Flow Comparison (Income vs. Expense Bars)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Periodic distribution of cash inflow vs. outflow
                    </p>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-3 text-xs font-semibold">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
                      <span className="text-slate-600 dark:text-slate-400">Income</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-md bg-rose-500 inline-block" />
                      <span className="text-slate-600 dark:text-slate-400">Expense</span>
                    </div>
                  </div>
                </div>

                {/* BAR CHART GRAPH */}
                {chartData.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <LucideCalendar className="w-8 h-8 mb-2 opacity-50" />
                    No transaction data available for the selected timeframe.
                  </div>
                ) : (
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div className="h-60 flex items-end gap-2 sm:gap-3 px-2">
                      {chartData.map((item, idx) => {
                        const incomeHeight = Math.max(8, Math.round((item.income / maxChartValue) * 100));
                        const expenseHeight = Math.max(8, Math.round((item.expense / maxChartValue) * 100));
                        const isHovered = hoveredBarIndex === idx;

                        return (
                          <div
                            key={item.label + idx}
                            onMouseEnter={() => setHoveredBarIndex(idx)}
                            onMouseLeave={() => setHoveredBarIndex(null)}
                            className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                          >
                            {/* TOOLTIP POPUP */}
                            {isHovered && (
                              <div className="absolute -top-16 z-30 bg-slate-900 text-white dark:bg-slate-800 px-3 py-1.5 rounded-xl text-[11px] shadow-xl font-mono whitespace-nowrap border border-slate-700 animate-in fade-in zoom-in-95">
                                <p className="font-sans font-bold text-slate-300 border-b border-slate-700 pb-1 mb-1">
                                  {item.label}
                                </p>
                                <div className="flex justify-between gap-3 text-emerald-400">
                                  <span>In:</span>
                                  <span>+₱{item.income.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between gap-3 text-rose-400">
                                  <span>Out:</span>
                                  <span>-₱{item.expense.toLocaleString()}</span>
                                </div>
                              </div>
                            )}

                            {/* BARS CONTAINER */}
                            <div className="w-full flex items-end justify-center gap-1 h-48">
                              {/* Income Bar */}
                              <div
                                style={{ height: `${incomeHeight}%` }}
                                className={cn(
                                  "w-1/2 max-w-[16px] rounded-t-md bg-emerald-500 transition-all duration-300 group-hover:bg-emerald-400",
                                  item.income === 0 && "opacity-20 bg-slate-300 dark:bg-slate-700"
                                )}
                              />
                              {/* Expense Bar */}
                              <div
                                style={{ height: `${expenseHeight}%` }}
                                className={cn(
                                  "w-1/2 max-w-[16px] rounded-t-md bg-rose-500 transition-all duration-300 group-hover:bg-rose-400",
                                  item.expense === 0 && "opacity-20 bg-slate-300 dark:bg-slate-700"
                                )}
                              />
                            </div>

                            {/* DATE LABEL */}
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-2 truncate w-full text-center">
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* PIE / DONUT CHART: EXPENSE CATEGORY BREAKDOWN */}
          {(viewMode === "overview" || viewMode === "breakdown") && (
            <Card
              className={cn(
                "p-6 rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between",
                viewMode === "breakdown" ? "lg:col-span-12" : "lg:col-span-5"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <LucidePieChart className="w-4 h-4 text-[#ff6b35]" />
                      Category Expense Breakdown
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Proportion of spending by category
                    </p>
                  </div>
                </div>

                {categoryBreakdown.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <ShoppingBag className="w-8 h-8 mb-2 opacity-50" />
                    No expense transactions found for this period.
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row lg:flex-col items-center gap-6 mt-2">
                    {/* SVG DONUT CHART */}
                    <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                        {donutSegments.map((seg, i) => {
                          const strokeDasharray = `${seg.percentage} ${100 - seg.percentage}`;
                          const strokeDashoffset = -seg.startPercent;

                          return (
                            <circle
                              key={seg.name + i}
                              cx="50"
                              cy="50"
                              r="15.915"
                              fill="transparent"
                              stroke={seg.color}
                              strokeWidth="10"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              onMouseEnter={() => setHoveredCategory(seg.name)}
                              onMouseLeave={() => setHoveredCategory(null)}
                              className={cn(
                                "transition-all duration-300 cursor-pointer hover:opacity-80",
                                hoveredCategory === seg.name && "stroke-[12]"
                              )}
                            />
                          );
                        })}
                      </svg>

                      {/* CENTER OVERLAY */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Total Expenses
                        </span>
                        <span className="text-sm font-black font-mono text-slate-900 dark:text-slate-50">
                          ₱{totalExpenseAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* CATEGORY LEGEND LIST */}
                    <div className="w-full space-y-2.5 max-h-48 overflow-y-auto pr-1">
                      {categoryBreakdown.map((cat) => (
                        <div
                          key={cat.name}
                          onMouseEnter={() => setHoveredCategory(cat.name)}
                          onMouseLeave={() => setHoveredCategory(null)}
                          className={cn(
                            "flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer border",
                            hoveredCategory === cat.name
                              ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                              : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {cat.name}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold font-mono text-slate-900 dark:text-slate-100 block">
                              ₱{cat.amount.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {cat.percentage}% · {cat.count} {cat.count === 1 ? "tx" : "txs"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── TOP EXPENSE CATEGORIES RANKING ── */}
      {categoryBreakdown.length > 0 && (
        <Card className="p-6 rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <LucideSparkles className="w-4 h-4 text-[#ff6b35]" />
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Top Spending Categories Ranking
            </h4>
          </div>

          <div className="space-y-3">
            {categoryBreakdown.slice(0, 5).map((cat, idx) => (
              <div key={cat.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[10px] flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{cat.name}</span>
                  </div>
                  <span className="font-mono text-slate-900 dark:text-slate-100 font-bold">
                    ₱{cat.amount.toLocaleString()} ({cat.percentage}%)
                  </span>
                </div>
                {/* PROGRESS BAR */}
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
