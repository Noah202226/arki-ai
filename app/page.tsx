"use client";

import { api } from "@/convex/_generated/api";
import { SignInButton, UserButton } from "@clerk/nextjs";
import {
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { useState } from "react";

export default function Home() {
  const tasks = useQuery(api.tasks.get);
  const addTask = useMutation(api.tasks.add);
  const toggleTask = useMutation(api.tasks.toggle);
  const deleteTask = useMutation(api.tasks.remove);

  const [newTask, setNewTask] = useState("");

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;

    await addTask({ text: newTask });

    setNewTask("");
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      {/* Auth Header */}
      <div className="absolute top-4 right-4">
        <Unauthenticated>
          <SignInButton mode="modal">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md">
              Log In
            </button>
          </SignInButton>
        </Unauthenticated>
        <Authenticated>
          <UserButton />
        </Authenticated>
      </div>

      <h1 className="text-4xl font-bold mb-8">My Tasks</h1>

      {/* Add Task Form */}
      <Authenticated>
        <form
          onSubmit={handleSubmit}
          className="mb-8 flex gap-2 w-full max-w-md"
        >
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="What needs to be done?"
            className="flex-1 p-2 border rounded-md text-black"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
          >
            Add
          </button>
        </form>

        {tasks === undefined ? (
          <p>Loading...</p>
        ) : (
          <ul className="space-y-4">
            {tasks.map((task) => (
              <li
                key={task._id}
                className="p-4 bg-gray-100 rounded-md shadow text-black"
              >
                {/* Left side: Checkbox and Text */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    // When the checkbox changes, we pass the task's unique _id to our toggle mutation
                    onChange={() => toggleTask({ id: task._id })}
                    className="w-5 h-5 cursor-pointer"
                  />
                  <span
                    className={
                      task.isCompleted ? "line-through text-gray-400" : ""
                    }
                  >
                    {task.text}
                  </span>
                </div>
                <button
                  // When clicked, we pass the task's unique _id to our remove mutation
                  onClick={() => deleteTask({ id: task._id })}
                  className="text-red-500 hover:text-red-700 font-bold px-2 py-1"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </Authenticated>

      {/* Show a message if they are logged out */}
      <Unauthenticated>
        <p className="text-gray-500">Please log in to see your tasks.</p>
      </Unauthenticated>
    </main>
  );
}
