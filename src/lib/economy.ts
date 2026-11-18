import {
  Challenge,
  EconomyDay,
  EconomySettings,
  Reward,
} from "@/types/economy";
import { CURRENCY_PRESETS } from "@/lib/money";
import { daysInMonthKey, todayKey } from "@/lib/economyDay";

/** Bumped when `EconomySettings` gains fields that need a client-side migration. */
export const SETTINGS_SCHEMA_VERSION = 2;

/**
 * Categories that count as regular food & drink spending. Everything else
 * (rent, bills, transport, shopping) is tracked but never charged to the food
 * allowance, so a rent payment cannot eat your lunch budget.
 */
export const DEFAULT_REGULAR_CATEGORIES = [
  "Food & Beverage",
  "Groceries",
  "Coffee",
  "Drinks",
  "Treats",
  "Snacks",
];

export const DEFAULT_ECONOMY_SETTINGS: EconomySettings = {
  enabled: true,
  currencyCode: "USD",
  currencySymbol: CURRENCY_PRESETS.USD.currencySymbol,
  locale: CURRENCY_PRESETS.USD.locale,
  decimals: CURRENCY_PRESETS.USD.decimals,
  moneyPerPoint: 1,
  dailyLimit: 0,
  monthlyRegularAllowance: 6000,
  monthlyProjectAllowance: 2000,
  regularCategories: [...DEFAULT_REGULAR_CATEGORIES],
  dailyEarnCap: 50,
  projectBonusPoints: 15,
  cashoutStep: 10,
  limitBoostEnabled: true,
  boostStepPoints: 10,
  maxBoostPointsPerDay: 30,
  spreadRawMaterials: true,
  defaultSpreadDays: 7,
  timeZone: "Asia/Jakarta",
  schemaVersion: SETTINGS_SCHEMA_VERSION,
};

/** Money used for raw-material purchases; its spend is spread into the daily limit. */
export const RAW_MATERIAL_CATEGORY = "Raw Materials";
export const JAJAN_CATEGORY = "Treats";

const CHALLENGE_SEEDS: Array<Omit<Challenge, "id">> = [
  { title: "Wake up before 6:30 AM", points: 10, emoji: "🌅", active: true, sortOrder: 1 },
  { title: "Exercise / walk for 20 minutes", points: 10, emoji: "🏃", active: true, sortOrder: 2 },
  { title: "Read a devotional / the Bible", points: 10, emoji: "📖", active: true, sortOrder: 3 },
  { title: "Drink 2 litres of water", points: 5, emoji: "💧", active: true, sortOrder: 4 },
  { title: "No impulse treats today", points: 10, emoji: "🚫", active: true, sortOrder: 5 },
  { title: "Tidy up your desk / room", points: 5, emoji: "🧹", active: true, sortOrder: 6 },
];

const REWARD_SEEDS: Array<Omit<Reward, "id">> = [
  { title: "Street snack", emoji: "🍢", kind: "treat", costPoints: 6, active: true, sortOrder: 1 },
  { title: "Iced coffee / boba", emoji: "🧋", kind: "treat", costPoints: 12, active: true, sortOrder: 2 },
  { title: "Watch a movie", emoji: "🎬", kind: "treat", costPoints: 30, active: true, sortOrder: 3 },
  { title: "Game top-up / online treat", emoji: "🎮", kind: "treat", costPoints: 50, active: true, sortOrder: 4 },
  { title: "Cash out points to wallet", emoji: "💸", kind: "cashout", costPoints: 10, active: true, sortOrder: 5 },
];

export const DEFAULT_CHALLENGES = CHALLENGE_SEEDS;
export const DEFAULT_REWARDS = REWARD_SEEDS;

export function pointsToMoney(points: number, settings: EconomySettings): number {
  const rate = settings.moneyPerPoint > 0 ? settings.moneyPerPoint : 0;
  return Math.round(points * rate * 100) / 100;
}

export function moneyToPoints(money: number, settings: EconomySettings): number {
  const rate = settings.moneyPerPoint > 0 ? settings.moneyPerPoint : 0;
  if (rate <= 0) return 0;
  return Math.ceil(money / rate);
}

/**
 * Base money a single day may spend on treats.
 * - `dailyLimit > 0`  → that fixed cap wins.
 * - `dailyLimit === 0` → the monthly food allowance is divided across the
 *   month's days, so $6000/month becomes $200/day in November.
 */
export function dailyBaseLimit(
  settings: EconomySettings,
  dayKey: string = todayKey(settings.timeZone)
): number {
  const fixed = Math.max(0, settings.dailyLimit ?? 0);
  if (fixed > 0) return fixed;
  const monthly = Math.max(0, settings.monthlyRegularAllowance ?? 0);
  if (monthly <= 0) return 0;
  const days = daysInMonthKey(dayKey);
  return Math.round((monthly / days) * 100) / 100;
}

export function dayLimit(
  day: EconomyDay | null,
  settings: EconomySettings,
  dayKey?: string
): number {
  return (day?.limit ?? dailyBaseLimit(settings, dayKey)) + boostedMoney(day);
}

/** Extra allowance bought with points today (on top of the base limit). */
export function boostedMoney(day: EconomyDay | null): number {
  return Math.max(0, day?.boostedMoney ?? 0);
}

/** Points already converted into extra allowance today. */
export function boostedPoints(day: EconomyDay | null): number {
  return Math.max(0, day?.boostedPoints ?? 0);
}

/** Money added by a single boost step. */
export function boostStepMoney(settings: EconomySettings): number {
  return pointsToMoney(Math.max(1, Math.trunc(settings.boostStepPoints)), settings);
}

/** How many more points may still be converted into extra limit today. */
export function remainingBoostPoints(day: EconomyDay | null, settings: EconomySettings): number {
  const cap = Math.max(0, Math.trunc(settings.maxBoostPointsPerDay));
  return Math.max(0, cap - boostedPoints(day));
}

export function dayEarnCap(day: EconomyDay | null, settings: EconomySettings): number {
  return day?.earnCap ?? settings.dailyEarnCap;
}

export function spentToday(day: EconomyDay | null): number {
  return day?.spentMoney ?? 0;
}

export function remainingAllowance(day: EconomyDay | null, settings: EconomySettings): number {
  const remaining = dayLimit(day, settings) - spentToday(day);
  return remaining > 0 ? Math.round(remaining * 100) / 100 : 0;
}

export function earnedToday(day: EconomyDay | null): number {
  return day?.earnedPoints ?? 0;
}

export function remainingEarnable(day: EconomyDay | null, settings: EconomySettings): number {
  const remaining = dayEarnCap(day, settings) - earnedToday(day);
  return remaining > 0 ? remaining : 0;
}

/** How many points a challenge may still award today, respecting the daily earn cap. */
export function awardablePoints(
  requested: number,
  day: EconomyDay | null,
  settings: EconomySettings
): number {
  const room = remainingEarnable(day, settings);
  return Math.max(0, Math.min(Math.trunc(requested), room));
}

export function limitProgress(day: EconomyDay | null, settings: EconomySettings): number {
  const limit = dayLimit(day, settings);
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((spentToday(day) / limit) * 100));
}

export function earnProgress(day: EconomyDay | null, settings: EconomySettings): number {
  const cap = dayEarnCap(day, settings);
  if (cap <= 0) return 0;
  return Math.min(100, Math.round((earnedToday(day) / cap) * 100));
}

/**
 * Splits `total` into `days` whole-currency shares. The first share absorbs the
 * rounding remainder so the sum always matches `total` exactly.
 */
export function splitAcrossDays(total: number, days: number): number[] {
  const count = Math.max(1, Math.trunc(days));
  const amount = Math.round(total * 100) / 100;
  if (count === 1) return [amount];
  const base = Math.round((amount / count) * 100) / 100;
  const shares = new Array(count).fill(base);
  const diff = Math.round((amount - base * count) * 100) / 100;
  shares[0] = Math.round((base + diff) * 100) / 100;
  return shares;
}

/** Money from raw materials already charged to a day. */
export function rawMaterialShare(day: EconomyDay | null): number {
  return Math.max(0, day?.rawMaterialSpent ?? 0);
}

/** Money from treats (allowance spending that is not a raw material). */
export function treatSpent(day: EconomyDay | null): number {
  return Math.max(0, spentToday(day) - rawMaterialShare(day));
}

export function validateSettings(settings: EconomySettings): string | null {
  if (settings.moneyPerPoint <= 0) return "Conversion must be greater than 0.";
  if (settings.dailyLimit < 0) return "Daily cap cannot be negative.";
  if (settings.monthlyRegularAllowance < 0) return "Food & drink allowance cannot be negative.";
  if (settings.monthlyProjectAllowance < 0) return "Project allowance cannot be negative.";
  if (settings.dailyLimit === 0 && settings.monthlyRegularAllowance === 0) {
    return "Set either a monthly food & drink allowance or a daily cap.";
  }
  if (settings.dailyEarnCap < 0) return "Daily earn cap cannot be negative.";
  if (settings.cashoutStep < 1) return "Cash-out step must be at least 1 point.";
  if (settings.boostStepPoints < 1) return "Boost step must be at least 1 point.";
  if (settings.maxBoostPointsPerDay < 0) return "Daily boost cap cannot be negative.";
  if (settings.defaultSpreadDays < 1) return "Spread days must be at least 1.";
  return null;
}

/**
 * Brings an older settings document up to `SETTINGS_SCHEMA_VERSION`.
 * Returns the patch to write, or `null` when the document is already current.
 * Amounts are re-based to the USD defaults on purpose: keeping Rp25.000 as a
 * "$25,000" limit would be nonsense, so the numbers are reset and the user
 * re-enters their allowance once in Settings.
 */
export function migrateSettings(settings: Partial<EconomySettings> | null): Partial<EconomySettings> | null {
  if (!settings) return null;
  const version = typeof settings.schemaVersion === "number" ? settings.schemaVersion : 1;
  if (version >= SETTINGS_SCHEMA_VERSION) return null;
  const preset = CURRENCY_PRESETS.USD;
  return {
    schemaVersion: SETTINGS_SCHEMA_VERSION,
    currencyCode: preset.code,
    currencySymbol: preset.currencySymbol,
    locale: preset.locale,
    decimals: preset.decimals,
    moneyPerPoint: DEFAULT_ECONOMY_SETTINGS.moneyPerPoint,
    dailyLimit: DEFAULT_ECONOMY_SETTINGS.dailyLimit,
    monthlyRegularAllowance: DEFAULT_ECONOMY_SETTINGS.monthlyRegularAllowance,
    monthlyProjectAllowance: DEFAULT_ECONOMY_SETTINGS.monthlyProjectAllowance,
    regularCategories: [...DEFAULT_REGULAR_CATEGORIES],
    dailyEarnCap: DEFAULT_ECONOMY_SETTINGS.dailyEarnCap,
    projectBonusPoints: DEFAULT_ECONOMY_SETTINGS.projectBonusPoints,
    cashoutStep: DEFAULT_ECONOMY_SETTINGS.cashoutStep,
    boostStepPoints: DEFAULT_ECONOMY_SETTINGS.boostStepPoints,
    maxBoostPointsPerDay: DEFAULT_ECONOMY_SETTINGS.maxBoostPointsPerDay,
  };
}

export function economyDocPath(userId: string): [string, string, string] {
  return ["users", userId, "settings"];
}
