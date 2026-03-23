"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Trash2, Plus } from "lucide-react";

export default function Home() {
  const tasks = useQuery(api.tasks.get);
  const addTask = useMutation(api.tasks.add);
  const toggleTask = useMutation(api.tasks.toggle);
  const deleteTask = useMutation(api.tasks.remove);

  const [newTaskText, setNewTaskText] = useState("");

  // --- LOADING STATES ---
  const [isAdding, setIsAdding] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || isAdding) return;

    setIsAdding(true); // Start loading
    try {
      await addTask({ text: newTaskText });
      setNewTaskText("");
    } finally {
      setIsAdding(false); // Stop loading
    }
  };

  const handleToggle = async (id: any) => {
    setPendingTaskId(id); // Mark this specific task as loading
    try {
      await toggleTask({ id });
    } finally {
      setPendingTaskId(null);
    }
  };

  const handleDelete = async (id: any) => {
    setPendingTaskId(id); // Mark this specific task as loading
    try {
      await deleteTask({ id });
    } finally {
      setPendingTaskId(null);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-24">
      {/* Navbar */}
      <div className="max-w-2xl mx-auto flex justify-between items-center mb-10">
        <h1 className="text-3xl font-extrabold tracking-tight">TaskFlow</h1>
        <div className="flex items-center gap-4">
          <Unauthenticated>
            <SignInButton mode="modal">
              <Button variant="outline">Log In</Button>
            </SignInButton>
          </Unauthenticated>
          <Authenticated>
            <UserButton afterSwitchSessionUrl="/" />
          </Authenticated>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <AuthLoading>
          <div className="flex justify-center p-10">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        </AuthLoading>

        <Authenticated>
          {/* Add Task Input */}
          <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
            <Input
              type="text"
              disabled={isAdding} // Disable input while adding
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="What's on your mind today?"
              className="bg-white dark:bg-slate-900 shadow-sm"
            />
            <Button
              type="submit"
              size="icon"
              className="shrink-0"
              disabled={isAdding}
            >
              {isAdding ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
            </Button>
          </form>

          <Card className="shadow-lg border-none">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Your Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks === undefined ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : tasks.length === 0 ? (
                <p className="text-center text-slate-500 py-6">
                  No tasks yet. Enjoy your day! ☀️
                </p>
              ) : (
                <div className="space-y-1">
                  {tasks.map((task) => {
                    const isTaskPending = pendingTaskId === task._id;

                    return (
                      <div
                        key={task._id}
                        className={`flex items-center justify-between p-3 rounded-lg transition-all group ${
                          isTaskPending
                            ? "opacity-50 pointer-events-none"
                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            id={task._id}
                            checked={task.isCompleted}
                            onCheckedChange={() => handleToggle(task._id)}
                            disabled={isTaskPending}
                          />
                          <label
                            htmlFor={task._id}
                            className={`text-sm font-medium leading-none cursor-pointer ${
                              task.isCompleted
                                ? "line-through text-slate-400"
                                : "text-slate-700 dark:text-slate-200"
                            }`}
                          >
                            {task.text}
                          </label>
                        </div>

                        <div className="flex items-center">
                          {isTaskPending ? (
                            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(task._id)}
                              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </Authenticated>

        <Unauthenticated>
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-semibold mb-2">Welcome to TaskFlow</h2>
            <p className="text-slate-500 mb-6 px-4">
              Log in to start organizing your day with real-time sync.
            </p>
            <SignInButton mode="modal">
              <Button size="lg">Get Started</Button>
            </SignInButton>
          </div>
        </Unauthenticated>
      </div>
    </main>
  );
}
