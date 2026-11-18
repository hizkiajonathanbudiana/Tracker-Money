"use client";

import Link from "next/link";
import { ArrowRight, Coins, Sparkles, Target } from "lucide-react";
import { useChallenges, useEconomyOverview, useTodayCompletions } from "@/hooks/useEconomy";
import {
  dayLimit,
  earnedToday,
  limitProgress,
  pointsToMoney,
  remainingAllowance,
} from "@/lib/economy";
import { dayEarnCap } from "@/lib/economy";
import { formatMoney, formatPoints } from "@/lib/money";
import { dayKeyLabel } from "@/lib/economyDay";

export default function PointsSummaryCard({ userId }: { userId: string }) {
  const { settings, points, day, dayKey, loading } = useEconomyOverview(userId);
  const { challenges } = useChallenges(userId);
  const { completions } = useTodayCompletions(userId, dayKey);

  const done = Object.keys(completions).length;
  const total = challenges.length;
  const spentToday = day?.spentMoney ?? 0;
  const allowanceLeft = remainingAllowance(day, settings);
  const cap = dayEarnCap(day, settings);
  const pct = limitProgress(day, settings);

  return (
    <section className="card-glass">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Points balance
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
            {loading ? "…" : formatPoints(points.balance)}
          </h2>
          <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            1 pt = {formatMoney(settings.moneyPerPoint, settings)} ·{" "}
            {formatMoney(pointsToMoney(points.balance, settings), settings)} total value
          </p>
        </div>
        <Link
          href="/app/points"
          className="glass-button flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-blue-600 dark:text-blue-400"
        >
          <Sparkles className="h-4 w-4" />
          Points
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-200/60 bg-amber-50/60 p-3 dark:border-amber-500/20 dark:bg-amber-500/10">
          <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
            <Coins className="h-3.5 w-3.5" /> Today&apos;s treat allowance
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            {formatMoney(allowanceLeft, settings)}
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {" "}
              left
            </span>
          </p>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-amber-200/70 dark:bg-amber-900/40">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-amber-700/80 dark:text-amber-300/80">
            {formatMoney(spentToday, settings)} of {formatMoney(dayLimit(day, settings), settings)}
          </p>
        </div>

        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/60 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
            <Target className="h-3.5 w-3.5" /> Challenges done
          </p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            {done}/{total || "…"}
          </p>
          <p className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
            {earnedToday(day)} of {cap} pts today
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700/70 dark:bg-slate-900/60">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Today
          </p>
          <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
            {dayKeyLabel(dayKey)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Points and limit reset at midnight WIB
          </p>
        </div>
      </div>
    </section>
  );
}
