"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Flame, Trophy, Zap, Brain, Quote, RefreshCw } from "lucide-react";
import { useState } from "react";

const DISCIPLINE_QUOTES = [
  "Discipline is choosing between what you want now and what you want most.",
  "We don't rise to the level of our expectations, we fall to the level of our training.",
  "Small daily improvements over time lead to stunning results.",
  "Action produces clarity. Do the hard thing first.",
  "You do not rise to the level of your goals. You fall to the level of your systems.",
  "Consistency is the true test of discipline.",
];

export function DisciplineHeader() {
  const userStats = useQuery(api.tasks.getUserStats);
  const [quoteIdx, setQuoteIdx] = useState(0);

  const xp = userStats?.xp ?? 0;
  const level = userStats?.level ?? 1;
  const streak = userStats?.streakCount ?? 0;
  const focusSessions = userStats?.focusSessionsCompleted ?? 0;

  const currentLevelXp = xp % 250;
  const xpProgressPercent = Math.min(100, Math.round((currentLevelXp / 250) * 100));

  const getRankTitle = (lvl: number) => {
    if (lvl === 1) return "Novice Operator";
    if (lvl === 2) return "Focused Executioner";
    if (lvl === 3) return "Discipline Master";
    if (lvl === 4) return "Relentless Achiever";
    return "Unstoppable Titan";
  };

  return (
    <div className="bg-[#111122] border-b border-white/[0.08] text-white">
      {/* Upper header section */}
      <div className="px-4 sm:px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff6b35] animate-pulse" />
            <span className="text-[11px] font-black tracking-widest uppercase text-white/40">
              Personal Discipline & Ops Center
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            System <span className="text-[#ff6b35]">Daily Ops</span>
          </h1>
          <p className="text-xs text-white/40 mt-1">
            {new Date().toLocaleDateString("en-PH", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Gamification Stats Cards */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Level & XP Card */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-3.5 min-w-[200px] flex-1 sm:flex-initial">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white/90">Lvl {level} • {getRankTitle(level)}</span>
              </div>
              <span className="text-[10px] font-mono text-[#ff6b35] font-bold">{currentLevelXp}/250 XP</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#ff6b35] to-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${xpProgressPercent}%` }}
              />
            </div>
          </div>

          {/* Streak Counter Badge */}
          <div className="bg-[#ff6b35]/10 border border-[#ff6b35]/30 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="p-2 bg-[#ff6b35]/20 rounded-lg text-[#ff6b35]">
              <Flame className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="text-xl font-black text-white leading-none">{streak} <span className="text-xs font-normal text-white/50">Days</span></div>
              <span className="text-[10px] font-bold text-[#ff6b35] uppercase tracking-wider">Active Streak</span>
            </div>
          </div>

          {/* Focus Sessions Badge */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-black text-white leading-none">{focusSessions}</div>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Focus Blocks</span>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Mindset Banner */}
      <div className="bg-white/[0.03] border-t border-white/[0.06] px-4 sm:px-8 py-3 flex items-center justify-between gap-4 text-xs text-white/70">
        <div className="flex items-center gap-2 truncate">
          <Quote className="w-3.5 h-3.5 text-[#ff6b35] shrink-0" />
          <span className="italic truncate">"{DISCIPLINE_QUOTES[quoteIdx]}"</span>
        </div>
        <button
          onClick={() => setQuoteIdx((prev) => (prev + 1) % DISCIPLINE_QUOTES.length)}
          className="p-1 hover:text-white text-white/40 rounded transition-colors shrink-0 flex items-center gap-1 text-[11px]"
          title="Next Mindset Shift"
        >
          <RefreshCw className="w-3 h-3" /> Shift Mindset
        </button>
      </div>
    </div>
  );
}
