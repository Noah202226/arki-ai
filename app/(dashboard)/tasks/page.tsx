import { RoutineManager } from "./components/RoutineManager";

export default function TasksPage() {
  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-slate-950/50">
      <div className="py-10">
        <RoutineManager />
      </div>
    </main>
  );
}
