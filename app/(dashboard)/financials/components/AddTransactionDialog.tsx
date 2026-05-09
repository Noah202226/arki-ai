"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

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

  // 1. Fetch categories based on the current type (Income/Expense)
  const categories = useQuery(api.categories.getCategories, {
    type: undefined,
  });

  const [type, setType] = useState("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  // 2. Change state to categoryId
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState<Date>(new Date());

  useEffect(() => {
    if (isOpen) {
      setTitle(initialData.title || "");
      // Reset category selection when opening
      setCategoryId("");
      setType(initialData.creditId ? "expense" : "expense");
      setDate(new Date());
      setAmount("");
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // 3. Ensure categoryId is selected
    if (!title || !amount || !accountId || !categoryId) return;

    setIsSubmitting(true);
    try {
      const finalType = initialData.creditId ? "expense" : type;

      await addTransaction({
        title,
        amount: Number(amount),
        type: finalType,
        categoryId: categoryId as any, // Send the ID, not a string
        accountId: accountId as any,
        creditId: (initialData.creditId as any) || undefined,
        date: date.getTime(),
      });

      onClose();
    } catch (error) {
      console.error("Failed to add transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <div className="fixed bottom-6 right-6 z-50 md:bottom-10 md:right-10">
        <Button
          onClick={() => onOpen()}
          size="icon"
          className="h-14 w-14 rounded-full bg-slate-900 shadow-2xl hover:scale-110 transition-transform active:scale-95 text-white ring-4 ring-white dark:ring-slate-950"
        >
          <Plus className="h-7 w-7" />
          <span className="sr-only">Add Transaction</span>
        </Button>
      </div>

      <DialogContent className="sm:max-w-106.25 rounded-t-3xl sm:rounded-3xl border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black italic uppercase tracking-tighter">
            <ReceiptText className="w-5 h-5 text-indigo-500" />
            {initialData.creditId ? "Debt Repayment" : "New Transaction"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {!initialData.creditId && (
            <Tabs value={type} onValueChange={setType} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-xl">
                <TabsTrigger
                  value="expense"
                  className="rounded-lg py-2 data-[state=active]:bg-rose-500 data-[state=active]:text-white font-bold transition-all"
                >
                  Expenses
                </TabsTrigger>
                <TabsTrigger
                  value="income"
                  className="rounded-lg py-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white font-bold transition-all"
                >
                  Income
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400 px-1">
                Description
              </Label>
              <Input
                placeholder="e.g. Salary, Coffee"
                className="bg-slate-50 border-none h-12 px-4 font-medium focus-visible:ring-indigo-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-between items-center">
              <Label className="text-xs font-bold px-1">Category</Label>
              <Link
                href="/settings"
                className="text-[10px] uppercase font-black text-indigo-500 hover:underline"
              >
                + Manage
              </Link>
            </div>

            {/* 4. NEW CATEGORY SELECT FIELD */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400 px-1">
                Category
              </Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger className="bg-slate-50 border-none h-12 focus:ring-indigo-500">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  {categories
                    ?.filter((c) => c.type === type)
                    .map((cat) => (
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-slate-400 px-1">
                  Amount
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-xs font-bold text-slate-400">
                    ₱
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    className="pl-7 bg-slate-50 border-none h-12 font-mono font-bold focus-visible:ring-indigo-500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-slate-400 px-1">
                  Wallet
                </Label>
                <Select onValueChange={setAccountId} required>
                  <SelectTrigger className="bg-slate-50 border-none h-12 focus:ring-indigo-500">
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
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-slate-400 px-1 block">
                Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-medium h-12 border-slate-100 rounded-xl",
                      !date && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-indigo-500" />
                    {date ? format(date, "PPP") : <span>Select Date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-0 rounded-2xl shadow-2xl border-none"
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
            className="w-full h-14 rounded-2xl bg-slate-900 text-white font-bold text-lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Plus className="w-5 h-5 mr-2" />
            )}
            Confirm{" "}
            {initialData.creditId
              ? "Repayment"
              : type === "income"
                ? "Deposit"
                : "Payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
