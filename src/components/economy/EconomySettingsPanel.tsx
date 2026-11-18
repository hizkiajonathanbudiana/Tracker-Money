"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Save, Trash2 } from "lucide-react";
import { Challenge, CurrencyCode, EconomySettings, Reward } from "@/types/economy";
import { CURRENCY_PRESETS, formatMoney } from "@/lib/money";
import { dailyBaseLimit, DEFAULT_REGULAR_CATEGORIES, validateSettings } from "@/lib/economy";
import { daysInMonthKey, todayKey } from "@/lib/economyDay";
import { EXPENSE_CATEGORIES } from "@/types/expense";
import {
  addChallenge,
  addReward,
  removeChallenge,
  removeReward,
  saveEconomySettings,
} from "@/lib/economyOps";
import { useEconomyAction } from "@/hooks/useEconomy";

const TIME_ZONES = [
  "Asia/Jakarta",
  "Asia/Makassar",
  "Asia/Jayapura",
  "Asia/Singapore",
  "Asia/Taipei",
  "Asia/Tokyo",
  "Asia/Kolkata",
  "UTC",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
];

interface Props {
  userId: string;
  settings: EconomySettings;
  challenges: Challenge[];
  rewards: Reward[];
}

export default function EconomySettingsPanel({ userId, settings, challenges, rewards }: Props) {
  const [draft, setDraft] = useState<EconomySettings>(settings);
  const { busy, error, message, run } = useEconomyAction();

  const [chTitle, setChTitle] = useState("");
  const [chPoints, setChPoints] = useState("5");
  const [chEmoji, setChEmoji] = useState("✅");

  const [rwTitle, setRwTitle] = useState("");
  const [rwPoints, setRwPoints] = useState("10");
  const [rwEmoji, setRwEmoji] = useState("🎁");
  const [rwKind, setRwKind] = useState<"treat" | "cashout">("treat");

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const validationError = validateSettings(draft);

  const setField = <K extends keyof EconomySettings>(key: K, value: EconomySettings[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const categoryPool = Array.from(
    new Set([
      ...EXPENSE_CATEGORIES,
      ...DEFAULT_REGULAR_CATEGORIES,
      ...(draft.regularCategories ?? []),
    ])
  );

  const toggleCategory = (category: string) => {
    setDraft((prev) => {
      const has = prev.regularCategories.includes(category);
      return {
        ...prev,
        regularCategories: has
          ? prev.regularCategories.filter((item) => item !== category)
          : [...prev.regularCategories, category],
      };
    });
  };

  const handleCurrency = (code: CurrencyCode) => {
    const preset = CURRENCY_PRESETS[code];
    setDraft((prev) => ({
      ...prev,
      currencyCode: preset.code,
      currencySymbol: preset.currencySymbol,
      locale: preset.locale,
      decimals: preset.decimals,
    }));
  };

  return (
    <section className="card-glass">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Points &amp; allowance settings</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Allowances, point conversion, boosts and the day reset. A day already in progress keeps its
        limit so past records do not change under you.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          Currency
          <div className="relative">
            <select
              value={draft.currencyCode}
              onChange={(e) => handleCurrency(e.target.value as CurrencyCode)}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {Object.values(CURRENCY_PRESETS).map((preset) => (
                <option key={preset.code} value={preset.code}>
                  {preset.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
        </label>

        <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          Value of 1 point
          <input
            type="number"
            value={draft.moneyPerPoint}
            onChange={(e) => setField("moneyPerPoint", Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>

        <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          Food allowance / month
          <input
            type="number"
            min={0}
            step="1"
            value={draft.monthlyRegularAllowance}
            onChange={(e) => setField("monthlyRegularAllowance", Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <span className="block text-[0.65rem] font-normal text-slate-500 dark:text-slate-400">
            Food &amp; drink only — bills, rent and transport stay outside.
          </span>
        </label>

        <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          Project allowance / month
          <input
            type="number"
            min={0}
            step="1"
            value={draft.monthlyProjectAllowance}
            onChange={(e) => setField("monthlyProjectAllowance", Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <span className="block text-[0.65rem] font-normal text-slate-500 dark:text-slate-400">
            Raw materials for the projects you are building.
          </span>
        </label>

        <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          Fixed daily limit (optional)
          <input
            type="number"
            min={0}
            step="1"
            value={draft.dailyLimit}
            onChange={(e) => setField("dailyLimit", Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <span className="block text-[0.65rem] font-normal text-slate-500 dark:text-slate-400">
            0 = split the monthly allowance evenly ({formatMoney(dailyBaseLimit(draft, todayKey(draft.timeZone)), draft)}/day this month).
          </span>
        </label>

        <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          Day resets at midnight in
          <div className="relative">
            <select
              value={draft.timeZone}
              onChange={(e) => setField("timeZone", e.target.value)}
              className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              {[draft.timeZone, ...TIME_ZONES.filter((zone) => zone !== draft.timeZone)].map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </div>
          <span className="block text-[0.65rem] font-normal text-slate-500 dark:text-slate-400">
            Challenges and the daily limit roll over at 00:00 here.
          </span>
        </label>

        <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          Point cap / day
          <input
            type="number"
            value={draft.dailyEarnCap}
            onChange={(e) => setField("dailyEarnCap", Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>

        <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          Project completion bonus (points)
          <input
            type="number"
            value={draft.projectBonusPoints}
            onChange={(e) => setField("projectBonusPoints", Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>

        <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          Cash-out multiple (points)
          <input
            type="number"
            value={draft.cashoutStep}
            onChange={(e) => setField("cashoutStep", Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>

        <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          Limit boost: points per step
          <input
            type="number"
            min={1}
            value={draft.boostStepPoints}
            onChange={(e) => setField("boostStepPoints", Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>

        <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          Raw-material spread (days)
          <input
            type="number"
            min={1}
            value={draft.defaultSpreadDays}
            onChange={(e) => setField("defaultSpreadDays", Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>

        <label className="space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
          Limit boost cap / day (points)
          <input
            type="number"
            min={0}
            value={draft.maxBoostPointsPerDay}
            onChange={(e) => setField("maxBoostPointsPerDay", Number(e.target.value))}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </label>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200/70 p-3 dark:border-white/10">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
          Categories that count as food &amp; drink
        </p>
        <p className="mt-0.5 text-[0.65rem] text-slate-500 dark:text-slate-400">
          Everything not ticked is still tracked, but it never spends the food allowance.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {categoryPool.map((category) => {
            const active = draft.regularCategories.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                aria-pressed={active}
                className={
                  active
                    ? "chip chip-success cursor-pointer"
                    : "chip cursor-pointer text-slate-500 dark:text-slate-400"
                }
              >
                {category}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[0.65rem] text-slate-500 dark:text-slate-400">
          {formatMoney(draft.monthlyRegularAllowance, draft)} / month ·{" "}
          {formatMoney(dailyBaseLimit(draft, todayKey(draft.timeZone)), draft)} per day · resets 00:00{" "}
          {draft.timeZone}
        </p>
      </div>

      <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          checked={draft.limitBoostEnabled}
          onChange={(e) => setField("limitBoostEnabled", e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600"
        />
        Let points raise today&apos;s limit (one step = {draft.boostStepPoints} pts ={" "}
        {formatMoney(draft.moneyPerPoint * draft.boostStepPoints, draft)} extra, max{" "}
        {formatMoney(draft.moneyPerPoint * draft.maxBoostPointsPerDay, draft)} extra per day)
      </label>

      <label className="mt-2 flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
        <input
          type="checkbox"
          checked={draft.spreadRawMaterials}
          onChange={(e) => setField("spreadRawMaterials", e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-blue-600"
        />
        Count raw-material purchases inside the daily limit (split over {draft.defaultSpreadDays}{" "}
        days by default)
      </label>

      <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 dark:bg-white/5 dark:text-slate-300">
        10 pts = {formatMoney(draft.moneyPerPoint * 10, draft)} · food{" "}
        {formatMoney(dailyBaseLimit(draft, todayKey(draft.timeZone)), draft)}/day · project{" "}
        {formatMoney(
          draft.monthlyProjectAllowance / Math.max(1, daysInMonthKey(todayKey(draft.timeZone))),
          draft
        )}
        /day · daily point cap {formatMoney(draft.moneyPerPoint * draft.dailyEarnCap, draft)}
      </p>

      {validationError && (
        <p className="mt-2 text-xs font-medium text-red-500">{validationError}</p>
      )}

      <button
        type="button"
        disabled={busy !== null || Boolean(validationError)}
        onClick={() =>
          run("Save settings", async () => {
            await saveEconomySettings(userId, draft);
          })
        }
        className="glass-button-primary mt-3 flex items-center gap-2 px-4 py-2 text-xs font-bold disabled:opacity-50"
      >
        <Save className="h-3.5 w-3.5" /> Save settings
      </button>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Challenges</h3>
          <div className="mt-2 space-y-1">
            {challenges.map((challenge) => (
              <div
                key={challenge.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/70 px-2 py-1.5 text-xs dark:border-slate-700/70"
              >
                <span className="truncate text-slate-700 dark:text-slate-200">
                  {challenge.emoji} {challenge.title}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-bold text-slate-500 dark:text-slate-400">
                    {challenge.points} pts
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      run("Delete challenge", async () => {
                        await removeChallenge(userId, challenge.id);
                      })
                    }
                    className="text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
            ))}
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await run("Add challenge", async () => {
                await addChallenge(userId, {
                  title: chTitle,
                  points: Number(chPoints) || 1,
                  emoji: chEmoji,
                });
              });
              if (ok) setChTitle("");
            }}
            className="mt-2 flex flex-wrap items-center gap-1.5"
          >
            <input
              value={chEmoji}
              onChange={(e) => setChEmoji(e.target.value)}
              className="w-10 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-xs dark:border-slate-700 dark:bg-slate-900"
            />
            <input
              value={chTitle}
              onChange={(e) => setChTitle(e.target.value)}
              placeholder="New challenge"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
            />
            <input
              type="number"
              value={chPoints}
              onChange={(e) => setChPoints(e.target.value)}
              className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
            />
            <button
              type="submit"
              className="rounded-lg border border-blue-500 px-2 py-1.5 text-[10px] font-bold text-blue-600 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-500/10"
            >
              + Add
            </button>
          </form>
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Rewards</h3>
          <div className="mt-2 space-y-1">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/70 px-2 py-1.5 text-xs dark:border-slate-700/70"
              >
                <span className="truncate text-slate-700 dark:text-slate-200">
                  {reward.emoji} {reward.title}
                  <span className="ml-1 text-[10px] uppercase text-slate-400">{reward.kind}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="font-bold text-slate-500 dark:text-slate-400">
                    {reward.costPoints} pts
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      run("Delete reward", async () => {
                        await removeReward(userId, reward.id);
                      })
                    }
                    className="text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>
            ))}
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const ok = await run("Add reward", async () => {
                await addReward(userId, {
                  title: rwTitle,
                  emoji: rwEmoji,
                  kind: rwKind,
                  costPoints: Number(rwPoints) || 1,
                });
              });
              if (ok) setRwTitle("");
            }}
            className="mt-2 flex flex-wrap items-center gap-1.5"
          >
            <input
              value={rwEmoji}
              onChange={(e) => setRwEmoji(e.target.value)}
              className="w-10 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-center text-xs dark:border-slate-700 dark:bg-slate-900"
            />
            <input
              value={rwTitle}
              onChange={(e) => setRwTitle(e.target.value)}
              placeholder="New reward"
              className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
            />
            <select
              value={rwKind}
              onChange={(e) => setRwKind(e.target.value as "treat" | "cashout")}
              className="rounded-lg border border-slate-200 bg-white px-1.5 py-1.5 text-[10px] dark:border-slate-700 dark:bg-slate-900"
            >
              <option value="treat">treat</option>
              <option value="cashout">cashout</option>
            </select>
            <input
              type="number"
              value={rwPoints}
              onChange={(e) => setRwPoints(e.target.value)}
              className="w-14 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
            />
            <button
              type="submit"
              className="rounded-lg border border-pink-500 px-2 py-1.5 text-[10px] font-bold text-pink-600 hover:bg-pink-50 dark:text-pink-300 dark:hover:bg-pink-500/10"
            >
              + Add
            </button>
          </form>
        </div>
      </div>

      {error && <p className="mt-3 text-sm font-medium text-red-500">{error}</p>}
      {message && <p className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">{message}</p>}
    </section>
  );
}
