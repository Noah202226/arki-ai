"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { Loader2, ArrowRightLeft, Building, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface TransferDialogProps {
  sourceAccount: {
    _id: Id<"accounts">;
    accountName: string;
    balance: number;
  };
  allAccounts: Array<{
    _id: Id<"accounts">;
    accountName: string;
    balance: number;
  }>;
  onSuccess?: () => void;
}

export function TransferDialog({
  sourceAccount,
  allAccounts,
  onSuccess,
}: TransferDialogProps) {
  const transferFunds = useMutation(api.accounts.transferFunds);

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [toAccountId, setToAccountId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [fee, setFee] = useState("");

  // Filter out the source account so we can't transfer to ourselves
  const availableDestinations = allAccounts.filter(
    (acc) => acc._id !== sourceAccount._id,
  );

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    const numAmount = parseFloat(amount);
    const numFee = parseFloat(fee) || 0;
    const totalDeduction = numAmount + numFee;

    if (!toAccountId) return toast.error("Please select a destination account.");
    if (isNaN(numAmount) || numAmount <= 0) return toast.error("Enter a valid amount.");
    if (totalDeduction > sourceAccount.balance) {
      return toast.error("Insufficient funds including the transfer fee.");
    }

    setIsLoading(true);
    try {
      await transferFunds({
        fromAccountId: sourceAccount._id,
        toAccountId: toAccountId as Id<"accounts">,
        amount: numAmount,
        fee: numFee > 0 ? numFee : undefined,
      });

      toast.success("Transfer completed successfully!");
      setAmount("");
      setFee("");
      setToAccountId("");
      setIsOpen(false);
      onSuccess?.();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to transfer funds";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const totalDeducted = (parseFloat(amount) || 0) + (parseFloat(fee) || 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className="w-full bg-slate-800/80 dark:bg-slate-800 text-white hover:bg-slate-700 dark:hover:bg-slate-700 hover:cursor-pointer border border-slate-700/50 dark:border-slate-700 flex items-center justify-start gap-2 rounded-xl"
          disabled={availableDestinations.length === 0}
        >
          <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
          Transfer Funds
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl p-6">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <DialogTitle className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            <div className="p-2 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <ArrowRightLeft className="w-4 h-4" />
            </div>
            Transfer Money
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleTransfer} className="space-y-4 pt-2">
          {/* Source Account — Read Only */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-xl p-3.5 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">From</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{sourceAccount.accountName}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Balance</p>
              <p className="text-sm font-mono font-black text-slate-800 dark:text-slate-100">
                ₱{sourceAccount.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* To Account */}
          <div className="space-y-1.5">
            <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1 flex items-center gap-1.5">
              <Building className="w-3 h-3 text-indigo-500" /> Destination Account
            </Label>
            <Select value={toAccountId} onValueChange={setToAccountId} disabled={isLoading}>
              <SelectTrigger className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 h-11 rounded-xl focus:ring-2 focus:ring-indigo-500">
                <SelectValue placeholder="Select destination..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl">
                {availableDestinations.map((acc) => (
                  <SelectItem key={acc._id} value={acc._id}>
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{acc.accountName}</span>
                      <span className="ml-auto text-xs font-mono text-slate-400 dark:text-slate-500">
                        ₱{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1">
                Amount to Send
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-bold">₱</span>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="pl-8 font-mono font-bold bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 h-11 rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1 flex items-center justify-between">
                <span>Transfer Fee</span>
                <span className="text-[9px] text-slate-300 dark:text-slate-600 font-semibold">Optional</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-bold">₱</span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8 font-mono font-bold bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 h-11 rounded-xl focus-visible:ring-2 focus-visible:ring-indigo-500"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Transfer Summary */}
          {amount && (
            <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Amount to send</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 font-mono">
                  ₱{parseFloat(amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {parseFloat(fee) > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Transfer fee</span>
                  <span className="font-bold text-rose-500 dark:text-rose-400 font-mono">
                    - ₱{parseFloat(fee).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-indigo-200 dark:border-indigo-800/60">
                <span className="font-extrabold text-slate-700 dark:text-slate-200">Total Deducted</span>
                <span className={cn(
                  "font-mono font-black text-sm",
                  totalDeducted > sourceAccount.balance
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-indigo-700 dark:text-indigo-300",
                )}>
                  ₱{totalDeducted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              {totalDeducted > sourceAccount.balance && (
                <p className="text-[10px] text-rose-500 dark:text-rose-400 font-bold">
                  ⚠ Exceeds available balance
                </p>
              )}
            </div>
          )}

          <Button
            type="submit"
            className="w-full mt-1 h-12 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-extrabold rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.99] gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4" />
                Confirm Transfer
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
