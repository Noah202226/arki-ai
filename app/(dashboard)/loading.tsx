import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[80vh] w-full flex flex-col items-center justify-center p-6 bg-[#fcfaf7] dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
        {/* Animated Brand Icon */}
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 rounded-3xl bg-[#ff6b35]/20 blur-xl animate-pulse" />
          <img
            src="/android-chrome-512x512.png"
            alt="Arki Icon"
            className="w-16 h-16 relative z-10 rounded-2xl shadow-xl shadow-[#ff6b35]/30 animate-pulse duration-1000"
          />
          <div className="absolute -bottom-1 -right-1 z-20 bg-slate-900 dark:bg-slate-100 p-1 rounded-full shadow-md">
            <Loader2 className="w-4 h-4 animate-spin text-[#ff6b35]" />
          </div>
        </div>

        {/* Text Details */}
        <div className="text-center space-y-1">
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Arki<span className="text-[#ff6b35]">.</span>
          </h3>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 animate-pulse">
            Preparing your workspace...
          </p>
        </div>

        {/* Skeleton Card Preview */}
        <div className="w-full max-w-sm mt-4 p-4 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-3">
          <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          <div className="h-10 w-full bg-slate-200/80 dark:bg-slate-800/80 rounded-xl animate-pulse" />
          <div className="h-4 w-2/3 bg-slate-200/60 dark:bg-slate-800/60 rounded-lg animate-pulse" />
        </div>
      </div>
    </div>
  );
}
