// app/(dashboard)/settings/page.tsx
import { CategorySettings } from "@/app/(dashboard)/dashboard/components/CategorySettings";

export default function SettingsPage() {
  return (
    <div className="space-y-8 pb-10 max-w-400 mx-auto">
      <div className="border-b pb-6">
        <h1 className="text-4xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-1">
          Configure your application preferences and manage data labels.
        </p>
      </div>

      <section>
        {/* You can add more settings sections here later */}
        <CategorySettings />
      </section>
    </div>
  );
}
