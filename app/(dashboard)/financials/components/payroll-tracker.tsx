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
  Check,
  AlertCircle,
  Edit2,
  Trash2,
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export function PayrollTracker() {
  const payrollData = useQuery(api.payroll.getCutOffStats);
  const logWorkDay = useMutation(api.payroll.addWorkDay);
  const saveSettings = useMutation(api.payroll.saveSettings);
  const updateWorkLog = useMutation(api.payroll.updateWorkDay);
  const deleteWorkLog = useMutation(api.payroll.deleteWorkDay);

  // Modals visibility states
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Edit Log State definitions
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editIsWorked, setEditIsWorked] = useState(true);
  const [editOtHours, setEditOtHours] = useState("");
  const [editBaseDailyRate, setEditBaseDailyRate] = useState("");
  const [editOtHourlyRate, setEditOtHourlyRate] = useState("");

  // Form State definitions
  const [otHours, setOtHours] = useState("");
  const [isWorked, setIsWorked] = useState(true);
  const [logDate, setLogDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Settings State definitions
  const [baseDailyRate, setBaseDailyRate] = useState("");
  const [otHourlyRate, setOtHourlyRate] = useState("");
  const [currentCutOff, setCurrentCutOff] = useState("");

  const stats = payrollData?.stats || {
    daysWorked: 0,
    expectedBase: 0,
    expectedOT: 0,
    totalExpected: 0,
  };
  const settings = payrollData?.settings;

  // Sync settings configuration data to local states when available
  useEffect(() => {
    if (settings) {
      setBaseDailyRate(settings.baseDailyRate.toString());
      setOtHourlyRate(settings.otHourlyRate.toString());
      setCurrentCutOff(settings.currentCutOff);
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
      });
      toast.success("Day logged successfully.");
      setIsLogOpen(false);
      setOtHours("");
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

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[32px] p-6 space-y-6 shadow-sm">
      {/* HEADER SECTION */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Calculator className="w-5 h-5 text-indigo-500" />
            Expected Income
          </h3>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
            Cut-Off: {settings?.currentCutOff || "Unconfigured"}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
            Total Cut-off Expected
          </p>
          <p className="text-3xl font-black text-emerald-600 font-mono">
            ₱
            {stats.totalExpected.toLocaleString(undefined, {
              minimumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {/* COMPUTED STATS MODULE GRID */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <Calendar className="w-4 h-4 text-indigo-500 mb-2" />
          <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-tighter">
            Days Complete
          </p>
          <p className="text-lg md:text-xl font-black text-slate-800 dark:text-white font-mono">
            {stats.daysWorked} Days
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <Wallet className="w-4 h-4 text-slate-400 mb-2" />
          <p className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 tracking-tighter">
            Base Pay earned
          </p>
          <p className="text-lg md:text-xl font-black text-slate-800 dark:text-white font-mono">
            ₱{stats.expectedBase.toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <Clock className="w-4 h-4 text-amber-500 mb-2" />
          <p className="text-[9px] md:text-[10px] font-black uppercase text-amber-500 tracking-tighter">
            OT Premium accumulated
          </p>
          <p className="text-lg md:text-xl font-black text-slate-800 dark:text-white font-mono">
            ₱{stats.expectedOT.toLocaleString()}
          </p>
        </div>
      </div>

      {/* CALL TO ACTIONS CONTROL MODULE */}
      <div className="flex gap-3 pt-2">
        {/* LOG DAY DIALOG */}
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
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Overtime Context (Hours)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="e.g. 2.5"
                    value={otHours}
                    onChange={(e) => setOtHours(e.target.value)}
                    className="h-12 rounded-xl font-black text-lg font-mono border-2"
                  />
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

        {/* SETTINGS DIALOG */}
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
          <DialogContent className="rounded-3xl border-2 max-w-md p-6 bg-white dark:bg-slate-900">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black tracking-tight">
                Payroll Rate Configurations
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveSettings} className="space-y-5 pt-3">
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Current Cut-off Description
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
                  placeholder="1000"
                  value={baseDailyRate}
                  onChange={(e) => setBaseDailyRate(e.target.value)}
                  className="h-12 rounded-xl font-black font-mono border-2"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                  OT Base Hourly Compensation (₱)
                </label>
                <Input
                  type="number"
                  placeholder="150"
                  value={otHourlyRate}
                  onChange={(e) => setOtHourlyRate(e.target.value)}
                  className="h-12 rounded-xl font-black font-mono border-2"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-black rounded-xl"
              >
                Save Rates Parameters
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
            <p className="text-xs font-bold text-slate-400">No shifts logged for this cut-off period.</p>
          </div>
        ) : (
          <div className="max-h-[220px] overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {sortedLogs.map((log) => {
              const dayEarnings = log.isWorked
                ? log.baseDailyRate + log.otHours * log.otHourlyRate
                : 0;

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
                      <div className="flex items-center gap-2 mt-0.5">
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
                          <span className="text-[9px] font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full">
                            +{log.otHours}h OT
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        Earning
                      </p>
                      <p className="text-sm font-black text-emerald-600 font-mono">
                        ₱{dayEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Overtime Context (Hours)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    placeholder="e.g. 2.5"
                    value={editOtHours}
                    onChange={(e) => setEditOtHours(e.target.value)}
                    className="h-12 rounded-xl font-black text-lg font-mono border-2"
                  />
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
