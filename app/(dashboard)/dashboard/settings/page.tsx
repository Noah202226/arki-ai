import { CategorySettings } from "@/app/(dashboard)/dashboard/components/CategorySettings";

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-10">
      {/* You can add other settings sections here later (Profile, Accounts, etc.) */}
      <CategorySettings />
    </div>
  );
}
