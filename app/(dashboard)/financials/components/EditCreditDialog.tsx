"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditCreditDialog({ credit, open, onOpenChange }: any) {
  const updateCredit = useMutation(api.credits.updateCredit); // Callable function
  const [name, setName] = useState(credit.creditorName);
  const [total, setTotal] = useState(credit.totalAmount);

  const handleUpdate = async () => {
    await updateCredit({
      id: credit._id,
      creditorName: name,
      totalAmount: Number(total),
      interest: credit.interest, // i-retain ang dati kung hindi babaguhin
      monthlyInstallment: credit.monthlyInstallment,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {credit.creditorName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Total Amount</Label>
            <Input
              type="number"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
            />
          </div>
          <Button onClick={handleUpdate} className="w-full">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
