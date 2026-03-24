"use client";

import { Button } from "@/components/ui/button";
import { Plus, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreditMonitoring } from "../financials/components/CreditMonitoring";

export default function CreditsPage() {
  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Credit & Loans
          </h1>
          <p className="text-muted-foreground">
            Monitor your amortization progress and remaining balances.
          </p>
        </div>
        <Button className="bg-orange-600 hover:bg-orange-700 w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Add New Loan
        </Button>
      </div>

      {/* QUICK INFO */}
      <Alert className="bg-blue-50 border-blue-200 text-blue-800">
        <Info className="h-4 w-4 stroke-blue-800" />
        <AlertTitle>Monthly Amortization</AlertTitle>
        <AlertDescription>
          Your total monthly commitment for all active loans is ₱12,500.00.
        </AlertDescription>
      </Alert>

      {/* MAIN CONTENT - Dito papasok yung component na inayos natin kanina */}
      <div className="pt-2">
        <CreditMonitoring />
      </div>
    </div>
  );
}
