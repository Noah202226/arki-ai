"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  ArrowRight,
  Wallet,
  CheckSquare,
  ShieldCheck,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0f1019] text-[#e8e6e0] font-sans">
      {/* NAV */}
      <nav className="flex items-center justify-between px-10 py-[18px] border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-[34px] h-[34px] bg-[#ff6b35] rounded-[9px] flex items-center justify-center text-white font-extrabold text-base">
            A
          </div>
          <span className="text-[18px] font-extrabold text-white tracking-tight">
            Arki<span className="text-[#ff6b35]">.</span>
          </span>
          <span className="text-[10px] font-bold tracking-[0.1em] bg-[#ff6b35]/10 text-[#ff6b35] border border-[#ff6b35]/25 px-[9px] py-[3px] rounded-full">
            BETA
          </span>
        </div>
        <AuthLoading>
          <Loader2 className="h-5 w-5 animate-spin text-white/30" />
        </AuthLoading>
        <Unauthenticated>
          <SignInButton mode="modal">
            <Button
              variant="outline"
              className="bg-white/[0.06] border-white/10 text-white/70 hover:bg-white/10 rounded-lg text-sm font-semibold"
            >
              Sign In
            </Button>
          </SignInButton>
        </Unauthenticated>
        <Authenticated>
          <Link href="/financials">
            <Button className="bg-[#ff6b35] hover:bg-[#e85e2b] text-white rounded-lg text-sm font-bold">
              Dashboard <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </Authenticated>
      </nav>

      {/* HERO */}
      <div className="max-w-[1100px] mx-auto px-10 py-20 grid grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#ff6b35]/10 border border-[#ff6b35]/20 rounded-full px-[14px] py-[5px] mb-6">
            <span className="w-[6px] h-[6px] rounded-full bg-[#ff6b35]" />
            <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#ff6b35]">
              AI-Powered Personal Assistant
            </span>
          </div>

          <h1 className="text-[52px] font-extrabold leading-[1.05] tracking-[-1.5px] text-white mb-5">
            Take control of
            <br />
            your <span className="text-[#ff6b35]">finances,</span>
            <br />
            <span className="text-white/35">tasks & life.</span>
          </h1>

          <p className="text-base text-white/45 leading-relaxed mb-8 font-normal">
            One dashboard for your wallets, payables, and daily workflow. Built
            for people who take their personal growth seriously.
          </p>

          <div className="flex gap-3">
            <AuthLoading>
              <div className="h-12 w-36 bg-white/[0.06] rounded-lg animate-pulse" />
            </AuthLoading>
            <Unauthenticated>
              <SignInButton mode="modal">
                <Button className="bg-[#ff6b35] hover:bg-[#e85e2b] text-white rounded-[10px] px-7 py-3 text-sm font-bold h-auto">
                  Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </SignInButton>
            </Unauthenticated>
            <Authenticated>
              <Link href="/financials">
                <Button className="bg-[#ff6b35] hover:bg-[#e85e2b] text-white rounded-[10px] px-7 py-3 text-sm font-bold h-auto">
                  Open Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </Authenticated>
            <Button
              variant="ghost"
              className="border border-white/10 text-white/50 hover:bg-white/[0.06] rounded-[10px] px-6 py-3 text-sm font-semibold h-auto"
            >
              See how it works
            </Button>
          </div>
        </div>

        {/* DASHBOARD PREVIEW CARD */}
        <div className="bg-[#1a1a2e] rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="bg-[#13132a] px-[18px] py-[14px] flex items-center justify-between border-b border-white/[0.05]">
            <span className="text-[11px] font-bold tracking-[0.06em] uppercase text-white/40">
              Financials
            </span>
            <div className="flex gap-[5px]">
              <span className="w-2 h-2 rounded-full bg-[#ff6b35]" />
              <span className="w-2 h-2 rounded-full bg-white/15" />
              <span className="w-2 h-2 rounded-full bg-white/15" />
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-white/[0.05]">
            {[
              {
                label: "Net Worth",
                val: "₱284,500",
                delta: "↑ 4.2%",
                pos: true,
              },
              {
                label: "Monthly Spend",
                val: "₱24,850",
                delta: "62% credit used",
                pos: false,
              },
              {
                label: "Total Cash",
                val: "₱61,200",
                delta: "↑ ₱3,400 inflow",
                pos: true,
              },
              {
                label: "Credit Used",
                val: "₱18,000",
                delta: "Due Aug 5",
                pos: false,
              },
            ].map((s) => (
              <div key={s.label} className="bg-[#1a1a2e] p-4">
                <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-white/25 mb-1">
                  {s.label}
                </div>
                <div className="font-mono text-[18px] font-medium text-white">
                  {s.val}
                </div>
                <div
                  className={`text-[10px] font-bold mt-1 ${s.pos ? "text-emerald-400" : "text-[#ff6b35]"}`}
                >
                  {s.delta}
                </div>
              </div>
            ))}
          </div>
          <div className="p-[18px]">
            <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-white/25 mb-3">
              Recent Transactions
            </div>
            {[
              {
                name: "SM Supermarket",
                date: "Today",
                amt: "−₱1,850",
                color: "#ff6b35",
                pos: false,
              },
              {
                name: "Salary Deposit",
                date: "Jul 30",
                amt: "+₱38,000",
                color: "#34d399",
                pos: true,
              },
              {
                name: "Meralco Bill",
                date: "Jul 25",
                amt: "−₱2,400",
                color: "rgba(255,255,255,0.2)",
                pos: false,
              },
            ].map((t) => (
              <div
                key={t.name}
                className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0"
              >
                <span
                  className="w-[7px] h-[7px] rounded-full flex-shrink-0"
                  style={{ background: t.color }}
                />
                <span className="text-[12px] font-semibold text-white/70 flex-1">
                  {t.name}
                </span>
                <span className="text-[10px] text-white/20">{t.date}</span>
                <span
                  className={`font-mono text-[12px] font-medium ${t.pos ? "text-emerald-400" : "text-[#e8e6e0]"}`}
                >
                  {t.amt}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FEATURES */}
      <div className="max-w-[1100px] mx-auto px-10 pb-20">
        <p className="text-center text-[11px] font-bold tracking-[0.14em] uppercase text-white/20 mb-3">
          Everything you need
        </p>
        <h2 className="text-center text-[34px] font-extrabold text-white tracking-[-0.8px] mb-2">
          Built around your life
        </h2>
        <p className="text-center text-[15px] text-white/35 mb-11">
          Three pillars that keep you in control every single day.
        </p>

        <div className="grid grid-cols-3 border border-white/[0.06] rounded-2xl overflow-hidden divide-x divide-white/[0.06]">
          {[
            {
              icon: Wallet,
              color: "#ff6b35",
              bg: "rgba(255,107,53,0.12)",
              title: "Financial Tracker",
              desc: "Track GCash, bank accounts, and credit cards. Project payables for the next 6 months at a glance.",
              tag: "Live in your dashboard",
            },
            {
              icon: CheckSquare,
              color: "#34d399",
              bg: "rgba(52,211,153,0.12)",
              title: "Smart Tasks",
              desc: "Organize your daily workflow with real-time sync, priority labels, and deadline tracking built in.",
              tag: "Syncs in real-time",
            },
            {
              icon: ShieldCheck,
              color: "#378add",
              bg: "rgba(55,138,221,0.12)",
              title: "Secure Vault",
              desc: "Store credentials and sensitive data encrypted — accessible only to you, always at hand.",
              tag: "End-to-end encrypted",
            },
          ].map((f) => (
            <div key={f.title} className="bg-[#0f1019] p-7">
              <div
                className="w-[42px] h-[42px] rounded-[10px] flex items-center justify-center mb-4"
                style={{ background: f.bg }}
              >
                <f.icon className="w-5 h-5" style={{ color: f.color }} />
              </div>
              <h3 className="text-[15px] font-bold text-white mb-2">
                {f.title}
              </h3>
              <p className="text-[13px] text-white/35 leading-relaxed">
                {f.desc}
              </p>
              <span
                className="inline-flex items-center gap-1 mt-4 text-[11px] font-bold px-[10px] py-[3px] rounded-[4px]"
                style={{ background: f.bg, color: f.color }}
              >
                <ArrowRight className="w-3 h-3" /> {f.tag}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA BAND */}
      <div className="max-w-255 mx-auto px-10 pb-16">
        <div className="bg-[#1a1a2e] border border-white/6 rounded-2xl p-12 flex items-center justify-between gap-10">
          <div>
            <h2 className="text-[28px] font-extrabold text-white tracking-[-0.5px] mb-2">
              Ready to take <span className="text-[#ff6b35]">control?</span>
            </h2>
            <p className="text-[14px] text-white/35">
              Free to start. No credit card. Your data stays yours.
            </p>
          </div>
          <Unauthenticated>
            <SignInButton mode="modal">
              <Button className="bg-[#ff6b35] hover:bg-[#e85e2b] text-white rounded-[10px] px-8 py-4 text-sm font-bold h-auto whitespace-nowrap">
                Open Dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </SignInButton>
          </Unauthenticated>
          <Authenticated>
            <Link href="/financials">
              <Button className="bg-[#ff6b35] hover:bg-[#e85e2b] text-white rounded-[10px] px-8 py-4 text-sm font-bold h-auto whitespace-nowrap">
                Open Dashboard <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </Authenticated>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="px-10 py-5 border-t border-white/5 flex items-center justify-between">
        <span className="text-[12px] text-white/20">
          © 2026 Arki. Built for personal use.
        </span>
        <span className="text-[12px] text-white/20">
          Next.js · Convex · Clerk
        </span>
      </footer>
    </main>
  );
}
