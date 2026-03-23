"use client";

import { useState } from "react";
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
import { Plus, Loader2 } from "lucide-react";

export function AddTransactionDialog({
  initialTitle = "",
  initialCategory = "General",
}: {
  initialTitle?: string;
  initialCategory?: string;
}) {
  const { user } = useUser();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !accountId) return;

    setIsSubmitting(true);
    try {
      await addTransaction({
        title,
        amount: Number(amount),
        type,
        category,
        accountId: accountId as any,
        date: Date.now(),
      });
      setOpen(false);
      // Reset Form
      setTitle("");
      setAmount("");
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
