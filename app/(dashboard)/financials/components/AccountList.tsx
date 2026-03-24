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
  Plus,
  Banknote,
} from "lucide-react";
import { AddAccountDialog } from "./AddAccountDialog";
import { AddFundsDialog } from "./AddFundsDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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

export function AccountList() {
  const accounts = useQuery(api.accounts.getAccounts);
  const removeAccount = useMutation(api.accounts.removeAccount);

  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  if (accounts === undefined) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  // 1. CALCULATE TOTAL BALANCE
  const totalBalance = accounts.reduce(
    (acc, account) => acc + account.balance,
    0,
  );

  const handleDelete = async (id: any) => {
    if (confirm("Are you sure? Transactions linked here might be affected.")) {
      await removeAccount({ id });
    }
  };

  return (
    <div className="space-y-6">
      {/* 2. TOTAL BALANCE OVERVIEW CARD */}
      <Card className="border-none bg-blue-600 text-white shadow-lg overflow-hidden relative">
        <CardContent className="p-6 relative z-10">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest">
                Total Combined Balance
              </p>
              <h2 className="text-3xl font-black font-mono">
                ₱
                {totalBalance.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </h2>
            </div>
            <div className="bg-white/20 p-3 rounded-full">
              <Banknote className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardContent>
        {/* Background Decoration */}
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
      </Card>

      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Wallet className="w-4 h-4" /> My Wallets ({accounts.length})
        </h2>
        <AddAccountDialog />
      </div>

      <div className="grid gap-3">
        {accounts.map((account) => (
          <Card
            key={account._id}
            onClick={() => setSelectedAccount(account)}
            className={cn(
              "group relative overflow-hidden border-none bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-500 cursor-pointer active:scale-[0.98]",
              selectedAccount?._id === account._id &&
                "ring-2 ring-blue-500 ring-offset-2",
            )}
          >
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">
                  {account.accountName}
                </p>
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
                  <DropdownMenuContent align="end">
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
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Account Details</SheetTitle>
            <SheetDescription>
              Managing <strong>{selectedAccount?.accountName}</strong>
            </SheetDescription>
          </SheetHeader>

          {selectedAccount && (
            <div className="space-y-6">
              <div className="bg-slate-950 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                <div className="relative z-10 flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em]">
                      Available Balance
                    </p>
                    <h3 className="text-3xl font-black font-mono">
                      ₱
                      {selectedAccount.balance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </h3>
                  </div>

                  <AddFundsDialog
                    accountId={selectedAccount._id}
                    accountName={selectedAccount.accountName}
                    onSuccess={() => setSelectedAccount(null)}
                  />
                </div>
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Wallet className="w-24 h-24 rotate-12" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                  Recent Activity
                </h4>
                <AccountFlow accountId={selectedAccount._id} />
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
