"use client";

import { useMemo } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { EconomySettings } from "@/types/economy";
import { AllowancePace, MonthSpend, movingAverage, recentDailySeries, SpendRecord } from "@/lib/allowance";
import { formatMoney, formatMoneyShort, formatPercent } from "@/lib/money";
import { dayKeyShortLabel } from "@/lib/economyDay";

interface SpendTrendCardProps {
  records: SpendRecord[];
  settings: EconomySettings;
  today: string;
  pace: AllowancePace;
  spend: MonthSpend;
  days?: number;
}

/**
 * Food & drink trend: 14 daily bars, the daily allowance as a dashed line and
 * a 7-day average so the direction is visible without reading every bar.
 */
export default function SpendTrendCard({
  records,
  settings,
  today,
  pace,
  spend,
  days = 14,
}: SpendTrendCardProps) {
  const series = useMemo(() => recentDailySeries(records, settings, today, days), [records, settings, today, days]);
  const regular = series.map((point) => point.regular);
  const avg = movingAverage(regular, regular.length - 1, 7);
  const dailyAllowance = pace.days > 0 ? pace.regularLimit / pace.days : 0;
  const total = regular.reduce((sum, value) => sum + value, 0);
  const peak = Math.max(...regular, dailyAllowance, 1);
  const scale = peak * 1.15;
  const overDays = regular.filter((value) => dailyAllowance > 0 && value > dailyAllowance).length;
  const trendUp = avg > dailyAllowance && dailyAllowance > 0;
  const money = (value: number) => formatMoney(value, settings);

  return (
    <section className="card-glass animate-in">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            Spending trend
          </p>
          <p className="mt-0.5 text-sm font-medium text-slate-700 dark:text-slate-300">
            Last {days} days · food &amp; drink
          </p>
        </div>
        <span className={trendUp ? "chip chip-warn" : "chip chip-success"}>
          {trendUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {money(avg)} avg / day
        </span>
      </div>

      <div className="relative mt-4">
        {/* allowance line + average line are positioned with the same scale as the bars */}
        {dailyAllowance > 0 && (
          <div
            className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-emerald-500/70"
            style={{ bottom: `${(dailyAllowance / scale) * 100}%` }}
          >
            <span className="absolute -top-4 right-0 rounded bg-emerald-500/10 px-1 text-[0.6rem] font-semibold text-emerald-600 dark:text-emerald-300">
              {formatMoneyShort(dailyAllowance, settings)}/day
            </span>
          </div>
        )}
        {avg > 0 && (
          <div
            className="pointer-events-none absolute inset-x-0 z-10 border-t border-dashed border-indigo-500/60"
            style={{ bottom: `${(avg / scale) * 100}%` }}
          />
        )}

        <div className="flex h-32 items-end gap-1 sm:gap-1.5">
          {series.map((point, index) => {
            const height = scale > 0 ? Math.max(2, (point.regular / scale) * 100) : 2;
            const isToday = point.dayKey === today;
            const over = dailyAllowance > 0 && point.regular > dailyAllowance;
            return (
              <div
                key={point.dayKey}
                className="group relative flex h-full flex-1 items-end"
                title={`${dayKeyShortLabel(point.dayKey)} · ${money(point.regular)}${
                  point.other > 0 ? ` · ${money(point.other)} other` : ""
                }`}
              >
                <div
                  className={[
                    "w-full rounded-t-[0.25rem] transition-all",
                    isToday
                      ? "bg-indigo-500 dark:bg-indigo-400"
                      : over
                        ? "bg-rose-400/80 dark:bg-rose-400/70"
                        : "bg-slate-300 dark:bg-slate-600",
                    "group-hover:opacity-100 group-hover:ring-1 group-hover:ring-indigo-400",
                  ].join(" ")}
                  style={{ height: `${height}%` }}
                />
                <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 text-[0.6rem] font-semibold text-white group-hover:block dark:bg-white dark:text-slate-900">
                  {index === series.length - 1 ? "today " : ""}
                  {formatMoneyShort(point.regular, settings)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-1 flex justify-between text-[0.6rem] font-medium text-slate-400 dark:text-slate-500">
          <span>{dayKeyShortLabel(series[0]?.dayKey ?? today)}</span>
          <span>{dayKeyShortLabel(series[Math.floor(series.length / 2)]?.dayKey ?? today)}</span>
          <span>today</span>
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-200/70 pt-3 text-xs dark:border-white/10 sm:grid-cols-4">
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Spent</dt>
          <dd className="font-semibold text-slate-900 dark:text-white">{money(total)}</dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Month to date</dt>
          <dd className="font-semibold text-slate-900 dark:text-white">{money(spend.regular)}</dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Used</dt>
          <dd className="font-semibold text-slate-900 dark:text-white">{formatPercent(pace.usedPercent)}</dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Days over</dt>
          <dd
            className={
              overDays > 0
                ? "font-semibold text-rose-600 dark:text-rose-400"
                : "font-semibold text-emerald-600 dark:text-emerald-400"
            }
          >
            {overDays} / {days}
          </dd>
        </div>
      </dl>
    </section>
  );
}
