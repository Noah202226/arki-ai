"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Trash2, Tag, Plus, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const EMOJI_SUGGESTIONS = [
  "🍱","🍽️","☕","🍿","🛒","🚌","🏠","💡","💊","💼","💻","📩",
  "🎮","📚","✈️","🎬","🏋️","💈","🐶","🎁","⛽","🍜","🥤","🏦",
];

export function QuickChipsSettings() {
  const categories = useQuery(api.categories.getCategories, {});
  const chips = useQuery(api.quickChips.getQuickChips);
  const createChip = useMutation(api.quickChips.createQuickChip);
  const deleteChip = useMutation(api.quickChips.deleteQuickChip);

  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("🍱");
  const [type, setType] = useState("expense");
  const [categoryId, setCategoryId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredCategories = categories?.filter((c) => c.type === type) ?? [];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim() || !categoryId) return;
    setIsSubmitting(true);
    try {
      await createChip({
        label: label.trim(),
        emoji,
        type,
        categoryId: categoryId as Id<"categories">,
      });
      setLabel("");
      setCategoryId("");
      toast.success(`"${label.trim()}" chip added!`);
    } catch {
      toast.error("Failed to add chip.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: Id<"quickChips">) => {
    await deleteChip({ id });
    toast.success("Chip removed.");
  };

  const expenseChips = chips?.filter((c) => c.type === "expense") ?? [];
  const incomeChips = chips?.filter((c) => c.type === "income") ?? [];

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-8">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#1a1a2e] flex items-center gap-2">
          <Zap className="text-[#ff6b35] w-7 h-7" />
          Quick Chip Buttons
        </h2>
        <p className="text-slate-500 text-sm">
          Create shortcut buttons that appear in the New Transaction form.
          Each chip auto-fills the description and selects a category.
        </p>
      </header>

      {/* ── CREATE FORM ─────────────────────────────────────────────── */}
      <Card className="border border-[#e5dec9]/40 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-[#e5dec9]/30 py-4 px-6">
          <CardTitle className="text-xs uppercase tracking-widest font-black text-slate-400">
            Add New Chip
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <form onSubmit={handleAdd} className="space-y-5">
            {/* Emoji picker */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600">Pick Emoji</Label>
              <div className="flex flex-wrap gap-2">
                {EMOJI_SUGGESTIONS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={cn(
                      "w-9 h-9 rounded-xl text-lg flex items-center justify-center border-2 transition-all duration-150",
                      emoji === e
                        ? "border-[#ff6b35] bg-[#ff6b35]/10 scale-110 shadow-sm"
                        : "border-slate-100 bg-slate-50 hover:border-[#ff6b35]/40",
                    )}
                  >
                    {e}
                  </button>
                ))}
                {/* Custom emoji input */}
                <input
                  type="text"
                  maxLength={2}
                  placeholder="✏️"
                  value={emoji}
                  onChange={(e) => setEmoji(e.target.value)}
                  className="w-9 h-9 rounded-xl border-2 border-dashed border-slate-200 text-center text-lg bg-white focus:outline-none focus:border-[#ff6b35]/50"
                  title="Type a custom emoji"
                />
              </div>
            </div>

            {/* Label + Type + Category row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600">Label</Label>
                <Input
                  placeholder="e.g. Lunch, Salary"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="bg-slate-50/50 border-[#e5dec9]/50 h-11 focus-visible:ring-[#ff6b35]/25 rounded-xl font-medium"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600">Type</Label>
                <Select
                  value={type}
                  onValueChange={(v) => {
                    setType(v);
                    setCategoryId(""); // reset category when type changes
                  }}
                >
                  <SelectTrigger className="bg-slate-50/50 border-[#e5dec9]/50 h-11 focus:ring-[#ff6b35]/25 rounded-xl font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId} required>
                  <SelectTrigger className="bg-slate-50/50 border-[#e5dec9]/50 h-11 focus:ring-[#ff6b35]/25 rounded-xl font-medium">
                    <SelectValue placeholder="Link category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl shadow-xl border-none">
                    {filteredCategories.length === 0 ? (
                      <div className="px-3 py-4 text-xs text-slate-400 text-center">
                        No {type} categories yet.
                      </div>
                    ) : (
                      filteredCategories.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: cat.color || "#94a3b8" }}
                            />
                            {cat.name}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview + Submit */}
            <div className="flex items-center gap-4 pt-1">
              {/* Live preview */}
              {label && (
                <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#ff6b35]/8 border border-[#ff6b35]/20 text-sm font-bold text-[#ff6b35]">
                  <span>{emoji}</span>
                  {label}
                </div>
              )}
              <Button
                type="submit"
                disabled={!label.trim() || !categoryId || isSubmitting}
                className="ml-auto h-11 px-6 bg-[#ff6b35] hover:bg-[#e85e2b] text-white font-bold rounded-xl shadow-md shadow-[#ff6b35]/15"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Chip
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── CURRENT CHIPS ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: "Expense Chips", list: expenseChips, color: "bg-rose-500" },
          { label: "Income Chips",  list: incomeChips,  color: "bg-emerald-500" },
        ].map(({ label: sectionLabel, list, color }) => (
          <div key={sectionLabel} className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <span className={cn("w-2 h-2 rounded-full", color)} />
              {sectionLabel}
            </h3>

            {chips === undefined ? (
              <div className="h-20 flex items-center justify-center bg-slate-50 rounded-2xl border border-[#e5dec9]/20">
                <span className="text-xs text-slate-400">Loading...</span>
              </div>
            ) : list.length === 0 ? (
              <div className="h-20 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-[#e5dec9]/50 gap-1">
                <Info className="w-4 h-4 text-slate-300" />
                <span className="text-xs text-slate-400">No chips yet. Add one above.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {list.map((chip) => {
                  const cat = categories?.find((c) => c._id === chip.categoryId);
                  return (
                    <div
                      key={chip._id}
                      className="flex items-center justify-between px-4 py-3 bg-white rounded-2xl shadow-sm border border-[#e5dec9]/30 group hover:border-[#ff6b35]/25 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        {/* Chip preview */}
                        <span className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border bg-slate-50 text-slate-700 border-slate-100">
                          <span>{chip.emoji}</span>
                          {chip.label}
                        </span>
                        {/* Category link */}
                        {cat && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Tag className="w-3 h-3" />
                            <span
                              className="font-semibold"
                              style={{ color: cat.color || "#94a3b8" }}
                            >
                              {cat.name}
                            </span>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleDelete(chip._id)}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
