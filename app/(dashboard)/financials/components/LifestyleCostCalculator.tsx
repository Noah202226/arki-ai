"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Compass,
  Home,
  Zap,
  Utensils,
  Car,
  CreditCard,
  Tv,
  ShoppingBag,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  PiggyBank,
  DollarSign,
  Target,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Pencil,
  Coins,
  Wallet,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Lock,
  Unlock,
  Check,
  Coffee,
  Save,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

interface LeisureItem {
  id: string;
  name: string;
  amount: number;
  frequency: "daily" | "weekly" | "monthly";
}

export function LifestyleCostCalculator() {
  // --- 1. CONVEX LIVE DB QUERIES ---
  const accounts = useQuery(api.accounts.getAccounts);
  const subSummary = useQuery(api.subscriptions.getSubscriptionSummary);
  const creditSummary = useQuery(api.credits.getCreditSummary);
  const payrollStats = useQuery(api.payroll.getCutOffStats);

  // Persisted Lifestyle Settings & Goals Queries
  const savedSettings = useQuery(api.lifestyle.getSettings);
  const savedGoals = useQuery(api.lifestyle.getGoals);

  // Mutations
  const processDueSubscriptions = useMutation(api.subscriptions.processDueSubscriptions);
  const saveLifestyleSettingsMutation = useMutation(api.lifestyle.saveSettings);
  const createGoalMutation = useMutation(api.lifestyle.createGoal);
  const updateGoalMutation = useMutation(api.lifestyle.updateGoal);
  const deleteGoalMutation = useMutation(api.lifestyle.deleteGoal);

  const [isSaving, setIsSaving] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // --- 2. DERIVED LIVE DB METRICS ---
  const dbSubscriptionsCost = useMemo(
    () => subSummary?.totalMonthlyCost || 0,
    [subSummary]
  );

  const dbCreditsCost = useMemo(() => {
    if (!creditSummary) return 0;
    return creditSummary.reduce((acc, c) => {
      if (c.remainingBalance <= 0) return acc;
      return acc + (c.monthlyInstallment || c.remainingBalance);
    }, 0);
  }, [creditSummary]);

  const totalLiquidBalance = useMemo(() => {
    if (!accounts) return 0;
    return accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  }, [accounts]);

  const dbPayrollMonthlyIncome = useMemo(() => {
    if (!payrollStats || !payrollStats.stats) return 0;
    return (payrollStats.stats.expectedBase + payrollStats.stats.expectedOT) * 2 || 0;
  }, [payrollStats]);

  const accountMap = useMemo(() => {
    if (!accounts) return new Map();
    return new Map(accounts.map((a) => [a._id, a]));
  }, [accounts]);

  // --- 3. EXPENSE & INCOME STATE ---
  const [useLivePayroll, setUseLivePayroll] = useState<boolean>(true);
  const [customIncome, setCustomIncome] = useState<string>("");

  const [useLiveSubscriptions, setUseLiveSubscriptions] = useState<boolean>(true);
  const [customSubscriptionsCost, setCustomSubscriptionsCost] = useState<string>("");

  const [useLiveDebt, setUseLiveDebt] = useState<boolean>(true);
  const [customDebtCost, setCustomDebtCost] = useState<string>("");

  // Base fixed monthly costs
  const [housingMonthly, setHousingMonthly] = useState<number>(0);
  const [utilitiesMonthly, setUtilitiesMonthly] = useState<number>(0);
  const [foodMonthly, setFoodMonthly] = useState<number>(0);
  const [transportMonthly, setTransportMonthly] = useState<number>(0);
  const [savingsBufferPercent, setSavingsBufferPercent] = useState<number>(10);

  // Itemized Leisure / Personal Spend List
  const [leisureItems, setLeisureItems] = useState<LeisureItem[]>([]);

  // HYDRATE FROM CONVEX DB
  useEffect(() => {
    if (savedSettings !== undefined && !isInitialized) {
      if (savedSettings) {
        setHousingMonthly(savedSettings.housingMonthly || 0);
        setUtilitiesMonthly(savedSettings.utilitiesMonthly || 0);
        setFoodMonthly(savedSettings.foodMonthly || 0);
        setTransportMonthly(savedSettings.transportMonthly || 0);
        setSavingsBufferPercent(savedSettings.savingsBufferPercent ?? 10);
        setUseLivePayroll(savedSettings.useLivePayroll ?? true);
        setCustomIncome(savedSettings.customIncome ? savedSettings.customIncome.toString() : "");
        setUseLiveSubscriptions(savedSettings.useLiveSubscriptions ?? true);
        setCustomSubscriptionsCost(
          savedSettings.customSubscriptionsCost ? savedSettings.customSubscriptionsCost.toString() : ""
        );
        setUseLiveDebt(savedSettings.useLiveDebt ?? true);
        setCustomDebtCost(savedSettings.customDebtCost ? savedSettings.customDebtCost.toString() : "");
        setLeisureItems(savedSettings.leisureItems || []);
      } else {
        setHousingMonthly(12000);
        setUtilitiesMonthly(4500);
        setFoodMonthly(10000);
        setTransportMonthly(3500);
        setSavingsBufferPercent(10);
        setLeisureItems([
          { id: "1", name: "Daily Coffee & Milk Tea", amount: 150, frequency: "daily" },
          { id: "2", name: "Gym Membership", amount: 1200, frequency: "monthly" },
        ]);
      }
      setIsInitialized(true);
    }
  }, [savedSettings, isInitialized]);

  // Auto-process due daily subscriptions on mount
  useEffect(() => {
    processDueSubscriptions().catch((err) => console.error("Auto daily process error:", err));
  }, [processDueSubscriptions]);

  // Form State for Adding Leisure Item
  const [newLeisureName, setNewLeisureName] = useState("");
  const [newLeisureAmount, setNewLeisureAmount] = useState("");
  const [newLeisureFrequency, setNewLeisureFrequency] = useState<"daily" | "weekly" | "monthly">("daily");

  const handleAddLeisureItem = () => {
    if (!newLeisureName || !newLeisureAmount) return;
    const item: LeisureItem = {
      id: Date.now().toString(),
      name: newLeisureName,
      amount: Math.max(0, Number(newLeisureAmount)),
      frequency: newLeisureFrequency,
    };
    const updated = [...leisureItems, item];
    setLeisureItems(updated);
    setNewLeisureName("");
    setNewLeisureAmount("");
    setNewLeisureFrequency("daily");
    handleSaveSettings(updated);
  };

  const handleRemoveLeisureItem = (id: string) => {
    const updated = leisureItems.filter((item) => item.id !== id);
    setLeisureItems(updated);
    handleSaveSettings(updated);
  };

  // Save Settings to Convex DB
  const handleSaveSettings = async (overrideLeisure?: LeisureItem[]) => {
    setIsSaving(true);
    try {
      await saveLifestyleSettingsMutation({
        housingMonthly: Number(housingMonthly) || 0,
        utilitiesMonthly: Number(utilitiesMonthly) || 0,
        foodMonthly: Number(foodMonthly) || 0,
        transportMonthly: Number(transportMonthly) || 0,
        savingsBufferPercent: Number(savingsBufferPercent) || 0,
        useLivePayroll,
        customIncome: customIncome !== "" ? Number(customIncome) : undefined,
        useLiveSubscriptions,
        customSubscriptionsCost: customSubscriptionsCost !== "" ? Number(customSubscriptionsCost) : undefined,
        useLiveDebt,
        customDebtCost: customDebtCost !== "" ? Number(customDebtCost) : undefined,
        leisureItems: overrideLeisure || leisureItems,
      });
      toast.success("Cost of living settings saved!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  // Compute daily cost of each leisure item
  const getLeisureItemDailyCost = (item: LeisureItem) => {
    if (item.frequency === "daily") return item.amount;
    if (item.frequency === "weekly") return Math.round(item.amount / 7);
    if (item.frequency === "monthly") return Math.round(item.amount / 30);
    return item.amount;
  };

  const totalLeisureDaily = useMemo(() => {
    return leisureItems.reduce((sum, item) => sum + getLeisureItemDailyCost(item), 0);
  }, [leisureItems]);

  const totalLeisureMonthly = totalLeisureDaily * 30;

  // --- 4. DAILY PER-DAY CONSUMPTION CALCULATIONS ---
  const effectiveMonthlyIncome = useLivePayroll
    ? dbPayrollMonthlyIncome
    : Number(customIncome) || 0;

  const effectiveSubscriptionsCost = useLiveSubscriptions
    ? dbSubscriptionsCost
    : Number(customSubscriptionsCost) || 0;

  const effectiveDebtCost = useLiveDebt
    ? dbCreditsCost
    : Number(customDebtCost) || 0;

  const dailyHousing = Math.round(housingMonthly / 30);
  const dailyUtilities = Math.round(utilitiesMonthly / 30);
  const dailyFood = Math.round(foodMonthly / 30);
  const dailyTransport = Math.round(transportMonthly / 30);
  const dailySubscriptions = Math.round(effectiveSubscriptionsCost / 30);
  const dailyDebt = Math.round(effectiveDebtCost / 30);

  const rawDailyCost =
    dailyHousing +
    dailyUtilities +
    dailyFood +
    dailyTransport +
    dailySubscriptions +
    dailyDebt +
    totalLeisureDaily;

  const dailySavingsBuffer = Math.round(rawDailyCost * (savingsBufferPercent / 100));

  const totalDailyConsumption = rawDailyCost + dailySavingsBuffer;
  const totalMonthlyExpenses = totalDailyConsumption * 30;

  const dailyIncome30 = Math.round(effectiveMonthlyIncome / 30);
  const dailyIncome20 = Math.round(effectiveMonthlyIncome / 20);

  const dailyNet = dailyIncome30 - totalDailyConsumption;
  const monthlyNet = effectiveMonthlyIncome - totalMonthlyExpenses;

  const runwayMonths =
    totalMonthlyExpenses > 0
      ? (totalLiquidBalance / totalMonthlyExpenses).toFixed(1)
      : "0";
  const runwayNumber = parseFloat(runwayMonths);

  const getPercentageOfDaily = (dailyVal: number) => {
    if (totalDailyConsumption <= 0) return 0;
    return Math.round((dailyVal / totalDailyConsumption) * 100);
  };

  // --- 5. GOAL SYSTEM STATE & DIALOGS ---
  const goals = savedGoals || [];

  // New Goal State
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalMonths, setNewGoalMonths] = useState("");
  const [newGoalAccountId, setNewGoalAccountId] = useState<string>("none");

  // Edit Goal State
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<Id<"financialGoals"> | null>(null);
  const [editGoalName, setEditGoalName] = useState("");
  const [editGoalTarget, setEditGoalTarget] = useState("");
  const [editGoalMonths, setEditGoalMonths] = useState("");
  const [editGoalAccountId, setEditGoalAccountId] = useState<string>("none");

  // Delete Goal Confirmation State
  const [isDeleteGoalOpen, setIsDeleteGoalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<{ id: Id<"financialGoals">; name: string } | null>(null);

  const handleAddGoal = async () => {
    if (!newGoalName || !newGoalTarget || !newGoalMonths) return;
    try {
      await createGoalMutation({
        name: newGoalName,
        targetAmount: Math.max(1, Number(newGoalTarget)),
        months: Math.max(1, Number(newGoalMonths)),
        linkedAccountId: newGoalAccountId !== "none" ? newGoalAccountId : undefined,
        customSaved: 0,
      });
      toast.success(`Goal "${newGoalName}" added!`);
      setNewGoalName("");
      setNewGoalTarget("");
      setNewGoalMonths("");
      setNewGoalAccountId("none");
    } catch (err) {
      console.error(err);
      toast.error("Failed to add goal.");
    }
  };

  const handleOpenEditGoal = (goal: any) => {
    setEditingGoalId(goal._id);
    setEditGoalName(goal.name || "");
    setEditGoalTarget(String(goal.targetAmount || ""));
    setEditGoalMonths(String(goal.months || ""));
    setEditGoalAccountId(goal.linkedAccountId || "none");
    setIsEditGoalOpen(true);
  };

  const handleSaveEditGoal = async () => {
    if (!editingGoalId || !editGoalName || !editGoalTarget || !editGoalMonths) return;
    try {
      await updateGoalMutation({
        id: editingGoalId,
        name: editGoalName,
        targetAmount: Math.max(1, Number(editGoalTarget)),
        months: Math.max(1, Number(editGoalMonths)),
        linkedAccountId: editGoalAccountId !== "none" ? editGoalAccountId : undefined,
      });
      toast.success("Goal updated!");
      setIsEditGoalOpen(false);
      setEditingGoalId(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to update goal.");
    }
  };

  const handleUpdateGoalAccount = async (goalId: Id<"financialGoals">, accountId: string) => {
    try {
      await updateGoalMutation({
        id: goalId,
        linkedAccountId: accountId !== "none" ? accountId : undefined,
      });
      toast.success("Linked wallet updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update goal link.");
    }
  };

  const handleOpenDeleteGoalConfirm = (goal: { _id: Id<"financialGoals">; name: string }) => {
    setGoalToDelete({ id: goal._id, name: goal.name });
    setIsDeleteGoalOpen(true);
  };

  const handleConfirmDeleteGoal = async () => {
    if (!goalToDelete) return;
    try {
      await deleteGoalMutation({ id: goalToDelete.id });
      toast.success(`Goal "${goalToDelete.name}" deleted.`);
      setIsDeleteGoalOpen(false);
      setGoalToDelete(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete goal.");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER BANNER */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-[#121420] via-[#1a1d2e] to-[#0f111a] text-white shadow-xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#ff6b35]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1.5 rounded-lg bg-[#ff6b35]/20 text-[#ff6b35]">
                <Compass className="w-4 h-4" />
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-white/50">
                Daily Living Reference &amp; Wallet Goals Engine
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Daily Cost of Living <span className="text-[#ff6b35]">&amp; Wallet Goals</span>
            </h2>
            <p className="text-xs sm:text-sm text-white/60 mt-1 max-w-2xl">
              Calculate your precise <strong className="text-white">daily consumption rate</strong> and track your financial goals linked live to your <strong className="text-white">Wallet Accounts</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* 2. DAILY CONSUMPTION vs DAILY INCOME vs DAILY NET CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* DAILY CONSUMPTION RATE CARD */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <TrendingDown className="w-4 h-4" /> Daily Living Consumption
            </span>
            <Badge variant="outline" className="text-[10px] font-bold border-rose-500/30 text-rose-600 dark:text-rose-400">
              Monthly: ₱{totalMonthlyExpenses.toLocaleString("en-US")}
            </Badge>
          </div>

          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900 dark:text-slate-50 font-mono tracking-tight">
              ₱{totalDailyConsumption.toLocaleString("en-US")}
            </p>
            <span className="text-xs font-bold text-slate-400">/ day</span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Includes rent, bills, leisure &amp; buffer:</span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
              +{savingsBufferPercent}% buffer
            </span>
          </div>
        </Card>

        {/* DAILY INCOME CARD */}
        <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <Coins className="w-4 h-4" /> Daily Net Income Rate
            </span>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-bold gap-1",
                useLivePayroll
                  ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5"
                  : "border-amber-500/30 text-amber-600 dark:text-amber-400"
              )}
            >
              {useLivePayroll ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              {useLivePayroll ? "Payroll DB" : "Custom"}
            </Badge>
          </div>

          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black text-slate-900 dark:text-slate-50 font-mono tracking-tight">
              ₱{dailyIncome30.toLocaleString("en-US")}
            </p>
            <span className="text-xs font-bold text-slate-400">/ day (30d)</span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Workday Rate (20 days):</span>
            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
              ₱{dailyIncome20.toLocaleString("en-US")}/day
            </span>
          </div>
        </Card>

        {/* DAILY NET SURPLUS / DEFICIT CARD */}
        <Card
          className={cn(
            "rounded-2xl border p-5 shadow-sm relative overflow-hidden",
            dailyNet >= 0
              ? "bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/30"
              : "bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/30"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span
              className={cn(
                "text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5",
                dailyNet >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}
            >
              <TrendingUp className="w-4 h-4" /> Daily Net Surplus
            </span>
            <Badge
              className={cn(
                "text-[10px] font-bold border-0",
                dailyNet >= 0 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
              )}
            >
              Monthly Net: {monthlyNet >= 0 ? "+" : ""}₱{monthlyNet.toLocaleString("en-US")}
            </Badge>
          </div>

          <div className="flex items-baseline gap-2">
            <p
              className={cn(
                "text-3xl font-black font-mono tracking-tight",
                dailyNet >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}
            >
              {dailyNet >= 0 ? "+" : ""}₱{dailyNet.toLocaleString("en-US")}
            </p>
            <span className="text-xs font-bold text-slate-400">/ day</span>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Savings Runway:</span>
            <span
              className={cn(
                "font-mono font-bold",
                runwayNumber >= 6
                  ? "text-emerald-600 dark:text-emerald-400"
                  : runwayNumber >= 3
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-rose-600 dark:text-rose-400"
              )}
            >
              {runwayMonths} months (₱{totalLiquidBalance.toLocaleString("en-US")})
            </span>
          </div>
        </Card>
      </div>

      {/* 3. ITEMIZATION SECTION: DAILY REFERENCE BREAKDOWN + LEISURE LIST */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: FIXED EXPENSES & ITEMIZED LEISURE (7 cols) */}
        <Card className="lg:col-span-7 rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50">
                Daily Living Reference Setup
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                All inputs are saved automatically.
              </p>
            </div>
            <Button
              onClick={() => handleSaveSettings()}
              disabled={isSaving}
              size="sm"
              variant="outline"
              className="h-8 text-xs font-bold gap-1 rounded-lg border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
            >
              <Save className="w-3.5 h-3.5" /> Save
            </Button>
          </div>

          <div className="space-y-4">
            {/* Income Input / Payroll Sync */}
            <div className="p-3.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Wallet className="w-4 h-4" />
                  </span>
                  <div>
                    <Label className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                      Baseline Net Income
                    </Label>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Daily rate: ₱{dailyIncome30.toLocaleString()}/day
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      const nextVal = !useLivePayroll;
                      setUseLivePayroll(nextVal);
                      handleSaveSettings();
                    }}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-7 text-[10px] font-bold rounded-lg gap-1 border",
                      useLivePayroll
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                        : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500"
                    )}
                  >
                    {useLivePayroll ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    {useLivePayroll ? "Synced to Payroll DB" : "Manual Override"}
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <Input
                  type="number"
                  disabled={useLivePayroll}
                  value={useLivePayroll ? Math.round(dbPayrollMonthlyIncome) : customIncome}
                  onChange={(e) => setCustomIncome(e.target.value)}
                  onBlur={() => handleSaveSettings()}
                  className={cn(
                    "h-9 font-mono text-xs font-bold rounded-lg",
                    useLivePayroll
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                  )}
                />
              </div>
            </div>

            <div className="pt-2">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
                Core Living Costs (Converted to Daily Rate)
              </p>
            </div>

            {/* Housing / Apartment Rent */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                <Home className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Apartment Rent &amp; Housing
                </Label>
                <p className="text-[10px] text-slate-400 font-mono">
                  Monthly: ₱{housingMonthly.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400 block">
                    ₱{dailyHousing.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-slate-400">/ day</span>
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    value={housingMonthly || ""}
                    onChange={(e) => setHousingMonthly(Number(e.target.value))}
                    onBlur={() => handleSaveSettings()}
                    className="h-8 font-mono text-xs font-bold text-right rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Utilities & Bills */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Utilities &amp; Bills Payment
                </Label>
                <p className="text-[10px] text-slate-400 font-mono">
                  Monthly: ₱{utilitiesMonthly.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className="text-xs font-black font-mono text-amber-600 dark:text-amber-400 block">
                    ₱{dailyUtilities.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-slate-400">/ day</span>
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    value={utilitiesMonthly || ""}
                    onChange={(e) => setUtilitiesMonthly(Number(e.target.value))}
                    onBlur={() => handleSaveSettings()}
                    className="h-8 font-mono text-xs font-bold text-right rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Food & Groceries */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Utensils className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Food &amp; Groceries
                </Label>
                <p className="text-[10px] text-slate-400 font-mono">
                  Monthly: ₱{foodMonthly.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className="text-xs font-black font-mono text-emerald-600 dark:text-emerald-400 block">
                    ₱{dailyFood.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-slate-400">/ day</span>
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    value={foodMonthly || ""}
                    onChange={(e) => setFoodMonthly(Number(e.target.value))}
                    onBlur={() => handleSaveSettings()}
                    className="h-8 font-mono text-xs font-bold text-right rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Transportation */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <Car className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Transportation &amp; Fuel
                </Label>
                <p className="text-[10px] text-slate-400 font-mono">
                  Monthly: ₱{transportMonthly.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className="text-xs font-black font-mono text-blue-600 dark:text-blue-400 block">
                    ₱{dailyTransport.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-slate-400">/ day</span>
                </div>
                <div className="w-28">
                  <Input
                    type="number"
                    value={transportMonthly || ""}
                    onChange={(e) => setTransportMonthly(Number(e.target.value))}
                    onBlur={() => handleSaveSettings()}
                    className="h-8 font-mono text-xs font-bold text-right rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Subscriptions */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                <Tv className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Active Subscriptions
                </Label>
                <p className="text-[10px] text-slate-400 font-mono">
                  Monthly: ₱{Math.round(effectiveSubscriptionsCost).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className="text-xs font-black font-mono text-purple-600 dark:text-purple-400 block">
                    ₱{dailySubscriptions.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-slate-400">/ day</span>
                </div>
              </div>
            </div>

            {/* Debt Installments */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Debt &amp; Loan Installments
                </Label>
                <p className="text-[10px] text-slate-400 font-mono">
                  Monthly: ₱{Math.round(effectiveDebtCost).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className="text-xs font-black font-mono text-rose-600 dark:text-rose-400 block">
                    ₱{dailyDebt.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-slate-400">/ day</span>
                </div>
              </div>
            </div>

            {/* ITEMIZED LEISURE & PERSONAL CONSUMPTION SECTION */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-pink-500/10 text-pink-600 dark:text-pink-400">
                    <ShoppingBag className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                      Itemized Leisure &amp; Personal Consumption
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Daily Total: <span className="font-mono font-bold text-pink-600 dark:text-pink-400">₱{totalLeisureDaily.toLocaleString()}/day</span> (₱{totalLeisureMonthly.toLocaleString()}/mo)
                    </p>
                  </div>
                </div>
              </div>

              {/* Leisure Items List */}
              <div className="space-y-2 mb-3">
                {leisureItems.map((item) => {
                  const itemDaily = getLeisureItemDailyCost(item);
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-pink-500/5 dark:bg-pink-950/20 border border-pink-500/20 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Coffee className="w-3.5 h-3.5 text-pink-500" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                        <Badge variant="outline" className="text-[9px] font-bold py-0 uppercase">
                          ₱{item.amount.toLocaleString()} / {item.frequency}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right font-mono">
                          <span className="font-bold text-pink-600 dark:text-pink-400">
                            ₱{itemDaily.toLocaleString()}
                          </span>
                          <span className="text-[9px] text-slate-400 block">/ day</span>
                        </div>
                        <Button
                          onClick={() => handleRemoveLeisureItem(item.id)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Leisure Item Form */}
              <div className="p-3 rounded-xl bg-slate-100/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase">
                  + Add Leisure or Personal Consumption Item
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <Input
                    placeholder="e.g. Daily Coffee, Gym, Snacks"
                    value={newLeisureName}
                    onChange={(e) => setNewLeisureName(e.target.value)}
                    className="sm:col-span-5 h-8 text-xs font-medium rounded-lg"
                  />
                  <Input
                    type="number"
                    placeholder="Amount ₱"
                    value={newLeisureAmount}
                    onChange={(e) => setNewLeisureAmount(e.target.value)}
                    className="sm:col-span-3 h-8 font-mono text-xs font-bold rounded-lg"
                  />
                  <Select
                    value={newLeisureFrequency}
                    onValueChange={(v) => setNewLeisureFrequency(v as "daily" | "weekly" | "monthly")}
                  >
                    <SelectTrigger className="sm:col-span-4 h-8 text-xs rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleAddLeisureItem}
                  disabled={!newLeisureName || !newLeisureAmount}
                  size="sm"
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-lg h-7 gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Consumption Item
                </Button>
              </div>
            </div>

            {/* Savings Buffer % */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-teal-500/5 dark:bg-teal-950/20 border border-teal-500/20">
              <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 shrink-0">
                <PiggyBank className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Savings &amp; Emergency Buffer ({savingsBufferPercent}%)
                </Label>
                <p className="text-[10px] text-slate-400 font-mono">
                  +₱{dailySavingsBuffer.toLocaleString()}/day (+₱{(dailySavingsBuffer * 30).toLocaleString()}/mo)
                </p>
              </div>
              <div className="w-28 shrink-0">
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={savingsBufferPercent || ""}
                  onChange={(e) => setSavingsBufferPercent(Number(e.target.value))}
                  onBlur={() => handleSaveSettings()}
                  className="h-8 font-mono text-xs font-bold text-right rounded-lg border-teal-500/30"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* RIGHT COLUMN: DAILY CONSUMPTION SHARE (5 cols) */}
        <Card className="lg:col-span-5 rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-50 mb-1">
              Daily Consumption Share
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Proportion of total ₱{totalDailyConsumption.toLocaleString()}/day living cost.
            </p>

            <div className="space-y-4">
              {/* Housing */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Rent &amp; Housing</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">
                    {getPercentageOfDaily(dailyHousing)}% (₱{dailyHousing.toLocaleString()}/day)
                  </span>
                </div>
                <Progress value={getPercentageOfDaily(dailyHousing)} className="h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-indigo-600" />
              </div>

              {/* Food */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Food &amp; Groceries</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">
                    {getPercentageOfDaily(dailyFood)}% (₱{dailyFood.toLocaleString()}/day)
                  </span>
                </div>
                <Progress value={getPercentageOfDaily(dailyFood)} className="h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-emerald-500" />
              </div>

              {/* Itemized Leisure */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Itemized Leisure &amp; Personal</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">
                    {getPercentageOfDaily(totalLeisureDaily)}% (₱{totalLeisureDaily.toLocaleString()}/day)
                  </span>
                </div>
                <Progress value={getPercentageOfDaily(totalLeisureDaily)} className="h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-pink-500" />
              </div>

              {/* Debt */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Debt Installments</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">
                    {getPercentageOfDaily(dailyDebt)}% (₱{dailyDebt.toLocaleString()}/day)
                  </span>
                </div>
                <Progress value={getPercentageOfDaily(dailyDebt)} className="h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-rose-500" />
              </div>

              {/* Utilities */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Utilities &amp; Bills</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">
                    {getPercentageOfDaily(dailyUtilities)}% (₱{dailyUtilities.toLocaleString()}/day)
                  </span>
                </div>
                <Progress value={getPercentageOfDaily(dailyUtilities)} className="h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-amber-500" />
              </div>

              {/* Subscriptions */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Subscriptions</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">
                    {getPercentageOfDaily(dailySubscriptions)}% (₱{dailySubscriptions.toLocaleString()}/day)
                  </span>
                </div>
                <Progress value={getPercentageOfDaily(dailySubscriptions)} className="h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-purple-500" />
              </div>

              {/* Transport */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Transportation</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">
                    {getPercentageOfDaily(dailyTransport)}% (₱{dailyTransport.toLocaleString()}/day)
                  </span>
                </div>
                <Progress value={getPercentageOfDaily(dailyTransport)} className="h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-blue-500" />
              </div>

              {/* Savings Buffer */}
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-slate-600 dark:text-slate-300">Savings Buffer</span>
                  <span className="font-mono text-slate-900 dark:text-slate-100">
                    {getPercentageOfDaily(dailySavingsBuffer)}% (₱{dailySavingsBuffer.toLocaleString()}/day)
                  </span>
                </div>
                <Progress value={getPercentageOfDaily(dailySavingsBuffer)} className="h-2 bg-slate-100 dark:bg-slate-800 [&>div]:bg-teal-500" />
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-slate-900 text-white border border-slate-800">
            <div className="flex items-center gap-2 mb-1.5 text-[#ff6b35]">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-extrabold uppercase tracking-wider">Reference Summary</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Reference burn rate is <strong className="text-white font-mono">₱{totalDailyConsumption.toLocaleString()}/day</strong>. All changes are saved automatically.
            </p>
          </div>
        </Card>
      </div>

      {/* 4. GOAL SYSTEM WITH EDIT & DELETE CONFIRMATION */}
      <Card className="rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                <Target className="w-4 h-4" />
              </span>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">
                Financial Goals &amp; Progress
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your goals with edit &amp; delete confirmation, linked live to your real Wallet Accounts.
            </p>
          </div>
        </div>

        {/* GOALS LIST */}
        <div className="space-y-4 mb-6">
          {goals.map((g) => {
            const linkedAccount = g.linkedAccountId ? accountMap.get(g.linkedAccountId) : undefined;
            const currentSaved = linkedAccount ? linkedAccount.balance : g.customSaved || 0;

            const remaining = Math.max(0, g.targetAmount - currentSaved);
            const reqMonthlySavings = Math.round(remaining / (g.months || 1));
            const reqDailySavings = Math.round(reqMonthlySavings / 30);

            const reqTotalMonthlyIncome = totalMonthlyExpenses + reqMonthlySavings;
            const reqTotalDailyIncome = Math.round(reqTotalMonthlyIncome / 30);

            const monthlyShortfall = reqMonthlySavings - monthlyNet;
            const dailyShortfall = Math.round(monthlyShortfall / 30);
            const isGoalOnTrack = monthlyShortfall <= 0;

            const progressPercent = Math.min(
              100,
              Math.round((currentSaved / (g.targetAmount || 1)) * 100)
            );

            return (
              <div
                key={g._id}
                className={cn(
                  "p-4 sm:p-5 rounded-xl border transition-all",
                  isGoalOnTrack
                    ? "bg-slate-50/70 dark:bg-slate-800/30 border-slate-200/80 dark:border-slate-800"
                    : "bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/30"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        {g.name}
                      </h4>
                      <Badge variant="outline" className="text-[10px] font-bold">
                        <Calendar className="w-3 h-3 mr-1" /> {g.months} months
                      </Badge>
                      {isGoalOnTrack ? (
                        <Badge className="bg-emerald-500 text-white text-[9px] font-extrabold gap-1">
                          <CheckCircle2 className="w-3 h-3" /> ON TRACK
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-500 text-white text-[9px] font-extrabold gap-1">
                          <AlertCircle className="w-3 h-3" /> NEED +₱{monthlyShortfall.toLocaleString()}/MO
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Linked Wallet:</span>
                      <Select
                        value={g.linkedAccountId || "none"}
                        onValueChange={(val) => handleUpdateGoalAccount(g._id, val)}
                      >
                        <SelectTrigger className="h-7 text-xs font-bold w-48 rounded-lg bg-white dark:bg-slate-900 border-indigo-500/30">
                          <SelectValue placeholder="Select wallet" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Manual Saved Input</SelectItem>
                          {accounts?.map((acc) => (
                            <SelectItem key={acc._id} value={acc._id}>
                              💼 {acc.accountName} (₱{acc.balance.toLocaleString()})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                    <Button
                      onClick={() => handleOpenEditGoal(g)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400"
                      title="Edit Goal"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>

                    <Button
                      onClick={() => handleOpenDeleteGoalConfirm(g)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-rose-500"
                      title="Delete Goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium text-slate-600 dark:text-slate-300">
                  <span>
                    Target: <strong className="font-mono text-slate-900 dark:text-slate-50">₱{g.targetAmount.toLocaleString()}</strong>
                  </span>
                  <span>
                    Live Saved: <strong className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">₱{currentSaved.toLocaleString()}</strong> ({progressPercent}%)
                  </span>
                </div>

                <Progress value={progressPercent} className="h-2.5 bg-slate-200 dark:bg-slate-700 mb-4 [&>div]:bg-indigo-600" />

                {/* Detailed breakdown metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-200/50 dark:border-slate-800 text-xs">
                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Required Goal Savings Rate
                    </span>
                    <p className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400">
                      ₱{reqMonthlySavings.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">/ mo</span>
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                      (₱{reqDailySavings.toLocaleString()} / day)
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Total Required Income
                    </span>
                    <p className="text-sm font-black font-mono text-slate-900 dark:text-slate-50">
                      ₱{reqTotalMonthlyIncome.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">/ mo</span>
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                      (₱{reqTotalDailyIncome.toLocaleString()} / day)
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                      Earnings Gap / Surplus
                    </span>
                    {isGoalOnTrack ? (
                      <div>
                        <p className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                          +₱{Math.abs(monthlyShortfall).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">surplus/mo</span>
                        </p>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                          Current net income covers goal!
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-black font-mono text-rose-600 dark:text-rose-400">
                          -₱{monthlyShortfall.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">shortfall/mo</span>
                        </p>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                          Earn +₱{dailyShortfall.toLocaleString()}/day more
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ADD NEW GOAL FORM */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-indigo-500" /> Create New Goal
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-3">
              <Label className="text-[10px] font-bold text-slate-500">Goal Name</Label>
              <Input
                placeholder="e.g. Emergency Fund, Laptop"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                className="h-9 text-xs font-medium rounded-lg"
              />
            </div>
            <div className="sm:col-span-3">
              <Label className="text-[10px] font-bold text-slate-500">Target Amount (₱)</Label>
              <Input
                type="number"
                placeholder="e.g. 50000"
                value={newGoalTarget}
                onChange={(e) => setNewGoalTarget(e.target.value)}
                className="h-9 font-mono text-xs font-bold rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[10px] font-bold text-slate-500">Timeline (Months)</Label>
              <Input
                type="number"
                placeholder="e.g. 6"
                value={newGoalMonths}
                onChange={(e) => setNewGoalMonths(e.target.value)}
                className="h-9 font-mono text-xs font-bold rounded-lg"
              />
            </div>
            <div className="sm:col-span-4">
              <Label className="text-[10px] font-bold text-slate-500">Link Wallet Account</Label>
              <Select value={newGoalAccountId} onValueChange={setNewGoalAccountId}>
                <SelectTrigger className="h-9 text-xs rounded-lg">
                  <SelectValue placeholder="Select wallet account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Manual Saved Amount</SelectItem>
                  {accounts?.map((acc) => (
                    <SelectItem key={acc._id} value={acc._id}>
                      💼 {acc.accountName} (₱{acc.balance.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleAddGoal}
            disabled={!newGoalName || !newGoalTarget || !newGoalMonths}
            className="mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg gap-1.5 h-9 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4" /> Add Goal
          </Button>
        </div>
      </Card>

      {/* EDIT GOAL DIALOG */}
      <Dialog open={isEditGoalOpen} onOpenChange={setIsEditGoalOpen}>
        <DialogContent className="sm:max-w-[460px] rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-slate-50">
              <Pencil className="w-4 h-4 text-indigo-500" />
              Edit Goal Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-3">
            <div>
              <Label className="text-[10px] uppercase font-bold text-slate-400">Goal Name</Label>
              <Input
                value={editGoalName}
                onChange={(e) => setEditGoalName(e.target.value)}
                className="h-10 text-xs font-bold rounded-xl mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] uppercase font-bold text-slate-400">Target Amount (₱)</Label>
                <Input
                  type="number"
                  value={editGoalTarget}
                  onChange={(e) => setEditGoalTarget(e.target.value)}
                  className="h-10 font-mono text-xs font-bold rounded-xl mt-1"
                />
              </div>

              <div>
                <Label className="text-[10px] uppercase font-bold text-slate-400">Timeline (Months)</Label>
                <Input
                  type="number"
                  value={editGoalMonths}
                  onChange={(e) => setEditGoalMonths(e.target.value)}
                  className="h-10 font-mono text-xs font-bold rounded-xl mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-[10px] uppercase font-bold text-slate-400">Link Wallet Account</Label>
              <Select value={editGoalAccountId} onValueChange={setEditGoalAccountId}>
                <SelectTrigger className="h-10 text-xs font-bold rounded-xl mt-1">
                  <SelectValue placeholder="Select wallet account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Manual Saved Amount</SelectItem>
                  {accounts?.map((acc) => (
                    <SelectItem key={acc._id} value={acc._id}>
                      💼 {acc.accountName} (₱{acc.balance.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="mt-5 flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditGoalOpen(false)}
              className="text-xs font-bold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveEditGoal}
              className="text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE GOAL CONFIRMATION DIALOG */}
      <Dialog open={isDeleteGoalOpen} onOpenChange={setIsDeleteGoalOpen}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <DialogHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-slate-900 dark:text-slate-50">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              Confirm Goal Deletion
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
            Are you sure you want to delete <strong className="text-slate-900 dark:text-slate-100 font-extrabold">"{goalToDelete?.name}"</strong>? This action cannot be undone.
          </p>

          <DialogFooter className="mt-5 flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteGoalOpen(false)}
              className="text-xs font-bold rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmDeleteGoal}
              className="text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
