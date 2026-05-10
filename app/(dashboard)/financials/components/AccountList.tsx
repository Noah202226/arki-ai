"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Trash2,
  Loader2,
  MoreVertical,
  Banknote,
  TrendingUp,
  ShieldCheck,
  Target,
  AlertCircle,
  Scale,
  Smartphone, // For GCash/Maya
  Building2, // For Banks
  HandCoins, // For Cash on Hand
  CreditCard,
  Coins, // For general cards
} from "lucide-react";
import { AddAccountDialog } from "./AddAccountDialog";
import { AddFundsDialog } from "./AddFundsDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AccountFlow } from "./AccountFlow";
import { TransferDialog } from "./TransferDialog";

// --- HELPERS FOR BRANDING ---
const getAccountBranding = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("gcash"))
    return {
      color: "bg-blue-600",
      icon: <Smartphone className="w-4 h-4" />,
      logoText: "G",
    };
  if (n.includes("maya"))
    return {
      color: "bg-emerald-500",
      icon: <Smartphone className="w-4 h-4" />,
      logoText: "M",
    };
  if (n.includes("landbank") || n.includes("lbp"))
    return {
      color: "bg-green-700",
      icon: <Building2 className="w-4 h-4" />,
      logoText: "L",
    };
  if (n.includes("bdo"))
    return {
      color: "bg-blue-800",
      icon: <Building2 className="w-4 h-4" />,
      logoText: "B",
    };
  if (n.includes("bpi"))
    return {
      color: "bg-red-600",
      icon: <Building2 className="w-4 h-4" />,
      logoText: "B",
    };
  if (n.includes("maribank"))
    return {
      color: "bg-orange-500",
      icon: <Building2 className="w-4 h-4" />,
      logoText: "M",
    };
  if (n.includes("cash on hand") || n.includes("wallet"))
    return {
      color: "bg-slate-700",
      icon: <HandCoins className="w-4 h-4" />,
      logoText: "₱",
    };

  return {
    color: "bg-slate-500",
    icon: <CreditCard className="w-4 h-4" />,
    logoText: "A",
  };
};

export function AccountList() {
  const accounts = useQuery(api.accounts.getAccounts);
  const creditSummary = useQuery(api.credits.getCreditSummary);

  const removeAccount = useMutation(api.accounts.removeAccount);
  const toggleSavings = useMutation(api.accounts.toggleSavings);

  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  if (accounts === undefined || creditSummary === undefined) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // --- CALCULATIONS ---
  const totalAssets = accounts.reduce(
    (acc, account) => acc + account.balance,
    0,
  );
  const totalDebt = creditSummary.reduce(
    (acc, credit) => acc + (credit.remainingBalance || 0),
    0,
  );
  const investmentBalance = accounts.reduce(
    (acc, account) => acc + (account.isSavings ? account.balance : 0),
    0,
  );
  const liquidBalance = totalAssets - investmentBalance;
  const earningsTarget = Math.max(0, totalDebt - totalAssets);
  const netPosition = totalAssets - totalDebt;

  const handleDelete = async (id: any) => {
    if (
      confirm(
        "Are you sure? This will remove the account from your total assets.",
      )
    ) {
      await removeAccount({ id });
    }
  };

  const handleToggleSavings = async (id: any, currentStatus: boolean) => {
    await toggleSavings({ id, isSavings: !currentStatus });
  };

  return (
    <div className="space-y-6">
      {/* --- DASHBOARD OVERVIEW --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* CARD 1: TOTAL ASSETS */}
        <Card className="border-none bg-blue-600 text-white shadow-lg overflow-hidden relative">
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">
                  Total Combined Assets
                </p>
                <h2 className="text-2xl font-black font-mono">
                  ₱
                  {totalAssets.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </h2>
                <p className="text-[9px] opacity-80 italic font-medium">
                  Sum of all your wallets
                </p>
              </div>
              <div className="bg-white/20 p-2.5 rounded-full">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </Card>

        {/* CARD 2: LIQUID CASH */}
        <Card className="border-none bg-emerald-500 text-white shadow-lg overflow-hidden relative">
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest">
                  Usable Liquid Assets
                </p>
                <h2 className="text-2xl font-black font-mono">
                  ₱
                  {liquidBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </h2>
                <p className="text-[9px] opacity-80 italic font-medium">
                  Ready-to-use cash
                </p>
              </div>
              <div className="bg-white/20 p-2.5 rounded-full">
                <Coins className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CARD 3: TOTAL SAVINGS */}
        <Card className="border-none bg-indigo-600 text-white shadow-lg overflow-hidden relative">
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest">
                  Total Savings Amount
                </p>
                <h2 className="text-2xl font-black font-mono">
                  ₱
                  {investmentBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </h2>
                <p className="text-[9px] opacity-80 italic font-medium">
                  Locked/Invested funds
                </p>
              </div>
              <div className="bg-white/20 p-2.5 rounded-full">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CARD 4: TOTAL DEBT */}
        <Card className="border-none bg-amber-500 text-white shadow-lg overflow-hidden relative">
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-amber-100 text-[10px] font-bold uppercase tracking-widest">
                  Total Remaining Balance (Owed)
                </p>
                <h2 className="text-2xl font-black font-mono">
                  ₱
                  {totalDebt.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </h2>
                <p className="text-[9px] opacity-80 italic font-medium">
                  Pending credit obligations
                </p>
              </div>
              <div className="bg-white/20 p-2.5 rounded-full">
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CARD 5: EARNINGS TARGET */}
        <Card className="border-none bg-rose-600 text-white shadow-lg overflow-hidden relative">
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-rose-100 text-[10px] font-bold uppercase tracking-widest">
                  Target Amount to Earn
                </p>
                <h2 className="text-2xl font-black font-mono">
                  ₱
                  {earningsTarget.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </h2>
                <p className="text-[9px] opacity-80 italic font-medium">
                  Income needed to clear all debt
                </p>
              </div>
              <div className="bg-white/20 p-2.5 rounded-full">
                <Target className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CARD 6: NET POSITION (Comparison) */}
        <Card
          className={cn(
            "border-none text-white shadow-lg overflow-hidden relative",
            netPosition >= 0 ? "bg-slate-800" : "bg-red-900",
          )}
        >
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">
                  Assets Less Credit Balance
                </p>
                <h2 className="text-2xl font-black font-mono">
                  ₱
                  {netPosition.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </h2>
                <p className="text-[9px] opacity-80 italic font-medium">
                  True financial difference
                </p>
              </div>
              <div className="bg-white/20 p-2.5 rounded-full">
                <Scale className="w-5 h-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- WALLET LIST SECTION --- */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
          My Wallets{" "}
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            {accounts.length}
          </span>
        </h2>
        <AddAccountDialog />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => {
          const branding = getAccountBranding(account.accountName);

          return (
            <Card
              key={account._id}
              onClick={() => setSelectedAccount(account)}
              className={cn(
                "group relative overflow-hidden border-none bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98]",
                selectedAccount?._id === account._id &&
                  "ring-2 ring-blue-500 ring-offset-2",
              )}
            >
              <CardContent className="p-0">
                {/* Brand Accent Top Bar */}
                <div className={cn("h-1 w-full", branding.color)} />

                <div className="p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      {/* Modern Logo Placeholder */}
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm",
                          branding.color,
                        )}
                      >
                        {branding.logoText}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate max-w-30">
                            {account.accountName}
                          </p>
                          {account.isSavings && (
                            <ShieldCheck className="w-3 h-3 text-indigo-500" />
                          )}
                        </div>
                        <p className="text-lg font-black tracking-tighter">
                          ₱
                          {account.balance.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>

                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-slate-400 hover:text-slate-900"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() =>
                              handleToggleSavings(
                                account._id,
                                !!account.isSavings,
                              )
                            }
                          >
                            <TrendingUp className="w-4 h-4 mr-2 text-indigo-500" />
                            {account.isSavings
                              ? "Set as Regular Account"
                              : "Mark as Investment"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(account._id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Subtle Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
                    <span className="text-[9px] font-bold text-slate-300 uppercase flex items-center gap-1">
                      {branding.icon}{" "}
                      {account.isSavings ? "Investment" : "Personal"}
                    </span>
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* --- ACCOUNT DETAILS SHEET --- */}
      <Sheet
        open={!!selectedAccount}
        onOpenChange={(open) => !open && setSelectedAccount(null)}
      >
        <SheetContent className="w-full sm:max-w-md p-0 flex flex-col h-full border-l-0 shadow-2xl">
          {selectedAccount && (
            <>
              {/* Modern Sheet Header Area */}
              <div className="bg-white dark:bg-slate-950 px-8 pt-10 pb-1 shrink-0">
                <SheetHeader className="text-left">
                  <div className="flex items-center gap-1">
                    {/* Animated Live Status Indicator */}
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <SheetTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                      Account Flow
                    </SheetTitle>
                  </div>
                  <SheetDescription className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {selectedAccount.accountName}
                  </SheetDescription>
                </SheetHeader>
              </div>

              {/* 1. BALANCE CARD (Now sits below the clean header) */}
              <div className="px-6 shrink-0">
                <div
                  className={cn(
                    "relative overflow-hidden rounded-[32px] p-8 text-white shadow-xl transition-all duration-500",
                    getAccountBranding(selectedAccount.accountName).color,
                  )}
                >
                  <div className="relative z-10">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
                      Current Balance
                    </p>
                    <h3 className="text-4xl font-black mt-1 font-mono tracking-tight">
                      ₱
                      {selectedAccount.balance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </h3>

                    {/* Action Buttons with Glassmorphism */}
                    <div className="mt-8 flex gap-3">
                      <AddFundsDialog
                        accountId={selectedAccount._id}
                        accountName={selectedAccount.accountName}
                      />
                      <TransferDialog
                        sourceAccount={selectedAccount}
                        allAccounts={accounts}
                      />
                    </div>
                  </div>

                  {/* Background Glass Orbs */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-2xl" />
                </div>
              </div>

              {/* 2. TRANSACTION HISTORY (Scrollable Area) */}
              <div className="flex-1 overflow-y-auto mt-8 px-6 pb-8 custom-scrollbar">
                <div className="flex items-center justify-between mb-6 sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-2 z-30">
                  <h4 className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
                    Transaction History
                  </h4>
                  <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800 ml-4" />
                </div>

                <AccountFlow accountId={selectedAccount._id} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
