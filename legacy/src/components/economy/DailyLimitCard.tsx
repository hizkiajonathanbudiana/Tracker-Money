"use client";

import { Flame, Clock, Coins } from "lucide-react";
import { EconomyDay, EconomySettings } from "@/types/economy";
import {
  boostedMoney,
  dailyBaseLimit,
  dayEarnCap,
  dayLimit,
  earnedToday,
  rawMaterialShare,
  remainingEarnable,
  spentToday,
  treatSpent,
} from "@/lib/economy";
import { formatMoney, formatPoints } from "@/lib/money";
import { dayKeyLabel } from "@/lib/economyDay";

interface Props {
  settings: EconomySettings;
  day: EconomyDay | null;
  dayKey: string;
}

export default function DailyLimitCard({ settings, day, dayKey }: Props) {
  const limit = dayLimit(day, settings);
  const spent = spentToday(day);
  const left = Math.max(0, limit - spent);
  const pct = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
  const cap = dayEarnCap(day, settings);
  const earned = earnedToday(day);
  const earnPct = cap > 0 ? Math.min(100, Math.round((earned / cap) * 100)) : 0;

  const over = spent > limit;
  const fromTreats = treatSpent(day);
  const fromRaw = rawMaterialShare(day);

  return (
    <section className="card-glass">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Today&apos;s budget</h2>
        <span className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Clock className="h-3.5 w-3.5" />
          {dayKeyLabel(dayKey)}
        </span>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <div className="flex items-end justify-between">
            <div>
              <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                <Coins className="h-3.5 w-3.5" /> Treat allowance
              </p>
              <p className="mt-1 text-3xl font-black text-slate-900 dark:text-white">
                {formatMoney(left, settings)}
              </p>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {formatMoney(spent, settings)} / {formatMoney(limit, settings)}
            </p>
          </div>
          {boostedMoney(day) > 0 && (
            <p className="mt-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
              Base {formatMoney(day?.limit ?? dailyBaseLimit(settings, dayKey), settings)} +{" "}
              {formatMoney(boostedMoney(day), settings)} boost from points
            </p>
          )}
          {fromRaw > 0 && (
            <p className="mt-1 text-[11px] font-medium text-violet-600 dark:text-violet-400">
              {formatMoney(fromTreats, settings)} treats + {formatMoney(fromRaw, settings)} raw-material
              share (spread over the days you chose)
            </p>
          )}
          <div className="progress-track mt-2">
            <div
              className={`progress-fill ${
                over ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.max(pct, spent > 0 ? 4 : 0)}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {over
              ? "Limit reached — nothing left until tomorrow."
              : "Treats, redeemed points and today's slice of raw materials all count against this limit."}
          </p>
        </div>

        <div>
          <div className="flex items-end justify-between">
            <div>
              <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <Flame className="h-3.5 w-3.5" /> Points today
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {formatPoints(earned)}{" "}
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  / {cap} pts
                </span>
              </p>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {remainingEarnable(day, settings)} pts still earnable
            </p>
          </div>
          <div className="progress-track mt-2">
            <div
              className="progress-fill bg-emerald-500"
              style={{ width: `${Math.max(earnPct, earned > 0 ? 4 : 0)}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            The daily point cap equals {formatMoney(settings.moneyPerPoint * cap, settings)} of
            treat value, so points can&apos;t be turned into unlimited money.
          </p>
        </div>
      </div>
    </section>
  );
}
