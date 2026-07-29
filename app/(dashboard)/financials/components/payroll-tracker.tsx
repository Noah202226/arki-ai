"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
  Loader2,
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
  const createJob = useMutation(api.payroll.createJob);
  const deleteJob = useMutation(api.payroll.deleteJob);
  const accounts = useQuery(api.accounts.getAccounts);

  const logs = payrollData?.logs || [];
  const jobs = payrollData?.jobs || [];
  const settings = payrollData?.settings;
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

  // Job Profile Creation State
  const [newJobTitle, setNewJobTitle] = useState("");
  const [newJobBaseRate, setNewJobBaseRate] = useState("");
  const [newJobOtRate, setNewJobOtRate] = useState("");
  const [isCreatingJob, setIsCreatingJob] = useState(false);

  // Form State definitions
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [otHours, setOtHours] = useState("");
  const [lateMinutes, setLateMinutes] = useState("");
  const [isWorked, setIsWorked] = useState(true);
  const [logDate, setLogDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Settings State definitions
  const [baseDailyRate, setBaseDailyRate] = useState("");
  const [otHourlyRate, setOtHourlyRate] = useState("");
  const [sssDeduction, setSssDeduction] = useState("");
  const [philhealthDeduction, setPhilhealthDeduction] = useState("");
  const [pagibigDeduction, setPagibigDeduction] = useState("");
  const [taxRate, setTaxRate] = useState("");

  // Populate settings form state when settings query loads
  useEffect(() => {
    if (settings) {
      setBaseDailyRate(settings.baseDailyRate?.toString() || "");
      setOtHourlyRate(settings.otHourlyRate?.toString() || "");
      setSssDeduction(settings.sssDeduction?.toString() || "");
      setPhilhealthDeduction(settings.philhealthDeduction?.toString() || "");
      setPagibigDeduction(settings.pagibigDeduction?.toString() || "");
      setTaxRate(settings.taxRate?.toString() || "");
    }
  }, [settings]);

  // Claim State definitions
  const [claimType, setClaimType] = useState<"base" | "ot" | "both">("both");
  const [claimStartDate, setClaimStartDate] = useState("");
  const [claimEndDate, setClaimEndDate] = useState("");
  const [claimAccountId, setClaimAccountId] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);

  // When claim dialog opens, auto-fill date range from available logs
  useEffect(() => {
    if (isClaimOpen && logs.length > 0) {
      const dates = logs.map((l) => l.date).sort();
      setClaimStartDate(dates[0]);
      setClaimEndDate(dates[dates.length - 1]);
    }
  }, [isClaimOpen, logs]);

  // Calculate live preview totals for selected date range
  const selectedRangeLogs = logs.filter(
    (l) => l.date >= claimStartDate && l.date <= claimEndDate
  );

  let previewSelectedBase = 0;
  let previewSelectedOT = 0;
  let previewLateDeduction = 0;

  selectedRangeLogs.forEach((log) => {
    if (log.isWorked) {
      if (!log.claimed) {
        previewSelectedBase += log.baseDailyRate;
        const lates = log.lateMinutes || 0;
        const minLateRate = log.baseDailyRate ? log.baseDailyRate / (8 * 60) : 0;
        previewLateDeduction += lates * minLateRate;
      }
      if (!log.otClaimed) {
        previewSelectedOT += log.otHours * log.otHourlyRate;
      }
    }
  });

  const previewTaxDeduction = settings?.taxRate
    ? previewSelectedBase * (settings.taxRate / 100)
    : 0;
  const previewNetBase = Math.max(
    0,
    previewSelectedBase - previewLateDeduction - previewTaxDeduction
  );

  let claimAmount = 0;
  if (claimType === "base") claimAmount = previewNetBase;
  else if (claimType === "ot") claimAmount = previewSelectedOT;
  else if (claimType === "both") claimAmount = previewNetBase + previewSelectedOT;

  const remainingBase = Math.max(0, stats.netPay - (claimType === "ot" ? 0 : previewNetBase));
  const remainingOT = Math.max(0, stats.expectedOT - (claimType === "base" ? 0 : previewSelectedOT));
  const remainingTotal = remainingBase + remainingOT;

  const selectedJob = jobs.find((j) => j._id === selectedJobId);

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle || !newJobBaseRate) {
      toast.error("Please enter a job title and base daily rate.");
      return;
    }
    setIsCreatingJob(true);
    try {
      await createJob({
        title: newJobTitle,
        baseDailyRate: parseFloat(newJobBaseRate) || 0,
        otHourlyRate: parseFloat(newJobOtRate) || 0,
      });
      toast.success(`Job profile "${newJobTitle}" created!`);
      setNewJobTitle("");
      setNewJobBaseRate("");
      setNewJobOtRate("");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to create job profile.";
      toast.error(errorMsg);
    } finally {
      setIsCreatingJob(false);
    }
  };

  const handleDeleteJobProfile = async (id: Id<"jobs">, title: string) => {
    try {
      await deleteJob({ id });
      toast.success(`Job profile "${title}" removed.`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete job profile.";
      toast.error(errorMsg);
    }
  };

  const handleLogDay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings && !selectedJob) {
      toast.error("Please configure your payroll settings or select a job profile.");
      return;
    }

    const jobBaseRate = selectedJob ? selectedJob.baseDailyRate : settings?.baseDailyRate || 0;
    const jobOtRate = selectedJob ? selectedJob.otHourlyRate : settings?.otHourlyRate || 0;

    try {
      await logWorkDay({
        date: logDate,
        baseDailyRate: jobBaseRate,
        isWorked,
        otHours: isWorked ? parseFloat(otHours) || 0 : 0,
        otHourlyRate: jobOtRate,
        lateMinutes: isWorked ? parseInt(lateMinutes) || 0 : 0,
        jobId: selectedJob ? (selectedJob._id as Id<"jobs">) : undefined,
        jobTitle: selectedJob ? selectedJob.title : undefined,
      });
      toast.success("Work log entry saved successfully!");
      setIsLogOpen(false);
      setOtHours("");
      setLateMinutes("");
      setSelectedJobId("");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to record work log.";
      toast.error(errorMsg);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveSettings({
        baseDailyRate: parseFloat(baseDailyRate) || 0,
        otHourlyRate: parseFloat(otHourlyRate) || 0,
        sssDeduction: parseFloat(sssDeduction) || 0,
        philhealthDeduction: parseFloat(philhealthDeduction) || 0,
        pagibigDeduction: parseFloat(pagibigDeduction) || 0,
        taxRate: parseFloat(taxRate) || 0,
      });
      toast.success("Payroll settings updated!");
      setIsSettingsOpen(false);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update settings.";
      toast.error(errorMsg);
    }
  };

  const handleOpenEdit = (log: (typeof logs)[number]) => {
    setEditingLogId(log._id);
    setEditDate(log.date);
    setEditIsWorked(log.isWorked);
    setEditOtHours(log.otHours ? log.otHours.toString() : "");
    setEditBaseDailyRate(log.baseDailyRate ? log.baseDailyRate.toString() : "");
    setEditOtHourlyRate(log.otHourlyRate ? log.otHourlyRate.toString() : "");
    setEditLateMinutes(log.lateMinutes ? log.lateMinutes.toString() : "");
    setIsEditOpen(true);
  };

  const handleUpdateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLogId) return;
    try {
      await updateWorkLog({
        id: editingLogId as Id<"workLogs">,
        date: editDate,
        isWorked: editIsWorked,
        otHours: editIsWorked ? parseFloat(editOtHours) || 0 : 0,
        baseDailyRate: editIsWorked ? parseFloat(editBaseDailyRate) || 0 : 0,
        otHourlyRate: editIsWorked ? parseFloat(editOtHourlyRate) || 0 : 0,
        lateMinutes: editIsWorked ? parseInt(editLateMinutes) || 0 : 0,
      });
      toast.success("Work log entry updated!");
      setIsEditOpen(false);
      setEditingLogId(null);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to update work log.";
      toast.error(errorMsg);
    }
  };

  const handleDeleteLog = async (id: Id<"workLogs">) => {
    try {
      await deleteWorkLog({ id });
      toast.success("Work log deleted.");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to delete log entry.";
      toast.error(errorMsg);
    }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimAccountId) {
      toast.error("Please select a target wallet account.");
      return;
    }
    if (!claimStartDate || !claimEndDate) {
      toast.error("Please select a valid date range.");
      return;
    }
    if (claimAmount <= 0) {
      toast.error("Selected range has no unclaimed earnings to deposit.");
      return;
    }

    setIsClaiming(true);
    try {
      await claimPayroll({
        startDate: claimStartDate,
        endDate: claimEndDate,
        accountId: claimAccountId as Id<"accounts">,
        amount: claimAmount,
        claimType,
      });
      toast.success(`Claimed ₱${claimAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} successfully!`);
      setIsClaimOpen(false);
      setClaimAccountId("");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to claim expected income.";
      toast.error(errorMsg);
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
            Unclaimed Shifts & Payroll Summary
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
              {/* Job / Sideline Selection */}
              {jobs.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Job / Sideline Profile
                  </label>
                  <Select value={selectedJobId} onValueChange={setSelectedJobId}>
                    <SelectTrigger className="h-12 rounded-xl font-bold border-2">
                      <SelectValue placeholder="Default Payroll Settings Rate" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="default">Default Payroll Settings</SelectItem>
                      {jobs.map((j) => (
                        <SelectItem key={j._id} value={j._id}>
                          {j.title} (₱{j.baseDailyRate}/day, ₱{j.otHourlyRate}/hr OT)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
            <DialogContent className="rounded-3xl border-2 max-w-lg p-6 bg-white dark:bg-slate-900 overflow-y-auto max-h-[85vh]">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black tracking-tight">
                  Claim Payroll Disbursement
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleClaim} className="space-y-5 pt-2">
                {/* 1. Date Range Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    1. Select Target Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500">From Date</span>
                      <Input
                        type="date"
                        value={claimStartDate}
                        onChange={(e) => setClaimStartDate(e.target.value)}
                        className="h-11 rounded-xl font-bold border-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500">To Date</span>
                      <Input
                        type="date"
                        value={claimEndDate}
                        onChange={(e) => setClaimEndDate(e.target.value)}
                        className="h-11 rounded-xl font-bold border-2"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] font-bold text-indigo-500">
                    {selectedRangeLogs.length} shift(s) found in selected date range
                  </p>
                </div>

                {/* 2. Claim Type Options */}
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    2. Select What to Claim
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setClaimType("base")}
                      className={`p-3 rounded-2xl border-2 text-center transition-all ${claimType === "base"
                          ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold"
                          : "border-slate-100 hover:border-slate-200 text-slate-600"
                        }`}
                    >
                      <p className="text-[10px] font-black uppercase">Base Pay</p>
                      <p className="text-sm font-black font-mono mt-0.5">
                        ₱{previewNetBase.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setClaimType("ot")}
                      className={`p-3 rounded-2xl border-2 text-center transition-all ${claimType === "ot"
                          ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold"
                          : "border-slate-100 hover:border-slate-200 text-slate-600"
                        }`}
                    >
                      <p className="text-[10px] font-black uppercase">Overtime</p>
                      <p className="text-sm font-black font-mono mt-0.5">
                        ₱{previewSelectedOT.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setClaimType("both")}
                      className={`p-3 rounded-2xl border-2 text-center transition-all ${claimType === "both"
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold"
                          : "border-slate-100 hover:border-slate-200 text-slate-600"
                        }`}
                    >
                      <p className="text-[10px] font-black uppercase">Both (All)</p>
                      <p className="text-sm font-black font-mono mt-0.5">
                        ₱{(previewNetBase + previewSelectedOT).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </button>
                  </div>
                </div>

                {/* 3. Live Payout & Remaining Breakdown */}
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b">
                    <span className="font-extrabold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[10px]">
                      Deposit Amount:
                    </span>
                    <span className="text-lg font-black text-emerald-600 font-mono">
                      ₱{claimAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-slate-500 text-[11px]">
                    <span>Remaining Unclaimed Balance:</span>
                    <span className="font-bold font-mono text-slate-700 dark:text-slate-300">
                      ₱{remainingTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* 4. Target Wallet Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    3. Target Wallet Account
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

                <Button
                  type="submit"
                  disabled={isClaiming || !claimAccountId || claimAmount <= 0}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-black rounded-xl"
                >
                  {isClaiming ? "Depositing..." : `Confirm Deposit (₱${claimAmount.toLocaleString()})`}
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
                    Base Daily Rate (₱)
                  </label>
                  <Input
                    type="number"
                    value={baseDailyRate}
                    onChange={(e) => setBaseDailyRate(e.target.value)}
                    className="h-12 rounded-xl font-black font-mono border-2"
                  />
                </div>
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
              </div>

              {/* AUTO-CALCULATED LATE DEDUCTION BANNER */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <p className="font-extrabold text-slate-700 dark:text-slate-200">
                    Auto Late Deduction Rate
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Computed as Base Daily Rate ÷ 8 hrs ÷ 60 mins
                  </p>
                </div>
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                  ₱{((parseFloat(baseDailyRate) || 0) / (8 * 60)).toFixed(2)}/min
                </span>
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

              {/* MULTI-JOB / SIDELINE PROFILES */}
              <div className="border-t pt-4 space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                  <span>Job & Sideline Profiles</span>
                  <span className="text-[10px] text-indigo-500 font-normal">Multi-Rate Support</span>
                </h4>

                {/* List existing job profiles */}
                {jobs.length > 0 && (
                  <div className="space-y-2">
                    {jobs.map((j) => (
                      <div key={j._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{j.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Base: ₱{j.baseDailyRate}/day • OT: ₱{j.otHourlyRate}/hr
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          onClick={() => handleDeleteJobProfile(j._id, j.title)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new job profile mini form */}
                <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-3">
                  <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300">+ Add New Job / Client Profile</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      placeholder="Title (e.g. Client A)"
                      value={newJobTitle}
                      onChange={(e) => setNewJobTitle(e.target.value)}
                      className="h-10 text-xs font-medium rounded-xl border-2"
                    />
                    <Input
                      type="number"
                      placeholder="Daily Rate (₱)"
                      value={newJobBaseRate}
                      onChange={(e) => setNewJobBaseRate(e.target.value)}
                      className="h-10 text-xs font-bold font-mono rounded-xl border-2"
                    />
                    <Input
                      type="number"
                      placeholder="OT Rate (₱)"
                      value={newJobOtRate}
                      onChange={(e) => setNewJobOtRate(e.target.value)}
                      className="h-10 text-xs font-bold font-mono rounded-xl border-2"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleCreateJob}
                    disabled={isCreatingJob || !newJobTitle || !newJobBaseRate}
                    className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl gap-1.5"
                  >
                    {isCreatingJob ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Add Job Profile
                  </Button>
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
            <p className="text-xs font-bold text-slate-400">No unclaimed shifts logged.</p>
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
                        {log.jobTitle && (
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
                            💼 {log.jobTitle}
                          </span>
                        )}
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${log.isWorked
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400"
                            }`}
                        >
                          {log.isWorked ? "Worked" : "Off Day"}
                        </span>
                        {log.isWorked && log.otHours > 0 && (
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${log.otClaimed
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
