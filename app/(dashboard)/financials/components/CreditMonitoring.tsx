"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Progress } from "@/components/ui/progress"; // shadcn
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CreditMonitoring() {
  const credits = useQuery(api.credits.getCreditSummary);

  if (!credits) return <div>Analyzing credits...</div>;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {credits.map((loan) => {
        const progress = (loan.totalPaid / loan.totalAmount) * 100;

        return (
          <Card key={loan._id} className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold">
                {loan.creditorName}
              </CardTitle>
              <span className="text-xs font-medium px-2 py-1 bg-orange-100 text-orange-700 rounded">
                {loan.remainingMonths} months left
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-bold">{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} className="h-2" />

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground uppercase">
                    Remaining
                  </p>
                  <p className="text-lg font-bold text-red-600">
                    ₱{loan.remainingBalance.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase">
                    Total Paid
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    ₱{loan.totalPaid.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
