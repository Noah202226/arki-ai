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
import { AddSubscriptionDialog } from "./AddSubscriptionDialog";
import { EditSubscriptionDialog } from "./EditSubscriptionDialog";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  Calendar,
  MoreVertical,
  Trash2,
  Edit2,
  DollarSign,
  AlertCircle,
  Clock,
  Sparkles,
  TrendingUp,
  CheckCircle,
} from "lucide-react";

export function SubscriptionTracker() {
  const summary = useQuery(api.subscriptions.getSubscriptionSummary);
  const deleteSubscription = useMutation(api.subscriptions.deleteSubscription);
  const paySubscription = useMutation(api.subscriptions.paySubscription);

  const [selectedSub, setSelectedSub] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);

  if (summary === undefined) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-40 w-full bg-slate-100 animate-pulse rounded-2xl"
          />
        ))}
      </div>
    );
  }

  if (summary === null) return null;

  const handleDelete = async (id: any) => {
    if (confirm("Are you sure you want to delete this subscription?")) {
      try {
        await deleteSubscription({ id });
      } catch (err) {
        console.error("Failed to delete subscription:", err);
      }
    }
  };

  const handlePay = async (id: any) => {
    setPayingId(id);
    try {
      await paySubscription({ id });
    } catch (err) {
      console.error("Failed to process payment:", err);
      alert("Error processing payment. Ensure account balance is sufficient!");
    } finally {
      setPayingId(null);
    }
  };

  const formatFrequency = (freq: string) => {
    if (freq === "weekly") return "week";
    if (freq === "monthly") return "mo";
    if (freq === "yearly") return "yr";
    return freq;
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden px-1">
      {/* 1. Header with Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-orange-500" />
            Recurring Expenses
          </h3>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Track and log your active subscription plans.
          </p>
        </div>
        <AddSubscriptionDialog />
      </div>

      {/* 2. Mini Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-[#1a1a2e] text-white border-none shadow-md overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-slate-400 text-[9px] uppercase tracking-wider font-bold">
                Monthly Total
              </p>
              <p className="text-xl font-black font-mono text-[#ff6b35]">
                ₱{Math.round(summary.totalMonthlyCost).toLocaleString()}
              </p>
            </div>
            <div className="bg-[#ff6b35]/10 p-2 rounded-xl text-[#ff6b35]">
              <Clock className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a2e] text-white border-none shadow-md overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-slate-400 text-[9px] uppercase tracking-wider font-bold">
                Yearly Total
              </p>
              <p className="text-xl font-black font-mono text-emerald-400">
                ₱{Math.round(summary.totalYearlyCost).toLocaleString()}
              </p>
            </div>
            <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Subscriptions List */}
      {summary.items.length === 0 ? (
        <div className="text-center py-10 bg-white border border-[#e5dec9]/40 rounded-2xl p-6">
          <Sparkles className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <h4 className="font-bold text-slate-700 text-sm">No Subscriptions Added</h4>
          <p className="text-[11px] text-slate-400 mt-1 max-w-[250px] mx-auto">
            Log your software, services or utilities here to start monitoring recurring charges.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {summary.items.map((sub) => {
            const isPaying = payingId === sub._id;
            return (
              <div
                key={sub._id}
                className={cn(
                  "bg-white border rounded-2xl p-4 transition-all duration-200 shadow-sm relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-300",
                  sub.isOverdue && "border-rose-200 bg-rose-50/20 hover:border-rose-300",
                  sub.isDueSoon && "border-amber-200 bg-amber-50/10 hover:border-amber-300",
                  sub.status !== "active" && "opacity-75 bg-slate-50/50"
                )}
              >
                {/* Visual Category Stripe */}
                <div
                  className="absolute top-0 left-0 bottom-0 w-[4px]"
                  style={{ backgroundColor: sub.categoryColor }}
                />

                <div className="flex items-start gap-3 pl-1.5 flex-1 min-w-0">
                  <div
                    className="p-2 rounded-xl shrink-0 text-white flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: sub.categoryColor }}
                  >
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-sm text-slate-800 truncate leading-none">
                        {sub.name}
                      </h4>
                      {sub.isOverdue && (
                        <Badge variant="destructive" className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md">
                          Overdue
                        </Badge>
                      )}
                      {sub.isDueSoon && (
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md">
                          Due Soon
                        </Badge>
                      )}
                      {sub.status === "paused" && (
                        <Badge variant="secondary" className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md">
                          Paused
                        </Badge>
                      )}
                      {sub.status === "cancelled" && (
                        <Badge variant="outline" className="text-slate-400 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md">
                          Cancelled
                        </Badge>
                      )}
                    </div>
                    {sub.description && (
                      <p className="text-[11px] text-slate-400 truncate">{sub.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        {sub.categoryName}
                      </span>
                      <span>•</span>
                      <span className="font-medium bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">
                        {sub.accountName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Next: {format(new Date(sub.nextBillingDate), "MMM dd, yyyy")}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right shrink-0">
                    <p className="text-xs text-slate-400 font-bold leading-none">Amount</p>
                    <p className="text-base font-black font-mono text-slate-800">
                      ₱{sub.amount.toLocaleString()}
                      <span className="text-[10px] text-slate-400 font-bold font-sans">
                        /{formatFrequency(sub.frequency)}
                      </span>
                    </p>
                  </div>

                  {sub.status === "active" && (
                    <Button
                      size="sm"
                      onClick={() => handlePay(sub._id)}
                      disabled={isPaying}
                      className={cn(
                        "h-8 rounded-xl font-bold text-xs bg-slate-900 hover:bg-slate-800 text-white shrink-0 shadow-sm",
                        sub.isOverdue && "bg-rose-600 hover:bg-rose-700",
                        sub.isDueSoon && "bg-amber-600 hover:bg-amber-700"
                      )}
                    >
                      {isPaying ? (
                        <CheckCircle className="w-3.5 h-3.5 animate-pulse" />
                      ) : (
                        "Log Payment"
                      )}
                    </Button>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-lg">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl border-none shadow-lg">
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedSub(sub);
                          setIsEditOpen(true);
                        }}
                        className="flex items-center gap-2 text-xs font-bold text-slate-600 py-2.5 rounded-lg cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-indigo-500" /> Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(sub._id)}
                        className="flex items-center gap-2 text-xs font-bold text-rose-600 py-2.5 rounded-lg cursor-pointer hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove Plan
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
