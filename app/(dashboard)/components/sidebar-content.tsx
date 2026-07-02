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
import { cn } from "@/lib/utils";
import { UserNavButton } from "./user-nav-button";

interface SidebarContentProps {
  onSelect?: () => void;
}

export function SidebarContent({ onSelect }: SidebarContentProps) {
  const pathname = usePathname();

  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
    { icon: Receipt, label: "Financials", href: "/financials" },
    { icon: CreditCard, label: "Credits", href: "/credits" },
    { icon: Wallet, label: "Accounts", href: "/accounts" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <div className="flex flex-col h-full bg-card">
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

      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onSelect}
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

      <div className="p-4 border-t bg-slate-50/50">
        <UserNavButton onAction={onSelect} side="right" />
      </div>
    </div>
  );
}
