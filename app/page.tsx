"use client";

import { SignInButton, useUser } from "@clerk/nextjs";
import { Authenticated, Unauthenticated, AuthLoading } from "convex/react";
import Link from "next/link";

// Shadcn UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  ArrowRight,
  Wallet,
  CheckSquare,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* --- HERO SECTION --- */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="mx-auto max-w-2xl py-32 sm:py-48">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" /> Built with Next.js & Convex
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl bg-clip-text text-transparent bg-linear-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
              Your AI-Powered Personal Assistant
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600 dark:text-slate-400">
              One place for your tasks, finances, and credentials. Plan your
              budget, track your payables, and manage your day with ease.
            </p>

            <div className="mt-10 flex items-center justify-center gap-x-6">
              <AuthLoading>
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </AuthLoading>

              <Unauthenticated>
                <SignInButton mode="modal">
                  <Button size="lg" className="rounded-full px-8">
                    Get Started <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </SignInButton>
              </Unauthenticated>

              <Authenticated>
                <Link href="/financials">
                  <Button size="lg" className="rounded-full px-8">
                    Enter Dashboard <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </Authenticated>
            </div>
          </div>
        </div>
      </div>

      {/* --- FEATURE PREVIEW --- */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <FeatureCard
            icon={<Wallet className="w-6 h-6 text-blue-500" />}
            title="Financial Tracker"
            description="Track GCash, Bank accounts, and project your payables for the next 6 months."
          />
          <FeatureCard
            icon={<CheckSquare className="w-6 h-6 text-green-500" />}
            title="Smart Tasks"
            description="Organize your daily workflow with real-time sync and priority management."
          />
          <FeatureCard
            icon={<ShieldCheck className="w-6 h-6 text-purple-500" />}
            title="Secure Vault"
            description="Keep your credentials encrypted and accessible only to you."
          />
        </div>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all">
      <CardContent className="pt-6">
        <div className="mb-4">{icon}</div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
