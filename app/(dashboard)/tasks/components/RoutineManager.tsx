"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Circle,
  Clock,
  Plus,
  Zap,
  Trash2,
  CheckCircle2,
  Loader2,
  Repeat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function RoutineManager() {
  const tasks = useQuery(api.tasks.get);
  const toggleTask = useMutation(api.tasks.toggle);
  const deleteTask = useMutation(api.tasks.remove);

  // 1. Separate data for columns
  const soloTasks = tasks?.filter((t) => t.type === "task");
  const routines = tasks?.filter((t) => t.type === "routine");

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 p-4 md:p-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-2">
        <h2 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
          System <span className="text-indigo-600">Daily Ops</span>
        </h2>
        <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em]">
          {new Date().toLocaleDateString("en-PH", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* RESPONSIVE COLUMN GRID */}
      {/* 'grid-cols-1' for mobile, 'lg:grid-cols-2' for desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* COLUMN 1: TASKS */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
              Objectives
            </h3>
            <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black border border-indigo-100">
              {soloTasks?.length || 0} ACTIVE
            </div>
          </div>

          <div className="space-y-4">
            {soloTasks?.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
              />
            ))}
            <AddButton label="Add Task" />
          </div>
        </div>

        {/* COLUMN 2: ROUTINES */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">
              System Routines
            </h3>
            <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black border border-emerald-100">
              {routines?.length || 0} RUNNING
            </div>
          </div>

          <div className="space-y-4">
            {routines?.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
                isRoutine
              />
            ))}
            <AddButton label="Add Routine" isRoutine />
          </div>
        </div>
      </div>
    </div>
  );
}

// Internal Card Component for clean layout
function TaskCard({ task, onToggle, onDelete, isRoutine }: any) {
  return (
    <div
      className={cn(
        "group flex items-center justify-between p-5 bg-white dark:bg-slate-900 border border-slate-200/60 rounded-[24px] transition-all hover:shadow-lg",
        task.isCompleted && "opacity-50 grayscale bg-slate-50",
      )}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => onToggle({ id: task._id })}
          className="shrink-0 transition-transform active:scale-90"
        >
          {task.isCompleted ? (
            <CheckCircle2 className="w-7 h-7 text-emerald-500 stroke-[2.5]" />
          ) : (
            <Circle className="w-7 h-7 text-slate-200 group-hover:text-indigo-400 stroke-[2.5]" />
          )}
        </button>
        <div>
          <h4
            className={cn(
              "font-bold text-slate-800 dark:text-white leading-tight",
              task.isCompleted && "line-through",
            )}
          >
            {task.text}
          </h4>
          <div className="flex items-center gap-3 mt-1.5">
            {isRoutine && (
              <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                <Repeat className="w-2.5 h-2.5" /> DAILY
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
              <Clock className="w-3 h-3" /> 09:00 AM
            </span>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete({ id: task._id })}
        className="opacity-0 group-hover:opacity-100 h-8 w-8 text-slate-300 hover:text-rose-500 rounded-xl transition-opacity"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

// Add Button Placeholder
function AddButton({
  label,
  isRoutine,
}: {
  label: string;
  isRoutine?: boolean;
}) {
  return (
    <button className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[24px] flex items-center justify-center gap-2 group hover:border-indigo-400 transition-all text-slate-400 hover:text-indigo-600 font-bold text-sm">
      <Plus className="w-4 h-4" />
      {label}
    </button>
  );
}
