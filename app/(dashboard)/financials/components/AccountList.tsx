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
  Coins,
  ShieldCheck,
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

export function AccountList() {
  const accounts = useQuery(api.accounts.getAccounts);
  const removeAccount = useMutation(api.accounts.removeAccount);
  const toggleSavings = useMutation(api.accounts.toggleSavings); // Ensure this mutation exists in convex/accounts.ts

  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  if (accounts === undefined) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // --- CALCULATIONS ---

  // 1. Total Net Worth (Everything)
  const totalBalance = accounts.reduce(
    (acc, account) => acc + account.balance,
    0,
  );

  // 2. Investment/Savings Total (Only accounts with isSavings: true)
  const investmentBalance = accounts.reduce(
    (acc, account) => acc + (account.isSavings ? account.balance : 0),
    0,
  );

  // 3. Liquid Cash (Total minus Investments)
  const liquidBalance = totalBalance - investmentBalance;

  const handleDelete = async (id: any) => {
    if (confirm("Are you sure? Transactions linked here might be affected.")) {
      await removeAccount({ id });
    }
  };

  const handleToggleSavings = async (id: any, currentStatus: boolean) => {
    await toggleSavings({ id, isSavings: !currentStatus });
  };

  return (
    <div className="space-y-6">
      {/* --- TOP OVERVIEW CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TOTAL NET WORTH */}
        <Card className="border-none bg-blue-600 text-white shadow-lg overflow-hidden relative">
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest">
                  Total Net Worth
                </p>
                <h2 className="text-2xl font-black font-mono">
                  ₱
                  {totalBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </h2>
              </div>
              <div className="bg-white/20 p-2.5 rounded-full">
                <Banknote className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </Card>

        {/* LIQUID CASH (Total - Investments) */}
        <Card className="border-none bg-emerald-500 text-white shadow-lg overflow-hidden relative">
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest">
                  Usable Liquid Cash
                </p>
                <h2 className="text-2xl font-black font-mono">
                  ₱
                  {liquidBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </h2>
              </div>
              <div className="bg-white/20 p-2.5 rounded-full">
                <Coins className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </Card>

        {/* INVESTMENTS / SAVINGS */}
        <Card className="border-none bg-indigo-600 text-white shadow-lg overflow-hidden relative">
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-indigo-100 text-[10px] font-bold uppercase tracking-widest">
                  Investments & Savings
                </p>
                <h2 className="text-2xl font-black font-mono">
                  ₱
                  {investmentBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </h2>
              </div>
              <div className="bg-white/20 p-2.5 rounded-full">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
          </CardContent>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </Card>
      </div>

      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Wallet className="w-4 h-4" /> My Wallets ({accounts.length})
        </h2>
        <AddAccountDialog />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {accounts.map((account) => (
          <Card
            key={account._id}
            onClick={() => setSelectedAccount(account)}
            className={cn(
              "group relative overflow-hidden border-none bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all border-l-4 cursor-pointer active:scale-[0.98]",
              account.isSavings
                ? "border-l-indigo-500"
                : "border-l-emerald-500",
              selectedAccount?._id === account._id &&
                "ring-2 ring-blue-500 ring-offset-2",
            )}
          >
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-xs font-medium text-slate-500 uppercase truncate max-w-[100px]">
                    {account.accountName}
                  </p>
                  {account.isSavings && (
                    <ShieldCheck className="w-3 h-3 text-indigo-500" />
                  )}
                </div>
                <p className="text-xl font-bold tracking-tight">
                  {account.currency === "PHP" ? "₱" : "$"}
                  {account.balance.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </div>

              <div onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() =>
                        handleToggleSavings(account._id, !!account.isSavings)
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
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet
        open={!!selectedAccount}
        onOpenChange={(open) => !open && setSelectedAccount(null)}
      >
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-2">
          <SheetHeader className="mb-6">
            <SheetTitle>Account Details</SheetTitle>
            <SheetDescription>
              Managing <strong>{selectedAccount?.accountName}</strong>
            </SheetDescription>
          </SheetHeader>

          {selectedAccount && (
            <div className="space-y-6 p-4 md:p-0">
              {/* Modern Balance Card */}
              <div
                className={cn(
                  "relative overflow-hidden rounded-3xl p-8 text-white shadow-2xl transition-colors duration-500",
                  selectedAccount.isSavings
                    ? "bg-linear-to-br from-indigo-900 to-slate-900"
                    : "bg-linear-to-br from-slate-900 to-slate-800",
                )}
              >
                <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      {selectedAccount.isSavings
                        ? "Invested Balance"
                        : "Available Balance"}
                    </p>
                    <h3 className="mt-1 text-4xl font-black tracking-tight font-mono">
                      ₱{" "}
                      {selectedAccount.balance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </h3>
                  </div>

                  <div className="flex flex-col items-center gap-3">
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

                {/* Subtle Background Pattern */}
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
              </div>

              {/* Activity Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    Recent Activity
                  </h4>
                </div>
                <AccountFlow accountId={selectedAccount._id} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
