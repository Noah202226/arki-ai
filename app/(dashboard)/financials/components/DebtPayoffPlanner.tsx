"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Flame,
  Zap,
  TrendingDown,
  TrendingUp,
  CalendarCheck,
  Award,
  ArrowRight,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { addMonths, format } from "date-fns";

type StrategyMode = "snowball" | "avalanche";

export function DebtPayoffPlanner() {
  const credits = useQuery(api.credits.getCreditSummary);
  const [strategy, setStrategy] = useState<StrategyMode>("snowball");
  const [extraPayment, setExtraPayment] = useState<number>(1000);

  const activeCredits = useMemo(() => {
    if (!credits) return [];
    return credits.filter((c) => c.remainingBalance > 0);
  }, [credits]);

  const totalRemainingDebt = useMemo(() => {
    return activeCredits.reduce((sum, c) => sum + c.remainingBalance, 0);
  }, [activeCredits]);

  const totalBaseMonthly = useMemo(() => {
    return activeCredits.reduce((sum, c) => sum + (c.monthlyInstallment || 0), 0);
  }, [activeCredits]);

  // Payoff sequence calculations
  const sortedPlan = useMemo(() => {
    if (activeCredits.length === 0) return [];

    // Clone array
    const plan = [...activeCredits];

    if (strategy === "snowball") {
      // Snowball: Smallest remaining balance first
      plan.sort((a, b) => a.remainingBalance - b.remainingBalance);
    } else {
      // Avalanche: Highest monthly installment / liability first
      plan.sort(
        (a, b) =>
          (b.monthlyInstallment || b.remainingBalance) -
          (a.monthlyInstallment || a.remainingBalance)
      );
    }

    let runningTotalBudget = totalBaseMonthly + extraPayment;
    let accumulatedMonths = 0;

    return plan.map((item, idx) => {
      const monthlyForThis = (item.monthlyInstallment || 0) + (idx === 0 ? extraPayment : 0);
      const estMonths =
        monthlyForThis > 0
          ? Math.max(1, Math.ceil(item.remainingBalance / monthlyForThis))
          : 12;

      accumulatedMonths += estMonths;
      const targetPayoffDate = addMonths(new Date(), accumulatedMonths);

      return {
        ...item,
        step: idx + 1,
        allocatedMonthly: monthlyForThis,
        estMonths,
        targetPayoffDate,
      };
    });
  }, [activeCredits, strategy, extraPayment, totalBaseMonthly]);

  const projectedDebtFreeDate = useMemo(() => {
    if (sortedPlan.length === 0) return null;
    const maxMonths = Math.max(...sortedPlan.map((p) => p.estMonths));
    return addMonths(new Date(), Math.max(1, maxMonths));
  }, [sortedPlan]);

  if (!credits) {
    return (
      <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 animate-pulse space-y-4">
        <div className="h-6 w-48 bg-slate-800 rounded-lg" />
        <div className="h-24 bg-slate-800 rounded-2xl" />
      </div>
    );
  }

  return (
    <Card className="p-6 rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-[#ff6b35]/15 text-[#ff6b35]">
              <Flame className="w-4 h-4" />
            </span>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Debt Payoff Strategy &amp; Accelerator
            </h3>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Calculate your optimal payoff order to eliminate ₱
            {totalRemainingDebt.toLocaleString()} of debt as fast as possible.
          </p>
        </div>

        {/* Strategy Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shrink-0">
          <button
            onClick={() => setStrategy("snowball")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5",
              strategy === "snowball"
                ? "bg-[#ff6b35] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <Zap className="w-3.5 h-3.5" /> Snowball (Quick Wins)
          </button>
          <button
            onClick={() => setStrategy("avalanche")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5",
              strategy === "avalanche"
                ? "bg-[#ff6b35] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            <Flame className="w-3.5 h-3.5" /> Avalanche (Highest Burden)
          </button>
        </div>
      </div>      {/* SMART DEBT-REDUCTION SUGGESTIONS, HABITS & INCOME ACCELERATION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Smart Suggestions &amp; Action Plan
          </h4>
          <Badge variant="outline" className="text-[10px] font-bold border-amber-500/30 text-amber-500 bg-amber-500/5">
            Strategy &amp; Growth Engine
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Card 1: Dynamic Strategy Advice */}
          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400">
                {strategy === "snowball" ? <Zap className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
              </span>
              <h5 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                {strategy === "snowball" ? "Snowball Momentum Strategy" : "Avalanche Cost Saver Strategy"}
              </h5>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {strategy === "snowball"
                ? "Channel 100% of your extra payment toward your smallest balance first. Once paid off, roll over that entire payment to target #2 for rapid psychological wins."
                : "Tackle your highest monthly installment/interest liability first to minimize long-term cash flow drain and eliminate high-cost debts faster."}
            </p>
          </div>

          {/* Card 2: 2x No-Spend Days Habit */}
          <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <CalendarCheck className="w-4 h-4" />
              </span>
              <h5 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                Habit: 2x Weekly "No-Spend" Days
              </h5>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Commit to 2 non-consecutive days each week with ₱0 non-essential spending. Redirect micro-savings directly into your monthly extra contribution slider below.
            </p>
          </div>

          {/* Card 3: Auto-Debit Minimums */}
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <TrendingDown className="w-4 h-4" />
              </span>
              <h5 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                Habit: Automate Base, Boost Manually
              </h5>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Automate minimum payments across all active loans to avoid late fees. On payday, manually deposit your planned extra contribution to Priority Target #1 immediately.
            </p>
          </div>

          {/* Card 4: Cut Recurring Leaks */}
          <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-rose-500/20 text-rose-600 dark:text-rose-400">
                <ShieldAlert className="w-4 h-4" />
              </span>
              <h5 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                Strategy: Trim Subscriptions &amp; Dining
              </h5>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Perform a monthly audit on unused subscriptions and food delivery apps. Cutting even ₱1,500/mo in recurring costs shortens your payoff timeline significantly.
            </p>
          </div>
        </div>

        {/* INCOME EXPANSION & MOTIVATION BOOSTER */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 border border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-500">
                <TrendingUp className="w-4 h-4" />
              </span>
              <h5 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                Income Acceleration &amp; Psychological Momentum
              </h5>
            </div>
            <Badge className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider">
              Growth Engine
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="space-y-1.5 bg-white/50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800">
              <span className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                🚀 3 Income-Increasing Tactics
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                <li><strong className="text-slate-800 dark:text-slate-200">High-Value Freelancing / Side Gigs</strong>: Monetize 5-10 hrs/week in design, coding, or consulting to directly fund your Extra Contribution Slider.</li>
                <li><strong className="text-slate-800 dark:text-slate-200">One-Time Asset Liquidations</strong>: Sell unused tech, appliances, or clothes for an instant ₱5,000–₱20,000 debt payoff boost.</li>
                <li><strong className="text-slate-800 dark:text-slate-200">Skill-Up for Promotions</strong>: Negotiate a raise or target higher-paying positions using newly added project portfolio achievements.</li>
              </ul>
            </div>

            <div className="space-y-1.5 bg-white/50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200/50 dark:border-slate-800">
              <span className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                🧠 Why Extra Income Drives Debt Motivation
              </span>
              <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
                <li><strong className="text-slate-800 dark:text-slate-200">Timeline Compression Effect</strong>: Adding just ₱3,000/mo extra income can cut your payoff timeline by months, giving immediate visual progress.</li>
                <li><strong className="text-slate-800 dark:text-slate-200">Financial Control High</strong>: Earning active extra income shifts your mindset from "debt survival" to proactive wealth creation.</li>
                <li><strong className="text-slate-800 dark:text-slate-200">Freed Cash Flow Compounder</strong>: Once a single debt is eliminated with side income, that monthly installment transforms into pure disposable investment capital!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* METRIC HIGHLIGHTS & EXTRA PAYMENT SLIDER */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left: Metric Summary Cards */}
        <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 space-y-1">
            <span className="text-[9px] font-black uppercase tracking-wider block">
              Active Debt Count
            </span>
            <span className="text-xl font-black font-mono block">
              {activeCredits.length} {activeCredits.length === 1 ? "Loan" : "Loans"}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 space-y-1">
            <span className="text-[9px] font-black uppercase tracking-wider block">
              Base Monthly Burden
            </span>
            <span className="text-xl font-black font-mono block">
              ₱{totalBaseMonthly.toLocaleString()}/mo
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[9px] font-black uppercase tracking-wider block">
              Debt-Free Target
            </span>
            <span className="text-sm font-black font-mono block mt-1">
              {projectedDebtFreeDate ? format(projectedDebtFreeDate, "MMM yyyy") : "N/A"}
            </span>
          </div>
        </div>

        {/* Right: Extra Monthly Payment Accelerator Slider */}
        <div className="md:col-span-5 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#ff6b35]" /> Extra Monthly Contribution
            </span>
            <span className="text-xs font-mono font-black text-[#ff6b35]">
              +₱{extraPayment.toLocaleString()} / mo
            </span>
          </div>

          <Slider
            value={[extraPayment]}
            min={0}
            max={10000}
            step={500}
            onValueChange={(val) => setExtraPayment(val[0])}
            className="[&_[role=slider]]:bg-[#ff6b35] [&_[role=slider]]:border-[#ff6b35]"
          />

          <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
            Adding extra payment accelerates your target payoff date and saves interest.
          </p>
        </div>
      </div>

      {/* RECOMMENDED PAYOFF SEQUENCE */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <Award className="w-3.5 h-3.5 text-[#ff6b35]" />
            Recommended Payoff Order ({strategy === "snowball" ? "Lowest Balance First" : "Highest Burden First"})
          </h4>
          <span className="text-[10px] font-bold text-slate-500">
            {sortedPlan.length} Steps
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {sortedPlan.map((item) => (
            <div
              key={item._id}
              className={cn(
                "p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 relative overflow-hidden",
                item.step === 1
                  ? "bg-[#ff6b35]/10 border-[#ff6b35]/50 dark:bg-[#ff6b35]/15 shadow-sm"
                  : "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800"
              )}
            >
              {item.step === 1 && (
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[#ff6b35] text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
                  Priority Target #1
                </span>
              )}

              <div className="flex items-start gap-3">
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center font-mono font-black text-xs shrink-0",
                    item.step === 1
                      ? "bg-[#ff6b35] text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  )}
                >
                  #{item.step}
                </div>

                <div className="min-w-0 flex-1">
                  <h5 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate leading-tight">
                    {item.creditorName}
                  </h5>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                    {item.category || "General Credit"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/40 dark:border-slate-700/40">
                <div>
                  <span className="text-[8px] font-extrabold uppercase text-slate-400 block">
                    Remaining
                  </span>
                  <span className="text-xs font-mono font-black text-rose-500">
                    ₱{item.remainingBalance.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-extrabold uppercase text-slate-400 block">
                    Est. Payoff Date
                  </span>
                  <span className="text-xs font-mono font-extrabold text-emerald-500">
                    {format(item.targetPayoffDate, "MMM yyyy")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
