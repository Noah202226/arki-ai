"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet, Landmark, CreditCard } from "lucide-react";

export default function AccountsPage() {
  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            My Accounts
          </h1>
          <p className="text-muted-foreground">
            Manage your digital wallets, banks, and cash on hand.
          </p>
        </div>
        <Button variant="outline" className="w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" /> Link New Account
        </Button>
      </div>

      {/* ACCOUNTS GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Placeholder for GCash */}
        <Card className="hover:border-blue-400 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">GCash</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱0.00</div>
            <p className="text-xs text-muted-foreground">e-Wallet Account</p>
          </CardContent>
        </Card>

        {/* Placeholder for Bank */}
        <Card className="hover:border-orange-400 transition-colors cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">BPI Savings</CardTitle>
            <Landmark className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱0.00</div>
            <p className="text-xs text-muted-foreground">Bank Account</p>
          </CardContent>
        </Card>

        {/* Placeholder for Cash */}
        <Card className="hover:border-green-400 transition-colors cursor-pointer border-dashed">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cash on Hand</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱0.00</div>
            <p className="text-xs text-muted-foreground text-center pt-2">
              Add amount manually
            </p>
          </CardContent>
        </Card>
      </div>

      {/* RECENT ACCOUNT ACTIVITY SECTION */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Account Allocation</h3>
        <Card className="min-h-50 flex items-center justify-center border-dashed">
          <p className="text-muted-foreground text-sm">
            Allocation chart coming soon...
          </p>
        </Card>
      </div>
    </div>
  );
}
