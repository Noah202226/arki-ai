// app/(dashboard)/layout.tsx
import Link from "next/link";
import { Wallet, CheckSquare, LayoutDashboard, Settings } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* SIDEBAR - Desktop */}
      <aside className="hidden md:flex w-72 flex-col bg-white border-r-2 border-slate-100 p-6">
        <div className="mb-10 px-2">
          <h2 className="text-2xl font-black tracking-tighter text-indigo-600">
            ARC TECH
          </h2>
        </div>

        <nav className="space-y-2 flex-1">
          <NavLink href="/financials" icon={<Wallet />} label="Financials" />
          <NavLink href="/tasks" icon={<CheckSquare />} label="Daily System" />
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>

      {/* MOBILE NAV - Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-100 p-4 flex justify-around items-center z-50">
        <Link href="/financials" className="p-3 text-slate-400">
          <Wallet />
        </Link>
        <Link
          href="/tasks"
          className="p-3 text-indigo-600 bg-indigo-50 rounded-2xl"
        >
          <CheckSquare />
        </Link>
      </nav>
    </div>
  );
}

function NavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 px-4 py-4 rounded-2xl font-black text-slate-500 hover:bg-slate-50 hover:text-indigo-600 transition-all"
    >
      {icon} {label}
    </Link>
  );
}
