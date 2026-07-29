"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";

const LAST_RESET_KEY = "arki_routine_last_reset";

function getTodayDateString() {
  return new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function useDailyRoutineReset() {
  const { user } = useUser();
  const resetRoutines = useMutation(api.tasks.resetDailyRoutines);

  useEffect(() => {
    if (!user?.id) return;

    const today = getTodayDateString();
    const lastReset = localStorage.getItem(LAST_RESET_KEY);

    // If we haven't reset today, trigger the reset
    if (lastReset !== today) {
      resetRoutines({ userId: user.id })
        .then((result) => {
          localStorage.setItem(LAST_RESET_KEY, today);
          if (result.reset > 0) {
            console.log(`[Arki] Reset ${result.reset} routine(s) for new day.`);
          }
        })
        .catch((err) => {
          console.error("[Arki] Failed to reset routines:", err);
        });
    }
  }, [user?.id, resetRoutines]);
}
