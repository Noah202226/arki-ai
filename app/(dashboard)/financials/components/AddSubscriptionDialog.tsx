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
import { Plus, Loader2, CalendarIcon, Tag, Wallet, CreditCard, AlignLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function AddSubscriptionDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createSubscription = useMutation(api.subscriptions.createSubscription);
  const accounts = useQuery(api.accounts.getAccounts);
  const categories = useQuery(api.categories.getCategories, { type: "expense" });

  // Form states
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<"weekly" | "monthly" | "yearly">("monthly");
  const [nextBillingDate, setNextBillingDate] = useState<Date>(new Date());
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount || !accountId || !categoryId || !nextBillingDate) return;

    setIsSubmitting(true);

    try {
      await createSubscription({
        name,
        amount: Number(amount),
        frequency,
        nextBillingDate: nextBillingDate.getTime(),
        accountId: accountId as any,
        categoryId: categoryId as any,
        description: description || undefined,
      });

      setOpen(false);
      // Reset form
      setName("");
      setAmount("");
      setFrequency("monthly");
      setNextBillingDate(new Date());
      setAccountId("");
      setCategoryId("");
      setDescription("");
    } catch (error) {
      console.error("Mutation Error:", error);
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
          className="text-orange-600 dark:text-orange-500 hover:text-orange-700 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 font-bold"
        >
          <Plus className="w-4 h-4 mr-1" /> Add Subscription
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[450px] rounded-3xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black italic uppercase tracking-tighter">
            <CreditCard className="w-5 h-5 text-orange-500" />
            New Subscription
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-slate-400 px-1">Subscription Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Netflix, Spotify, AWS"
              className="bg-slate-50 border-none h-12 px-4 font-medium focus-visible:ring-orange-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400 px-1">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-xs font-bold text-slate-400">₱</span>
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="pl-7 bg-slate-50 border-none h-12 font-mono font-bold focus-visible:ring-orange-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400 px-1">Frequency</Label>
              <Select
                value={frequency}
                onValueChange={(val) => setFrequency(val as "weekly" | "monthly" | "yearly")}
              >
                <SelectTrigger className="bg-slate-50 border-none h-12 focus:ring-orange-500">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400 px-1">Wallet/Account</Label>
              <Select value={accountId} onValueChange={setAccountId} required>
                <SelectTrigger className="bg-slate-50 border-none h-12 focus:ring-orange-500">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
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

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400 px-1">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger className="bg-slate-50 border-none h-12 focus:ring-orange-500">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
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

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-slate-400 px-1 block">Next Billing Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-medium h-12 border-slate-100 rounded-xl bg-slate-55",
                    !nextBillingDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-orange-500" />
                  {nextBillingDate ? format(nextBillingDate, "PPP") : <span>Select Date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border-none" align="center">
                <Calendar
                  mode="single"
                  selected={nextBillingDate}
                  onSelect={(d) => d && setNextBillingDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-slate-400 px-1">Description (Optional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-3.5">
                <AlignLeft className="w-4 h-4 text-slate-400" />
              </span>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Netflix Premium UHD Family Plan"
                className="pl-9 bg-slate-50 border-none h-12 px-4 font-medium focus-visible:ring-orange-500"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-14 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Plus className="w-5 h-5 mr-2" />
            )}
            Add Subscription
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
