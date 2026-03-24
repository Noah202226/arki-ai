"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  CreditCard,
  Wallet,
  Settings,
} from "lucide-react";
import { UserButton, useUser } from "@clerk/nextjs";
import { cn } from "@/lib/utils";

interface SidebarContentProps {
  onSelect?: () => void; // Idagdag itong prop
}

export function SidebarContent({ onSelect }: SidebarContentProps) {
  const pathname = usePathname();
  const { user } = useUser();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Receipt, label: "Financials", href: "/financials" },
    { icon: CreditCard, label: "Credits", href: "/credits" },
    { icon: Wallet, label: "Accounts", href: "/accounts" },
  ];

  return (
    <div className="flex flex-col h-full bg-card">
      {/* BRANDING SECTION */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Arc Tech
          </h2>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold px-1">
          Solutions
        </p>
      </div>

      {/* NAVIGATION SECTION */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onSelect} // ✅ Dito tatawagin ang close function
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 group",
                isActive
                  ? "bg-orange-50 text-orange-600 shadow-sm"
                  : "text-muted-foreground hover:bg-slate-100 hover:text-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5",
                  isActive
                    ? "text-orange-600"
                    : "text-muted-foreground group-hover:text-foreground",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* USER PROFILE SECTION (CLERK) */}
      <div className="p-4 border-t bg-slate-50/50">
        <div className="flex items-center justify-between px-2 py-2 rounded-xl bg-white border shadow-sm">
          <div className="flex items-center gap-3 overflow-hidden">
            <UserButton
              afterSwitchSessionUrl="/"
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-9 h-9",
                },
              }}
            />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold truncate">
                {user?.firstName || "User"}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {user?.primaryEmailAddress?.emailAddress}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
