import { Plus } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { TaskRow } from "./TaskRow";

interface RoutinesListProps {
  routines: any[];
  completedCount: number;
  onToggle: (args: { id: Id<"tasks"> }) => void;
  onDelete: (args: { id: Id<"tasks"> }) => void;
}

export function RoutinesList({
  routines,
  completedCount,
  onToggle,
  onDelete,
}: RoutinesListProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-4 sm:p-6 mb-20 sm:mb-0">
      <div className="flex items-center justify-between mb-5">
        <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#1a1a2e] dark:text-slate-100">
          <span className="w-[3px] h-[14px] rounded-sm bg-[#34d399]" />
          System Routines
          <span className="text-[10px] bg-[#1a1a2e]/[0.07] dark:bg-slate-800 text-[#1a1a2e]/50 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
            {routines.length}
          </span>
        </h2>
        <span
          className="text-[10px] font-bold px-2.5 py-1 rounded-md"
          style={{ background: "rgba(52,211,153,0.10)", color: "#34d399" }}
        >
          {completedCount}/{routines.length} RUNNING
        </span>
      </div>

      <div className="space-y-2">
        {routines.length === 0 && (
          <div className="text-center py-10 text-[#1a1a2e]/20 text-sm font-medium">
            No routines yet
          </div>
        )}
        {routines.map((routine) => (
          <TaskRow
            key={routine._id}
            task={routine}
            onToggle={onToggle}
            onDelete={onDelete}
            isRoutine
          />
        ))}
      </div>
    </div>
  );
}
