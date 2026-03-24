"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Wallet } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

// Props definition
interface AddFundsDialogProps {
  accountId: Id<"accounts">;
  accountName: string;
  onSuccess?: () => void;
}

export function AddFundsDialog({
  accountId,
  accountName,
  onSuccess,
}: AddFundsDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");

  const addFunds = useMutation(api.accounts.addFunds);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !source) {
      toast.error("Paki-fill up ang Amount at Source");
      return;
    }

    try {
      await addFunds({
        accountId,
        amount: parseFloat(amount),
        source: source,
      });

      toast.success(
        `₱${parseFloat(amount).toLocaleString()} added to ${accountName}!`,
      );
      setOpen(false);

      if (onSuccess) onSuccess();

      setAmount("");
      setSource("");
    } catch (error) {
      toast.error("May mali sa pag-add ng funds.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 h-9 px-4 gap-2 shadow-lg"
        >
          <PlusCircle className="w-4 h-4" /> Add Money
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="text-green-600" /> Deposit to {accountName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2 text-center p-3 bg-slate-50 rounded-lg border border-dashed">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Target Account
            </p>
            <p className="text-sm font-bold text-slate-700">{accountName}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source of Income</Label>
            <Input
              id="source"
              placeholder="e.g. Salary, Sideline, Bonus"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">
                ₱
              </span>
              <Input
                id="amount"
                type="number"
                step="0.01"
                className="pl-7"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 font-bold"
            >
              Confirm Deposit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
