"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

// Shadcn UI
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function AddTransactionDialog({
  initialTitle = "",
  initialCategory = "General",
  creditId,
}: {
  initialTitle?: string;
  initialCategory?: string;
  creditId?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mutations & Queries
  const addTransaction = useMutation(api.financials.addTransaction);
  const accounts = useQuery(api.accounts.getAccounts);

  // Form States
  const [type, setType] = useState("expense");
  const [title, setTitle] = useState(initialTitle);
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [date, setDate] = useState<Date>(new Date()); // Default to today

  useEffect(() => {
    if (open) {
      setTitle(initialTitle);
      setCategory(initialCategory);
      setDate(new Date());
      setAmount(""); // Siguraduhin na laging malinis ang amount
    }
  }, [open, initialTitle, initialCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !accountId) return;

    setIsSubmitting(true);
    try {
      // Kung may creditId, force natin na "Debt Payment" ang category
      // at "expense" ang type (kasi outflow ng pera ito).
      const finalCategory = creditId ? "Debt Payment" : category;
      const finalType = creditId ? "expense" : type;

      await addTransaction({
        title,
        amount: Number(amount),
        type: finalType,
        category: finalCategory,
        accountId: accountId as any,
        creditId: creditId as any,
        date: date.getTime(),
      });

      setOpen(false);
      setAmount(""); // Reset amount after success
    } catch (error) {
      console.error("Failed to add transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="w-4 h-4 mr-2" /> Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Income vs Expense Toggle */}

          {!creditId && (
            <Tabs value={type} onValueChange={setType} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="expense"
                  className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
                >
                  Expense
                </TabsTrigger>
                <TabsTrigger
                  value="income"
                  className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
                >
                  Income
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {creditId && (
            <div className="bg-orange-50 border border-orange-100 p-3 rounded-lg mb-4">
              <p className="text-[11px] font-bold text-orange-800 uppercase tracking-tight">
                Repayment Mode
              </p>
              <p className="text-[10px] text-orange-600">
                This transaction will be recorded as a debt payment and will
                reduce your remaining balance.
              </p>
            </div>
          )}

          {/* DATE PICKER FIELD */}
          <div className="space-y-2 flex flex-col">
            <Label>Date of Transaction</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              placeholder="e.g. Netflix, Salary, Grocery"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount (PHP)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Account</Label>
              <Select onValueChange={setAccountId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts?.map((acc) => (
                    <SelectItem key={acc._id} value={acc._id}>
                      {acc.accountName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Confirm {type === "income" ? "Inflow" : "Outflow"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
