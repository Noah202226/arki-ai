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

  // Modals visibility states
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    </div>
  );
}
