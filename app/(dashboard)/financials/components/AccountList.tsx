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

export function AccountList() {
  const accounts = useQuery(api.accounts.getAccounts);
  const removeAccount = useMutation(api.accounts.removeAccount);

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
            className="group relative overflow-hidden border-none bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-500"
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

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                    onClick={() => handleDelete(account._id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>

            {/* Subtle background decoration */}
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Wallet className="w-16 h-16" />
            </div>
          </Card>
        ))}

        {accounts.length === 0 && (
          <div className="text-center py-10 border-2 border-dashed rounded-xl border-slate-200 dark:border-slate-800">
            <p className="text-sm text-slate-500 italic">No accounts yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
