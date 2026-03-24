"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from "@/components/ui/sheet";

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
  PlusCircle,
} from "lucide-react";
import { AddCreditDialog } from "./AddCreditDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
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
  const archive = useMutation(api.credits.archiveCredit);

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
      {/* 1. Header */}
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
      {/* 2. Summary Card */}
      <Card className="bg-slate-950 text-white border-none shadow-xl overflow-hidden relative">
        <CardContent className="p-6 md:p-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
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
        <TrendingDown className="absolute -right-6 -bottom-6 w-32 h-32 text-white/3 -rotate-12" />
      </Card>
      {/* 3. Individual Credits */}
      <div className="grid gap-4 sm:grid-cols-2">
        {credits.map((loan) => {
          const isFullyPaid = loan.remainingBalance <= 0;

          const now = new Date();
          const hasDueDate =
            loan.dueDate !== undefined && loan.dueDate !== null;
          const dueDay = hasDueDate ? loan.dueDate : 1;
          const nextPayment = new Date(
            now.getFullYear(),
            now.getMonth(),
            dueDay,
          );

          if (now.getDate() > dueDay) {
            nextPayment.setMonth(nextPayment.getMonth() + 1);
          }

          const isUrgent =
            Math.abs(nextPayment.getTime() - now.getTime()) <
            3 * 24 * 60 * 60 * 1000;
          const isValidTime = !isNaN(nextPayment.getTime());
          const progress = (loan.totalPaid / loan.totalAmount) * 100;

          return (
            <Card
              key={loan._id}
              className={cn(
                "group border transition-all",
                isFullyPaid
                  ? "bg-green-50/30 border-green-200"
                  : "hover:border-orange-500/30",
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex gap-2 items-center">
                      <CardTitle>{loan.creditorName}</CardTitle>
                      {isFullyPaid && (
                        <Badge className="bg-green-600 hover:bg-green-700">
                          FULLY PAID
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <CardTitle>{loan.creditorName}</CardTitle>
                      <Badge
                        variant="outline"
                        className="text-[9px] uppercase py-0 px-1.5 h-4 border-slate-200 text-slate-500"
                      >
                        {loan.category || "General"}
                      </Badge>
                    </div>
                    {hasDueDate && isValidTime ? (
                      <p
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full w-fit",
                          isUrgent
                            ? "bg-red-100 text-red-600 animate-pulse"
                            : "bg-slate-100 text-slate-500",
                        )}
                      >
                        NEXT: {format(nextPayment, "MMM dd, yyyy")}
                      </p>
                    ) : (
                      <p className="text-[10px] bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full w-fit">
                        ⚠️ SET DUE DAY
                      </p>
                    )}
                  </div>

                  {/* ACTION MENU */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCredit(loan);
                          setIsEditOpen(true);
                        }}
                      >
                        <Edit2 className="mr-2 h-4 w-4" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => removeCredit({ id: loan._id })}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Progress
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-black",
                        progress >= 100 ? "text-green-600" : "text-orange-600",
                      )}
                    >
                      {progress.toFixed(0)}%
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
                      Balance
                    </p>
                    <p className="text-sm font-bold text-red-600 font-mono">
                      ₱{loan.remainingBalance.toLocaleString()}
                    </p>
                  </div>
                  <div className="border-l pl-3">
                    <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                      Months Left
                    </p>
                    <p className="text-sm font-bold text-slate-700 font-mono">
                      {loan.remainingMonths} Mo.
                    </p>
                  </div>
                </div>

                {isFullyPaid ? (
                  <Button
                    onClick={() => archive({ id: loan._id })}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold gap-2 shadow-lg shadow-green-100"
                  >
                    <TrendingDown className="w-4 h-4 rotate-180" />
                    Archive Completed Loan
                  </Button>
                ) : (
                  <div className="pt-2 flex items-center gap-2">
                    <AddTransactionDialog
                      initialCategory="expense"
                      initialTitle={`Payment for ${loan.creditorName}`}
                      creditId={loan._id}
                    />

                    <div className="flex-1" />

                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[10px] font-bold uppercase gap-1.5 text-slate-400 hover:text-orange-600"
                        >
                          <History className="w-3 h-3" />
                          History
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-full sm:max-w-md border-l shadow-2xl flex flex-col p-0">
                        {/* 1. STICKY HEADER WITH SUMMARY */}
                        <div className="p-6 border-b bg-slate-50/50">
                          <SheetHeader className="text-left mb-6">
                            <div className="flex items-center gap-3">
                              <div className="bg-orange-600 p-2 rounded-xl text-white shadow-lg shadow-orange-200">
                                <History className="w-5 h-5" />
                              </div>
                              <div>
                                <SheetTitle className="text-xl font-bold">
                                  Repayment History
                                </SheetTitle>
                                <SheetDescription className="text-xs font-medium text-slate-500">
                                  Tracking payments for{" "}
                                  <span className="text-orange-600 font-bold">
                                    {loan.creditorName}
                                  </span>
                                </SheetDescription>
                              </div>
                            </div>
                          </SheetHeader>

                          {/* MINI DASHBOARD SA LOOB NG SIDEBAR */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-4 rounded-2xl border shadow-sm">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Total Paid
                              </p>
                              <p className="text-lg font-black text-green-600 font-mono">
                                ₱{loan.totalPaid.toLocaleString()}
                              </p>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border shadow-sm">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Remaining
                              </p>
                              <p className="text-lg font-black text-red-600 font-mono">
                                ₱{loan.remainingBalance.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 2. SCROLLABLE TRANSACTION LIST */}
                        <div className="flex-1 overflow-y-auto p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                              Transaction Logs
                            </h4>
                            <Badge
                              variant="outline"
                              className="text-[9px] font-bold bg-slate-100 border-none"
                            >
                              {loan.remainingMonths} Months Left
                            </Badge>
                          </div>

                          <CreditTransactionFlow
                            creditorName={loan.creditorName}
                            creditId={loan._id}
                          />
                        </div>

                        {/* 3. FOOTER ACTION */}
                        <div className="p-6 border-t bg-slate-50/50">
                          <Button
                            variant="outline"
                            className="w-full border-dashed border-slate-300 text-slate-500 hover:text-orange-600 hover:border-orange-200 transition-all"
                            onClick={() => {
                              /* Pwede mo itrigger dito ang export to PDF sa future */
                            }}
                          >
                            Generate Payment Report
                          </Button>
                        </div>
                      </SheetContent>
                    </Sheet>
                  </div>
                )}
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

function CreditTransactionFlow({
  creditorName,
  creditId,
}: {
  creditorName: string;
  creditId: string;
}) {
  const allTransactions = useQuery(api.financials.getTransactions);

  if (!allTransactions)
    return <div className="py-2 animate-pulse h-4 bg-slate-50 rounded" />;

  // Filter based on creditId (mas accurate kaysa title matching)
  const payments = allTransactions
    .filter((tx) => tx.creditId === creditId)
    .sort((a, b) => b.dueDate - a.dueDate);

  if (payments.length === 0)
    return (
      <p className="text-[10px] text-muted-foreground italic py-2">
        No payments recorded.
      </p>
    );

  return (
    <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
      {payments.map((p) => (
        <div
          key={p._id}
          className="flex justify-between items-center text-xs py-1.5 border-b border-slate-50 last:border-0"
        >
          <span className="text-slate-600 text-[10px] font-medium">
            {p.dueDate ? format(new Date(p.dueDate), "MMM dd, yyyy") : "---"}
          </span>
          <span className="font-black text-red-500 font-mono">
            ₱{p.amount.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
