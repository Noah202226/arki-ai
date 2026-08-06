import { RoutineManager } from "./components/RoutineManager";

export default function TasksPage() {
  return (
    <div className="min-h-screen bg-[#fcfaf7] dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <RoutineManager />
    </div>
  );
}
