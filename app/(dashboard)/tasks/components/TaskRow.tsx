import { Id } from "@/convex/_generated/dataModel";
import { Circle, Clock, CheckCircle2, Repeat, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TaskRowProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  task: any;
  onToggle: (args: { id: Id<"tasks"> }) => void;
  onDelete: (args: { id: Id<"tasks"> }) => void;
  isRoutine?: boolean;
}

export function TaskRow({ task, onToggle, onDelete, isRoutine }: TaskRowProps) {
  const accentColor = isRoutine ? "#34d399" : "#ff6b35";
  const accentBg = isRoutine
    ? "rgba(52,211,153,0.10)"
    : "rgba(255,107,53,0.10)";

  return (
    <div
      className={cn(
        "relative group flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all duration-150",
        "hover:shadow-sm hover:-translate-y-[1px]",
        task.isCompleted
          ? "bg-[#f5f2ed] dark:bg-slate-900/60 border-[#e8e4de] dark:border-slate-800 opacity-60"
          : "bg-white dark:bg-slate-900 border-[#e8e4de] dark:border-slate-800",
      )}
    >
      <div
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: accentColor }}
      />

      <button
        onClick={async () => {
          const willBeCompleted = !task.isCompleted;
          onToggle({ id: task._id });

          // Send OS notification when task is marked completed
          if (willBeCompleted && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
            try {
              if ("serviceWorker" in navigator) {
                const reg = await navigator.serviceWorker.getRegistration();
                if (reg) {
                  await reg.showNotification("🎉 Task Completed!", {
                    body: `Completed: "${task.text}"`,
                    icon: "/android-chrome-192x192.png",
                    badge: "/favicon-32x32.png",
                    data: { url: "/tasks" },
                  });
                  return;
                }
              }
              new Notification("🎉 Task Completed!", {
                body: `Completed: "${task.text}"`,
                icon: "/android-chrome-192x192.png",
              });
            } catch (err) {
              console.warn("Failed to trigger task OS notification:", err);
            }
          }
        }}
        className="shrink-0 transition-transform active:scale-90"
      >
        {task.isCompleted ? (
          <CheckCircle2 className="w-6 h-6" style={{ color: accentColor }} />
        ) : (
          <Circle className="w-6 h-6 text-[#1a1a2e]/15 dark:text-slate-600 group-hover:text-[#1a1a2e]/40 dark:group-hover:text-slate-400 transition-colors" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-bold text-[#1a1a2e] dark:text-slate-100 leading-tight truncate",
            task.isCompleted && "line-through text-[#1a1a2e]/40 dark:text-slate-500",
          )}
        >
          {task.text}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {isRoutine && (
            <span
              className="flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded"
              style={{ background: accentBg, color: accentColor }}
            >
              <Repeat className="w-2.5 h-2.5" /> DAILY
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] font-medium text-[#1a1a2e]/30 dark:text-slate-500">
            <Clock className="w-3 h-3" /> 09:00 AM
          </span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete({ id: task._id })}
        className="h-7 w-7 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/40 rounded-lg transition-all flex-shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
