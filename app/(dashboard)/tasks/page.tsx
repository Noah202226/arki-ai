"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Trash2,
  Plus,
  Zap,
  Clock,
  CalendarDays,
  Repeat,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  const [newTaskText, setNewTaskText] = useState("");
  const [taskType, setTaskType] = useState<"task" | "routine">("task");

  const tasks = useQuery(api.tasks.get);
  const addTask = useMutation(api.tasks.add);
  const toggleTask = useMutation(api.tasks.toggle);
  const deleteTask = useMutation(api.tasks.remove);

  // Separate tasks into columns for better visibility
  const soloTasks = tasks?.filter((t) => t.type === "task");
  const routines = tasks?.filter((t) => t.type === "routine");

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    await addTask({
      text: newTaskText,
      type: taskType,
      priority: "medium",
    });
    setNewTaskText("");
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/50 p-6 md:p-10 space-y-8">
      {/* HEADER - Styled like Financial Hub */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-indigo-600">
          <CalendarDays className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">
            System Routine
          </span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
          Your <span className="text-indigo-600">Daily Ops</span>
        </h1>
      </div>

      {/* QUICK ADD BAR */}
      <form
        onSubmit={handleAddTask}
        className="flex flex-col md:flex-row gap-3 bg-white dark:bg-slate-900 p-3 rounded-[24px] shadow-sm border border-slate-200/60"
      >
        <Input
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Deploying a new objective..."
          className="flex-1 h-12 px-6 border-none bg-transparent text-lg font-bold focus-visible:ring-0"
        />
        <div className="flex items-center gap-2 px-2">
          <Button
            type="button"
            variant={taskType === "task" ? "default" : "outline"}
            onClick={() => setTaskType("task")}
            className="rounded-xl font-bold h-10"
          >
            Task
          </Button>
          <Button
            type="button"
            variant={taskType === "routine" ? "default" : "outline"}
            onClick={() => setTaskType("routine")}
            className="rounded-xl font-bold h-10"
          >
            Routine
          </Button>
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 bg-indigo-600 rounded-xl"
          >
            <Plus className="w-5 h-5 text-white" />
          </Button>
        </div>
      </form>

      {/* MULTI-COLUMN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* COLUMN 1: ONE-TIME TASKS */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black uppercase text-xs tracking-widest text-slate-400">
              One-Time Tasks
            </h3>
            <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg text-[10px] font-black">
              {soloTasks?.length || 0} Total
            </span>
          </div>

          <div className="space-y-3">
            {soloTasks?.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
              />
            ))}
          </div>
        </section>

        {/* COLUMN 2: RECURRING ROUTINES */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-black uppercase text-xs tracking-widest text-slate-400">
              System Routines
            </h3>
            <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-black">
              {routines?.length || 0} Active
            </span>
          </div>

          <div className="space-y-3">
            {routines?.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
                isRoutine
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// Sub-component for clean, consistent cards
function TaskCard({ task, onToggle, onDelete, isRoutine }: any) {
  return (
    <div
      className={cn(
        "group flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200/60 rounded-[20px] transition-all hover:shadow-md",
        task.isCompleted && "opacity-60 bg-slate-50/50",
      )}
    >
      <div className="flex items-center gap-4">
        <Checkbox
          checked={task.isCompleted}
          onCheckedChange={() => onToggle({ id: task._id })}
          className="w-6 h-6 rounded-lg border-2 border-slate-200 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
        />
        <div>
          <h4
            className={cn(
              "font-bold text-slate-800 dark:text-slate-100",
              task.isCompleted && "line-through",
            )}
          >
            {task.text}
          </h4>
          <div className="flex items-center gap-3 mt-0.5">
            {isRoutine && (
              <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 uppercase">
                <Repeat className="w-2.5 h-2.5" /> Daily
              </span>
            )}
            <span className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase">
              <Clock className="w-2.5 h-2.5" />{" "}
              {new Date(task._creationTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete({ id: task._id })}
        className="opacity-0 group-hover:opacity-100 h-8 w-8 text-slate-300 hover:text-rose-500 rounded-lg transition-all"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}
