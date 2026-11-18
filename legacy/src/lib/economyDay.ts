export const DEFAULT_TIME_ZONE = "Asia/Jakarta";

const dayFormatterCache = new Map<string, Intl.DateTimeFormat>();

function dayFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = dayFormatterCache.get(timeZone);
  if (cached) return cached;
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  dayFormatterCache.set(timeZone, formatter);
  return formatter;
}

/**
 * Returns the local calendar day (`yyyy-MM-dd`) of `date` in `timeZone`.
 * Never use `toISOString().slice(0,10)` for this: that keys by UTC and puts
 * everything before 07:00 WIB into the previous day.
 */
export function dayKeyFor(date: Date = new Date(), timeZone: string = DEFAULT_TIME_ZONE): string {
  const parts = dayFormatter(timeZone).formatToParts(date);
  const year = parts.find((p) => p.type === "year")?.value ?? "1970";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

export function todayKey(timeZone: string = DEFAULT_TIME_ZONE): string {
  return dayKeyFor(new Date(), timeZone);
}

/** Milliseconds until local midnight in `timeZone` (used to refresh the day view). */
export function msUntilNextDay(
  now: Date = new Date(),
  timeZone: string = DEFAULT_TIME_ZONE
): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const second = Number(parts.find((p) => p.type === "second")?.value ?? "0");
  const elapsed = ((hour * 60 + minute) * 60 + second) * 1000 + now.getMilliseconds();
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.max(1000, dayMs - elapsed);
}

/** `2026-11-17` -> `Mon, 17 Nov 2026` */
/** Shifts a yyyy-MM-dd key by whole days (calendar math, no timezone drift). */
export function dayKeyPlus(dayKey: string, days: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const ms = Date.UTC(y, m - 1, d) + days * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

/** `2026-11-17` -> `2026-11` */
export function monthKeyOf(dayKey: string): string {
  return dayKey.slice(0, 7);
}

/** Number of days in the month of a `yyyy-MM` or `yyyy-MM-dd` key. */
export function daysInMonthKey(monthKey: string): number {
  const [year, month] = monthKey.slice(0, 7).split("-").map(Number);
  if (!year || !month) return 30;
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Days from `todayKey` to the last day of its month, inclusive (never below 1). */
export function daysLeftInMonth(todayKey: string): number {
  const last = daysInMonthKey(todayKey);
  const day = Number(todayKey.slice(8, 10));
  if (!day) return last;
  return Math.max(1, last - day + 1);
}

/** 1-based day-of-month of a `yyyy-MM-dd` key. */
export function dayOfMonth(dayKey: string): number {
  return Number(dayKey.slice(8, 10)) || 1;
}

/** `2026-11` -> `November 2026` */
export function monthKeyLabel(monthKey: string): string {
  const [year, month] = monthKey.slice(0, 7).split("-").map(Number);
  if (!year || !month) return monthKey;
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

/** `2026-11-17` -> `17 Nov` */
export function dayKeyShortLabel(dayKey: string): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  if (!year || !month || !day) return dayKey;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/** All day keys of a month, in order. */
export function monthDayKeys(monthKey: string): string[] {
  const days = daysInMonthKey(monthKey);
  return Array.from({ length: days }, (_, index) => `${monthKey}-${String(index + 1).padStart(2, "0")}`);
}

export function dayKeyLabel(dayKey: string): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  if (!year || !month || !day) return dayKey;
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
