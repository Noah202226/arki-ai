"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AddSubscriptionDialog } from "./AddSubscriptionDialog";
import { EditSubscriptionDialog } from "./EditSubscriptionDialog";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import {
  CreditCard,
  Calendar,
  MoreVertical,
  Trash2,
  Edit2,
  Clock,
  Sparkles,
  TrendingUp,
  Loader2,
  AlertTriangle,
} from "lucide-react";

export function SubscriptionTracker() {
  const summary = useQuery(api.subscriptions.getSubscriptionSummary);
  const deleteSubscription = useMutation(api.subscriptions.deleteSubscription);
  const paySubscription = useMutation(api.subscriptions.paySubscription);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "expense" | "income">("all");

  // Delete confirmation dialog state
  const [subToDelete, setSubToDelete] = useState<{ id: Id<"subscriptions">; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (summary === undefined) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-40 w-full bg-slate-100 dark:bg-slate-800/50 animate-pulse rounded-2xl"
          />
        ))}
      </div>
    );
  }

  if (summary === null) return null;

  const confirmDelete = async () => {
    if (!subToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSubscription({ id: subToDelete.id });
      toast.success(`"${subToDelete.name}" entry removed.`);
      setSubToDelete(null);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete item.";
      toast.error(errorMsg);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePay = async (id: Id<"subscriptions">, name: string, type?: string) => {
    setPayingId(id);
    try {
      await paySubscription({ id });
      const actionText = type === "income" ? "Collection logged" : "Payment logged";
      toast.success(`${actionText} for "${name}".`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Operation failed.";
      toast.error(errorMsg);
    } finally {
      setPayingId(null);
    }
  };

  const formatFrequency = (freq: string) => {
    if (freq === "weekly") return "wk";
    if (freq === "15days") return "15d";
    if (freq === "monthly") return "mo";
    if (freq === "yearly") return "yr";
    return freq;
  };

  const filteredItems = summary.items.filter((item) => {
    if (filterType === "all") return true;
    return (item.type || "expense") === filterType;
  });

  return (
    <div className="space-y-6 max-w-full overflow-hidden px-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-xl font-bold tracking-tight flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <CreditCard className="w-5 h-5 text-[#ff6b35]" />
            Recurring Retainers & Subscriptions
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
            Track client retainers (inflow) & active plans (outflow).
          </p>
        </div>
        <AddSubscriptionDialog />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl max-w-fit">
        <button
          onClick={() => setFilterType("all")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
            filterType === "all"
              ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          All ({summary.items.length})
        </button>
        <button
          onClick={() => setFilterType("income")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
            filterType === "income"
              ? "bg-emerald-500 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          💰 Client Income ({summary.items.filter((i) => i.type === "income").length})
        </button>
        <button
          onClick={() => setFilterType("expense")}
          className={cn(
            "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
            filterType === "expense"
              ? "bg-slate-900 dark:bg-slate-700 text-white shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          💳 Expenses ({summary.items.filter((i) => i.type !== "income").length})
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-slate-900 dark:bg-slate-800/80 text-white border border-slate-800 dark:border-slate-700/50 shadow-md overflow-hidden">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-slate-400 text-[9px] uppercase tracking-wider font-bold">Monthly Retainers</p>
              <p className="text-lg font-black font-mono text-emerald-400">
                +₱{Math.round(summary.totalMonthlyIncome || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-emerald-400/80 font-mono font-medium">
                +₱{(summary.totalDailyIncome || 0).toFixed(2)}/day
              </p>
            </div>
            <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 dark:bg-slate-800/80 text-white border border-slate-800 dark:border-slate-700/50 shadow-md overflow-hidden">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-slate-400 text-[9px] uppercase tracking-wider font-bold">Monthly Expenses</p>
              <p className="text-lg font-black font-mono text-[#ff6b35]">
                -₱{Math.round(summary.totalMonthlyCost).toLocaleString()}
              </p>
              <p className="text-[10px] text-[#ff6b35]/80 font-mono font-medium">
                -₱{(summary.totalDailyCost || 0).toFixed(2)}/day
              </p>
            </div>
            <div className="bg-[#ff6b35]/10 p-2 rounded-xl text-[#ff6b35]">
              <Clock className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 dark:bg-slate-800/80 text-white border border-slate-800 dark:border-slate-700/50 shadow-md overflow-hidden">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-slate-400 text-[9px] uppercase tracking-wider font-bold">Net Recurring Flow</p>
              <p className={cn("text-lg font-black font-mono", (summary.netMonthlyBalance || 0) >= 0 ? "text-emerald-400" : "text-rose-400")}>
                {(summary.netMonthlyBalance || 0) >= 0 ? "+" : ""}₱{Math.round(summary.netMonthlyBalance || 0).toLocaleString()}
              </p>
              <p className="text-[10px] text-slate-400 font-mono font-medium">
                Net ₱{(summary.netDailyBalance || 0).toFixed(2)}/day
              </p>
            </div>
            <div className={cn("p-2 rounded-xl", (summary.netMonthlyBalance || 0) >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
              <Sparkles className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 dark:bg-slate-800/80 text-white border border-slate-800 dark:border-slate-700/50 shadow-md overflow-hidden">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-slate-400 text-[9px] uppercase tracking-wider font-bold">Daily Burn Rate</p>
              <p className="text-lg font-black font-mono text-amber-400">
                ₱{(summary.totalDailyCost || 0).toFixed(2)}/day
              </p>
              <p className="text-[10px] text-slate-400 font-mono font-medium">
                ₱{Math.round(summary.totalYearlyCost || 0).toLocaleString()}/yr
              </p>
            </div>
            <div className="bg-amber-500/10 p-2 rounded-xl text-amber-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscription List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-10 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-6">
          <Sparkles className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">No Entries Found</h4>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 max-w-[250px] mx-auto">
            Click &quot;Add Subscription&quot; to log client retainers or recurring subscription plans.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredItems.map((sub) => {
            const isPaying = payingId === sub._id;
            const isIncome = sub.type === "income";

            const daysRemaining = sub.daysRemaining;
            let countdownText = "";
            if (sub.isOverdue) {
              const overdueDays = Math.abs(daysRemaining);
              countdownText = `Overdue by ${overdueDays} day${overdueDays > 1 ? "s" : ""}`;
            } else if (daysRemaining === 0) {
              countdownText = "Due today";
            } else if (daysRemaining === 1) {
              countdownText = "Due tomorrow";
            } else if (daysRemaining > 1) {
              countdownText = `In ${daysRemaining} days`;
            }

            return (
              <div
                key={sub._id}
                className={cn(
                  "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-all duration-200 shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-300 dark:hover:border-slate-700",
                  sub.isOverdue && "border-rose-200 bg-rose-50/20 dark:border-rose-900/40 dark:bg-rose-950/20",
                  sub.isDueSoon && "border-amber-200 bg-amber-50/10 dark:border-amber-900/40 dark:bg-amber-950/20",
                  sub.status !== "active" && "opacity-75"
                )}
              >
                {/* Category color stripe */}
                <div
                  className="absolute top-0 left-0 bottom-0 w-[4px]"
                  style={{ backgroundColor: isIncome ? "#10b981" : (sub.categoryColor ?? "#94a3b8") }}
                />

                <div className="flex items-start gap-3 pl-1.5 flex-1 min-w-0">
                  {/* Icon */}
                  <div
                    className={cn(
                      "p-2 rounded-xl shrink-0 text-white flex items-center justify-center shadow-sm",
                      isIncome ? "bg-emerald-500" : ""
                    )}
                    style={{ backgroundColor: isIncome ? undefined : (sub.categoryColor ?? "#94a3b8") }}
                  >
                    {isIncome ? <TrendingUp className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                  </div>

                  {/* Text Info */}
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 truncate leading-none">
                        {sub.name}
                      </h4>
                      {isIncome ? (
                        <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md">
                          Client Retainer
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md">
                          Expense
                        </Badge>
                      )}

                      {/* Daily Rate Pill */}
                      <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md">
                        ₱{sub.dailyContribution.toFixed(2)}/day
                      </Badge>

                      {sub.isOverdue && (
                        <Badge variant="destructive" className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md">
                          {countdownText}
                        </Badge>
                      )}
                      {sub.isDueSoon && !sub.isOverdue && (
                        <Badge className="bg-amber-500 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md">
                          {countdownText}
                        </Badge>
                      )}
                      {!sub.isDueSoon && !sub.isOverdue && countdownText && (
                        <Badge variant="outline" className="text-slate-400 text-[9px] font-medium px-1.5 py-0.5 rounded-md">
                          {countdownText}
                        </Badge>
                      )}
                    </div>
                    {sub.description && (
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{sub.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 flex-wrap">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {sub.categoryName}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded">
                        {sub.accountName}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        Next: {format(new Date(sub.nextBillingDate), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Amount + Actions */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-bold leading-none">Amount</p>
                    <p className={cn("text-base font-black font-mono", isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-100")}>
                      {isIncome ? "+" : ""}₱{sub.amount.toLocaleString()}
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold font-sans">
                        /{formatFrequency(sub.frequency)}
                      </span>
                    </p>
                  </div>

                  {sub.status === "active" && (
                    <Button
                      size="sm"
                      onClick={() => handlePay(sub._id, sub.name, sub.type)}
                      disabled={isPaying}
                      className={cn(
                        "h-8 rounded-xl font-bold text-xs shrink-0 shadow-sm gap-1.5",
                        isIncome
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : sub.isOverdue
                          ? "bg-rose-600 hover:bg-rose-700 text-white"
                          : sub.isDueSoon
                          ? "bg-amber-600 hover:bg-amber-700 text-white"
                          : "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200"
                      )}
                    >
                      {isPaying ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</>
                      ) : isIncome ? (
                        "Log Collection"
                      ) : (
                        "Log Payment"
                      )}
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg text-slate-900 dark:text-slate-100"
                    >
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedSub(sub);
                          setIsEditOpen(true);
                        }}
                        className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 py-2.5 rounded-lg cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-indigo-500" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setSubToDelete({ id: sub._id, name: sub.name })}
                        className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 py-2.5 rounded-lg cursor-pointer hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Entry
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── DELETE CONFIRMATION DIALOG ── */}
      <Dialog open={!!subToDelete} onOpenChange={(open) => !open && setSubToDelete(null)}>
        <DialogContent className="sm:max-w-sm rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl p-6">
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <DialogTitle className="flex items-center gap-2.5 text-base font-extrabold text-slate-900 dark:text-slate-50">
              <div className="p-2 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              Remove Subscription
            </DialogTitle>
          </DialogHeader>
          <div className="pt-3 space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to remove{" "}
              <span className="font-bold text-slate-900 dark:text-slate-100">
                &quot;{subToDelete?.name}&quot;
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                onClick={() => setSubToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-lg shadow-rose-600/20 gap-1.5"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Removing...</>
                ) : (
                  <><Trash2 className="w-4 h-4" /> Remove</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {selectedSub && (
        <EditSubscriptionDialog
          subscription={selectedSub}
          isOpen={isEditOpen}
          onOpenChange={setIsEditOpen}
        />
      )}
    </div>
  );
}
