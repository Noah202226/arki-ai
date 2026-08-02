"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sparkles,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { startOfMonth, endOfMonth } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";

export function BudgetLimitsWidget() {
  const budgets = useQuery(api.budgets.getBudgets) || [];
  const transactions = useQuery(api.financials.getTransactions) || [];
  const categories = useQuery(api.categories.getCategories, {}) || [];
  const setCapMutation = useMutation(api.budgets.setBudgetCap);
  const removeCapMutation = useMutation(api.budgets.removeBudgetCap);

  const [openModal, setOpenModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Food & Dining");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [monthlyCapInput, setMonthlyCapInput] = useState<string>("10000");

  // Calculate current month's spending per category
  const monthlySpendingMap = useMemo(() => {
    const start = startOfMonth(new Date()).getTime();
    const end = endOfMonth(new Date()).getTime();
    const map = new Map<string, number>();

    transactions.forEach((tx) => {
      if (
        !tx.isDeleted &&
        tx.type === "expense" &&
        tx.dueDate >= start &&
        tx.dueDate <= end
      ) {
        const cat = (tx.category || "General").trim();
        const current = map.get(cat) || 0;
        map.set(cat, current + tx.amount);
      }
    });

    return map;
  }, [transactions]);

  const budgetItems = useMemo(() => {
    return budgets.map((b) => {
      const spent = monthlySpendingMap.get(b.category) || 0;
      const cap = b.monthlyCap || 1;
      const pct = Math.min(100, Math.round((spent / cap) * 100));
      return {
        ...b,
        spent,
        pct,
        isOver: pct >= 100,
        isWarning: pct >= 75 && pct < 100,
      };
    }).sort((a, b) => b.pct - a.pct);
  }, [budgets, monthlySpendingMap]);

  const handleSaveBudget = async () => {
    const finalCategory = selectedCategory === "+ Custom..." ? customCategory.trim() : selectedCategory;
    const capNum = parseFloat(monthlyCapInput);

    if (!finalCategory) {
      toast.error("Please enter or select a category.");
      return;
    }
    if (isNaN(capNum) || capNum <= 0) {
      toast.error("Please enter a valid monthly cap amount.");
      return;
    }

    try {
      await setCapMutation({
        category: finalCategory,
        monthlyCap: capNum,
      });
      toast.success(`Budget cap for "${finalCategory}" saved!`);
      setOpenModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to set budget cap.";
      toast.error(msg);
    }
  };

  const handleRemove = async (id: Id<"budgets">) => {
    try {
      await removeCapMutation({ id });
      toast.success("Budget cap removed.");
    } catch (err) {
      toast.error("Failed to remove budget cap.");
    }
  };

  return (
    <Card className="p-6 rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#ff6b35]/15 text-[#ff6b35]">
              <PieChart className="w-4 h-4" />
            </span>
            Monthly Category Budget Caps &amp; Alerts
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor real-time monthly spending vs target spending limits.
          </p>
        </div>

        <Button
          onClick={() => setOpenModal(true)}
          className="bg-[#ff6b35] hover:bg-[#e05a2b] text-white font-extrabold text-xs rounded-xl shadow-sm gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Set Budget Cap
        </Button>
      </div>

      {/* BUDGET ITEMS GRID */}
      {budgetItems.length === 0 ? (
        <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <Sliders className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-extrabold text-slate-600 dark:text-slate-400">
            No Category Budget Caps Set Yet
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            Set spending caps on categories like Food, Utilities, or Subscriptions to avoid overspending.
          </p>
          <Button
            onClick={() => setOpenModal(true)}
            variant="outline"
            className="mt-4 text-xs font-bold border-[#ff6b35] text-[#ff6b35] hover:bg-[#ff6b35]/10 rounded-xl"
          >
            + Set Your First Cap
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {budgetItems.map((item) => (
            <div
              key={item._id}
              className={cn(
                "p-4 rounded-2xl border transition-all space-y-3 relative group",
                item.isOver
                  ? "bg-rose-500/10 border-rose-500/30"
                  : item.isWarning
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  {item.isOver ? (
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  ) : item.isWarning ? (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  )}
                  {item.category}
                </span>

                <button
                  onClick={() => handleRemove(item._id)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity p-1"
                  title="Remove cap"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Spent</span>
                  <span className="text-sm font-mono font-black text-slate-900 dark:text-slate-100">
                    ₱{item.spent.toLocaleString()}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Target Cap</span>
                  <span className="text-sm font-mono font-bold text-slate-500 dark:text-slate-400">
                    ₱{item.monthlyCap.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[9px] font-bold">
                  <span className={cn(item.isOver ? "text-rose-500 font-extrabold" : "text-slate-400")}>
                    {item.isOver ? "⚠️ OVER BUDGET" : item.isWarning ? "⚡ NEAR LIMIT" : "On Track"}
                  </span>
                  <span className={cn(item.isOver ? "text-rose-500 font-black" : "text-slate-400")}>
                    {item.pct}%
                  </span>
                </div>
                <Progress
                  value={item.pct}
                  className={cn(
                    "h-2 bg-slate-200 dark:bg-slate-800",
                    item.isOver
                      ? "[&>div]:bg-rose-500"
                      : item.isWarning
                      ? "[&>div]:bg-amber-500"
                      : "[&>div]:bg-emerald-500"
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DIALOG TO ADD / EDIT CAP */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="w-[94vw] sm:max-w-md bg-slate-900 border-slate-800 text-slate-100 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#ff6b35]" /> Set Monthly Category Budget Cap
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Define a maximum monthly spending limit for a specific expense category.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-300">Select Category</Label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl p-2.5 outline-none focus:border-[#ff6b35]"
              >
                {["Food & Dining", "Utilities & Bills", "Subscriptions", "Shopping & Retail", "Entertainment & Leisure", "Transportation", "+ Custom..."].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {selectedCategory === "+ Custom..." && (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-300">Custom Category Name</Label>
                <Input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g., Groceries"
                  className="bg-slate-800 border-slate-700 text-xs rounded-xl text-white"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-300">Monthly Budget Cap (₱)</Label>
              <Input
                type="number"
                value={monthlyCapInput}
                onChange={(e) => setMonthlyCapInput(e.target.value)}
                placeholder="10000"
                className="bg-slate-800 border-slate-700 text-xs rounded-xl text-white font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              variant="ghost"
              onClick={() => setOpenModal(false)}
              className="text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveBudget}
              className="bg-[#ff6b35] hover:bg-[#e05a2b] text-white font-extrabold text-xs rounded-xl"
            >
              Save Cap
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
