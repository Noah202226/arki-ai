"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusCircle, Wallet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

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
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [source, setSource] = useState("");

  const addFunds = useMutation(api.accounts.addFunds);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || !source) {
      toast.error("Please fill in the Amount and Source.");
      return;
    }

    setIsLoading(true);
    try {
      await addFunds({
        accountId,
        amount: parseFloat(amount),
        source,
      });
      toast.success(`₱${parseFloat(amount).toLocaleString()} added to ${accountName}!`);
      setOpen(false);
      setAmount("");
      setSource("");
      onSuccess?.();
    } catch {
      toast.error("Failed to add funds. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white h-9 px-4 gap-2 shadow-lg shadow-emerald-600/25 rounded-xl font-bold"
        >
          <PlusCircle className="w-4 h-4" /> Add Money
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl p-6">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <DialogTitle className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
            Deposit to {accountName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {/* Target account card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Depositing Into</p>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{accountName}</p>
            </div>
          </div>

          {/* Source */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1">
              Source of Funds
            </Label>
            <Input
              placeholder="e.g. Salary, Freelance, Bonus"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 h-11 px-4 font-medium rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500"
              required
              disabled={isLoading}
            />
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1">
              Amount
            </Label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-bold">₱</span>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 h-11 font-mono font-bold rounded-xl focus-visible:ring-2 focus-visible:ring-emerald-500"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.99] gap-2"
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
            ) : (
              <><PlusCircle className="w-4 h-4" /> Confirm Deposit</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
