"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
import { Plus, Loader2, Info, CalendarDays, Tag, Wallet, ArrowDownLeft } from "lucide-react";

export function AddCreditDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addCredit = useMutation(api.credits.addCredit);
  const accounts = useQuery(api.accounts.getAccounts);

  // Form states
  const [name, setName] = useState("");
  const [total, setTotal] = useState("");
  const [interest, setInterest] = useState("");
  const [monthly, setMonthly] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState("Personal");

  // Optional Income Deposit fields (enabled by default so loan cash goes straight to transactions)
  const [recordIncome, setRecordIncome] = useState(true);
  const [depositAccountId, setDepositAccountId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");

  // Set default account when accounts load
  useEffect(() => {
    if (accounts && accounts.length > 0 && !depositAccountId) {
      setDepositAccountId(accounts[0]._id);
    }
  }, [accounts, depositAccountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addCredit({
        creditorName: name,
        totalAmount: Number(total),
        interest: Number(interest) || 0,
        monthlyInstallment: Number(monthly),
        dueDate: Number(dueDate),
        category: category,
        depositAccountId: recordIncome && depositAccountId ? (depositAccountId as Id<"accounts">) : undefined,
        depositAmount: recordIncome ? Number(depositAmount || total) : undefined,
      });

      setOpen(false);
      // Reset form
      setName("");
      setTotal("");
      setInterest("");
      setMonthly("");
      setDueDate("");
      setCategory("Personal");
      setRecordIncome(false);
      setDepositAccountId("");
      setDepositAmount("");
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
          className="text-[#ff6b35] dark:text-[#ff8555] hover:bg-[#ff6b35]/10 font-bold border border-[#ff6b35]/30 rounded-xl"
        >
          <Plus className="w-4 h-4 mr-1" /> New Credit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl p-6">
        <DialogHeader className="pb-1 border-b border-slate-100 dark:border-slate-800/80">
          <DialogTitle className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            <div className="p-2 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-[#ff6b35] dark:text-[#ff8555]">
              <Plus className="w-5 h-5" />
            </div>
            Add Credit / Loan Details
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {/* Creditor & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 px-1">
                Creditor Name
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Gloan, Maya"
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-11 px-4 font-medium rounded-xl focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 px-1 flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-[#ff6b35]" /> Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-11 rounded-xl focus:ring-2 focus:ring-[#ff6b35]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl">
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Bank/SaaS">Bank/SaaS</SelectItem>
                  <SelectItem value="Government">Government</SelectItem>
                  <SelectItem value="Motorcycle Installment">Motorcycle Installment</SelectItem>
                  <SelectItem value="Gadget/Phone Installment">Gadget/Phone Installment</SelectItem>
                  <SelectItem value="Education/Tuition">Education/Tuition</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 px-1">
                Total Amount (w/ Interest)
              </Label>
              <Input
                type="number"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="0.00"
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-11 px-4 font-mono font-bold rounded-xl focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 px-1">
                Interest Included
              </Label>
              <Input
                type="number"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                placeholder="0.00"
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-11 px-4 font-mono font-bold rounded-xl focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
              />
            </div>
          </div>

          {/* Repayment Details */}
          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 px-1 flex items-center gap-1">
                Monthly Pay <Info className="w-3 h-3 text-slate-400" />
              </Label>
              <Input
                type="number"
                value={monthly}
                onChange={(e) => setMonthly(e.target.value)}
                placeholder="e.g. 1500"
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-11 px-4 font-mono font-bold rounded-xl focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-[#ff6b35] dark:text-[#ff8555] px-1 flex items-center gap-1">
                <CalendarDays className="w-3 h-3 text-[#ff6b35]" /> Due Day
              </Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="1 - 31"
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 h-11 px-4 font-mono font-bold rounded-xl focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                required
              />
            </div>
          </div>

          {/* ── OPTIONAL: RECORD LOAN DISBURSEMENT AS INCOME ───────────────── */}
          <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                <Label className="text-xs font-extrabold text-slate-800 dark:text-slate-200 cursor-pointer">
                  Record Loan Disbursement as Income?
                </Label>
              </div>
              <input
                type="checkbox"
                checked={recordIncome}
                onChange={(e) => {
                  setRecordIncome(e.target.checked);
                  if (e.target.checked && !depositAmount && total) {
                    setDepositAmount(total); // default deposit amount to loan total
                  }
                }}
                className="w-4 h-4 accent-[#ff6b35] rounded cursor-pointer"
              />
            </div>

            {recordIncome && (
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/40 dark:border-slate-700/50">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 px-1">
                    Deposit Amount
                  </Label>
                  <Input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 h-10 px-3 font-mono font-bold rounded-xl"
                    required={recordIncome}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-400 px-1 flex items-center gap-1">
                    <Wallet className="w-3 h-3 text-emerald-500" /> Destination Wallet
                  </Label>
                  <Select
                    value={depositAccountId}
                    onValueChange={setDepositAccountId}
                    required={recordIncome}
                  >
                    <SelectTrigger className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 h-10 rounded-xl">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl">
                      {accounts?.map((acc) => (
                        <SelectItem key={acc._id} value={acc._id}>
                          <div className="flex items-center gap-2">
                            <Wallet className="w-3.5 h-3.5 text-slate-400" />
                            {acc.accountName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
            Note: First payment for new credits will automatically start next month on Day {dueDate || "__"}.
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#ff6b35] hover:bg-[#e05a2b] text-white font-extrabold h-12 rounded-xl shadow-lg shadow-[#ff6b35]/25 transition-all mt-1 active:scale-[0.99]"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : null}
            {isSubmitting ? "Processing..." : "Start Monitoring Credit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
