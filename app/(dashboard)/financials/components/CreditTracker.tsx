"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Calendar,
  MoreVertical,
  Trash2,
  Edit2,
  ChevronDown,
  History,
  TrendingDown,
  AlertCircle,
} from "lucide-react";
import { AddCreditDialog } from "./AddCreditDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { AddTransactionDialog } from "./AddTransactionDialog";
import { useState } from "react";
import { EditCreditDialog } from "./EditCreditDialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function CreditTracker() {
  const credits = useQuery(api.credits.getCreditSummary);
  const removeCredit = useMutation(api.credits.deleteCredit);

  const [selectedCredit, setSelectedCredit] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (credits === undefined)
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-64 w-full bg-slate-50 animate-pulse rounded-2xl"
          />
        ))}
      </div>
    );

  const totalDebt = credits.reduce((sum, c) => sum + c.totalAmount, 0);
  const totalRemaining = credits.reduce(
    (sum, c) => sum + c.remainingBalance,
    0,
  );
  const overallProgress =
    totalDebt > 0 ? ((totalDebt - totalRemaining) / totalDebt) * 100 : 0;

  return (
    <div className="space-y-6 max-w-full overflow-hidden px-1">
      {/* 1. Unified Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-orange-600" />
            Credit Monitoring
          </h2>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            Manage your liabilities and track repayment.
          </p>
        </div>
        <AddCreditDialog />
      </div>

      {/* 2. All-in-One Summary Card */}
      <Card className="bg-slate-950 text-white border-none shadow-xl overflow-hidden relative">
        <CardContent className="p-6 md:p-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Left: Progress Circle/Text */}
            <div className="md:col-span-4 space-y-4 border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0">
              <div>
                <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold">
                  Total Progress
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black">
                    {overallProgress.toFixed(1)}%
                  </span>
                  <span className="text-slate-500 text-xs font-medium italic">
                    Settled
                  </span>
                </div>
              </div>
              <Progress
                value={overallProgress}
                className="h-2.5 bg-white/10 w-full"
              />
            </div>

            {/* Middle: Key Financials */}
            <div className="md:col-span-5 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Remaining
                </p>
                <p className="text-2xl font-bold text-orange-400 font-mono leading-none">
                  ₱{totalRemaining.toLocaleString()}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Overall Debt
                </p>
                <p className="text-2xl font-bold text-white/40 font-mono leading-none">
                  ₱{totalDebt.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Right: Creditor Count Badge */}
            <div className="md:col-span-3 flex md:justify-end">
              <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-4 border border-white/10 w-full md:w-auto">
                <div className="bg-orange-500/20 p-2 rounded-full">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">
                    Creditors
                  </p>
                  <p className="text-2xl font-black text-white leading-none">
                    {credits.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        {/* Background Icon Decoration */}
        <TrendingDown className="absolute -right-6 -bottom-6 w-32 h-32 text-white/3 -rotate-12" />
      </Card>

      {/* 3. Individual Credits (2-column layout for better visibility) */}
      <div className="grid gap-4 sm:grid-cols-2">
        {credits.map((loan) => {
          const progress = (loan.totalPaid / loan.totalAmount) * 100;
          return (
            <Card
              key={loan._id}
              className="group border shadow-none hover:border-orange-500/30 transition-all flex flex-col"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div className="space-y-1">
                  <CardTitle className="text-base font-bold uppercase tracking-tight">
                    {loan.creditorName}
                  </CardTitle>
                  <p className="text-[11px] font-medium text-muted-foreground italic">
                    ₱{loan.monthlyInstallment.toLocaleString()}/mo
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <AddTransactionDialog
                    initialTitle={`Payment for ${loan.creditorName}`}
                    initialCategory="Debt Payment"
                    creditId={loan._id}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCredit(loan);
                          setIsEditOpen(true);
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-2" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={async () => {
                          if (confirm(`Burahin ang "${loan.creditorName}"?`))
                            await removeCredit({ id: loan._id });
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete Record
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Repayment
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-black",
                        progress >= 100 ? "text-green-600" : "text-orange-600",
                      )}
                    >
                      {progress.toFixed(0)}% COMPLETE
                    </span>
                  </div>
                  <Progress
                    value={progress}
                    className="h-1.5 bg-white shadow-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                      Balance Left
                    </p>
                    <p className="text-sm font-bold text-red-600 font-mono">
                      ₱{loan.remainingBalance.toLocaleString()}
                    </p>
                  </div>
                  <div className="border-l pl-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                      Total Paid
                    </p>
                    <p className="text-sm font-bold text-green-600 font-mono">
                      ₱{loan.totalPaid.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-100/80 w-fit px-2 py-1 rounded">
                    <Calendar className="w-3 h-3 text-orange-600" />
                    {loan.remainingMonths} MONTHS REMAINING
                  </div>

                  <details className="group/details border-t pt-2">
                    <summary className="list-none cursor-pointer flex items-center justify-between text-[10px] text-slate-400 hover:text-orange-600 font-bold uppercase transition-all py-1">
                      <div className="flex items-center gap-1.5">
                        <History className="w-3 h-3" />
                        View History
                      </div>
                      <ChevronDown className="w-3.5 h-3.5 group-open/details:rotate-180 transition-transform" />
                    </summary>
                    <CreditTransactionFlow creditorName={loan.creditorName} />
                  </details>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {selectedCredit && (
        <EditCreditDialog
          credit={selectedCredit}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
        />
      )}
    </div>
  );
}

function CreditTransactionFlow({ creditorName }: { creditorName: string }) {
  const allTransactions = useQuery(api.financials.getTransactions);

  if (!allTransactions)
    return (
      <div className="py-2 animate-pulse">
        <div className="h-3 w-full bg-slate-50 rounded" />
      </div>
    );

  const payments = allTransactions
    .filter((tx) => tx.title === `Payment for ${creditorName}`)
    .sort((a, b) => b.dueDate - a.dueDate);

  if (payments.length === 0)
    return (
      <p className="text-[10px] text-muted-foreground italic py-2 pl-4 border-l-2">
        No payments yet.
      </p>
    );

  return (
    <div className="mt-2 space-y-1 border-l-2 border-orange-100 pl-4">
      {payments.map((p) => (
        <div
          key={p._id}
          className="flex justify-between items-center text-xs py-1.5 border-b border-slate-50 last:border-0"
        >
          <span className="font-bold text-slate-600 text-[10px]">
            {format(p.dueDate, "MMM dd, yyyy")}
          </span>
          <span className="font-black text-red-500 font-mono">
            ₱{p.amount.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
