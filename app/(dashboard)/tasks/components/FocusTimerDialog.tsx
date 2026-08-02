"use client";

import { useState, useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Brain,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Plus,
  Minus,
  Flame,
  Target,
  Gift,
  HelpCircle,
  Clock,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FocusTimerDialogProps {
  open: boolean;
  onClose: () => void;
  task?: {
    _id: Id<"tasks">;
    text: string;
    description?: string;
    priority?: string;
    category?: string;
    type?: "task" | "routine";
    estimatedMinutes?: number;
    xpValue?: number;
    isCompleted?: boolean;
  } | null;
}

const CANCEL_REASONS = [
  "🚨 Unexpected Interruption / Emergency",
  "🧠 Mental Fatigue / Low Energy",
  "🧱 Blocked by Missing Info / Dependencies",
  "⏱️ Underestimated Task Complexity",
  "🎯 Priority Shifted / Wrong Task",
  "✏️ Other / Custom Reason",
];

export function FocusTimerDialog({ open, onClose, task }: FocusTimerDialogProps) {
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Cancellation Flow States
  const [showCancelWarning, setShowCancelWarning] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReasonText, setCustomReasonText] = useState<string>("");

  // Mutations
  const completeFocusSession = useMutation(api.tasks.completeFocusSession);
  const toggleTask = useMutation(api.tasks.toggle);

  const audioContextRef = useRef<AudioContext | null>(null);
  const noiseOscillatorRef = useRef<AudioNode | null>(null);

  // Initialize or reset timer when task changes or modal opens
  useEffect(() => {
    if (open) {
      const defaultMins = task?.estimatedMinutes ? Math.min(Math.max(task.estimatedMinutes, 5), 120) : 25;
      const initialSecs = defaultMins * 60;
      setTotalSeconds(initialSecs);
      setSecondsLeft(initialSecs);
      setIsActive(false);
      setIsFinished(false);
      setShowCancelWarning(false);
      setSelectedReason("");
      setCustomReasonText("");
    }
  }, [open, task]);

  // Audio Ambient Generator (White noise / focus synth via Web Audio API)
  useEffect(() => {
    if (soundEnabled && isActive) {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 350; // Deep focus brown noise

        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.035;

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        whiteNoise.start();
        noiseOscillatorRef.current = whiteNoise;
      } catch (e) {
        console.warn("Audio Context error:", e);
      }
    } else {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [soundEnabled, isActive]);

  // Countdown timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isActive) {
      setIsActive(false);
      setIsFinished(true);
      completeFocusSession({
        taskId: task?._id,
        durationMinutes: Math.round(totalSeconds / 60),
      }).catch(console.error);

      // Play completion chime
      try {
        const ctx = new (window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
      } catch (e) {
        console.warn("Chime error:", e);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, secondsLeft, totalSeconds, completeFocusSession, task]);

  if (!open) return null;

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

  // Time adjustment helpers
  const handleAddMinutes = (mins: number) => {
    const addedSecs = mins * 60;
    setTotalSeconds((prev) => prev + addedSecs);
    setSecondsLeft((prev) => prev + addedSecs);
  };

  const handleSubtractMinutes = (mins: number) => {
    const subSecs = mins * 60;
    if (secondsLeft <= subSecs) return;
    setTotalSeconds((prev) => Math.max(60, prev - subSecs));
    setSecondsLeft((prev) => Math.max(1, prev - subSecs));
  };

  // Attempt close action
  const handleAttemptClose = () => {
    if (isActive || (secondsLeft < totalSeconds && !isFinished)) {
      // Prompt warning and reason for canceling
      setIsActive(false);
      setShowCancelWarning(true);
    } else {
      onClose();
    }
  };

  // Confirm cancellation and abandon session
  const handleConfirmCancel = () => {
    // Session canceled with reason
    setShowCancelWarning(false);
    setIsActive(false);
    onClose();
  };

  // Mark task completed directly from Pomodoro modal
  const handleCompleteTask = async () => {
    if (task?._id) {
      await toggleTask({ id: task._id });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        // Prevent closing by clicking outside if timer is active or uncompleted
        if (e.target === e.currentTarget) {
          handleAttemptClose();
        }
      }}
    >
      <div className="relative w-full max-w-lg bg-[#141424] border border-white/10 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-center text-white max-h-[90vh] overflow-y-auto">
        {/* Top Header Controls */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2 text-[#ff6b35]">
            <Brain className="w-5 h-5 animate-pulse" />
            <span className="text-xs font-black tracking-widest uppercase">Pomodoro Focus Block</span>
          </div>

          <div className="flex items-center gap-2">
            {isActive && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Lock className="w-3 h-3" /> Lock Engaged
              </span>
            )}
            <button
              onClick={handleAttemptClose}
              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              title={isActive ? "Cancel session" : "Close timer"}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cancellation Warning Screen */}
        {showCancelWarning ? (
          <div className="py-2 text-left space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300">
              <AlertTriangle className="w-6 h-6 shrink-0 text-rose-400" />
              <div>
                <h4 className="font-bold text-sm">Abandon Focus Session?</h4>
                <p className="text-xs text-rose-300/80">
                  Stopping now will forfeit your remaining session progress and XP multiplier rewards.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">
                Why could this task not be completed? (Required for reflection):
              </label>
              <div className="grid grid-cols-1 gap-2">
                {CANCEL_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={cn(
                      "w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium border transition-all flex items-center justify-between",
                      selectedReason === reason
                        ? "bg-[#ff6b35]/20 border-[#ff6b35] text-white shadow-sm"
                        : "bg-white/5 border-white/10 text-slate-300 hover:bg-white/10"
                    )}
                  >
                    <span>{reason}</span>
                    {selectedReason === reason && <CheckCircle2 className="w-4 h-4 text-[#ff6b35]" />}
                  </button>
                ))}
              </div>

              {selectedReason.includes("Other") && (
                <textarea
                  value={customReasonText}
                  onChange={(e) => setCustomReasonText(e.target.value)}
                  placeholder="Provide brief details on what got in the way..."
                  className="mt-3 w-full bg-slate-900 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#ff6b35]"
                  rows={2}
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                onClick={() => {
                  setShowCancelWarning(false);
                  setIsActive(true); // Resume timer
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-all shadow-md"
              >
                Resume Focus
              </button>

              <button
                onClick={handleConfirmCancel}
                disabled={!selectedReason}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-all border",
                  selectedReason
                    ? "bg-rose-600/80 hover:bg-rose-600 border-rose-500 text-white shadow-md cursor-pointer"
                    : "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed"
                )}
              >
                Confirm & Abandon
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Task Info & Goal Purpose Card */}
            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-4 mb-5 text-left space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#ff6b35] flex items-center gap-1">
                  <Target className="w-3.5 h-3.5" /> Task & Goal Purpose
                </span>
                {task?.priority && (
                  <span
                    className={cn(
                      "text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border",
                      task.priority === "high"
                        ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                        : task.priority === "medium"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : "bg-blue-500/20 text-blue-300 border-blue-500/30"
                    )}
                  >
                    {task.priority} Priority
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-white leading-snug">
                {task ? task.text : "Deep Work Focus Session"}
              </h3>

              {/* Purpose / Goal Description */}
              <p className="text-xs text-slate-300/90 leading-relaxed">
                {task?.description
                  ? task.description
                  : "Dedicated high-concentration block to eliminate distraction, conquer key objectives, and maintain daily discipline."}
              </p>

              {/* Benefits Section */}
              <div className="pt-2 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 text-[11px]">
                <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                  <Sparkles className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>
                    <strong>+100 Focus XP</strong> towards next Level
                  </span>
                </div>

                <div className="flex items-center gap-2 text-amber-300 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                  <Flame className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    <strong>Streak Boost:</strong> Builds discipline habit
                  </span>
                </div>
              </div>
            </div>

            {/* Timer Circle */}
            <div className="relative w-44 h-44 sm:w-48 sm:h-48 mx-auto my-3 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="text-white/5 stroke-current"
                  strokeWidth="6"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  className="text-[#ff6b35] stroke-current transition-all duration-1000 ease-linear"
                  strokeWidth="6"
                  strokeDasharray="276.46"
                  strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>

              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight">
                  {formattedTime}
                </span>
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1 flex items-center gap-1">
                  {isActive ? (
                    <span className="flex items-center gap-1 text-[#ff6b35] animate-pulse">
                      <Zap className="w-3 h-3" /> In Deep Zone
                    </span>
                  ) : isFinished ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Completed!
                    </span>
                  ) : (
                    "Ready to Start"
                  )}
                </span>
              </div>
            </div>

            {/* Time Adjust Controls (+5m / -5m) */}
            {!isFinished && (
              <div className="flex items-center justify-center gap-2 my-3">
                <button
                  type="button"
                  onClick={() => handleSubtractMinutes(5)}
                  disabled={secondsLeft <= 5 * 60}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-slate-300 disabled:opacity-30 transition-all flex items-center gap-1"
                >
                  <Minus className="w-3 h-3" /> 5m
                </button>
                <span className="text-xs text-slate-400 font-mono">Adjust Duration</span>
                <button
                  type="button"
                  onClick={() => handleAddMinutes(5)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-bold text-slate-300 transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> 5m
                </button>
              </div>
            )}

            {/* Finished Reward Screen */}
            {isFinished && (
              <div className="my-4 p-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl text-emerald-300 space-y-3 animate-in zoom-in-95">
                <div className="flex items-center justify-center gap-2">
                  <Gift className="w-6 h-6 text-emerald-400 animate-bounce" />
                  <span className="text-base font-bold text-white">+100 Discipline XP Earned!</span>
                </div>
                <p className="text-xs text-emerald-200">
                  Awesome job staying focused! You completed your <strong>{Math.round(totalSeconds / 60)}m Focus Block</strong>.
                </p>
                {task?._id && (
                  <button
                    onClick={handleCompleteTask}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Mark Task as Completed
                  </button>
                )}
              </div>
            )}

            {/* Main Controls */}
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => setSoundEnabled((prev) => !prev)}
                className={cn(
                  "p-3 rounded-2xl border transition-all",
                  soundEnabled
                    ? "bg-[#ff6b35]/20 border-[#ff6b35] text-[#ff6b35]"
                    : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10"
                )}
                title={soundEnabled ? "Ambient Focus Sound ON" : "Ambient Focus Sound OFF"}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsActive((prev) => !prev)}
                className="w-16 h-16 rounded-2xl bg-[#ff6b35] hover:bg-[#e85e2b] text-white shadow-lg shadow-[#ff6b35]/30 flex items-center justify-center transition-transform active:scale-95"
              >
                {isActive ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
              </button>

              <button
                onClick={() => {
                  if (isActive) {
                    handleAttemptClose();
                  } else {
                    setSecondsLeft(totalSeconds);
                    setIsFinished(false);
                  }
                }}
                className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10 transition-all"
                title={isActive ? "Cancel block with reason" : "Reset Timer"}
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>

            {/* Footer advice */}
            <p className="text-[11px] text-white/40 mt-5 flex items-center justify-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {isActive
                  ? "Focus block running. Stay on single task to maximize momentum."
                  : "Tap play to ignite your deep work session."}
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
