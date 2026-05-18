import React from "react";

interface StatCellProps {
  label: string;
  value: string;
  sub: string;
  accent: string;
  icon: React.ReactNode;
}

export function StatCell({ label, value, sub, accent, icon }: StatCellProps) {
  return (
    <div className="bg-[#1a1a2e] px-5 sm:px-6 py-5 relative group hover:bg-[#1f1f38] transition-colors duration-200">
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between mb-3">
        <div
          className="p-1.5 rounded-lg"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <span style={{ color: "rgba(255,255,255,0.4)" }}>{icon}</span>
        </div>
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/30 mb-1">
        {label}
      </p>
      <p className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight leading-none mb-2">
        {value}
      </p>
      <p className="text-[10px] text-white/25">{sub}</p>
    </div>
  );
}
