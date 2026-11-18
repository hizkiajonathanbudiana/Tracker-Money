"use client";

import Link from "next/link";
import { ArrowUpRight, Settings2, Wallet } from "lucide-react";
import { AllowancePace, ALLOWANCE_STATUS_LABEL, MonthSpend } from "@/lib/allowance";
import { EconomySettings } from "@/types/economy";
import { formatMoney, formatPercent } from "@/lib/money";
import { monthKeyLabel } from "@/lib/economyDay";

interface MonthlyAllowanceCardProps {
  settings: EconomySettings;
  pace: AllowancePace;
  spend: MonthSpend;
  /** Categories tracked but kept out of the food allowance (rent, bills, transport...). */
  excludedCategories: string[];
}

const STATUS_CLASS: Record<AllowancePace["status"], string> = {
  unset: "chip",
  over: "chip chip-danger",
  watch: "chip chip-warn",
  "on-track": "chip chip-success",
};

export default function MonthlyAllowanceCard({
  settings,
  pace,
  spend,
  excludedCategories,
}: MonthlyAllowanceCardProps) {
  const money = (value: number) => formatMoney(value, settings);
  const expectedPercent =
    pace.regularLimit > 0
      ? Math.min(100, Math.round((pace.expectedToDate / pace.regularLimit) * 100))
      : 0;
  const projectPercent =
    pace.projectLimit > 0 ? Math.min(100, Math.round((pace.projectSpent / pace.projectLimit) * 100)) : 0;
  const barColor =
    pace.status === "over"
      ? "bg-rose-500"
      : pace.status === "watch"
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <section className="card-hero animate-in">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Monthly allowance
          </p>
          <p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            {monthKeyLabel(pace.monthKey)} · food &amp; drink only
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={STATUS_CLASS[pace.status]}>{ALLOWANCE_STATUS_LABEL[pace.status]}</span>
          <Link
            href="/app/points"
            className="glass-button inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Settings
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-bold leading-none tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {money(pace.regularLeft)}
            </p>
            <span className="pb-1 text-sm text-slate-600 dark:text-slate-400">
              left of {money(pace.regularLimit)}
            </span>
          </div>

          <div className="relative mt-3">
            <div className="progress-track">
              <div
                className={`progress-fill ${barColor}`}
                style={{ width: `${Math.min(100, pace.usedPercent)}%` }}
              />
            </div>
            {pace.regularLimit > 0 && (
              <span
                className="absolute -top-1 h-3 w-px bg-slate-900/40 dark:bg-white/40"
                style={{ left: `${expectedPercent}%` }}
                title={`Pace marker: ${money(pace.expectedToDate)} by today`}
              />
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {formatPercent(pace.usedPercent)} used
            </span>
            <span>
              {money(pace.perDayLeft)}/day for {pace.daysLeft} day{pace.daysLeft === 1 ? "" : "s"} left
            </span>
            <span>·</span>
            <span>
              today {money(pace.todaySpent)} / {money(pace.regularLimit / pace.days)}
            </span>
          </div>

          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {pace.status === "over"
              ? `You are ${money(pace.regularSpent - pace.regularLimit)} over. Treats now come from points only.`
              : pace.status === "watch"
                ? `Slightly ahead of pace — keep the next days around ${money(pace.perDayLeft)} to land on target.`
                : `At this pace you finish the month around ${money(pace.projected)}.`}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/70 bg-white/60 p-3 dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between gap-2">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <Wallet className="h-3.5 w-3.5" />
              Projects
            </p>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {formatPercent(projectPercent)}
            </span>
          </div>
          <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
            {money(pace.projectLeft)}
            <span className="ml-1 text-xs font-medium text-slate-500 dark:text-slate-400">
              left of {money(pace.projectLimit)}
            </span>
          </p>
          <div className="progress-track mt-2">
            <div
              className="progress-fill bg-indigo-500"
              style={{ width: `${projectPercent}%` }}
            />
          </div>
          <p className="mt-2 text-[0.7rem] leading-relaxed text-slate-500 dark:text-slate-400">
            Raw materials {money(spend.project)} this month · day {pace.dayOfMonth} of {pace.days}
          </p>
          <Link
            href="/app/points"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-300"
          >
            Manage projects
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-slate-200/70 pt-3 dark:border-white/10">
        <span className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Counted
        </span>
        {(settings.regularCategories ?? []).slice(0, 4).map((category) => (
          <span key={category} className="chip chip-success">
            {category}
          </span>
        ))}
        <span className="ml-1 text-[0.7rem] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Not counted
        </span>
        {excludedCategories.slice(0, 4).map((category) => (
          <span key={category} className="chip">
            {category}
          </span>
        ))}
        {excludedCategories.length === 0 && (
          <span className="chip">Rent · Bills · Transport</span>
        )}
      </div>
    </section>
  );
}
