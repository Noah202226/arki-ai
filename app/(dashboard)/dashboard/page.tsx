import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Page() {
  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Financials</h1>
        <p className="text-muted-foreground">
          Manage and track your daily transactions here.
        </p>
      </div>

      {/* QUICK STATS OR CONTENT PLACEHOLDER */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₱0.00</div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN CONTENT AREA */}
      <Card className="min-h-100 flex items-center justify-center border-dashed">
        <div className="text-center space-y-2">
          <p className="text-muted-foreground">
            Main content for this module is coming soon.
          </p>
        </div>
      </Card>
    </div>
  );
}
