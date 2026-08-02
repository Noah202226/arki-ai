"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Clock, Target, Repeat, Zap, Loader2, Plus, X, Filter, Flame, CheckCircle2 } from "lucide-react";
import { StatCell } from "./StatCell";
import { ObjectivesList } from "./ObjectivesList";
import { RoutinesList } from "./RoutinesList";
import { cn } from "@/lib/utils";
import { AddTaskDialog } from "./AddTaskDialog";
import { DisciplineHeader } from "./DisciplineHeader";
import { FocusTimerDialog } from "./FocusTimerDialog";
import { useDailyRoutineReset } from "../hooks/useDailyRoutineReset";

export function RoutineManager() {
  const tasks = useQuery(api.tasks.get);
  const toggleTask = useMutation(api.tasks.toggle);
  const deleteTask = useMutation(api.tasks.remove);

  const [fabOpen, setFabOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"task" | "routine">("task");

  const [activeFilter, setActiveFilter] = useState<"all" | "high" | "quick" | "completed">("all");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [focusTask, setFocusTask] = useState<any | null>(null);
  const [focusDialogOpen, setFocusDialogOpen] = useState(false);

  useDailyRoutineReset();

  if (tasks === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-[#1a1a2e]/20 dark:text-white/20" />
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

  // Filter tasks based on activeFilter
  const filterTaskFn = (t: (typeof tasks)[0]) => {
    if (activeFilter === "high") return t.priority === "high" && !t.isCompleted;
    if (activeFilter === "quick") return (t.estimatedMinutes ?? 30) <= 15 && !t.isCompleted;
    if (activeFilter === "completed") return t.isCompleted;
    return true;
  };

  const filteredSoloTasks = soloTasks.filter(filterTaskFn);
  const filteredRoutines = routines.filter(filterTaskFn);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleStartFocus = (taskItem: any) => {
    setFocusTask(taskItem);
    setFocusDialogOpen(true);
  };

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
      value: totalAll > 0 ? `${Math.round((completedAll / totalAll) * 100)}%` : "0%",
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

  const filterTabs = [
    { id: "all", label: "All Items", icon: Filter, accent: "" },
    { id: "high", label: "Core High-Priority", icon: Flame, accent: "text-rose-500" },
    { id: "quick", label: "Quick Wins (<15m)", icon: Zap, accent: "text-[#ff6b35]" },
    { id: "completed", label: "Completed", icon: CheckCircle2, accent: "text-emerald-500" },
  ] as const;

  return (
    <div className="min-h-screen bg-[#f5f2ed] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Dynamic Discipline & XP Header */}
      <DisciplineHeader />

      {/* Stats bar */}
      <div className="bg-[#1a1a2e] grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-white/[0.06] border-t border-white/[0.06]">
        {statsConfig.map((stat) => (
          <StatCell key={stat.label} {...stat} />
        ))}
      </div>

      {/* Quick Filter Tabs */}
      <div className="px-4 sm:px-8 py-3 bg-[#e8e4de] dark:bg-slate-900 border-b border-[#d8d3cb] dark:border-slate-800 flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 shrink-0 mr-1">
          Filter:
        </span>
        {filterTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all border",
                isActive
                  ? "bg-[#1a1a2e] text-white border-transparent shadow-sm"
                  : "bg-white/60 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", tab.accent)} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-[#e0dbd4] dark:divide-slate-800">
        <ObjectivesList
          tasks={filteredSoloTasks}
          completedCount={completedTasks}
          onToggle={toggleTask}
          onDelete={deleteTask}
          onStartFocus={handleStartFocus}
        />
        <RoutinesList
          routines={filteredRoutines}
          completedCount={completedRoutines}
          onToggle={toggleTask}
          onDelete={deleteTask}
          onStartFocus={handleStartFocus}
        />
      </div>

      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-25 sm:bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        <div
          className={cn(
            "flex flex-col items-end gap-2.5 transition-all duration-200",
            fabOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-4 pointer-events-none"
          )}
        >
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
              className="w-14 h-14 rounded-full bg-[#34d399] text-white shadow-lg hover:bg-[#2bb885] active:scale-95 transition-all flex items-center justify-center"
              aria-label="Add Routine"
            >
              <Repeat className="w-5 h-5" />
            </button>
          </div>

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
              className="w-14 h-14 rounded-full bg-[#ff6b35] text-white shadow-lg hover:bg-[#e85e2b] active:scale-95 transition-all flex items-center justify-center"
              aria-label="Add Task"
            >
              <Target className="w-5 h-5" />
            </button>
          </div>
        </div>

        <button
          onClick={() => setFabOpen((prev) => !prev)}
          className={cn(
            "w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 active:scale-95",
            fabOpen
              ? "bg-[#1a1a2e] text-white rotate-45"
              : "bg-[#ff6b35] text-white hover:bg-[#e85e2b]"
          )}
          aria-label="Toggle actions"
        >
          {fabOpen ? <X className="w-7 h-7" /> : <Plus className="w-7 h-7" />}
        </button>
      </div>

      {fabOpen && (
        <div className="fixed inset-0 z-30" onClick={() => setFabOpen(false)} />
      )}

      {/* Dialogs */}
      <AddTaskDialog
        open={dialogOpen}
        defaultType={dialogType}
        onClose={() => setDialogOpen(false)}
      />

      <FocusTimerDialog
        open={focusDialogOpen}
        task={focusTask}
        onClose={() => {
          setFocusDialogOpen(false);
          setFocusTask(null);
        }}
      />
    </div>
  );
}
