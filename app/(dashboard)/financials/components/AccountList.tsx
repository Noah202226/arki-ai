"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Trash2, Loader2, MoreVertical } from "lucide-react";
import { AddAccountDialog } from "./AddAccountDialog";
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

  const handleDelete = async (id: any) => {
    if (
      confirm(
        "Are you sure you want to delete this account? Transactions linked here might be affected.",
      )
    ) {
      await removeAccount({ id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Wallet className="w-4 h-4" /> My Wallets
        </h2>
        <AddAccountDialog />
      </div>

      <div className="grid gap-3">
        {accounts.map((account) => (
          <Card
            key={account._id}
            // 1. GAWING CLICKABLE ANG CARD
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

              {/* ACTIONS MENU (StopPropagation para hindi mag-trigger ang card click) */}
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

      {/* --- SHEET PARA SA ACCOUNT FLOW --- */}
      <Sheet
        open={!!selectedAccount}
        onOpenChange={(open) => !open && setSelectedAccount(null)}
      >
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Account Details</SheetTitle>
            <SheetDescription>
              Showing transaction history for{" "}
              <strong>{selectedAccount?.accountName}</strong>
            </SheetDescription>
          </SheetHeader>

          {selectedAccount && (
            <div className="space-y-6">
              {/* Quick Balance Header sa loob ng Sheet */}
              <div className="bg-slate-50 p-4 rounded-xl">
                <p className="text-xs text-slate-500 uppercase font-semibold">
                  Current Balance
                </p>
                <h3 className="text-2xl font-bold text-slate-900">
                  ₱{selectedAccount.balance.toLocaleString()}
                </h3>
              </div>

              {/* History Component */}
              <AccountFlow accountId={selectedAccount._id} />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
