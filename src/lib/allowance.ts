import { EconomySettings } from "@/types/economy";
import { RAW_MATERIAL_CATEGORY } from "@/lib/economy";
import { dayKeyPlus, dayOfMonth, daysInMonthKey, daysLeftInMonth, monthKeyOf } from "@/lib/economyDay";

/** Minimal expense shape needed to classify spending. */
export interface SpendRecord {
  amount: number;
  category: string;
  /** Local calendar day of the expense (`yyyy-MM-dd`). */
  dayKey: string;
}

export type SpendBucket = "regular" | "project" | "excluded";
export type AllowanceStatus = "unset" | "over" | "watch" | "on-track";

export interface MonthSpend {
  monthKey: string;
  days: number;
  /** Food & drink money (the regular allowance). */
  regular: number;
  /** Raw material / project money. */
  project: number;
  /** Money that is tracked but does not touch any allowance. */
  excluded: number;
  /** Every category, so the UI can show what was left out. */
  byCategory: Record<string, number>;
  /** Per day-of-month regular spending, index 0 = the 1st. */
  dailyRegular: number[];
  /** Per day-of-month project spending, index 0 = the 1st. */
  dailyProject: number[];
  /** Per day-of-month all other spending, index 0 = the 1st. */
  dailyOther: number[];
}

export interface AllowancePace {
  status: AllowanceStatus;
  monthKey: string;
  days: number;
  daysLeft: number;
  dayOfMonth: number;
  regularLimit: number;
  regularSpent: number;
  regularLeft: number;
  /** Money per remaining day if the leftover is spread evenly. */
  perDayLeft: number;
  /** Cumulative food allowance that should have been used by now. */
  expectedToDate: number;
  /** Where the month lands if the current pace holds. */
  projected: number;
  /** Money already spent on food today. */
  todaySpent: number;
  /** Percent of the monthly allowance used. */
  usedPercent: number;
  projectLimit: number;
  projectSpent: number;
  projectLeft: number;
}

function norm(value: string): string {
  return (value ?? "").trim().toLowerCase();
}

export function isRegularCategory(category: string, settings: EconomySettings): boolean {
  const target = norm(category);
  if (!target) return false;
  if (target === norm(RAW_MATERIAL_CATEGORY)) return false;
  return (settings.regularCategories ?? []).some((item) => norm(item) === target);
}

export function bucketOf(category: string, settings: EconomySettings): SpendBucket {
  const target = norm(category);
  if (target === norm(RAW_MATERIAL_CATEGORY)) return "project";
  return isRegularCategory(category, settings) ? "regular" : "excluded";
}

function newSeries(days: number): number[] {
  return new Array(days).fill(0);
}

function addTo(series: number[], index: number, amount: number) {
  if (index < 0 || index >= series.length) return;
  series[index] = Math.round((series[index] + amount) * 100) / 100;
}

/** Aggregates expenses into the month buckets used by the allowance cards. */
export function monthSpend(
  records: SpendRecord[],
  settings: EconomySettings,
  monthKey: string
): MonthSpend {
  const days = daysInMonthKey(monthKey);
  const result: MonthSpend = {
    monthKey,
    days,
    regular: 0,
    project: 0,
    excluded: 0,
    byCategory: {},
    dailyRegular: newSeries(days),
    dailyProject: newSeries(days),
    dailyOther: newSeries(days),
  };

  for (const record of records) {
    if (!record || monthKeyOf(record.dayKey) !== monthKey) continue;
    const amount = Number.isFinite(record.amount) ? record.amount : 0;
    if (amount === 0) continue;
    const index = dayOfMonth(record.dayKey) - 1;
    const bucket = bucketOf(record.category, settings);
    result.byCategory[record.category] = Math.round(((result.byCategory[record.category] ?? 0) + amount) * 100) / 100;
    if (bucket === "regular") {
      result.regular = Math.round((result.regular + amount) * 100) / 100;
      addTo(result.dailyRegular, index, amount);
    } else if (bucket === "project") {
      result.project = Math.round((result.project + amount) * 100) / 100;
      addTo(result.dailyProject, index, amount);
    } else {
      result.excluded = Math.round((result.excluded + amount) * 100) / 100;
      addTo(result.dailyOther, index, amount);
    }
  }

  return result;
}

export function allowancePace(
  spend: MonthSpend,
  settings: EconomySettings,
  today: string
): AllowancePace {
  const days = daysInMonthKey(today);
  const day = dayOfMonth(today);
  const daysLeft = daysLeftInMonth(today);
  const regularLimit = Math.max(0, settings.monthlyRegularAllowance ?? 0);
  const projectLimit = Math.max(0, settings.monthlyProjectAllowance ?? 0);
  const regularSpent = spend.regular;
  const regularLeft = Math.max(0, Math.round((regularLimit - regularSpent) * 100) / 100);
  const perDayLeft = Math.round((regularLeft / Math.max(1, daysLeft)) * 100) / 100;
  const expectedToDate = Math.round(((regularLimit * day) / days) * 100) / 100;
  const elapsedDays = Math.max(1, day);
  const projected = Math.round(((regularSpent / elapsedDays) * days) * 100) / 100;
  const todaySpent = spend.dailyRegular[day - 1] ?? 0;

  let status: AllowanceStatus = "on-track";
  if (regularLimit <= 0) {
    status = "unset";
  } else if (regularSpent > regularLimit) {
    status = "over";
  } else if (regularSpent > expectedToDate) {
    status = "watch";
  }

  return {
    status,
    monthKey: spend.monthKey,
    days,
    daysLeft,
    dayOfMonth: day,
    regularLimit,
    regularSpent,
    regularLeft,
    perDayLeft,
    expectedToDate,
    projected,
    todaySpent,
    usedPercent: regularLimit > 0 ? Math.min(999, Math.round((regularSpent / regularLimit) * 100)) : 0,
    projectLimit,
    projectSpent: spend.project,
    projectLeft: Math.max(0, Math.round((projectLimit - spend.project) * 100) / 100),
  };
}

/** Convenience wrapper: expenses → month buckets → pace. */
export function computeAllowance(
  records: SpendRecord[],
  settings: EconomySettings,
  today: string
): { spend: MonthSpend; pace: AllowancePace } {
  const spend = monthSpend(records, settings, monthKeyOf(today));
  return { spend, pace: allowancePace(spend, settings, today) };
}

/** Trailing average of `daily` ending at `endIndex` (inclusive). */
export function movingAverage(daily: number[], endIndex: number, window = 7): number {
  const start = Math.max(0, endIndex - window + 1);
  let sum = 0;
  let count = 0;
  for (let i = start; i <= endIndex && i < daily.length; i += 1) {
    sum += daily[i] ?? 0;
    count += 1;
  }
  return count > 0 ? Math.round((sum / count) * 100) / 100 : 0;
}

/**
 * Daily food & drink totals for the last `days` days ending today (oldest first).
 * Works across month boundaries, which the month buckets deliberately do not.
 */
export function recentDailySeries(
  records: SpendRecord[],
  settings: EconomySettings,
  today: string,
  days = 14
): Array<{ dayKey: string; regular: number; other: number }> {
  const keys: string[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    keys.push(dayKeyPlus(today, -offset));
  }
  const totals = new Map<string, { regular: number; other: number }>();
  keys.forEach((key) => totals.set(key, { regular: 0, other: 0 }));
  for (const record of records) {
    const bucket = totals.get(record.dayKey);
    if (!bucket) continue;
    const amount = Number.isFinite(record.amount) ? record.amount : 0;
    if (bucketOf(record.category, settings) === "regular") {
      bucket.regular = Math.round((bucket.regular + amount) * 100) / 100;
    } else if (bucketOf(record.category, settings) !== "project") {
      bucket.other = Math.round((bucket.other + amount) * 100) / 100;
    }
  }
  return keys.map((dayKey) => ({ dayKey, ...(totals.get(dayKey) as { regular: number; other: number }) }));
}

export const ALLOWANCE_STATUS_LABEL: Record<AllowanceStatus, string> = {
  unset: "No allowance set",
  over: "Over the monthly allowance",
  watch: "Ahead of pace",
  "on-track": "On track",
};
