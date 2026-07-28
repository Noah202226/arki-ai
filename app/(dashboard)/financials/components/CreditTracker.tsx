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
  Plus,
  Search,
  X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { useState, useMemo, useDeferredValue } from "react";
import { EditCreditDialog } from "./EditCreditDialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTransactionStore } from "@/app/store/use-transaction-store";

export function CreditTracker() {
  const { onOpen } = useTransactionStore();

  const credits = useQuery(api.credits.getCreditSummary);
  const removeCredit = useMutation(api.credits.deleteCredit);
  const archive = useMutation(api.credits.archiveCredit);

  const [selectedCredit, setSelectedCredit] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Use deferred value so input state responds instantly while filtering renders smoothly
  const deferredSearchQuery = useDeferredValue(searchQuery);

  // Compute Manila current timestamp once outside loop
  const nowMs = useMemo(() => {
    const tempDate = new Date();
    return new Date(
      tempDate.toLocaleString("en-US", { timeZone: "Asia/Manila" })
    ).getTime();
  }, []);

  const totalDebt = useMemo(
    () => (credits || []).reduce((sum, c) => sum + c.totalAmount, 0),
    [credits]
  );

  const totalRemaining = useMemo(
    () => (credits || []).reduce((sum, c) => sum + c.remainingBalance, 0),
    [credits]
  );

  const overallProgress = useMemo(
    () => (totalDebt > 0 ? ((totalDebt - totalRemaining) / totalDebt) * 100 : 0),
    [totalDebt, totalRemaining]
  );

  // Memoize search filtering and sorting to avoid heavy recalculations on every keystroke
  const sortedCredits = useMemo(() => {
    if (!credits) return [];

    const q = deferredSearchQuery.toLowerCase().trim();
    const filtered = q
      ? credits.filter(
          (c) =>
            c.creditorName.toLowerCase().includes(q) ||
            (c.category && c.category.toLowerCase().includes(q))
        )
      : credits;

    return [...filtered].sort((a, b) => {
      if (a.isPaidThisMonth !== b.isPaidThisMonth) {
        return a.isPaidThisMonth ? 1 : -1;
      }
      return a.nextPaymentDate - b.nextPaymentDate;
    });
  }, [credits, deferredSearchQuery]);

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

  return (
    <div className="space-y-6 max-w-full overflow-hidden px-1">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <CreditCard className="w-6 h-6 text-orange-600 dark:text-orange-500" />
            Credit Monitoring
          </h2>
          <p className="text-xs text-muted-foreground dark:text-slate-400 uppercase tracking-wider font-semibold">
            Manage your liabilities and track repayment.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
            <Input
              type="text"
              placeholder="Search credit or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus-visible:ring-1 focus-visible:ring-[#ff6b35]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <AddCreditDialog />
        </div>
      </div>

      {/* 2. Summary Card */}
      <Card className="bg-slate-950 dark:bg-slate-900 text-white border-none dark:border dark:border-slate-800 shadow-xl overflow-hidden relative">
        <CardContent className="p-6 md:p-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-4 space-y-4 border-b md:border-b-0 md:border-r border-white/10 dark:border-slate-800 pb-6 md:pb-0">
              <div>
                <p className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold">
                  Total Progress
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white dark:text-slate-50">
                    {overallProgress.toFixed(1)}%
                  </span>
                  <span className="text-slate-400 dark:text-slate-500 text-xs font-medium italic">
                    Settled
                  </span>
                </div>
              </div>
              <Progress
                value={overallProgress}
                className="h-2.5 bg-white/15 dark:bg-slate-800 w-full [&>div]:bg-[#ff6b35]"
              />
            </div>

            <div className="md:col-span-5 grid grid-cols-1 gap-4">
              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Remaining
                </p>
                <p className="text-2xl font-bold text-orange-400 dark:text-orange-400 font-mono leading-none">
                  ₱{totalRemaining.toLocaleString()}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                  Overall Debt
                </p>
                <p className="text-2xl font-bold text-white/50 dark:text-slate-400 font-mono leading-none">
                  ₱{totalDebt.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="md:col-span-3 flex md:justify-end">
              <div className="bg-white/5 dark:bg-slate-800/60 rounded-2xl p-4 flex items-center gap-4 border border-white/10 dark:border-slate-800 w-full md:w-auto">
                <div className="bg-orange-500/20 p-2 rounded-full">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">
                    Creditors
                  </p>
                  <p className="text-2xl font-black text-white dark:text-slate-100 leading-none">
                    {credits.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <TrendingDown className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 dark:text-slate-800/40 -rotate-12" />
      </Card>

      {/* 3. Individual Credits */}
      {sortedCredits.length === 0 ? (
        <div className="text-center py-10 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
          <Search className="w-8 h-8 text-slate-400 dark:text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No credit accounts found
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {searchQuery
              ? `No credit records matching "${searchQuery}"`
              : "No active credit accounts yet."}
          </p>
        </div>
      ) : (
        <div className="flex overflow-x-auto gap-4 snap-x pb-4 md:grid md:grid-cols-1 lg:grid-cols-2 md:gap-4 scrollbar-none">
          {sortedCredits.map((loan) => {
          const isFullyPaid = loan.remainingBalance <= 0;

          const isPaidThisMonth = loan.isPaidThisMonth;

          // Compare numbers to numbers using pre-computed nowMs
          const isOverdue = nowMs > loan.nextPaymentDate && !isPaidThisMonth;

          // --- COUNTDOWN LOGIC ---
          const diffMs = loan.nextPaymentDate - nowMs;
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

          let countdownText = "";
          if (isPaidThisMonth) {
            countdownText = "SETTLED";
          } else if (diffMs < 0) {
            countdownText = "OVERDUE";
          } else if (diffDays > 0) {
            countdownText = `${diffDays}d to go`;
          } else {
            countdownText = `${diffHours}h left`;
          }

          const isCritical =
            !isFullyPaid &&
            !isPaidThisMonth &&
            diffMs < 24 * 60 * 60 * 1000 &&
            diffMs > 0;

          const isUrgent =
            !isFullyPaid &&
            !isPaidThisMonth &&
            Math.abs(diffMs) < 3 * 24 * 60 * 60 * 1000;

          const hasDueDate =
            loan.dueDate !== undefined && loan.dueDate !== null;
          const isValidTime = !isNaN(loan.nextPaymentDate);
          const progress = (loan.totalPaid / loan.totalAmount) * 100;

          const showWarning = (isCritical || isOverdue) && !isPaidThisMonth;
          const showUrgent = isUrgent && !isPaidThisMonth;

          const handleQuickPay = (id: string, name: string, installment: number, balance: number) => {
            // Determine default payment amount: monthly installment or remaining balance if smaller
            const defaultPayAmount = installment > 0 ? Math.min(installment, balance) : balance;
            // Triggers the modal and pre-fills transaction title, category, credit ID, and amount
            onOpen(`Payment for ${name}`, "Debt Payment", id, defaultPayAmount);
          };

          return (
            <Card
              key={loan._id}
              className={cn(
                "group border transition-all duration-300 shrink-0 w-[300px] md:w-auto snap-center bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm",
                isFullyPaid
                  ? "bg-emerald-50/30 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40"
                  : "hover:border-orange-500/40 dark:hover:border-orange-500/40",
                showWarning &&
                  "border-red-500 dark:border-rose-600 shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-pulse ring-1 ring-red-500/20 dark:ring-rose-500/20",
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex gap-2 items-center">
                      <CardTitle className={cn("text-slate-900 dark:text-slate-100 font-extrabold", showWarning && "text-red-600 dark:text-rose-400")}>
                        {loan.creditorName}
                      </CardTitle>

                      {isFullyPaid ? (
                        <Badge className="bg-emerald-600 dark:bg-emerald-600 text-[9px] h-4 font-bold">
                          FULLY PAID
                        </Badge>
                      ) : isPaidThisMonth ? (
                        <Badge className="bg-blue-600 dark:bg-blue-600 text-white text-[9px] h-4 uppercase font-bold">
                          Paid this month ✨
                        </Badge>
                      ) : (
                        hasDueDate && (
                          <Badge
                            variant={showWarning ? "destructive" : "outline"}
                            className={cn(
                              "text-[9px] px-1.5 h-4 font-bold uppercase dark:border-slate-700",
                              showWarning && "animate-bounce text-white",
                              !showWarning &&
                                showUrgent &&
                                "border-orange-500 dark:border-orange-500 text-orange-600 dark:text-orange-400",
                            )}
                          >
                            {countdownText}
                          </Badge>
                        )
                      )}
                    </div>

                    {hasDueDate && isValidTime ? (
                      <div
                        className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full w-fit flex items-center gap-1",
                          isPaidThisMonth
                            ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                            : showWarning
                              ? "bg-red-600 dark:bg-rose-600 text-white"
                              : showUrgent
                                ? "bg-red-100 dark:bg-rose-950/60 text-red-600 dark:text-rose-300"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
                        )}
                      >
                        <span>
                          {isPaidThisMonth
                            ? `SETTLED FOR THIS MONTH, NEXT: ${format(loan.nextPaymentDate, "MMM dd, yyyy")}`
                            : showWarning
                              ? `⚠️ PAY BY: ${format(loan.nextPaymentDate, "MMM dd, yyyy")}`
                              : `NEXT: ${format(loan.nextPaymentDate, "MMM dd, yyyy")}`}
                        </span>
                      </div>
                    ) : (
                      <p className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full w-fit">
                        ⚠️ SET DUE DAY
                      </p>
                    )}

                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[9px] uppercase py-0 px-1.5 h-4 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
                      >
                        {loan.category || "General"}
                      </Badge>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCredit(loan);
                          setIsEditOpen(true);
                        }}
                      >
                        <Edit2 className="mr-2 h-4 w-4" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800" />
                      <DropdownMenuItem
                        className="text-red-600 dark:text-rose-400 focus:text-red-600 dark:focus:text-rose-400"
                        onClick={() => removeCredit({ id: loan._id })}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                      Progress
                    </span>
                    <span
                      className={cn(
                        "text-[10px] font-black",
                        progress >= 100 ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400",
                      )}
                    >
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <Progress
                    value={progress}
                    className="h-2 bg-slate-200 dark:bg-slate-800 w-full [&>div]:bg-[#ff6b35]"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 py-1">
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase mb-0.5">
                      Paid
                    </p>
                    <p className="text-[13px] font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      ₱{loan.totalPaid.toLocaleString()}
                    </p>
                  </div>

                  <div className="border-l border-slate-100 dark:border-slate-800 pl-2">
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase mb-0.5">
                      Installment
                    </p>
                    <p className="text-[13px] font-bold text-orange-600 dark:text-orange-400 font-mono">
                      ₱{(loan.monthlyInstallment || 0).toLocaleString()}
                    </p>
                  </div>

                  <div className="border-l border-slate-100 dark:border-slate-800 pl-2">
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase mb-0.5">
                      Balance
                    </p>
                    <p className="text-[13px] font-bold text-rose-600 dark:text-rose-400 font-mono">
                      ₱{loan.remainingBalance.toLocaleString()}
                    </p>
                  </div>

                  <div className="border-l border-slate-100 dark:border-slate-800 pl-2">
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase mb-0.5">
                      Left
                    </p>
                    <p className="text-[13px] font-bold text-slate-700 dark:text-slate-200 font-mono">
                      {loan.remainingMonths}{" "}
                      <span className="text-[10px] text-slate-400 dark:text-slate-400">Mo.</span>
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  {isFullyPaid ? (
                    <Button
                      onClick={() => archive({ id: loan._id })}
                      className="bg-emerald-600 dark:bg-emerald-600 hover:bg-emerald-700 dark:hover:bg-emerald-700 text-white font-bold gap-2 shadow-lg shadow-emerald-100 dark:shadow-none"
                    >
                      <TrendingDown className="w-4 h-4 rotate-180" />
                      Archive Completed Loan
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 font-bold"
                      onClick={() =>
                        handleQuickPay(loan._id, loan.creditorName, loan.monthlyInstallment || 0, loan.remainingBalance || 0)
                      }
                    >
                      <Plus className="w-4 h-4 mr-1" /> Pay
                    </Button>
                  )}

                  <div className="flex-1" />

                    <Sheet>
                      <SheetTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[10px] font-bold uppercase gap-1.5 text-slate-400 dark:text-slate-400 hover:text-orange-600 dark:hover:text-orange-400"
                        >
                          <History className="w-3 h-3" />
                          History
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-full sm:max-w-md border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl flex flex-col p-0 text-slate-900 dark:text-slate-100">
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

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 py-1">
                          <div>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                              Paid
                            </p>
                            <p className="text-[13px] font-bold text-green-600 font-mono">
                              ₱{loan.totalPaid.toLocaleString()}
                            </p>
                          </div>
                          <div className="border-l pl-2">
                            <p className="text-[9px] font-bold text-orange-600 uppercase mb-0.5">
                              Monthly
                            </p>
                            <p className="text-[13px] font-bold text-orange-600 font-mono">
                              ₱{(loan.monthlyInstallment || 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="border-l pl-2">
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                              Balance
                            </p>
                            <p className="text-[13px] font-bold text-red-600 font-mono">
                              ₱{loan.remainingBalance.toLocaleString()}
                            </p>
                          </div>
                          <div className="border-l pl-2">
                            <p className="text-[9px] font-bold text-slate-400 uppercase mb-0.5">
                              Left
                            </p>
                            <p className="text-[13px] font-bold text-slate-700 font-mono">
                              {loan.remainingMonths}{" "}
                              <span className="text-[10px]">Mo.</span>
                            </p>
                          </div>
                        </div>
                      </div>

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

                      <div className="p-6 border-t bg-slate-50/50">
                        <Button
                          variant="outline"
                          className="w-full border-dashed border-slate-300 text-slate-500 hover:text-orange-600 hover:border-orange-200 transition-all"
                        >
                          Generate Payment Report
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      )}
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

// Transaction Flow component (pwedeng i-keep sa parehong file o i-separate)
function CreditTransactionFlow({
  creditorName,
  creditId,
}: {
  creditorName: string;
  creditId: string;
}) {
  const allTransactions = useQuery(api.financials.getAllTransactions);

  if (!allTransactions)
    return <div className="py-2 animate-pulse h-4 bg-slate-50 rounded" />;

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
      {payments.map((p) => {
        const isReversal = p.type === "reversal";
        const isVoided = p.isDeleted;

        return (
          <div
            key={p._id}
            className={cn(
              "flex justify-between items-center text-xs py-1.5 border-b border-slate-50 last:border-0",
              isVoided && "opacity-40 grayscale",
              isReversal && "bg-blue-50/50 rounded px-1",
            )}
          >
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-700">
                {isReversal ? "REFUND/ADJUSTMENT" : p.title}
              </span>
              <span className="text-slate-400 text-[9px]">
                {format(new Date(p.dueDate), "MMM dd, yyyy")}
              </span>
            </div>

            <div className="text-right">
              {isReversal || (isVoided && p.type === "expense") ? (
                <span className="font-black text-green-500 font-mono">
                  + ₱{p.amount.toLocaleString()}
                </span>
              ) : (
                <span className="font-black text-red-500 font-mono">
                  - ₱{p.amount.toLocaleString()}
                </span>
              )}
              {isVoided && (
                <div className="text-[8px] font-bold text-slate-400 uppercase">
                  Voided
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
