"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// Shadcn UI
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Icons
import {
  Plus,
  Loader2,
  Calendar as CalendarIcon,
  Wallet,
  ReceiptText,
  Tag,
  Zap,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Zustand Store
import { useTransactionStore } from "@/app/store/use-transaction-store";
import Link from "next/link";

export function AddTransactionDialog() {
  const { isOpen, onClose, initialData, onOpen } = useTransactionStore();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const addTransaction = useMutation(api.financials.addTransaction);
  const accounts = useQuery(api.accounts.getAccounts);

  const categories = useQuery(api.categories.getCategories, {
    type: undefined,
  });

  // Fetch custom quick chips from the database!
  const quickChips = useQuery(api.quickChips.getQuickChips);

  const [type, setType] = useState("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState<Date>(new Date());

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData.title || "");
      setType("expense");
      setDate(new Date());
      setAmount(initialData.amount ? String(initialData.amount) : "");

      // Auto-select "Debt Payment" or "Credit Payment" category when paying a credit loan
      if (initialData.creditId && categories) {
        const debtCategory = categories.find(
          (c) =>
            c.name.toLowerCase().includes("debt") ||
            c.name.toLowerCase().includes("credit") ||
            c.name.toLowerCase().includes("loan")
        );
        if (debtCategory) {
          setCategoryId(debtCategory._id);
        } else {
          setCategoryId("");
        }
      } else {
        setCategoryId("");
      }
    }
  }, [isOpen, initialData, categories]);

  /** Apply a quick-add preset from user database */
  const applyPreset = (preset: { label: string; categoryId: string; type: string }) => {
    setTitle(preset.label);
    setType(preset.type);
    setCategoryId(preset.categoryId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !accountId || !categoryId) return;

    setIsSubmitting(true);
    try {
      const finalType = initialData.creditId ? "expense" : type;

      await addTransaction({
        title,
        amount: Number(amount),
        type: finalType,
        categoryId: categoryId as Id<"categories">,
        accountId: accountId as Id<"accounts">,
        creditId: (initialData.creditId as Id<"credits">) || undefined,
        date: date.getTime(),
      });

      onClose();
    } catch (error) {
      console.error("Failed to add transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter db quick chips based on current type (expense / income)
  const visiblePresets = quickChips?.filter((p) => p.type === type) ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-20 sm:bottom-8 right-5 md:bottom-8 md:right-8 z-[999] group">
        {/* Animated Glow Aura */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#ff6b35] via-amber-500 to-orange-600 opacity-70 blur-md group-hover:opacity-100 group-hover:blur-lg transition-all duration-500 animate-pulse group-hover:animate-none" />

        <Button
          onClick={() => onOpen()}
          className="relative flex items-center gap-2.5 h-13 sm:h-14 px-4 sm:px-5 rounded-full bg-gradient-to-r from-[#ff6b35] via-orange-500 to-amber-500 hover:from-orange-600 hover:to-[#ff6b35] text-white font-bold shadow-[0_10px_25px_rgba(255,107,53,0.45)] border border-white/20 transition-all duration-300 group-hover:scale-105 active:scale-95 group-hover:shadow-[0_15px_35px_rgba(255,107,53,0.65)] group-hover:cursor-pointer"
        >
          {/* Animated Icon Container */}
          <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm transition-transform duration-300 group-hover:rotate-90 group-hover:bg-white/30">
            <Plus className="w-5 h-5 text-white stroke-[2.5]" />
          </div>

          {/* Label with micro-typography */}
          <span className="text-xs sm:text-sm font-extrabold tracking-wide drop-shadow-sm whitespace-nowrap">
            Add Transaction
          </span>

          {/* Shimmer Effect overlay */}
          <span className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
          </span>
        </Button>
      </div>

      <DialogContent className="sm:max-w-xl rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl p-6">
        <DialogHeader className="pb-1 border-b border-slate-100 dark:border-slate-800/80">
          <DialogTitle className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <ReceiptText className="w-5 h-5" />
            </div>
            {initialData.creditId ? "Debt Repayment" : "New Transaction"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {!initialData.creditId && (
            <Tabs value={type} onValueChange={setType} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800/70 p-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-700/50">
                <TabsTrigger
                  value="expense"
                  className="rounded-xl py-2.5 text-xs font-bold transition-all duration-200 data-[state=active]:bg-rose-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                >
                  Expense
                </TabsTrigger>
                <TabsTrigger
                  value="income"
                  className="rounded-xl py-2.5 text-xs font-bold transition-all duration-200 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                >
                  Income
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* ── QUICK ADD STRIP (GROUPED BY CATEGORIES) ───────────────── */}
          {visiblePresets.length > 0 && (
            <div className="space-y-2.5 bg-slate-50/70 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#ff6b35] dark:text-[#ff8555]" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-400">
                  Quick Add Chips
                </span>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {Array.from(
                  new Set(visiblePresets.map((p) => p.categoryId))
                ).map((catId) => {
                  const categoryObj = categories?.find((c) => c._id === catId);
                  const categoryName = categoryObj?.name || "General";
                  const groupChips = visiblePresets.filter((p) => p.categoryId === catId);

                  return (
                    <div key={catId} className="space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block px-0.5">
                        {categoryName}
                      </span>
                      <div className="flex gap-1.5 flex-wrap">
                        {groupChips.map((preset) => {
                          const isActive =
                            title === preset.label && categoryId === preset.categoryId;

                          return (
                            <button
                              key={preset._id}
                              type="button"
                              onClick={() => applyPreset(preset)}
                              className={cn(
                                "flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all duration-150 active:scale-95",
                                isActive
                                  ? "bg-[#ff6b35] text-white border-[#ff6b35] shadow-sm shadow-[#ff6b35]/30"
                                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-slate-700/60 hover:border-[#ff6b35]/40 hover:bg-[#ff6b35]/10 hover:text-[#ff6b35]"
                              )}
                            >
                              <span>{preset.emoji}</span>
                              {preset.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-3.5">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 px-1">
                Description
              </Label>
              <Input
                placeholder="e.g. Salary, Coffee"
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-11 px-4 font-medium rounded-xl focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400">
                  Category
                </Label>
                <Link
                  href="/settings"
                  className="text-[10px] uppercase font-black text-[#ff6b35] dark:text-[#ff8555] hover:underline"
                >
                  + Manage
                </Link>
              </div>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-11 rounded-xl focus:ring-2 focus:ring-[#ff6b35]">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl">
                  {categories
                    ?.filter((c) => c.type === type)
                    .map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 px-1">
                  Amount
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-xs font-bold text-slate-400 dark:text-slate-400">
                    ₱
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    className="pl-7 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-11 rounded-xl font-mono font-bold focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 px-1">
                  Wallet
                </Label>
                <Select onValueChange={setAccountId} required>
                  <SelectTrigger className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-11 rounded-xl focus:ring-2 focus:ring-[#ff6b35]">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl">
                    {accounts?.map((acc) => (
                      <SelectItem key={acc._id} value={acc._id}>
                        <div className="flex items-center gap-2">
                          <Wallet className="w-3.5 h-3.5 text-slate-400 dark:text-slate-400" />
                          {acc.accountName}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 px-1 block">
                Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-medium h-11 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-[#ff6b35] dark:text-[#ff8555]" />
                    {date ? format(date, "PPP") : <span>Select Date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  align="center"
                >
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#ff6b35] hover:bg-[#e05a2b] text-white font-extrabold h-12 rounded-xl shadow-lg shadow-[#ff6b35]/25 transition-all mt-2 active:scale-[0.99]"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : initialData.creditId ? (
              "Confirm Repayment"
            ) : type === "income" ? (
              "Confirm Deposit"
            ) : (
              "Confirm Expense"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
