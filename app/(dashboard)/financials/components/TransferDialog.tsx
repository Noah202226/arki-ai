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
    const numFee = parseFloat(fee) || 0; // Default to 0 if empty
    const totalDeduction = numAmount + numFee;

    // Validation
    if (!toAccountId)
      return toast.error("Please select a destination account.");
    if (isNaN(numAmount) || numAmount <= 0)
      return toast.error("Enter a valid amount.");
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

      // Reset form and close
      setAmount("");
      setFee("");
      setToAccountId("");
      setIsOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to transfer funds");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          className="w-full bg-slate-700 text-white hover:bg-slate-900 hover:cursor-pointer hover:text-white border-none flex items-center justify-start gap-2"
          disabled={availableDestinations.length === 0}
        >
          <ArrowRightLeft className="w-4 h-4 text-indigo-400" />
          Transfer Funds
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
            Transfer Money
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleTransfer} className="space-y-4 mt-4">
          {/* Source Account Info (Read Only) */}
          <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600 font-medium">
                From: {sourceAccount.accountName}
              </span>
            </div>
            <span className="text-sm font-bold">
              Bal: ₱{sourceAccount.balance.toLocaleString()}
            </span>
          </div>

          <div className="space-y-2">
            <Label>To Account</Label>
            <Select
              value={toAccountId}
              onValueChange={setToAccountId}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select destination..." />
              </SelectTrigger>
              <SelectContent>
                {availableDestinations.map((acc) => (
                  <SelectItem key={acc._id} value={acc._id}>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-slate-400" />
                      {acc.accountName}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount to Send</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">
                  ₱
                </span>
                <Input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  className="pl-8 font-mono"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex justify-between">
                <span>Transfer Fee</span>
                <span className="text-[10px] text-slate-400 font-normal uppercase">
                  Optional
                </span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500">
                  ₱
                </span>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  className="pl-8 font-mono"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Transfer Summary */}
          {amount && (
            <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-md text-xs mt-2 border border-indigo-100 dark:border-indigo-900">
              <div className="flex justify-between mb-1">
                <span className="text-slate-500">Amount to send:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  ₱{parseFloat(amount).toLocaleString()}
                </span>
              </div>
              {parseFloat(fee) > 0 && (
                <div className="flex justify-between mb-1">
                  <span className="text-slate-500">Fee deduction:</span>
                  <span className="font-medium text-red-500">
                    - ₱{parseFloat(fee).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-indigo-200 dark:border-indigo-800 mt-2 font-bold">
                <span>Total Deducted:</span>
                <span className="text-indigo-700 dark:text-indigo-400">
                  ₱
                  {(
                    (parseFloat(amount) || 0) + (parseFloat(fee) || 0)
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm Transfer"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
