"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import {
  X,
  Target,
  Repeat,
  ChevronDown,
  Loader2,
  AlignLeft,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AddTaskDialogProps {
  open: boolean;
  defaultType?: "task" | "routine";
  onClose: () => void;
}

const CATEGORIES = [
  "Work",
  "Health",
  "Finance",
  "Personal",
  "Learning",
  "Family",
  "Other",
];

const PRIORITIES = [
  { value: "low", label: "Low", color: "#34d399", bg: "rgba(52,211,153,0.10)" },
  {
    value: "medium",
    label: "Medium",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.10)",
  },
  {
    value: "high",
    label: "High",
    color: "#f87171",
    bg: "rgba(248,113,113,0.10)",
  },
] as const;

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
] as const;

export function AddTaskDialog({
  open,
  defaultType = "task",
  onClose,
}: AddTaskDialogProps) {
  // ✅ ALL hooks must be called before any early return
  const { user } = useUser();
  const createTask = useMutation(api.tasks.create);

  const [type, setType] = useState<"task" | "routine">(defaultType);
  const [text, setText] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [category, setCategory] = useState("Personal");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Early return AFTER all hooks
  if (!open) return null;

  const reset = () => {
    setText("");
    setDescription("");
    setPriority("medium");
    setCategory("Personal");
    setFrequency("daily");
    setError("");
    setType(defaultType);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      setError("Title is required.");
      return;
    }
    if (!user?.id) return;

    setLoading(true);
    try {
      await createTask({
        userId: user.id,
        text: text.trim(),
        description: description.trim() || undefined,
        type,
        priority,
        category,
        frequency: type === "routine" ? frequency : undefined,
        isCompleted: false,
        isDeleted: false,
      });
      handleClose();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const accentColor = type === "routine" ? "#34d399" : "#ff6b35";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none mb-20 sm:mb-0">
        <div
          className="pointer-events-auto w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle — mobile only */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-[#e0dbd4]" />
          </div>

          {/* Header */}
          <div className="bg-[#1a1a2e] px-6 py-5 rounded-t-3xl sm:rounded-t-2xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: accentColor }}
                />
                <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-white/30">
                  {type === "routine" ? "New Routine" : "New Task"}
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                {type === "routine" ? "Add System Routine" : "Add Objective"}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg bg-white/[0.08] hover:bg-white/15 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Type toggle */}
          <div className="px-6 pt-5">
            <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-[#f5f2ed] rounded-xl">
              <button
                type="button"
                onClick={() => setType("task")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all",
                  type === "task"
                    ? "bg-white shadow-sm text-[#ff6b35]"
                    : "text-[#1a1a2e]/40 hover:text-[#1a1a2e]/60",
                )}
              >
                <Target className="w-3.5 h-3.5" /> Objective
              </button>
              <button
                type="button"
                onClick={() => setType("routine")}
                className={cn(
                  "flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all",
                  type === "routine"
                    ? "bg-white shadow-sm text-[#34d399]"
                    : "text-[#1a1a2e]/40 hover:text-[#1a1a2e]/60",
                )}
              >
                <Repeat className="w-3.5 h-3.5" /> Routine
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 pb-6 pt-4 space-y-4">
            {/* Title */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1a1a2e]/40 mb-1.5 block">
                Title <span className="text-[#ff6b35]">*</span>
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setError("");
                }}
                placeholder={
                  type === "routine"
                    ? "e.g. Morning workout, Read 30 mins..."
                    : "e.g. Submit report, Call client..."
                }
                className={cn(
                  "w-full px-4 py-3 rounded-xl border text-sm font-medium text-[#1a1a2e] placeholder:text-[#1a1a2e]/25",
                  "bg-[#f5f2ed] focus:bg-white focus:outline-none transition-colors",
                  error
                    ? "border-red-300 focus:border-red-400"
                    : "border-[#e0dbd4] focus:border-[#1a1a2e]/30",
                )}
                autoFocus
              />
              {error && (
                <p className="text-[11px] text-red-500 font-medium mt-1">
                  {error}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1a1a2e]/40 mb-1.5 flex items-center gap-1.5">
                <AlignLeft className="w-3 h-3" /> Description
                <span className="normal-case font-normal text-[#1a1a2e]/25">
                  (optional)
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add details or notes..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-[#e0dbd4] focus:border-[#1a1a2e]/30 text-sm font-medium text-[#1a1a2e] placeholder:text-[#1a1a2e]/25 bg-[#f5f2ed] focus:bg-white focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Priority + Category row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Priority */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1a1a2e]/40 mb-1.5 block">
                  Priority
                </label>
                <div className="flex gap-1.5">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={cn(
                        "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wide transition-all border",
                        priority === p.value
                          ? "border-transparent"
                          : "border-[#e8e4de] text-[#1a1a2e]/30 bg-white hover:border-[#d0cbc4]",
                      )}
                      style={
                        priority === p.value
                          ? { background: p.bg, color: p.color }
                          : {}
                      }
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1a1a2e]/40 mb-1.5 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Category
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e0dbd4] bg-[#f5f2ed] text-sm font-bold text-[#1a1a2e] focus:outline-none focus:border-[#1a1a2e]/30 appearance-none cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1a1a2e]/30 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Frequency — routines only */}
            {type === "routine" && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#1a1a2e]/40 mb-1.5 block">
                  Frequency
                </label>
                <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-[#f5f2ed] rounded-xl">
                  {FREQUENCIES.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setFrequency(f.value)}
                      className={cn(
                        "py-2.5 rounded-lg text-xs font-bold transition-all",
                        frequency === f.value
                          ? "bg-white shadow-sm text-[#34d399]"
                          : "text-[#1a1a2e]/40 hover:text-[#1a1a2e]/60",
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !text.trim()}
              className={cn(
                "w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2",
                "transition-all active:scale-[0.98]",
                loading || !text.trim()
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:opacity-90",
              )}
              style={{ background: accentColor }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {type === "routine" ? (
                    <Repeat className="w-4 h-4" />
                  ) : (
                    <Target className="w-4 h-4" />
                  )}
                  {type === "routine" ? "Save Routine" : "Save Task"}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
