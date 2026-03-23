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
import { Plus, Loader2, Info } from "lucide-react";

export function AddCreditDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addCredit = useMutation(api.credits.addCredit);

  // Form states based on your Excel columns
  const [name, setName] = useState("");
  const [total, setTotal] = useState("");
  const [interest, setInterest] = useState("");
  const [monthly, setMonthly] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addCredit({
        creditorName: name,
        totalAmount: Number(total),
        interest: Number(interest),
        monthlyInstallment: Number(monthly),
      });
      setOpen(false);
      // Reset form
      setName("");
      setTotal("");
      setInterest("");
      setMonthly("");
    } catch (error) {
      console.error(error);
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
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
        >
          <Plus className="w-4 h-4 mr-1" /> New Credit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-100">
        <DialogHeader>
          <DialogTitle>Add Credit/Loan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Creditor Name (e.g. Patrick, Gloan 1)</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Who did you borrow from?"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Total Amount (w/ Interest)</Label>
              <Input
                type="number"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Interest Amount</Label>
              <Input
                type="number"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label className="flex items-center gap-2">
              Monthly Installment <Info className="w-3 h-3 text-slate-400" />
            </Label>
            <Input
              type="number"
              value={monthly}
              onChange={(e) => setMonthly(e.target.value)}
              placeholder="e.g. 1500"
              required
            />
            <p className="text-[10px] text-slate-500 italic">
              This helps us compute how many months are left.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Start Monitoring"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
