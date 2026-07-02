"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  // Redirect automatically when authenticated
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/financials");
    }
  }, [isSignedIn, isLoaded, router]);

  return (
    <main className="min-h-screen bg-[#0f1019] text-[#e8e6e0] font-sans">
      {/* NAV */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-white/[0.06]">
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
        <div className="flex items-center gap-4">
          <AuthLoading>
            <Loader2 className="h-4 w-4 animate-spin text-white/30" />
          </AuthLoading>
          <Unauthenticated>
            <SignInButton mode="modal">
              <button className="text-sm font-semibold text-white/80 hover:text-white transition-colors">
                Sign In
              </button>
            </SignInButton>
          </Unauthenticated>
          <Authenticated>
            <Link href="/financials">
              <button className="text-sm font-semibold text-[#ff6b35] hover:text-[#ff8254] transition-colors">
                Go to Dashboard
              </button>
            </Link>
          </Authenticated>
        </div>
      </nav>

      {/* HERO */}
      <div className="max-w-[1100px] mx-auto px-6 sm:px-10 py-12 md:py-24 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 bg-[#ff6b35]/10 border border-[#ff6b35]/20 rounded-full px-[14px] py-[5px]">
            <span className="w-[6px] h-[6px] rounded-full bg-[#ff6b35]" />
            <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#ff6b35]">
              AI-Powered Personal Assistant
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-[52px] font-extrabold leading-[1.1] md:leading-[1.05] tracking-[-1.5px] text-white">
            Take control of
            <br />
            your <span className="text-[#ff6b35]">finances,</span>
            <br />
            <span className="text-white/35">tasks & life.</span>
          </h1>

          <p className="text-sm sm:text-base text-white/45 leading-relaxed font-normal max-w-md">
            One dashboard for your wallets, payables, and daily workflow. Built
            for people who take their personal growth seriously.
          </p>

          <div className="pt-2">
            <AuthLoading>
              <div className="h-12 w-44 bg-white/[0.06] rounded-xl animate-pulse" />
            </AuthLoading>
            <Unauthenticated>
              <SignInButton mode="modal">
                <Button className="bg-[#ff6b35] hover:bg-[#e85e2b] text-white rounded-[10px] px-8 py-4 text-sm font-bold h-auto shadow-lg shadow-[#ff6b35]/10 hover:shadow-[#ff6b35]/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </SignInButton>
            </Unauthenticated>
            <Authenticated>
              <Link href="/financials">
                <Button className="bg-[#ff6b35] hover:bg-[#e85e2b] text-white rounded-[10px] px-8 py-4 text-sm font-bold h-auto hover:scale-[1.02] active:scale-[0.98] transition-all">
                  Open Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </Authenticated>
          </div>
        </div>

        {/* DASHBOARD PREVIEW CARD */}
        <div className="bg-[#1a1a2e] rounded-2xl border border-white/[0.06] overflow-hidden shadow-2xl">
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
                <span className="text-[12px] font-semibold text-white/70 flex-1 truncate">
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
      <div className="max-w-[1100px] mx-auto px-6 sm:px-10 pb-20">
        <p className="text-center text-[11px] font-bold tracking-[0.14em] uppercase text-white/20 mb-3">
          Everything you need
        </p>
        <h2 className="text-center text-3xl sm:text-[34px] font-extrabold text-white tracking-[-0.8px] mb-2">
          Built around your life
        </h2>
        <p className="text-center text-sm sm:text-[15px] text-white/35 mb-11">
          Three pillars that keep you in control every single day.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 border border-white/[0.06] rounded-2xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">
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
      <div className="max-w-[1100px] mx-auto px-6 sm:px-10 pb-16">
        <div className="bg-[#1a1a2e] border border-white/6 rounded-2xl p-8 sm:p-12 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 text-center md:text-left">
          <div>
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-white tracking-[-0.5px] mb-2">
              Ready to take <span className="text-[#ff6b35]">control?</span>
            </h2>
            <p className="text-xs sm:text-[14px] text-white/35">
              Free to start. No credit card. Your data stays yours.
            </p>
          </div>
          <div>
            <Unauthenticated>
              <SignInButton mode="modal">
                <Button className="bg-[#ff6b35] hover:bg-[#e85e2b] text-white rounded-[10px] px-8 py-4 text-sm font-bold h-auto whitespace-nowrap w-full md:w-auto hover:scale-[1.02] transition-transform">
                  Get Started Free <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </SignInButton>
            </Unauthenticated>
            <Authenticated>
              <Link href="/financials" className="w-full md:w-auto">
                <Button className="bg-[#ff6b35] hover:bg-[#e85e2b] text-white rounded-[10px] px-8 py-4 text-sm font-bold h-auto whitespace-nowrap w-full md:w-auto">
                  Open Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </Authenticated>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="px-6 sm:px-10 py-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
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
