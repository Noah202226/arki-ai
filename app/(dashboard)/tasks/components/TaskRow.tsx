"use client";

import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Circle, Clock, CheckCircle2, Repeat, Trash2, Brain, ChevronDown, ChevronUp, Plus, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface TaskRowProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  task: any;
  onToggle: (args: { id: Id<"tasks"> }) => void;
  onDelete: (args: { id: Id<"tasks"> }) => void;
  onStartFocus?: (task: any) => void;
  isRoutine?: boolean;
}

export function TaskRow({ task, onToggle, onDelete, onStartFocus, isRoutine }: TaskRowProps) {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState("");
  const updateSubtasks = useMutation(api.tasks.updateSubtasks);

  const accentColor = isRoutine ? "#34d399" : "#ff6b35";
  const accentBg = isRoutine ? "rgba(52,211,153,0.10)" : "rgba(255,107,53,0.10)";

  const subtasks = task.subtasks ?? [];
  const completedSubtasksCount = subtasks.filter((s: { isCompleted: boolean }) => s.isCompleted).length;

  const handleToggleSubtask = (subtaskId: string) => {
    const updated = subtasks.map((s: { id: string; text: string; isCompleted: boolean }) => {
      if (s.id === subtaskId) return { ...s, isCompleted: !s.isCompleted };
      return s;
    });
    updateSubtasks({ id: task._id, subtasks: updated }).catch(console.error);
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskText.trim()) return;

    const newSub = {
      id: Date.now().toString(),
      text: newSubtaskText.trim(),
      isCompleted: false,
    };
    const updated = [...subtasks, newSub];
    updateSubtasks({ id: task._id, subtasks: updated }).catch(console.error);
    setNewSubtaskText("");
  };

  const xpAmount = task.xpValue ?? (task.priority === "high" ? 50 : task.priority === "medium" ? 30 : 20);

  return (
    <div
      className={cn(
        "relative group flex flex-col rounded-xl border transition-all duration-150 overflow-hidden",
        "hover:shadow-sm hover:-translate-y-[1px]",
        task.isCompleted
          ? "bg-[#f5f2ed] dark:bg-slate-900/60 border-[#e8e4de] dark:border-slate-800 opacity-70"
          : "bg-white dark:bg-slate-900 border-[#e8e4de] dark:border-slate-800",
      )}
    >
      <div
        className="absolute left-0 top-2 bottom-2 w-[3.5px] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: accentColor }}
      />

      <div className="flex items-center gap-3 px-4 py-3.5">
        {/* Checkbox */}
        <button
          onClick={async () => {
            const willBeCompleted = !task.isCompleted;
            onToggle({ id: task._id });

            if (willBeCompleted && typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              try {
                if ("serviceWorker" in navigator) {
                  const reg = await navigator.serviceWorker.getRegistration();
                  if (reg) {
                    await reg.showNotification("🎉 Task Completed!", {
                      body: `Completed: "${task.text}" (+${xpAmount} XP)`,
                      icon: "/android-chrome-192x192.png",
                      badge: "/favicon-32x32.png",
                      data: { url: "/tasks" },
                    });
                    return;
                  }
                }
                new Notification("🎉 Task Completed!", {
                  body: `Completed: "${task.text}" (+${xpAmount} XP)`,
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

        {/* Task Text & Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className={cn(
                "text-sm font-bold text-[#1a1a2e] dark:text-slate-100 leading-tight truncate",
                task.isCompleted && "line-through text-[#1a1a2e]/40 dark:text-slate-500",
              )}
            >
              {task.text}
            </p>
            {task.priority === "high" && !task.isCompleted && (
              <span className="shrink-0 text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-1">
                <AlertCircle className="w-2.5 h-2.5" /> Must-Do
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {isRoutine ? (
              <span
                className="flex items-center gap-1 text-[9px] font-black px-1.5 py-0.5 rounded"
                style={{ background: accentBg, color: accentColor }}
              >
                <Repeat className="w-2.5 h-2.5" /> DAILY
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                <Sparkles className="w-2.5 h-2.5" /> +{xpAmount} XP
              </span>
            )}

            {task.estimatedMinutes && (
              <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                <Clock className="w-3 h-3" /> {task.estimatedMinutes}m
              </span>
            )}

            {subtasks.length > 0 && (
              <button
                onClick={() => setShowSubtasks((prev) => !prev)}
                className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded hover:bg-slate-200 transition-colors"
              >
                Checklist ({completedSubtasksCount}/{subtasks.length})
                {showSubtasks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!task.isCompleted && onStartFocus && (
            <button
              onClick={() => onStartFocus(task)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-[#ff6b35]/10 text-[#ff6b35] hover:bg-[#ff6b35] hover:text-white rounded-lg transition-all border border-[#ff6b35]/20 active:scale-95"
              title="Start Pomodoro Focus Block"
            >
              <Brain className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Focus</span>
            </button>
          )}

          {subtasks.length === 0 && (
            <button
              onClick={() => setShowSubtasks((prev) => !prev)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="Add Sub-checklist"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete({ id: task._id })}
            className="h-7 w-7 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Subtasks Accordion Section */}
      {showSubtasks && (
        <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 px-4 py-3 space-y-2">
          {subtasks.map((sub: { id: string; text: string; isCompleted: boolean }) => (
            <div key={sub.id} className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300">
              <button
                onClick={() => handleToggleSubtask(sub.id)}
                className="shrink-0 text-slate-400 hover:text-emerald-500 transition-colors"
              >
                {sub.isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Circle className="w-4 h-4" />
                )}
              </button>
              <span className={cn("flex-1 truncate", sub.isCompleted && "line-through text-slate-400 dark:text-slate-500")}>
                {sub.text}
              </span>
            </div>
          ))}

          {/* Add Subtask Input */}
          <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-2 pt-1">
            <input
              type="text"
              placeholder="Add subtask step..."
              value={newSubtaskText}
              onChange={(e) => setNewSubtaskText(e.target.value)}
              className="flex-1 text-xs px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md focus:outline-none focus:border-[#ff6b35]"
            />
            <button
              type="submit"
              className="text-xs font-bold px-2.5 py-1.5 bg-[#1a1a2e] text-white dark:bg-slate-800 rounded-md hover:bg-[#ff6b35] transition-colors"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
