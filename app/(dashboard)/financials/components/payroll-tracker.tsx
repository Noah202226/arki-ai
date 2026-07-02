"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Calculator,
  Calendar,
  Clock,
  Plus,
  Wallet,
  Settings,
  AlertCircle,
  Edit2,
  Trash2,
  Receipt,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export function PayrollTracker() {
  const payrollData = useQuery(api.payroll.getCutOffStats);
  const logWorkDay = useMutation(api.payroll.addWorkDay);
  const saveSettings = useMutation(api.payroll.saveSettings);
  const updateWorkLog = useMutation(api.payroll.updateWorkDay);
  const deleteWorkLog = useMutation(api.payroll.deleteWorkDay);
  const claimPayroll = useMutation(api.payroll.claimPayroll);
  const accounts = useQuery(api.accounts.getAccounts);

  // Modals visibility states
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isClaimOpen, setIsClaimOpen] = useState(false);

  // Edit Log State definitions
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editIsWorked, setEditIsWorked] = useState(true);
  const [editOtHours, setEditOtHours] = useState("");
  const [editBaseDailyRate, setEditBaseDailyRate] = useState("");
  const [editOtHourlyRate, setEditOtHourlyRate] = useState("");
  const [editLateMinutes, setEditLateMinutes] = useState("");

  // Form State definitions
  const [otHours, setOtHours] = useState("");
  const [lateMinutes, setLateMinutes] = useState("");
  const [isWorked, setIsWorked] = useState(true);
  const [logDate, setLogDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Claim State definitions
  const [claimType, setClaimType] = useState<"base" | "ot">("base");
  const [claimAccountId, setClaimAccountId] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);

  // Settings State definitions
  const [baseDailyRate, setBaseDailyRate] = useState("");
  const [otHourlyRate, setOtHourlyRate] = useState("");
  const [currentCutOff, setCurrentCutOff] = useState("");
  const [sssDeduction, setSssDeduction] = useState("");
  const [philhealthDeduction, setPhilhealthDeduction] = useState("");
  const [pagibigDeduction, setPagibigDeduction] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [lateRatePerMin, setLateRatePerMin] = useState("");

  const stats = payrollData?.stats || {
    daysWorked: 0,
    expectedBase: 0,
    expectedOT: 0,
    totalLatesMinutes: 0,
    expectedLateDeductions: 0,
    sssDeduction: 0,
    philhealthDeduction: 0,
    pagibigDeduction: 0,
    taxDeduction: 0,
    totalDeductions: 0,
    totalExpected: 0,
    netPay: 0,
  };

  const nextStats = payrollData?.nextStats || {
    daysWorked: 0,
    expectedBase: 0,
    expectedOT: 0,
    totalLatesMinutes: 0,
    expectedLateDeductions: 0,
    sssDeduction: 0,
    philhealthDeduction: 0,
    pagibigDeduction: 0,
    taxDeduction: 0,
    totalDeductions: 0,
    totalExpected: 0,
    netPay: 0,
  };

  const settings = payrollData?.settings;

  // Sync settings configuration data to local states when available
  useEffect(() => {
    if (settings) {
      setBaseDailyRate(settings.baseDailyRate.toString());
      setOtHourlyRate(settings.otHourlyRate.toString());
      setCurrentCutOff(settings.currentCutOff);
      setSssDeduction(settings.sssDeduction?.toString() || "");
      setPhilhealthDeduction(settings.philhealthDeduction?.toString() || "");
      setPagibigDeduction(settings.pagibigDeduction?.toString() || "");
      setTaxRate(settings.taxRate?.toString() || "");
      setLateRatePerMin(settings.lateRatePerMin?.toString() || "");
    }
  }, [settings]);

  const handleLogDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) {
      toast.error("Please configure your payroll settings first.");
      return;
    }

    try {
      await logWorkDay({
        date: logDate,
        cutOffPeriod: settings.currentCutOff,
        baseDailyRate: settings.baseDailyRate,
        isWorked,
        otHours: isWorked ? Number(otHours) || 0 : 0,
        otHourlyRate: settings.otHourlyRate,
        lateMinutes: isWorked ? Number(lateMinutes) || 0 : 0,
      });
      toast.success("Day logged successfully.");
      setIsLogOpen(false);
      setOtHours("");
      setLateMinutes("");
    } catch {
      toast.error("Failed to log day.");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveSettings({
        baseDailyRate: Number(baseDailyRate) || 0,
        otHourlyRate: Number(otHourlyRate) || 0,
        currentCutOff,
        sssDeduction: Number(sssDeduction) || 0,
        philhealthDeduction: Number(philhealthDeduction) || 0,
        pagibigDeduction: Number(pagibigDeduction) || 0,
        taxRate: Number(taxRate) || 0,
        lateRatePerMin: Number(lateRatePerMin) || 0,
      });
      toast.success("Settings updated.");
      setIsSettingsOpen(false);
    } catch {
      toast.error("Failed to update configurations.");
    }
  };

  const handleOpenEdit = (log: any) => {
    setEditingLogId(log._id);
    setEditDate(log.date);
    setEditIsWorked(log.isWorked);
    setEditOtHours(log.otHours.toString());
    setEditBaseDailyRate(log.baseDailyRate.toString());
    setEditOtHourlyRate(log.otHourlyRate.toString());
    setEditLateMinutes((log.lateMinutes || 0).toString());
    setIsEditOpen(true);
  };

  const handleUpdateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLogId) return;

    try {
      await updateWorkLog({
        id: editingLogId as any,
        date: editDate,
        isWorked: editIsWorked,
        otHours: editIsWorked ? Number(editOtHours) || 0 : 0,
        baseDailyRate: Number(editBaseDailyRate) || 0,
        otHourlyRate: Number(editOtHourlyRate) || 0,
        lateMinutes: editIsWorked ? Number(editLateMinutes) || 0 : 0,
      });
      toast.success("Log updated successfully.");
      setIsEditOpen(false);
      setEditingLogId(null);
    } catch {
      toast.error("Failed to update log.");
    }
  };

  const handleDeleteLog = async (id: any) => {
    if (!window.confirm("Are you sure you want to delete this log entry?")) return;
    try {
      await deleteWorkLog({ id });
      toast.success("Log entry deleted.");
    } catch {
      toast.error("Failed to delete log entry.");
    }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimAccountId) {
      toast.error("Please select a target wallet account.");
      return;
    }
    setIsClaiming(true);
    try {
      const amountToClaim = claimType === "base" ? stats.netPay : stats.expectedOT;
      await claimPayroll({
        cutOffPeriod: payrollData?.activeCutOff || "",
        accountId: claimAccountId as any,
        amount: amountToClaim,
        claimType,
      });
      toast.success(`${claimType === "base" ? "Base Pay" : "Overtime"} claimed successfully!`);
      setIsClaimOpen(false);
      setClaimAccountId("");
    } catch (err: any) {
      toast.error(err.message || "Failed to claim expected income.");
    } finally {
      setIsClaiming(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + "T00:00:00");
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const logs = payrollData?.logs || [];
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  // Determine if there is anything to claim
  const hasBaseToClaim = stats.netPay > 0;
  const hasOtToClaim = stats.expectedOT > 0;

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[32px] p-6 space-y-6 shadow-sm">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-500" />
            Expected Income Tracker
          </h3>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
            Active Cut-Off: {payrollData?.activeCutOff || "Unconfigured"}
          </p>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Expected Base Pay (Net)
          </p>
          <p className="text-3xl font-black text-emerald-600 font-mono">
            ₱
            {stats.netPay.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
          <p className="text-[10px] text-slate-400">
            Unclaimed OT: <span className="font-bold text-amber-500 font-mono">₱{stats.expectedOT.toLocaleString()}</span>
          </p>
        </div>
      </div>

      {/* DETAILED STATS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <Calendar className="w-4 h-4 text-indigo-500 mb-1.5" />
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">
            Days Worked
          </p>
          <p className="text-base font-black text-slate-800 dark:text-white font-mono">
            {stats.daysWorked} Days
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <Wallet className="w-4 h-4 text-slate-400 mb-1.5" />
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">
            Base Pay (Gross)
          </p>
          <p className="text-base font-black text-slate-800 dark:text-white font-mono">
            ₱{stats.expectedBase.toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <Clock className="w-4 h-4 text-amber-500 mb-1.5" />
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">
            Overtime Pay
          </p>
          <p className="text-base font-black text-slate-800 dark:text-white font-mono">
            ₱{stats.expectedOT.toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <AlertCircle className="w-4 h-4 text-rose-500 mb-1.5" />
          <p className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">
            Total Lates
          </p>
          <p className="text-base font-black text-slate-800 dark:text-white font-mono">
            {stats.totalLatesMinutes} Mins
          </p>
        </div>
      </div>

      {/* DEDUCTIONS SUMMARY PANEL */}
      {stats.totalDeductions > 0 && (
        <div className="p-4 bg-rose-50/40 dark:bg-rose-950/10 rounded-2xl border border-rose-100/50 dark:border-rose-950/20 text-xs space-y-2">
          <p className="font-extrabold uppercase tracking-wider text-rose-800 dark:text-rose-400 text-[10px]">
            Cut-Off Deductions Summary (Applied to Base Pay)
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-slate-600 dark:text-slate-400 font-medium">
            <div className="flex justify-between">
              <span>SSS Contribution:</span>
              <span className="font-semibold text-rose-600">₱{stats.sssDeduction}</span>
            </div>
            <div className="flex justify-between">
              <span>PhilHealth:</span>
              <span className="font-semibold text-rose-600">₱{stats.philhealthDeduction}</span>
            </div>
            <div className="flex justify-between">
              <span>Pag-IBIG:</span>
              <span className="font-semibold text-rose-600">₱{stats.pagibigDeduction}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax Deductions:</span>
              <span className="font-semibold text-rose-600">₱{stats.taxDeduction.toFixed(2)}</span>
            </div>
            <div className="flex justify-between col-span-2 border-t pt-1.5 mt-0.5">
              <span>Late Penalties ({stats.totalLatesMinutes} mins):</span>
              <span className="font-semibold text-rose-600">₱{stats.expectedLateDeductions.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* FUTURE PROJECTION COMPONENT */}
      {nextStats.daysWorked > 0 && (
        <div className="p-4 bg-indigo-50/30 dark:bg-indigo-950/10 rounded-2xl border border-indigo-100/40 dark:border-indigo-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-white">Next Cut-off Earnings</p>
              <p className="text-[10px] text-slate-400">Projected: {nextStats.daysWorked} workdays</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-indigo-600 font-mono">
              ₱{(nextStats.netPay + nextStats.expectedOT).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-400">Total Proj.</p>
          </div>
        </div>
      )}

      {/* ACTIONS ROW */}
      <div className="flex gap-3 pt-2">
        <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
          <DialogTrigger asChild>
            <Button className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-black gap-2">
              <Plus className="w-4 h-4" /> Log Day Status
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl border-2 max-w-md p-6 bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">
                Record Operational Hours
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleLogDay} className="space-y-5 pt-3">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Target Log Date
                </label>
                <Input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="h-12 rounded-xl font-bold border-2"
                />
              </div>
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border">
                <Checkbox
                  id="worked"
                  checked={isWorked}
                  onCheckedChange={(checked) => setIsWorked(!!checked)}
                  className="w-5 h-5 rounded-md"
                />
                <label
                  htmlFor="worked"
                  className="text-sm font-black text-slate-700 dark:text-slate-200 cursor-pointer select-none"
                >
                  I reported for operations/shift on this date
                </label>
              </div>
              {isWorked && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Overtime (Hours)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="e.g. 2"
                      value={otHours}
                      onChange={(e) => setOtHours(e.target.value)}
                      className="h-12 rounded-xl font-black text-lg font-mono border-2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Lates (Minutes)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g. 15"
                      value={lateMinutes}
                      onChange={(e) => setLateMinutes(e.target.value)}
                      className="h-12 rounded-xl font-black text-lg font-mono border-2"
                    />
                  </div>
                </div>
              )}
              <Button
                type="submit"
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-black rounded-xl"
              >
                Commit Log Entry
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* CLAIM TO WALLET DIALOG */}
        {(hasBaseToClaim || hasOtToClaim) && (
          <Dialog open={isClaimOpen} onOpenChange={setIsClaimOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-black gap-2 text-white">
                <Receipt className="w-4 h-4" /> Claim Payout
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl border-2 max-w-md p-6 bg-white dark:bg-slate-900">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">
                  Transfer Payout to Wallet
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleClaim} className="space-y-5 pt-3">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    What are you claiming?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={!hasBaseToClaim}
                      onClick={() => setClaimType("base")}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                        claimType === "base"
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-slate-100 hover:border-slate-200"
                      } ${!hasBaseToClaim ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <p className="text-[10px] font-black uppercase text-slate-400">Base Salary</p>
                      <p className="text-lg font-black text-emerald-600 font-mono">
                        ₱{stats.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </button>
                    <button
                      type="button"
                      disabled={!hasOtToClaim}
                      onClick={() => setClaimType("ot")}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all ${
                        claimType === "ot"
                          ? "border-amber-500 bg-amber-500/10"
                          : "border-slate-100 hover:border-slate-200"
                      } ${!hasOtToClaim ? "opacity-40 cursor-not-allowed" : ""}`}
                    >
                      <p className="text-[10px] font-black uppercase text-slate-400">Overtime Pay</p>
                      <p className="text-lg font-black text-amber-600 font-mono">
                        ₱{stats.expectedOT.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Select Target Wallet Account
                  </label>
                  <Select value={claimAccountId} onValueChange={setClaimAccountId} required>
                    <SelectTrigger className="h-12 rounded-xl font-bold border-2">
                      <SelectValue placeholder="Where to deposit?" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {accounts?.map((acc) => (
                        <SelectItem key={acc._id} value={acc._id}>
                          {acc.accountName} (Balance: ₱{acc.balance.toLocaleString()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <p className="text-[10px] text-slate-400 italic bg-amber-50 border border-amber-100 p-2.5 rounded-lg leading-relaxed">
                  Notice: Claiming will mark the select shifts' type in this cutoff as Claimed and record a new deposit under your transaction history.
                </p>

                <Button
                  type="submit"
                  disabled={isClaiming || !claimAccountId}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-black rounded-xl"
                >
                  {isClaiming ? "Depositing..." : "Confirm Deposit"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-xl border-2 hover:bg-slate-50"
            >
              <Settings className="w-5 h-5 text-slate-500" />
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-3xl border-2 max-w-lg p-6 bg-white dark:bg-slate-900 overflow-y-auto max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">
                Payroll Settings & Deductions
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveSettings} className="space-y-4 pt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Current Cut-off Period
                  </label>
                  <Input
                    placeholder="e.g. May 15 - May 30"
                    value={currentCutOff}
                    onChange={(e) => setCurrentCutOff(e.target.value)}
                    className="h-12 rounded-xl font-bold border-2"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Base Daily Rate (₱)
                  </label>
                  <Input
                    type="number"
                    value={baseDailyRate}
                    onChange={(e) => setBaseDailyRate(e.target.value)}
                    className="h-12 rounded-xl font-black font-mono border-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    OT Rate / Hour (₱)
                  </label>
                  <Input
                    type="number"
                    value={otHourlyRate}
                    onChange={(e) => setOtHourlyRate(e.target.value)}
                    className="h-12 rounded-xl font-black font-mono border-2"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Late Deductions Rate (₱/min)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 2"
                    value={lateRatePerMin}
                    onChange={(e) => setLateRatePerMin(e.target.value)}
                    className="h-12 rounded-xl font-black font-mono border-2"
                  />
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Fixed Monthly Deductions</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400">SSS (₱)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={sssDeduction}
                      onChange={(e) => setSssDeduction(e.target.value)}
                      className="h-11 rounded-xl font-bold font-mono border-2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400">PhilHealth (₱)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={philhealthDeduction}
                      onChange={(e) => setPhilhealthDeduction(e.target.value)}
                      className="h-11 rounded-xl font-bold font-mono border-2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400">Pag-IBIG (₱)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={pagibigDeduction}
                      onChange={(e) => setPagibigDeduction(e.target.value)}
                      className="h-11 rounded-xl font-bold font-mono border-2"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Withholding Tax Rate (%)
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 5"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                    className="h-12 rounded-xl font-black font-mono border-2"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-black rounded-xl mt-2"
              >
                Save Payroll Configurations
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* LOGGED DAYS LIST */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-indigo-500" />
          Logged Shifts ({sortedLogs.length})
        </h4>

        {sortedLogs.length === 0 ? (
          <div className="text-center py-6 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <p className="text-xs font-bold text-slate-400">No shifts logged for this active cut-off period.</p>
          </div>
        ) : (
          <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {sortedLogs.map((log) => {
              const dayBaseEarnings = log.isWorked ? log.baseDailyRate : 0;
              const dayOtEarnings = log.isWorked ? log.otHours * log.otHourlyRate : 0;

              return (
                <div
                  key={log._id}
                  className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-indigo-100 dark:hover:border-indigo-950/50 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-700 dark:text-slate-200">
                        {formatDate(log.date)}
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            log.isWorked
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400"
                          }`}
                        >
                          {log.isWorked ? "Worked" : "Off Day"}
                        </span>
                        {log.isWorked && log.otHours > 0 && (
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              log.otClaimed
                                ? "bg-slate-200 text-slate-500 dark:bg-slate-800"
                                : "bg-amber-50 text-amber-500 dark:bg-amber-950/20"
                            }`}
                          >
                            +{log.otHours}h OT {log.otClaimed ? "(Claimed)" : ""}
                          </span>
                        )}
                        {log.isWorked && (log.lateMinutes ?? 0) > 0 && (
                          <span className="text-[9px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-full">
                            {log.lateMinutes}m Late
                          </span>
                        )}
                        {log.claimed && (
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                            Base Claimed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Earnings
                      </p>
                      <p className="text-sm font-black text-emerald-600 font-mono">
                        ₱{(dayBaseEarnings + dayOtEarnings).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
                        onClick={() => handleOpenEdit(log)}
                      >
                        <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600"
                        onClick={() => handleDeleteLog(log._id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT LOG DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="rounded-3xl border-2 max-w-md p-6 bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">
              Modify Log Entry
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateLog} className="space-y-5 pt-3">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                Target Log Date
              </label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                className="h-12 rounded-xl font-bold border-2"
              />
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border">
              <Checkbox
                id="edit-worked"
                checked={editIsWorked}
                onCheckedChange={(checked) => setEditIsWorked(!!checked)}
                className="w-5 h-5 rounded-md"
              />
              <label
                htmlFor="edit-worked"
                className="text-sm font-black text-slate-700 dark:text-slate-200 cursor-pointer select-none"
              >
                I reported for operations/shift on this date
              </label>
            </div>

            {editIsWorked && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Overtime (Hours)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="e.g. 2"
                      value={editOtHours}
                      onChange={(e) => setEditOtHours(e.target.value)}
                      className="h-12 rounded-xl font-black text-lg font-mono border-2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Lates (Minutes)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      placeholder="e.g. 15"
                      value={editLateMinutes}
                      onChange={(e) => setEditLateMinutes(e.target.value)}
                      className="h-12 rounded-xl font-black text-lg font-mono border-2"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Base Daily Rate (₱)
                    </label>
                    <Input
                      type="number"
                      value={editBaseDailyRate}
                      onChange={(e) => setEditBaseDailyRate(e.target.value)}
                      className="h-12 rounded-xl font-black font-mono border-2"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                      OT Rate / Hour (₱)
                    </label>
                    <Input
                      type="number"
                      value={editOtHourlyRate}
                      onChange={(e) => setEditOtHourlyRate(e.target.value)}
                      className="h-12 rounded-xl font-black font-mono border-2"
                    />
                  </div>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-black rounded-xl"
            >
              Update Log Entry
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
