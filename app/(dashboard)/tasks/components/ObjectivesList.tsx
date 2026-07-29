import { Id } from "@/convex/_generated/dataModel";
import { TaskRow } from "./TaskRow";

interface ObjectivesListProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tasks: any[];
  completedCount: number;
  onToggle: (args: { id: Id<"tasks"> }) => void;
  onDelete: (args: { id: Id<"tasks"> }) => void;
}

export function ObjectivesList({
  tasks,
  completedCount,
  onToggle,
  onDelete,
}: ObjectivesListProps) {
  return (
    <div className="bg-[#f5f2ed] dark:bg-slate-950 p-4 sm:p-6 border-b lg:border-b-0 border-[#e0dbd4] dark:border-slate-800">
      <div className="flex items-center justify-between mb-5">
        <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#1a1a2e] dark:text-slate-100">
          <span className="w-[3px] h-[14px] rounded-sm bg-[#ff6b35]" />
          Objectives
          <span className="text-[10px] bg-[#1a1a2e]/[0.07] dark:bg-slate-800 text-[#1a1a2e]/50 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
            {tasks.length}
          </span>
        </h2>
        <span
          className="text-[10px] font-bold px-2.5 py-1 rounded-md"
          style={{ background: "rgba(255,107,53,0.10)", color: "#ff6b35" }}
        >
          {completedCount}/{tasks.length} DONE
        </span>
      </div>

      <div className="space-y-2">
        {tasks.length === 0 && (
          <div className="text-center py-10 text-[#1a1a2e]/20 text-sm font-medium">
            No objectives yet
          </div>
        )}
        {tasks.map((task) => (
          <TaskRow
            key={task._id}
            task={task}
            onToggle={onToggle}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
