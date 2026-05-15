"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Trash2,
  Loader2,
  MoreVertical,
  TrendingUp,
  ShieldCheck,
  Target,
  AlertCircle,
  Scale,
  Smartphone,
  Building2,
  HandCoins,
  CreditCard,
  Coins,
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

const getAccountBranding = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("gcash"))
    return {
      color: "bg-blue-600",
      dot: "#2563eb",
      icon: <Smartphone className="w-4 h-4" />,
      logoText: "G",
    };
  if (n.includes("maya"))
    return {
      color: "bg-emerald-500",
      dot: "#10b981",
      icon: <Smartphone className="w-4 h-4" />,
      logoText: "M",
    };
  if (n.includes("landbank") || n.includes("lbp"))
    return {
      color: "bg-green-700",
      dot: "#15803d",
      icon: <Building2 className="w-4 h-4" />,
      logoText: "L",
    };
  if (n.includes("bdo"))
    return {
      color: "bg-blue-800",
      dot: "#1e40af",
      icon: <Building2 className="w-4 h-4" />,
      logoText: "B",
    };
  if (n.includes("bpi"))
    return {
      color: "bg-red-600",
      dot: "#dc2626",
      icon: <Building2 className="w-4 h-4" />,
      logoText: "B",
    };
  if (n.includes("maribank"))
    return {
      color: "bg-orange-500",
      dot: "#f97316",
      icon: <Building2 className="w-4 h-4" />,
      logoText: "M",
    };
  if (n.includes("cash on hand") || n.includes("wallet"))
    return {
      color: "bg-slate-600",
      dot: "#475569",
      icon: <HandCoins className="w-4 h-4" />,
      logoText: "₱",
    };
  return {
    color: "bg-slate-500",
    dot: "#64748b",
    icon: <CreditCard className="w-4 h-4" />,
    logoText: "A",
  };
};

const formatPHP = (amount: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 3,
  }).format(amount);

export function AccountList() {
  const accounts = useQuery(api.accounts.getAccounts);
  const creditSummary = useQuery(api.credits.getCreditSummary);
  const removeAccount = useMutation(api.accounts.removeAccount);
  const toggleSavings = useMutation(api.accounts.toggleSavings);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  if (accounts === undefined || creditSummary === undefined) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#1a1a2e]/20" />
      </div>
    );
  }

  const totalAssets = accounts.reduce((acc, a) => acc + a.balance, 0);
  const totalDebt = creditSummary.reduce(
    (acc, c) => acc + (c.remainingBalance || 0),
    0,
  );
  const investmentBalance = accounts.reduce(
    (acc, a) => acc + (a.isSavings ? a.balance : 0),
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

  const overviewStats = [
    {
      label: "Total Combined Assets",
      value: totalAssets,
      sub: "Sum of all your wallets",
      icon: Wallet,
      accentColor: "#3b82f6",
      accentBg: "rgba(59,130,246,0.10)",
    },
    {
      label: "Usable Liquid Assets",
      value: liquidBalance,
      sub: "Ready-to-use cash",
      icon: Coins,
      accentColor: "#10b981",
      accentBg: "rgba(16,185,129,0.10)",
    },
    {
      label: "Total Savings Amount",
      value: investmentBalance,
      sub: "Locked / Invested funds",
      icon: ShieldCheck,
      accentColor: "#818cf8",
      accentBg: "rgba(129,140,248,0.10)",
    },
    {
      label: "Total Remaining Balance",
      value: totalDebt,
      sub: "Pending credit obligations",
      icon: AlertCircle,
      accentColor: "#f59e0b",
      accentBg: "rgba(245,158,11,0.10)",
    },
    {
      label: "Target Amount to Earn",
      value: earningsTarget,
      sub: "Income needed to clear all debt",
      icon: Target,
      accentColor: "#ff6b35",
      accentBg: "rgba(255,107,53,0.10)",
    },
    {
      label: "Assets Less Credit Balance",
      value: netPosition,
      sub: "True financial difference",
      icon: Scale,
      accentColor: netPosition >= 0 ? "#34d399" : "#f87171",
      accentBg:
        netPosition >= 0 ? "rgba(52,211,153,0.10)" : "rgba(248,113,113,0.10)",
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── OVERVIEW STATS GRID ── */}
      {/* Mobile: 1 col stacked | sm: 2 col | lg: 3 col */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#e0dbd4] rounded-2xl overflow-hidden border border-[#e0dbd4]">
        {overviewStats.map((stat) => (
          <div
            key={stat.label}
            className="relative bg-[#f5f2ed] px-5 py-5 flex flex-col gap-4 group"
          >
            {/* Left accent bar */}
            <div
              className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full"
              style={{ background: stat.accentColor }}
            />

            {/* Icon + percentage row */}
            <div className="flex items-center justify-between">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: stat.accentBg }}
              >
                <stat.icon
                  className="w-5 h-5"
                  style={{ color: stat.accentColor }}
                />
              </div>
              <span
                className="text-xs font-black font-mono px-2 py-0.5 rounded-md"
                style={{ color: stat.accentColor, background: stat.accentBg }}
              >
                {stat.value >= 0 ? "+" : ""}
                {((stat.value / (totalAssets || 1)) * 100).toFixed(0)}%
              </span>
            </div>

            {/* Label + Value */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-[#1a1a2e]/40 mb-2 leading-tight">
                {stat.label}
              </p>
              <p
                className="font-mono font-black tracking-tight leading-none text-[#1a1a2e] break-all"
                style={{ fontSize: "clamp(18px, 3.5vw, 22px)" }}
              >
                {formatPHP(stat.value)}
              </p>
              <p className="text-xs text-[#1a1a2e]/30 mt-1.5 italic">
                {stat.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── MY WALLETS HEADER ── */}
      <div className="flex items-center justify-between pt-1">
        <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#1a1a2e]">
          <span className="w-[3px] h-[14px] rounded-sm bg-[#ff6b35]" />
          My Wallets
          <span className="text-[10px] bg-[#1a1a2e]/[0.07] text-[#1a1a2e]/50 px-2 py-0.5 rounded-full font-bold">
            {accounts.length}
          </span>
        </h2>
        <AddAccountDialog />
      </div>

      {/* ── WALLET CARDS ── */}
      {/* Mobile: 1 col | sm: 2 col | lg: 3 col */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {accounts.map((account) => {
          const branding = getAccountBranding(account.accountName);
          return (
            <div
              key={account._id}
              onClick={() => setSelectedAccount(account)}
              className={cn(
                "group relative bg-white border border-[#e8e4de] rounded-2xl overflow-hidden cursor-pointer",
                "hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98]",
                selectedAccount?._id === account._id &&
                  "ring-2 ring-[#ff6b35] ring-offset-2",
              )}
            >
              {/* Top accent bar */}
              <div className={cn("h-[3px] w-full", branding.color)} />

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar */}
                    <div
                      className={cn(
                        "w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-base shadow-sm flex-shrink-0",
                        branding.color,
                      )}
                    >
                      {branding.logoText}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-[11px] font-bold text-[#1a1a2e]/40 uppercase tracking-tight truncate">
                          {account.accountName}
                        </p>
                        {account.isSavings && (
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xl font-black font-mono tracking-tight text-[#1a1a2e] leading-tight">
                        ₱
                        {account.balance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Dropdown — stop propagation so card click doesn't fire */}
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0"
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-[#1a1a2e]/25 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/[0.06] rounded-lg"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
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
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDelete(account._id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#f0ede8]">
                  <span
                    className="text-[10px] font-bold uppercase flex items-center gap-1.5"
                    style={{ color: branding.dot }}
                  >
                    {branding.icon}
                    <span className="text-[#1a1a2e]/30">
                      {account.isSavings ? "Investment" : "Personal"}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-[#1a1a2e]/25 font-medium">
                      Active
                    </span>
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── ACCOUNT DETAILS SHEET ── */}
      <Sheet
        open={!!selectedAccount}
        onOpenChange={(open) => !open && setSelectedAccount(null)}
      >
        {/* w-full on mobile, capped at md on larger screens */}
        <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col h-full border-l border-[#e0dbd4] shadow-2xl bg-[#f5f2ed]">
          {selectedAccount && (
            <>
              {/* Navy header */}
              <div className="bg-[#1a1a2e] px-6 sm:px-8 pt-8 pb-7 shrink-0">
                <SheetHeader className="text-left space-y-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </div>
                    <SheetTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                      Account Flow
                    </SheetTitle>
                  </div>
                  <SheetDescription className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    {selectedAccount.accountName}
                  </SheetDescription>
                </SheetHeader>
              </div>

              {/* Balance card — overlaps header slightly */}
              <div className="px-4 sm:px-6 -mt-3 shrink-0">
                <div
                  className={cn(
                    "relative overflow-hidden rounded-2xl p-6 text-white shadow-xl",
                    getAccountBranding(selectedAccount.accountName).color,
                  )}
                >
                  <div className="relative z-10">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-1">
                      Current Balance
                    </p>
                    <h3 className="text-3xl sm:text-4xl font-black font-mono tracking-tight break-all">
                      ₱
                      {selectedAccount.balance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </h3>
                    <div className="mt-5 flex flex-wrap gap-3">
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
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-2xl pointer-events-none" />
                </div>
              </div>

              {/* Scrollable transaction history */}
              <div className="flex-1 overflow-y-auto mt-6 px-4 sm:px-6 pb-10">
                <div className="flex items-center gap-3 mb-5 sticky top-0 bg-[#f5f2ed]/95 backdrop-blur-sm py-2 z-30">
                  <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-[#1a1a2e]/40 whitespace-nowrap">
                    <span className="w-[3px] h-[12px] rounded-sm bg-[#ff6b35]" />
                    Transaction History
                  </h4>
                  <div className="h-px flex-1 bg-[#e0dbd4]" />
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
