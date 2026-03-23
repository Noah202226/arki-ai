"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Calendar,
  ArrowUpRight,
  AlertCircle,
  MoreVertical,
  Trash2,
  Edit2,
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
import { deleteCredit } from "@/convex/credits";
import { useState } from "react";
import { EditCreditDialog } from "./EditCreditDialog";

export function CreditTracker() {
  const credits = useQuery(api.credits.getCreditSummary);
  const removeCredit = useMutation(api.credits.deleteCredit);

  const [selectedCredit, setSelectedCredit] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (credits === undefined)
    return <div className="animate-pulse">Loading tracker...</div>;

  // Compute overall stats (parang "Total Credentials" sa Excel mo)
  const totalDebt = credits.reduce((sum, c) => sum + c.totalAmount, 0);
  const totalRemaining = credits.reduce(
    (sum, c) => sum + c.remainingBalance,
    0,
  );
  const overallProgress =
    totalDebt > 0 ? ((totalDebt - totalRemaining) / totalDebt) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Summary */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-orange-500" />
          Credit Monitoring
        </h2>

        <AddCreditDialog />
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-200"
        >
          Total Liability: ₱{totalRemaining.toLocaleString()}
        </Badge>
      </div>

      {/* 2. Overall Progress Card */}
      <Card className="bg-slate-950 text-white border-none shadow-xl overflow-hidden relative">
        <CardContent className="pt-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-slate-400 text-xs uppercase font-semibold">
                Total Repayment Progress
              </p>
              <h3 className="text-3xl font-bold">
                {overallProgress.toFixed(1)}%{" "}
                <span className="text-sm font-normal text-slate-400">Paid</span>
              </h3>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-xs uppercase">Overall Debt</p>
              <p className="text-lg font-mono">₱{totalDebt.toLocaleString()}</p>
            </div>
          </div>
          <Progress value={overallProgress} className="h-3 bg-slate-800" />
        </CardContent>
        {/* Subtle decorative icon */}
        <ArrowUpRight className="absolute -right-2 -top-2 w-24 h-24 text-white/5" />
      </Card>

      {/* 3. Individual Loan Cards (Patrick, Gloan, etc.) */}
      <div className="grid gap-4 md:grid-cols-2">
        {credits.map((loan) => {
          const progress = (loan.totalPaid / loan.totalAmount) * 100;
          const isCritical = loan.remainingMonths <= 2;

          return (
            <Card
              key={loan._id}
              className="group hover:border-orange-200 transition-colors"
            >
              <CardHeader className="pb-2 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">
                    {loan.creditorName}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    ₱{loan.monthlyInstallment}/mo
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {/* SMART PAY BUTTON */}
                  <AddTransactionDialog
                    initialTitle={`Payment for ${loan.creditorName}`}
                    initialCategory="Debt Payment"
                  />

                  {/* ACTIONS MENU */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCredit(loan); // Ipasa yung current loan data
                          setIsEditOpen(true); // Buksan ang modal
                        }}
                      >
                        <Edit2 className="w-4 h-4 mr-2" /> Edit Details
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={async () => {
                          {
                            if (
                              confirm(
                                `Sigurado ka bang buburahin ang "${loan.creditorName}"?`,
                              )
                            ) {
                              await removeCredit({ id: loan._id });
                            }
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex justify-between text-xs font-medium">
                  <span>
                    Balance: ₱{loan.remainingBalance.toLocaleString()}
                  </span>
                  <span
                    className={
                      progress >= 100 ? "text-green-600" : "text-orange-600"
                    }
                  >
                    {progress.toFixed(0)}%
                  </span>
                </div>
                <Progress value={progress} className="h-1.5" />

                <div className="flex items-center gap-4 pt-2 text-[10px] text-muted-foreground uppercase tracking-widest">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {loan.remainingMonths} Months Left
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Paid: ₱{loan.totalPaid.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* --- EDIT DIALOG COMPONENT --- */}
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
