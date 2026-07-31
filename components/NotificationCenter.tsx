"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  CreditCard,
  CheckSquare,
  Info,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { requestAndRegisterPush } from "@/lib/push-subscription";

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "subscription" | "credit" | "task">("all");

  const data = useQuery(api.notifications.getNotifications);
  const syncReminders = useMutation(api.notifications.syncAutoReminders);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteNotif = useMutation(api.notifications.deleteNotification);
  const clearAll = useMutation(api.notifications.clearAll);

  // Auto-sync reminders on component mount
  useEffect(() => {
    syncReminders().catch(() => {});
  }, [syncReminders]);

  const items = data?.items || [];
  const unreadCount = data?.unreadCount || 0;

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    return item.type === filter;
  });

  const getIcon = (type: string, severity?: string) => {
    if (type === "subscription") {
      return <CreditCard className={cn("w-4 h-4", severity === "error" ? "text-rose-500" : "text-amber-500")} />;
    }
    if (type === "credit") {
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    }
    if (type === "task") {
      return <CheckSquare className="w-4 h-4 text-emerald-500" />;
    }
    return <Info className="w-4 h-4 text-indigo-500" />;
  };

  const pushStatus = useQuery(api.notifications.getPushStatus);
  const savePushMutation = useMutation(api.notifications.savePushSubscription);
  const [isRegisteringPush, setIsRegisteringPush] = useState(false);
  const [hasBrowserPermission, setHasBrowserPermission] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "granted") {
        setHasBrowserPermission(true);
        // Automatically sync device push registration with Convex
        requestAndRegisterPush(savePushMutation).catch(() => {});
      }
    }
  }, [savePushMutation]);

  const isSubscribed = pushStatus?.isSubscribed || hasBrowserPermission;

  const handleEnablePush = async () => {
    setIsRegisteringPush(true);
    try {
      const res = await requestAndRegisterPush(savePushMutation);
      if (res.success) {
        setHasBrowserPermission(true);
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to enable push.";
      toast.error(msg);
    } finally {
      setIsRegisteringPush(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      toast.error("Notifications not supported in this browser.");
      return;
    }

    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        toast.error("Notification permission denied in browser settings.");
        return;
      }
    }

    try {
      if ("serviceWorker" in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.showNotification("🚨 Arki Test System Alert", {
            body: "Your system status bar & desktop alerts are working perfectly! 🎉",
            icon: "/android-chrome-192x192.png",
            badge: "/favicon-32x32.png",
            data: { url: "/financials" },
          });
          toast.success("Test OS Notification sent to your system!");
          return;
        }
      }

      new Notification("🚨 Arki Test System Alert", {
        body: "Your system status bar & desktop alerts are working perfectly! 🎉",
        icon: "/android-chrome-192x192.png",
      });
      toast.success("Test OS Notification sent to your system!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to trigger test notification.";
      toast.error(msg);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
        >
          <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white shadow-md animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-[360px] sm:w-[400px] p-0 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#ff6b35]/10 text-[#ff6b35]">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 leading-none">
                Notifications
              </h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5">
                {unreadCount > 0 ? `${unreadCount} unread reminders` : "All caught up!"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="h-7 px-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Read all
              </Button>
            )}
            {items.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => clearAll()}
                className="h-7 w-7 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg"
                title="Clear all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 p-2 border-b border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 overflow-x-auto text-xs">
          {[
            { id: "all", label: "All" },
            { id: "subscription", label: "Bills" },
            { id: "credit", label: "Loans" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as typeof filter)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all shrink-0",
                filter === tab.id
                  ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="max-h-[280px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 flex-1">
          {filteredItems.length === 0 ? (
            <div className="py-10 text-center px-4">
              <Sparkles className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No notifications</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                Upcoming billings & loan payments will appear here.
              </p>
            </div>
          ) : (
            filteredItems.map((item) => {
              const notifId = item._id as Id<"notifications">;
              return (
                <div
                  key={item._id}
                  className={cn(
                    "p-3 flex items-start gap-3 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/40 relative group",
                    !item.isRead && "bg-orange-500/5 dark:bg-orange-500/10"
                  )}
                >
                  {/* Unread indicator */}
                  {!item.isRead && (
                    <span className="absolute left-1.5 top-4 w-1.5 h-1.5 rounded-full bg-[#ff6b35]" />
                  )}

                  {/* Icon */}
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                    {getIcon(item.type, item.severity)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h5 className="text-xs font-extrabold text-slate-900 dark:text-slate-100 truncate">
                        {item.title}
                      </h5>
                      <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 shrink-0">
                        {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                      {item.message}
                    </p>

                    {item.linkUrl && (
                      <Link
                        href={item.linkUrl}
                        onClick={() => {
                          if (!item.isRead) markAsRead({ id: notifId });
                          setOpen(false);
                        }}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[#ff6b35] dark:text-[#ff8555] hover:underline pt-1"
                      >
                        View Details <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => deleteNotif({ id: notifId })}
                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 dark:text-slate-600 dark:hover:text-rose-400 transition-all p-1"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Web Push Option */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                {isSubscribed ? "📱 Notifications Enabled" : "📱 Android & Desktop Push"}
              </p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500">
                {isSubscribed
                  ? "Status bar & browser alerts active."
                  : "Get lockscreen alerts when bills are due."}
              </p>
            </div>

            <Button
              size="sm"
              onClick={handleEnablePush}
              disabled={isRegisteringPush}
              className={cn(
                "h-7 text-[10px] font-extrabold rounded-xl px-2.5 shrink-0 transition-all",
                isSubscribed
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                  : "bg-[#ff6b35] text-white hover:bg-[#e05a2b] shadow-sm"
              )}
            >
              {isRegisteringPush
                ? "Enabling..."
                : isSubscribed
                ? "Active ✅"
                : "Enable Push"}
            </Button>
          </div>

          {/* Test System Notification Trigger */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleSendTestNotification}
            className="w-full h-8 text-[11px] font-bold rounded-xl border-dashed border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 gap-1.5"
          >
            🧪 Test System Notification Banner
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
