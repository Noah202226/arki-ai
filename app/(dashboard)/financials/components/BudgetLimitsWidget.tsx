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

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";
import {
  PieChart,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Sparkles,
  Trash2,
  ArrowRightLeft,
  Coins,
  TrendingDown,
  ArrowRight,
  Eye,
  Pencil,
  Search,
  Receipt,
  Calendar,
  CreditCard,
  Tag,
} from "lucide-react";

// Helper keyword alias mapping for intelligent transaction category matching
const CATEGORY_ALIASES: Record<string, string[]> = {
  "food & dining": ["food", "dining", "groceries", "snack", "restaurant", "coffee", "drinks", "saging", "eats", "meal"],
  "utilities & bills": ["utilities", "bills", "water", "electricity", "electric", "internet", "wifi", "rent", "housing", "phone"],
  "subscriptions": ["subscriptions", "subscription", "software", "streaming", "netflix", "spotify", "saas"],
  "shopping & retail": ["shopping", "retail", "clothes", "fashion", "appliances", "gadgets", "online shopping"],
  "entertainment & leisure": ["entertainment", "leisure", "games", "movies", "hobbies", "travel", "date", "vacation"],
  "transportation": ["transportation", "transport", "gas", "fuel", "fare", "grab", "commute", "taxi", "car", "parking"],
};

export function BudgetLimitsWidget() {
  const budgets = useQuery(api.budgets.getBudgets) || [];
  const transactions = useQuery(api.financials.getTransactions) || [];
  const categories = useQuery(api.categories.getCategories, {}) || [];
  const setCapMutation = useMutation(api.budgets.setBudgetCap);
  const removeCapMutation = useMutation(api.budgets.removeBudgetCap);
  const transferMutation = useMutation(api.budgets.transferBudgetBalance);
  const deleteTransactionMutation = useMutation(api.financials.softDeleteTransaction);

  // Detail Modal State
  const [selectedDetailCategory, setSelectedDetailCategory] = useState<string | null>(null);
  const [detailSearchQuery, setDetailSearchQuery] = useState<string>("");

  // Edit Budget Cap State inside Detail Modal / Card
  const [isEditingCapInline, setIsEditingCapInline] = useState(false);
  const [inlineCapInput, setInlineCapInput] = useState<string>("");

  // Set Budget Cap Modal State
  const [openModal, setOpenModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("Food & Dining");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [monthlyCapInput, setMonthlyCapInput] = useState<string>("10000");

  // Transfer Saved Balance Modal State
  const [openTransferModal, setOpenTransferModal] = useState(false);
  const [transferFromCategory, setTransferFromCategory] = useState<string>("");
  const [transferToCategory, setTransferToCategory] = useState<string>("Travel & Date");
  const [customTargetCategory, setCustomTargetCategory] = useState<string>("");
  const [transferAmountInput, setTransferAmountInput] = useState<string>("");
  const [transferNoteInput, setTransferNoteInput] = useState<string>("");

  // Calculate current month's spending & mapped transactions per budget category using smart matching
  const { monthlySpendingMap, monthlyTransactionsMap } = useMemo(() => {
    const start = startOfMonth(new Date()).getTime();
    const end = endOfMonth(new Date()).getTime();
    const spendingMap = new Map<string, number>();
    const txMap = new Map<string, typeof transactions>();

    const activeBudgets = budgets.map((b) => b.category);

    transactions.forEach((tx) => {
      if (
        !tx.isDeleted &&
        tx.type === "expense" &&
        tx.dueDate >= start &&
        tx.dueDate <= end
      ) {
        const txCatRaw = (tx.category || "General").trim();
        const txCatLower = txCatRaw.toLowerCase();

        // 1. Try exact match first
        let matchedCategory = activeBudgets.find(
          (bCat) => bCat.toLowerCase() === txCatLower
        );

        // 2. Try alias keyword matching if exact match not found
        if (!matchedCategory) {
          matchedCategory = activeBudgets.find((bCat) => {
            const bCatLower = bCat.toLowerCase();
            const aliases = CATEGORY_ALIASES[bCatLower] || [];
            return (
              aliases.includes(txCatLower) ||
              txCatLower.includes(bCatLower) ||
              bCatLower.includes(txCatLower)
            );
          });
        }

        const targetCat = matchedCategory || txCatRaw;
        const current = spendingMap.get(targetCat) || 0;
        spendingMap.set(targetCat, current + tx.amount);

        const categoryTxs = txMap.get(targetCat) || [];
        categoryTxs.push(tx);
        txMap.set(targetCat, categoryTxs);
      }
    });

    return { monthlySpendingMap: spendingMap, monthlyTransactionsMap: txMap };
  }, [transactions, budgets]);

  const budgetItems = useMemo(() => {
    return budgets
      .map((b) => {
        const spent = monthlySpendingMap.get(b.category) || 0;
        const rollover = b.rolloverAmount || 0;
        const effectiveCap = (b.monthlyCap || 0) + rollover;
        const capForPct = Math.max(1, effectiveCap);
        const remaining = effectiveCap - spent;
        const pct = Math.min(100, Math.round((spent / capForPct) * 100));

        return {
          ...b,
          spent,
          rollover,
          effectiveCap,
          remaining,
          pct,
          isOver: remaining < 0,
          isWarning: remaining >= 0 && pct >= 75,
        };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [budgets, monthlySpendingMap]);

  const handleSaveBudget = async () => {
    const finalCategory =
      selectedCategory === "+ Custom..." ? customCategory.trim() : selectedCategory;
    const capNum = parseFloat(monthlyCapInput);

    if (!finalCategory) {
      toast.error("Please enter or select a category.");
      return;
    }
    if (isNaN(capNum) || capNum < 0) {
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
      setCustomCategory("");
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

  const openTransferDialogForCategory = (item: (typeof budgetItems)[0]) => {
    setTransferFromCategory(item.category);
    // Suggest remaining amount if positive
    const initialAmount = item.remaining > 0 ? item.remaining.toString() : "";
    setTransferAmountInput(initialAmount);
    setOpenTransferModal(true);
  };

  const handleExecuteTransfer = async () => {
    const amountNum = parseFloat(transferAmountInput);
    const finalTargetCat =
      transferToCategory === "+ Custom Tab..."
        ? customTargetCategory.trim()
        : transferToCategory;

    if (!transferFromCategory) {
      toast.error("Please select a source category.");
      return;
    }
    if (!finalTargetCat) {
      toast.error("Please enter or select a target category/tab.");
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid transfer amount greater than 0.");
      return;
    }

    try {
      await transferMutation({
        fromCategory: transferFromCategory,
        toCategory: finalTargetCat,
        amount: amountNum,
        note: transferNoteInput.trim() || undefined,
      });
      toast.success(
        `Successfully transferred ₱${amountNum.toLocaleString()} from ${transferFromCategory} to ${finalTargetCat}!`
      );
      setOpenTransferModal(false);
      setTransferAmountInput("");
      setTransferNoteInput("");
      setCustomTargetCategory("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to transfer budget.";
      toast.error(msg);
    }
  };

  const selectedDetailBudgetItem = useMemo(() => {
    if (!selectedDetailCategory) return null;
    return budgetItems.find((b) => b.category === selectedDetailCategory) || null;
  }, [selectedDetailCategory, budgetItems]);

  const selectedCategoryTransactions = useMemo(() => {
    if (!selectedDetailCategory) return [];
    const list = monthlyTransactionsMap.get(selectedDetailCategory) || [];
    if (!detailSearchQuery.trim()) return list;
    const q = detailSearchQuery.toLowerCase();
    return list.filter(
      (tx) =>
        tx.title.toLowerCase().includes(q) ||
        (tx.category && tx.category.toLowerCase().includes(q))
    );
  }, [selectedDetailCategory, monthlyTransactionsMap, detailSearchQuery]);

  const handleSoftDeleteTx = async (id: Id<"financials">) => {
    try {
      await deleteTransactionMutation({ id });
      toast.success("Transaction voided & account balance restored.");
    } catch (err) {
      toast.error("Failed to delete transaction.");
    }
  };

  const handleSaveInlineCap = async (category: string) => {
    const num = parseFloat(inlineCapInput);
    if (isNaN(num) || num < 0) {
      toast.error("Please enter a valid cap amount.");
      return;
    }
    try {
      await setCapMutation({ category, monthlyCap: num });
      toast.success(`Budget cap for "${category}" updated to ₱${num.toLocaleString()}`);
      setIsEditingCapInline(false);
    } catch (err) {
      toast.error("Failed to update budget cap.");
    }
  };

  return (
    <Card className="p-6 rounded-3xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#ff6b35]/15 text-[#ff6b35]">
              <PieChart className="w-4 h-4" />
            </span>
            Monthly Category Budget Caps &amp; Rollover
          </h3>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Track expenses dynamically per category, view remaining balances, and transfer saved funds between tabs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {budgetItems.length > 0 && (
            <Button
              onClick={() => {
                const firstWithSavings = budgetItems.find((b) => b.remaining > 0);
                if (firstWithSavings) {
                  openTransferDialogForCategory(firstWithSavings);
                } else if (budgetItems[0]) {
                  openTransferDialogForCategory(budgetItems[0]);
                }
              }}
              variant="outline"
              className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs rounded-xl gap-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-[#ff6b35]" /> Transfer Saved
            </Button>
          )}

          <Button
            onClick={() => setOpenModal(true)}
            className="bg-[#ff6b35] hover:bg-[#e05a2b] text-white font-extrabold text-xs rounded-xl shadow-sm gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Set Budget Cap
          </Button>
        </div>
      </div>

      {/* BUDGET ITEMS GRID */}
      {budgetItems.length === 0 ? (
        <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <Sliders className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-xs font-extrabold text-slate-600 dark:text-slate-400">
            No Category Budget Caps Set Yet
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            Set spending limits on Food, Utilities, or Subscriptions to track spent vs remaining balance automatically.
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
                "p-4 rounded-2xl border transition-all space-y-3 relative group hover:border-[#ff6b35]/40 cursor-pointer",
                item.isOver
                  ? "bg-rose-500/10 border-rose-500/30"
                  : item.isWarning
                  ? "bg-amber-500/10 border-amber-500/30"
                  : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800"
              )}
              onClick={() => setSelectedDetailCategory(item.category)}
            >
              {/* CARD TOP BAR */}
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

                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => {
                      setSelectedDetailCategory(item.category);
                      setInlineCapInput((item.monthlyCap || 0).toString());
                    }}
                    className="opacity-90 hover:opacity-100 bg-slate-200/70 dark:bg-slate-700/60 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1"
                    title="View transactions & detailed breakdown"
                  >
                    <Eye className="w-3 h-3 text-[#ff6b35]" /> View Details
                  </button>

                  <button
                    onClick={() => openTransferDialogForCategory(item)}
                    className="opacity-90 hover:opacity-100 bg-slate-200/70 dark:bg-slate-700/60 hover:bg-[#ff6b35]/20 text-slate-600 dark:text-slate-300 hover:text-[#ff6b35] text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1"
                    title="Transfer saved remaining amount"
                  >
                    <ArrowRightLeft className="w-3 h-3" /> Transfer
                  </button>

                  <button
                    onClick={() => handleRemove(item._id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-500 transition-opacity p-1"
                    title="Remove cap"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* CARD NUMBERS GRID */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Spent</span>
                  <span className="text-xs sm:text-sm font-mono font-black text-rose-500 dark:text-rose-400">
                    ₱{item.spent.toLocaleString()}
                  </span>
                </div>

                <div className="text-center">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">
                    {item.rollover !== 0 ? "Total Cap (Adj)" : "Budget Cap"}
                  </span>
                  <span className="text-xs sm:text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
                    ₱{item.effectiveCap.toLocaleString()}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">Remaining</span>
                  <span
                    className={cn(
                      "text-xs sm:text-sm font-mono font-black",
                      item.remaining < 0
                        ? "text-rose-500"
                        : item.remaining === 0
                        ? "text-slate-400"
                        : "text-emerald-500"
                    )}
                  >
                    {item.remaining < 0 ? `-₱${Math.abs(item.remaining).toLocaleString()}` : `₱${item.remaining.toLocaleString()}`}
                  </span>
                </div>
              </div>

              {/* PROGRESS BAR & ALERT BADGE */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[9px] font-bold">
                  <span className={cn(item.isOver ? "text-rose-500 font-extrabold" : "text-slate-400")}>
                    {item.isOver
                      ? "⚠️ OVER BUDGET"
                      : item.isWarning
                      ? "⚡ NEAR LIMIT"
                      : item.remaining > 0
                      ? `✨ Saved: ₱${item.remaining.toLocaleString()}`
                      : "On Track"}
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

      {/* DIALOG TO SET BUDGET CAP */}
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
                {[
                  "Food & Dining",
                  "Utilities & Bills",
                  "Subscriptions",
                  "Shopping & Retail",
                  "Entertainment & Leisure",
                  "Transportation",
                  "+ Custom...",
                ].map((c) => (
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
                  placeholder="e.g., Travel or Groceries"
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

      {/* DIALOG TO TRANSFER SAVED BUDGET BALANCE */}
      <Dialog open={openTransferModal} onOpenChange={setOpenTransferModal}>
        <DialogContent className="w-[94vw] sm:max-w-md bg-slate-900 border-slate-800 text-slate-100 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-emerald-400" /> Transfer Saved / Leftover Budget
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Move unspent funds from one budget category to another tab (e.g. Travel, Date, or Savings).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* SOURCE CATEGORY */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-300">Transfer From (Source Budget)</Label>
              <select
                value={transferFromCategory}
                onChange={(e) => {
                  setTransferFromCategory(e.target.value);
                  const matched = budgetItems.find((b) => b.category === e.target.value);
                  if (matched && matched.remaining > 0) {
                    setTransferAmountInput(matched.remaining.toString());
                  }
                }}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl p-2.5 outline-none focus:border-[#ff6b35]"
              >
                {budgetItems.map((b) => (
                  <option key={b._id} value={b.category}>
                    {b.category} (Remaining: ₱{b.remaining.toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {/* TARGET CATEGORY */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-300">Transfer To (Destination Tab / Category)</Label>
              <select
                value={transferToCategory}
                onChange={(e) => setTransferToCategory(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-xl p-2.5 outline-none focus:border-[#ff6b35]"
              >
                {[
                  "Travel & Vacation",
                  "Date & Night Out",
                  "Emergency Savings",
                  "Entertainment & Leisure",
                  "Shopping & Retail",
                  "+ Custom Tab...",
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {transferToCategory === "+ Custom Tab..." && (
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-300">Custom Target Name</Label>
                <Input
                  value={customTargetCategory}
                  onChange={(e) => setCustomTargetCategory(e.target.value)}
                  placeholder="e.g., Japan Trip Savings"
                  className="bg-slate-800 border-slate-700 text-xs rounded-xl text-white"
                />
              </div>
            )}

            {/* AMOUNT TO TRANSFER */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-300">Transfer Amount (₱)</Label>
              <Input
                type="number"
                value={transferAmountInput}
                onChange={(e) => setTransferAmountInput(e.target.value)}
                placeholder="1000"
                className="bg-slate-800 border-slate-700 text-xs rounded-xl text-white font-mono"
              />
            </div>

            {/* NOTE / REASON */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-300">Note / Reason (Optional)</Label>
              <Input
                value={transferNoteInput}
                onChange={(e) => setTransferNoteInput(e.target.value)}
                placeholder="e.g., End of month leftover food budget"
                className="bg-slate-800 border-slate-700 text-xs rounded-xl text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <Button
              variant="ghost"
              onClick={() => setOpenTransferModal(false)}
              className="text-xs font-bold text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExecuteTransfer}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl gap-1.5"
            >
              Confirm Transfer <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG FOR DETAILED CATEGORY TRANSACTIONS & EDITING */}
      <Dialog
        open={!!selectedDetailCategory}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDetailCategory(null);
            setIsEditingCapInline(false);
            setDetailSearchQuery("");
          }
        }}
      >
        <DialogContent className="w-[94vw] sm:max-w-[92vw] lg:max-w-4xl xl:max-w-5xl max-h-[90vh] bg-slate-900 border-slate-800 text-slate-100 rounded-2xl p-6 flex flex-col gap-4">
          {selectedDetailBudgetItem && (
            <>
              <DialogHeader className="border-b border-slate-800 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <DialogTitle className="text-xl font-black text-white flex items-center gap-2">
                        <Tag className="w-5 h-5 text-[#ff6b35]" />
                        {selectedDetailBudgetItem.category}
                      </DialogTitle>
                      <span
                        className={cn(
                          "text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider",
                          selectedDetailBudgetItem.isOver
                            ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                            : selectedDetailBudgetItem.isWarning
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        )}
                      >
                        {selectedDetailBudgetItem.isOver
                          ? "Over Budget"
                          : selectedDetailBudgetItem.isWarning
                          ? "Near Limit"
                          : "On Track"}
                      </span>
                    </div>
                    <DialogDescription className="text-xs text-slate-400 mt-1">
                      Detailed expense list for this category during the current month ({format(new Date(), "MMMM yyyy")}).
                    </DialogDescription>
                  </div>

                  {/* Inline Cap Editor */}
                  {!isEditingCapInline ? (
                    <Button
                      onClick={() => {
                        setIsEditingCapInline(true);
                        setInlineCapInput((selectedDetailBudgetItem.monthlyCap || 0).toString());
                      }}
                      variant="outline"
                      className="border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl gap-1.5 shrink-0"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#ff6b35]" /> Edit Budget Cap
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2 bg-slate-800/80 p-2 rounded-xl border border-slate-700">
                      <span className="text-xs font-mono font-bold text-slate-400">₱</span>
                      <Input
                        type="number"
                        value={inlineCapInput}
                        onChange={(e) => setInlineCapInput(e.target.value)}
                        placeholder="Cap amount"
                        className="w-28 h-8 bg-slate-900 border-slate-700 text-xs font-mono text-white rounded-lg"
                      />
                      <Button
                        onClick={() => handleSaveInlineCap(selectedDetailBudgetItem.category)}
                        className="h-8 px-3 bg-[#ff6b35] hover:bg-[#e05a2b] text-white text-xs font-bold rounded-lg"
                      >
                        Save
                      </Button>
                      <Button
                        onClick={() => setIsEditingCapInline(false)}
                        variant="ghost"
                        className="h-8 px-2 text-slate-400 hover:text-white text-xs font-bold"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>

                {/* STATS OVERVIEW HEADER */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80">
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Spent This Month</span>
                    <p className="text-base font-mono font-black text-rose-400 mt-0.5">
                      ₱{selectedDetailBudgetItem.spent.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Monthly Cap Limit</span>
                    <p className="text-base font-mono font-bold text-slate-200 mt-0.5">
                      ₱{selectedDetailBudgetItem.effectiveCap.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Remaining Balance</span>
                    <p
                      className={cn(
                        "text-base font-mono font-black mt-0.5",
                        selectedDetailBudgetItem.remaining < 0 ? "text-rose-400" : "text-emerald-400"
                      )}
                    >
                      {selectedDetailBudgetItem.remaining < 0
                        ? `-₱${Math.abs(selectedDetailBudgetItem.remaining).toLocaleString()}`
                        : `₱${selectedDetailBudgetItem.remaining.toLocaleString()}`}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Transactions</span>
                    <p className="text-base font-mono font-bold text-slate-200 mt-0.5">
                      {selectedCategoryTransactions.length} item(s)
                    </p>
                  </div>
                </div>
              </DialogHeader>

              {/* SEARCH FILTER */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  value={detailSearchQuery}
                  onChange={(e) => setDetailSearchQuery(e.target.value)}
                  placeholder="Filter transactions by title or keyword..."
                  className="pl-9 bg-slate-800 border-slate-700 text-xs rounded-xl text-white placeholder:text-slate-500"
                />
              </div>

              {/* TRANSACTIONS SCROLLABLE LIST */}
              <div className="flex-1 overflow-y-auto max-h-[45vh] pr-1 space-y-2">
                {selectedCategoryTransactions.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl p-6">
                    <Receipt className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-400">No Transactions Found</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {detailSearchQuery
                        ? "No transactions match your search filter."
                        : `No expense transactions recorded under ${selectedDetailBudgetItem.category} for this month.`}
                    </p>
                  </div>
                ) : (
                  selectedCategoryTransactions.map((tx) => (
                    <div
                      key={tx._id}
                      className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between gap-4 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-100 truncate">{tx.title}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              {format(new Date(tx.dueDate), "MMM dd, yyyy · hh:mm a")}
                            </span>
                            {tx.category && (
                              <span className="bg-slate-700/60 text-slate-300 px-2 py-0.5 rounded-md font-mono">
                                {tx.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono font-black text-rose-400">
                          -₱{tx.amount.toLocaleString()}
                        </span>
                        <button
                          onClick={() => handleSoftDeleteTx(tx._id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                          title="Void transaction & restore balance"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
