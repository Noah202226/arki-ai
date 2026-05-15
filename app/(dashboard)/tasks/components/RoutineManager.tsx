"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { CheckCircle2, Circle, Clock, Flame, Plus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function RoutineManager() {
  const [view, setView] = useState<"tasks" | "routines">("tasks");
  const tasks = useQuery(api.tasks.getTasks); // You'll need to create this API

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 p-4">
      {/* HEADER & TOGGLE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white">
            Daily System
          </h2>
          <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em]">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border-2 border-slate-200 dark:border-slate-800">
          <Button
            variant={view === "tasks" ? "default" : "ghost"}
            onClick={() => setView("tasks")}
            className={cn(
              "rounded-xl font-black px-6",
              view === "tasks" &&
                "bg-white text-indigo-600 shadow-sm hover:bg-white",
            )}
          >
            Tasks
          </Button>
          <Button
            variant={view === "routines" ? "default" : "ghost"}
            onClick={() => setView("routines")}
            className={cn(
              "rounded-xl font-black px-6",
              view === "routines" &&
                "bg-white text-indigo-600 shadow-sm hover:bg-white",
            )}
          >
            Routines
          </Button>
        </div>
      </div>

      {/* QUICK ADD */}
      <button className="w-full py-4 border-4 border-dashed border-slate-200 dark:border-slate-800 rounded-[32px] flex items-center justify-center gap-3 group hover:border-indigo-500 transition-all">
        <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
          <Plus className="w-6 h-6" />
        </div>
        <span className="text-lg font-black text-slate-400 group-hover:text-indigo-600">
          Add new {view === "tasks" ? "task" : "routine"}
        </span>
      </button>

      {/* TASK/ROUTINE LIST */}
      <div className="grid gap-4">
        {/* Placeholder for mapping tasks */}
        <div className="group flex items-center justify-between p-6 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[32px] hover:shadow-xl transition-all cursor-pointer">
          <div className="flex items-center gap-5">
            <div className="text-slate-300 group-hover:text-indigo-500 transition-colors">
              <Circle className="w-8 h-8 stroke-[3]" />
            </div>
            <div>
              <h4 className="text-xl font-black text-slate-800 dark:text-white">
                Morning Code Review
              </h4>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs font-bold text-amber-600 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-md">
                  <Zap className="w-3 h-3 fill-current" /> High Priority
                </span>
                <span className="flex items-center gap-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <Clock className="w-3 h-3" /> 09:00 AM
                </span>
              </div>
            </div>
          </div>

          {view === "routines" && (
            <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-2xl text-orange-600 border border-orange-100">
              <Flame className="w-5 h-5 fill-current" />
              <span className="font-black text-sm">5 Day Streak</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
