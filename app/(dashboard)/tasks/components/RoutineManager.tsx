"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Clock, Target, Repeat, Zap, Loader2, Plus, X } from "lucide-react";
import { StatCell } from "./StatCell";
import { ObjectivesList } from "./ObjectivesList";
import { RoutinesList } from "./RoutinesList";
import { cn } from "@/lib/utils";
import { AddTaskDialog } from "./AddTaskDialog";

export function RoutineManager() {
  const tasks = useQuery(api.tasks.get);
  const toggleTask = useMutation(api.tasks.toggle);
  const deleteTask = useMutation(api.tasks.remove);
  const [fabOpen, setFabOpen] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"task" | "routine">("task");

  if (tasks === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-[#1a1a2e]/20" />
      </div>
    );
  }

  const soloTasks = tasks.filter((t) => t.type === "task");
  const routines = tasks.filter((t) => t.type === "routine");
  const completedTasks = soloTasks.filter((t) => t.isCompleted).length;
  const completedRoutines = routines.filter((t) => t.isCompleted).length;
  const totalTasks = soloTasks.length;
  const totalRoutines = routines.length;
  const totalAll = totalTasks + totalRoutines;
  const completedAll = completedTasks + completedRoutines;

  const statsConfig = [
    {
      label: "Objectives",
      value: `${completedTasks}/${totalTasks}`,
      sub: "Tasks completed",
      accent: "#ff6b35",
      icon: <Target className="w-4 h-4" />,
    },
    {
      label: "Routines",
      value: `${completedRoutines}/${totalRoutines}`,
      sub: "Routines done today",
      accent: "#34d399",
      icon: <Repeat className="w-4 h-4" />,
    },
    {
      label: "Completion Rate",
      value:
        totalAll > 0 ? `${Math.round((completedAll / totalAll) * 100)}%` : "0%",
      sub: "Overall progress",
      accent: "#818cf8",
      icon: <Zap className="w-4 h-4" />,
    },
    {
      label: "Pending",
      value: `${totalAll - completedAll}`,
      sub: "Items remaining",
      accent: "#f59e0b",
      icon: <Clock className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f5f2ed]">
      {/* Header — no action buttons */}
      <header className="bg-[#1a1a2e] flex flex-col">
        <div className="px-4 sm:px-8 py-6 sm:py-7">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-[#ff6b35]" />
            <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-white/30">
              Personal Task System
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-none mb-1">
            System <span className="text-[#ff6b35]">Daily Ops</span>
          </h1>
          <p className="text-sm text-white/35 mt-2">
            {new Date().toLocaleDateString("en-PH", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-white/[0.06] border-t border-white/[0.06]">
          {statsConfig.map((stat) => (
            <StatCell key={stat.label} {...stat} />
          ))}
        </div>
      </header>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-[#e0dbd4]">
        <ObjectivesList
          tasks={soloTasks}
          completedCount={completedTasks}
          onToggle={toggleTask}
          onDelete={deleteTask}
        />
        <RoutinesList
          routines={routines}
          completedCount={completedRoutines}
          onToggle={toggleTask}
          onDelete={deleteTask}
        />
      </div>

      {/* ── FLOATING ACTION BUTTON ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Expanded options — slide up when open */}
        <div
          className={cn(
            "flex flex-col items-end gap-2.5 transition-all duration-200",
            fabOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-4 pointer-events-none",
          )}
        >
          {/* Add Routine option */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#1a1a2e] bg-white border border-[#e0dbd4] shadow-md px-3 py-1.5 rounded-lg whitespace-nowrap">
              Add Routine
            </span>
            <button
              onClick={() => {
                setDialogType("routine");
                setDialogOpen(true);
                setFabOpen(false);
              }}
              className="w-12 h-12 rounded-full bg-[#34d399] text-white shadow-lg hover:bg-[#2bb885] active:scale-95 transition-all flex items-center justify-center"
              aria-label="Add Routine"
            >
              <Repeat className="w-5 h-5" />
            </button>
          </div>

          {/* Add Task option */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#1a1a2e] bg-white border border-[#e0dbd4] shadow-md px-3 py-1.5 rounded-lg whitespace-nowrap">
              Add Task
            </span>
            <button
              onClick={() => {
                setDialogType("task");
                setDialogOpen(true);
                setFabOpen(false);
              }}
              className="w-12 h-12 rounded-full bg-[#ff6b35] text-white shadow-lg hover:bg-[#e85e2b] active:scale-95 transition-all flex items-center justify-center"
              aria-label="Add Task"
            >
              <Target className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main FAB toggle button */}
        <button
          onClick={() => setFabOpen((prev) => !prev)}
          className={cn(
            "w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95",
            fabOpen
              ? "bg-[#1a1a2e] text-white rotate-45"
              : "bg-[#ff6b35] text-white hover:bg-[#e85e2b]",
          )}
          aria-label="Toggle actions"
        >
          {fabOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </button>
      </div>

      {/* Backdrop — tap outside to close */}
      {fabOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setFabOpen(false)} />
      )}

      <AddTaskDialog
        open={dialogOpen}
        defaultType={dialogType}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
