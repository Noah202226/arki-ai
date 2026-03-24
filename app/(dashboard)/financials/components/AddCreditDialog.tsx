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
import { Plus, Loader2, Info, CalendarDays, Tag } from "lucide-react";

export function AddCreditDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addCredit = useMutation(api.credits.addCredit);

  // Form states
  const [name, setName] = useState("");
  const [total, setTotal] = useState("");
  const [interest, setInterest] = useState("");
  const [monthly, setMonthly] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState("Personal");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addCredit({
        creditorName: name,
        totalAmount: Number(total),
        interest: Number(interest) || 0, // Fallback sa 0 kung empty
        monthlyInstallment: Number(monthly),
        dueDate: Number(dueDate),
        category: category,
      });

      setOpen(false);
      // Reset form
      setName("");
      setTotal("");
      setInterest("");
      setMonthly("");
      setDueDate("");
      setCategory("Personal");
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
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
        >
          <Plus className="w-4 h-4 mr-1" /> New Credit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-112.5">
        <DialogHeader>
          <DialogTitle>Add Credit/Loan Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Creditor & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Creditor Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Gloan, Maya"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-3 h-3" /> Category
              </Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Personal">Personal</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Bank/SaaS">Bank/SaaS</SelectItem>
                  <SelectItem value="Government">Government</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Amounts */}
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
              <Label>Interest Included</Label>
              <Input
                type="number"
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Repayment Details */}
          <div className="grid grid-cols-2 gap-4 border-t pt-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                Monthly Pay <Info className="w-3 h-3 text-slate-400" />
              </Label>
              <Input
                type="number"
                value={monthly}
                onChange={(e) => setMonthly(e.target.value)}
                placeholder="e.g. 1500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-orange-600 font-bold">
                <CalendarDays className="w-3 h-3" /> Due Day
              </Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                placeholder="1 - 31"
                required
              />
            </div>
          </div>

          <p className="text-[10px] text-slate-400 italic bg-slate-50 p-2 rounded border border-dashed">
            Note: System will automatically remind you 3 days before the{" "}
            <strong>Day {dueDate || "__"}</strong> of every month.
          </p>

          <Button
            type="submit"
            className="w-full bg-orange-600 hover:bg-orange-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {isSubmitting ? "Processing..." : "Start Monitoring Credit"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
