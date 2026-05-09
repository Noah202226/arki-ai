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

export function CategorySettings() {
  const categories = useQuery(api.categories.getCategories, {});
  const createCategory = useMutation(api.categories.createCategory);
  const deleteCategory = useMutation(api.categories.deleteCategory);

  const [name, setName] = useState("");
  const [type, setType] = useState("expense");
  const [color, setColor] = useState("#6366f1"); // Default Indigo

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    await createCategory({
      name,
      type,
      color,
    });

    setName("");
  };

  const handleDeleteCategory = async (id: Id<"categories">) => {
    await deleteCategory({ id });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-2">
          <PieChart className="text-indigo-500" />
          Category Manager
        </h1>
        <p className="text-slate-500 text-sm">
          Organize your transaction labels for better KPI tracking.
        </p>
      </header>

      {/* --- ADD NEW CATEGORY CARD --- */}
      <Card className="border-none shadow-xl bg-slate-50/50">
        <CardHeader>
          <CardTitle className="text-sm uppercase font-bold text-slate-400">
            Add New Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleAddCategory}
            className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            <div className="md:col-span-2 space-y-2">
              <Label className="text-xs font-bold px-1">Name</Label>
              <Input
                placeholder="e.g. Subscriptions"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-white border-none h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold px-1">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-white border-none h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              className="h-11 bg-slate-900 text-white font-bold rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" /> Add
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* --- CATEGORY LIST --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {["expense", "income"].map((t) => (
          <div key={t} className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${t === "expense" ? "bg-rose-500" : "bg-emerald-500"}`}
              />
              {t} Categories
            </h3>
            <div className="space-y-2">
              {categories
                ?.filter((c) => c.type === t)
                .map((cat) => (
                  <div
                    key={cat._id}
                    className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-sm border border-slate-100 group"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          backgroundColor: `${cat.color}20`,
                          color: cat.color,
                        }}
                      >
                        <Tag className="w-4 h-4" />
                      </div>
                      <span className="font-semibold text-slate-700">
                        {cat.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCategory(cat._id)}
                      className="opacity-0 group-hover:opacity-100 text-rose-500 hover:bg-rose-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
