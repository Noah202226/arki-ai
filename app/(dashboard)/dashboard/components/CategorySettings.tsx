"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
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
import { Plus, Trash2, Tag, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

const COLOR_PRESETS = [
  { value: "#ef4444", label: "Red" },
  { value: "#ff6b35", label: "Orange" },
  { value: "#eab308", label: "Yellow" },
  { value: "#10b981", label: "Green" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#3b82f6", label: "Blue" },
  { value: "#6366f1", label: "Indigo" },
  { value: "#a855f7", label: "Purple" },
  { value: "#ec4899", label: "Pink" },
  { value: "#64748b", label: "Slate" },
];

export function CategorySettings() {
  const categories = useQuery(api.categories.getCategories, {});
  const createCategory = useMutation(api.categories.createCategory);
  const deleteCategory = useMutation(api.categories.deleteCategory);

  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [color, setColor] = useState("#ff6b35");

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await createCategory({
      name: name.trim(),
      type,
      color,
    });

    setName("");
  };

  const handleDeleteCategory = async (id: Id<"categories">) => {
    await deleteCategory({ id });
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1a1a2e] flex items-center gap-2">
          <PieChart className="text-[#ff6b35] w-7 h-7 sm:w-8 sm:h-8" />
          Category Manager
        </h1>
        <p className="text-slate-500 text-sm">
          Organize your transaction labels for better budget and credit tracking.
        </p>
      </header>

      {/* --- ADD NEW CATEGORY CARD --- */}
      <Card className="border border-[#e5dec9]/40 shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-[#e5dec9]/30 py-4 px-6">
          <CardTitle className="text-xs uppercase tracking-widest font-black text-slate-400">
            Create Custom Category
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleAddCategory} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600">Category Name</Label>
                <Input
                  placeholder="e.g. Groceries, Gym, Rent"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-50/50 border-[#e5dec9]/50 h-11 focus-visible:ring-[#ff6b35]/25 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600">Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="bg-slate-50/50 border-[#e5dec9]/50 h-11 focus:ring-[#ff6b35]/25 rounded-xl font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  type="submit"
                  disabled={!name.trim()}
                  className="w-full h-11 bg-[#ff6b35] hover:bg-[#e85e2b] text-white font-bold rounded-xl shadow-md shadow-[#ff6b35]/15 transition-all duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Category
                </Button>
              </div>
            </div>

            {/* Presets Color Picker */}
            <div className="space-y-3">
              <Label className="text-xs font-bold text-slate-600">Choose Badge Color</Label>
              <div className="flex flex-wrap gap-2.5">
                {COLOR_PRESETS.map((preset) => {
                  const isSelected = color === preset.value;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setColor(preset.value)}
                      className={cn(
                        "w-7 h-7 rounded-full transition-all duration-200 border-2 flex items-center justify-center relative",
                        isSelected
                          ? "border-slate-800 scale-110 shadow-sm"
                          : "border-transparent hover:scale-105"
                      )}
                      style={{ backgroundColor: preset.value }}
                      title={preset.label}
                    >
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* --- CATEGORY LISTS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {["expense", "income"].map((t) => (
          <div key={t} className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  t === "expense" ? "bg-rose-500" : "bg-emerald-500"
                )}
              />
              {t} Categories
            </h3>

            <div className="space-y-2">
              {categories === undefined ? (
                <div className="h-20 flex items-center justify-center bg-slate-50 rounded-2xl border border-[#e5dec9]/20">
                  <span className="text-xs text-slate-400">Loading...</span>
                </div>
              ) : categories.filter((c) => c.type === t).length === 0 ? (
                <div className="h-20 flex items-center justify-center bg-slate-50 rounded-2xl border border-dashed border-[#e5dec9]/50">
                  <span className="text-xs text-slate-400">No {t} categories defined.</span>
                </div>
              ) : (
                categories
                  ?.filter((c) => c.type === t)
                  .map((cat) => (
                    <div
                      key={cat._id}
                      className="flex items-center justify-between p-3.5 bg-white rounded-2xl shadow-sm border border-[#e5dec9]/30 group hover:border-[#ff6b35]/25 transition-all duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8.5 h-8.5 rounded-xl flex items-center justify-center shadow-sm"
                          style={{
                            backgroundColor: `${cat.color}15`,
                            color: cat.color,
                          }}
                        >
                          <Tag className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-sm text-slate-700">
                          {cat.name}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(cat._id)}
                        className="md:opacity-0 md:group-hover:opacity-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all rounded-xl w-8 h-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
