"use client";

import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Loader2, Pencil, CalendarDays, Tag, Info } from "lucide-react";

interface EditCreditDialogProps {
  credit: {
    _id: Id<"credits">;
    creditorName: string;
    totalAmount: number;
    interest: number;
    monthlyInstallment: number;
    dueDate: number;
    category?: string;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_OPTIONS = [
  "SPayLater",
  "LazPayLater",
  "OLA / Micro-Loan",
  "Billease",
  "Gloan / GCash",
  "Maya Credit",
  "Credit Card",
  "BNPL (Buy Now Pay Later)",
  "Personal",
  "Business",
  "Gadget/Phone Installment",
  "Motorcycle Installment",
  "Bank/SaaS",
  "Government",
  "Education/Tuition",
];

export function EditCreditDialog({
  credit,
  open,
  onOpenChange,
}: EditCreditDialogProps) {
  const updateCredit = useMutation(api.credits.updateCredit);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Normalize dueDate: if stored as full timestamp, extract day-of-month
  const rawDue = credit.dueDate;
  const initialDueDay = rawDue > 31 ? new Date(rawDue).getDate() : rawDue;

  // Form state — pre-populated from existing credit
  const [name, setName] = useState(credit.creditorName);
  const [total, setTotal] = useState(String(credit.totalAmount));
  const [interest, setInterest] = useState(String(credit.interest));
  const [monthly, setMonthly] = useState(String(credit.monthlyInstallment));
  const [dueDay, setDueDay] = useState(String(initialDueDay));
  const [category, setCategory] = useState(credit.category ?? "Personal");
  const [customCategory, setCustomCategory] = useState("");

  // Re-synchronize form states when selected credit or open changes
  useEffect(() => {
    if (open && credit) {
      const raw = credit.dueDate;
      const day = raw > 31 ? new Date(raw).getDate() : raw;
      setName(credit.creditorName || "");
      setTotal(String(credit.totalAmount ?? ""));
      setInterest(String(credit.interest ?? 0));
      setMonthly(String(credit.monthlyInstallment ?? ""));
      setDueDay(String(day ?? ""));

      const isKnown = CATEGORY_OPTIONS.includes(credit.category || "");
      if (credit.category && !isKnown) {
        setCategory("__custom__");
        setCustomCategory(credit.category);
      } else {
        setCategory(credit.category ?? "Personal");
        setCustomCategory("");
      }
    }
  }, [open, credit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numTotal = parseFloat(total);
    const numInterest = parseFloat(interest) || 0;
    const numMonthly = parseFloat(monthly);
    const numDueDay = parseInt(dueDay);

    const finalCategory = category === "__custom__" ? customCategory.trim() || "General" : category;

    if (!name.trim()) return toast.error("Creditor name is required.");
    if (isNaN(numTotal) || numTotal <= 0) return toast.error("Enter a valid total amount.");
    if (isNaN(numMonthly) || numMonthly <= 0) return toast.error("Enter a valid monthly installment.");
    if (isNaN(numDueDay) || numDueDay < 1 || numDueDay > 31) return toast.error("Due day must be between 1 and 31.");

    setIsSubmitting(true);
    try {
      await updateCredit({
        id: credit._id,
        creditorName: name.trim(),
        totalAmount: numTotal,
        interest: numInterest,
        monthlyInstallment: numMonthly,
        dueDate: numDueDay,
        category: finalCategory,
      });
      toast.success(`"${name}" updated successfully.`);
      onOpenChange(false);
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : "Failed to update credit.";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl p-6">
        {/* ── HEADER ── */}
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <DialogTitle className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            <div className="p-2 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-[#ff6b35] dark:text-[#ff8555]">
              <Pencil className="w-4 h-4" />
            </div>
            Edit Credit — {credit.creditorName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          {/* Row 1: Creditor Name + Category */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1">
                Creditor Name
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Gloan, Maya"
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 h-11 px-4 font-medium rounded-xl focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1 flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-[#ff6b35]" /> Category
              </Label>
              <Select value={category} onValueChange={setCategory} disabled={isSubmitting}>
                <SelectTrigger className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 h-11 rounded-xl focus:ring-2 focus:ring-[#ff6b35]">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xl max-h-60">
                  {CATEGORY_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                  <SelectItem value="__custom__">✨ + Custom Category...</SelectItem>
                </SelectContent>
              </Select>
              {category === "__custom__" && (
                <Input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category name..."
                  className="mt-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 h-10 px-3 font-medium rounded-xl text-xs"
                  required
                />
              )}
            </div>
          </div>

          {/* Row 2: Total Amount + Interest */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1">
                Total Amount (w/ Interest)
              </Label>
              <Input
                type="number"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="0.00"
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 h-11 px-4 font-mono font-bold rounded-xl focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1">
                Interest Included
              </Label>
              <Input
                type="number"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                placeholder="0.00"
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 h-11 px-4 font-mono font-bold rounded-xl focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Row 3: Monthly Installment + Due Day */}
          <div className="grid grid-cols-2 gap-3 border-t border-slate-100 dark:border-slate-800/80 pt-3">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 px-1 flex items-center gap-1">
                Monthly Pay <Info className="w-3 h-3 text-slate-400" />
              </Label>
              <Input
                type="number"
                value={monthly}
                onChange={(e) => setMonthly(e.target.value)}
                placeholder="e.g. 1500"
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 h-11 px-4 font-mono font-bold rounded-xl focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                required
                disabled={isSubmitting}
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
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                placeholder="1 – 31"
                className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-slate-900 dark:text-slate-100 h-11 px-4 font-mono font-bold rounded-xl focus-visible:ring-2 focus-visible:ring-[#ff6b35]"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#ff6b35] hover:bg-[#e05a2b] text-white font-extrabold h-12 rounded-xl shadow-lg shadow-[#ff6b35]/25 transition-all mt-1 active:scale-[0.99] gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
