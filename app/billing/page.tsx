import { PricingTable } from "@clerk/nextjs";

export default function BillingPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Upgrade your account</h1>
      <PricingTable />
    </div>
  );
}
