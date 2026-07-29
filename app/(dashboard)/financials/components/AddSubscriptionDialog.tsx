"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, Loader2, CalendarIcon, Tag, Wallet, CreditCard, AlignLeft, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export function AddSubscriptionDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createSubscription = useMutation(api.subscriptions.createSubscription);
  const accounts = useQuery(api.accounts.getAccounts);
  const categories = useQuery(api.categories.getCategories, { type: "expense" });

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [nextBillingDate, setNextBillingDate] = useState<Date>(new Date());
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !accountId || !categoryId) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createSubscription({
        name,
        amount: Number(amount),
        frequency,
        nextBillingDate: nextBillingDate.getTime(),
        accountId: accountId as Id<"accounts">,
        categoryId: categoryId as Id<"categories">,
        description: description || undefined,
      });
      toast.success(`"${name}" subscription added!`);
      setOpen(false);
      setName(""); setAmount(""); setFrequency("monthly");
      setNextBillingDate(new Date()); setAccountId(""); setCategoryId(""); setDescription("");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to create subscription.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-[#ff6b35] dark:text-[#ff8555] hover:bg-[#ff6b35]/10 font-bold border border-[#ff6b35]/30 rounded-xl gap-1"
        >
          <Plus className="w-4 h-4" /> Add Subscription
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[480px] rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl p-6">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <DialogTitle className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            <div className="p-2 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-[#ff6b35] dark:text-[#ff8555]">
              <CreditCard className="w-4 h-4" />
            </div>
            New Subscription
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1">
              Subscription Name
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Netflix, Spotify, AWS"
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 h-11 px-4 font-medium rounded-xl focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Amount + Frequency */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1">Amount</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-bold">₱</span>
                <Input
                  type="number" step="0.01"
                  value={amount} onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-8 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 h-11 font-mono font-bold rounded-xl focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                  required disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1 flex items-center gap-1">
                <RefreshCw className="w-3 h-3 text-[#ff6b35]" /> Frequency
              </Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as "weekly" | "monthly" | "yearly")} disabled={isSubmitting}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 h-11 rounded-xl focus:ring-2 focus:ring-[#ff6b35]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl">
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Wallet + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1 flex items-center gap-1">
                <Wallet className="w-3 h-3 text-[#ff6b35]" /> Wallet
              </Label>
              <Select value={accountId} onValueChange={setAccountId} disabled={isSubmitting}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 h-11 rounded-xl focus:ring-2 focus:ring-[#ff6b35]">
                  <SelectValue placeholder="Select wallet" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl">
                  {accounts?.map((acc) => (
                    <SelectItem key={acc._id} value={acc._id}>
                      <div className="flex items-center gap-2">
                        <Wallet className="w-3 h-3 text-slate-400" />
                        {acc.accountName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#ff6b35]" /> Category
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={isSubmitting}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 h-11 rounded-xl focus:ring-2 focus:ring-[#ff6b35]">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl">
                  {categories?.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      <div className="flex items-center gap-2">
                        <Tag className="w-3 h-3 text-slate-400" />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Next Billing Date */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1 flex items-center gap-1">
              <CalendarIcon className="w-3 h-3 text-[#ff6b35]" /> Next Billing Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-medium h-11 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800",
                    !nextBillingDate && "text-slate-400"
                  )}
                  disabled={isSubmitting}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-[#ff6b35]" />
                  {nextBillingDate ? format(nextBillingDate, "PPP") : <span>Select date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl" align="center">
                <Calendar
                  mode="single"
                  selected={nextBillingDate}
                  onSelect={(d) => d && setNextBillingDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1 flex items-center gap-1">
              <AlignLeft className="w-3 h-3" /> Description
              <span className="text-[9px] text-slate-300 dark:text-slate-600 font-semibold ml-1">Optional</span>
            </Label>
            <div className="relative">
              <AlignLeft className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Netflix Premium UHD Family Plan"
                className="pl-10 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 h-11 font-medium rounded-xl focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 bg-[#ff6b35] hover:bg-[#e05a2b] text-white font-extrabold rounded-xl shadow-lg shadow-[#ff6b35]/25 transition-all active:scale-[0.99] gap-2"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</>
            ) : (
              <><Plus className="w-4 h-4" /> Add Subscription</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
