"use client";

import { useState } from "react";
import { ArrowUpCircle, Gift, Loader2, Wallet } from "lucide-react";
import { EconomyDay, EconomySettings, PointsSummary, Reward } from "@/types/economy";
import {
  boostedMoney,
  boostStepMoney,
  dayLimit,
  pointsToMoney,
  remainingAllowance,
  remainingBoostPoints,
} from "@/lib/economy";
import { formatMoney, formatPoints } from "@/lib/money";
import { boostDailyLimit, cashoutPoints, redeemTreat } from "@/lib/economyOps";
import { useEconomyAction } from "@/hooks/useEconomy";

interface Props {
  userId: string;
  settings: EconomySettings;
  points: PointsSummary;
  day: EconomyDay | null;
  dayKey: string;
  rewards: Reward[];
}

export default function RewardsPanel({ userId, settings, points, day, dayKey, rewards }: Props) {
  const { busy, error, message, run } = useEconomyAction();
  const [cashoutAmount, setCashoutAmount] = useState(String(settings.cashoutStep));
  const [boostSteps, setBoostSteps] = useState("1");
  const allowance = remainingAllowance(day, settings);

  const stepPoints = Math.max(1, Math.trunc(settings.boostStepPoints));
  const stepMoney = boostStepMoney(settings);
  const stepsRequested = Math.max(1, Math.trunc(Number(boostSteps) || 1));
  const boostCost = stepPoints * stepsRequested;
  const boostMoney = pointsToMoney(boostCost, settings);
  const boostRoom = remainingBoostPoints(day, settings);
  const currentLimit = dayLimit(day, settings);
  const boostValid =
    settings.limitBoostEnabled &&
    boostCost <= points.balance &&
    boostCost <= boostRoom &&
    busy === null;

  const treats = rewards.filter((reward) => reward.kind === "treat");
  const cashoutReward = rewards.find((reward) => reward.kind === "cashout");

  const cashoutPointsValue = Math.max(0, Math.trunc(Number(cashoutAmount) || 0));
  const cashoutMoney = pointsToMoney(cashoutPointsValue, settings);
  const cashoutValid =
    cashoutPointsValue > 0 &&
    cashoutPointsValue % Math.max(1, settings.cashoutStep) === 0 &&
    cashoutPointsValue <= points.balance;

  return (
    <section className="card-glass">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
          <Gift className="h-5 w-5 text-pink-500" /> Redeem points
        </h2>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          balance {formatPoints(points.balance)}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Turn points into a treat today, or cash them out to your wallet. Treat allowance left:{" "}
        <span className="font-semibold">{formatMoney(allowance, settings)}</span>
      </p>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {treats.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400 sm:col-span-2">
            No rewards yet. Add some under Settings → Rewards.
          </p>
        )}
        {treats.map((reward) => {
          const money = pointsToMoney(reward.costPoints, settings);
          const notEnoughPoints = points.balance < reward.costPoints;
          const overLimit = money > allowance;
          const disabled = notEnoughPoints || overLimit || busy !== null;

          return (
            <button
              key={reward.id}
              type="button"
              disabled={disabled}
              onClick={() =>
                run(reward.title, async () => {
                  await redeemTreat({ userId, settings, dayKey, reward });
                })
              }
              className={`flex flex-col items-start rounded-xl border p-3 text-left transition-all ${
                disabled
                  ? "cursor-not-allowed border-slate-200 opacity-60 dark:border-slate-800"
                  : "border-pink-200/70 bg-pink-50/50 hover:scale-[1.01] hover:border-pink-400 dark:border-pink-500/20 dark:bg-pink-500/10"
              }`}
            >
              <span className="text-lg">{reward.emoji || "🎁"}</span>
              <span className="mt-1 text-sm font-bold text-slate-900 dark:text-white">
                {reward.title}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {formatPoints(reward.costPoints)} · ≈ {formatMoney(money, settings)}
              </span>
              <span className="mt-1 text-[10px] font-semibold uppercase tracking-wide">
                {busy === reward.title ? (
                  <span className="flex items-center gap-1 text-pink-600 dark:text-pink-400">
                    <Loader2 className="h-3 w-3 animate-spin" /> working
                  </span>
                ) : notEnoughPoints ? (
                  <span className="text-slate-400">not enough pts</span>
                ) : overLimit ? (
                  <span className="text-amber-600 dark:text-amber-400">over today&apos;s limit</span>
                ) : (
                  <span className="text-pink-600 dark:text-pink-400">redeem now</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-slate-200/80 bg-white/70 p-3 dark:border-slate-700/70 dark:bg-slate-900/60">
        <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          <Wallet className="h-3.5 w-3.5" /> Cash out to wallet
        </p>
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
          {cashoutReward ? cashoutReward.title : "Cash out"}: multiples of {settings.cashoutStep}{" "}
          pts, 1 pt = {formatMoney(settings.moneyPerPoint, settings)}.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={settings.cashoutStep}
            step={settings.cashoutStep}
            value={cashoutAmount}
            onChange={(e) => setCashoutAmount(e.target.value)}
            className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            pts → {formatMoney(cashoutMoney, settings)}
          </span>
          <button
            type="button"
            disabled={!cashoutValid || busy !== null}
            onClick={() =>
              run("Cash out", async () => {
                await cashoutPoints({ userId, settings, dayKey, points: cashoutPointsValue });
              })
            }
            className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "Cash out" ? "Working…" : "Cash out"}
          </button>
        </div>
        {!cashoutValid && cashoutPointsValue > 0 && (
          <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
            {cashoutPointsValue > points.balance
              ? "Not enough points."
              : `Must be a multiple of ${settings.cashoutStep} pts.`}
          </p>
        )}
      </div>

      {settings.limitBoostEnabled && (
        <div className="mt-3 rounded-xl border border-blue-200/80 bg-blue-50/60 p-3 dark:border-blue-500/20 dark:bg-blue-500/10">
          <p className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
            <ArrowUpCircle className="h-3.5 w-3.5" /> Raise today&apos;s limit
          </p>
          <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-300">
            Spend points to go past the limit: {stepPoints} pts = +
            {formatMoney(stepMoney, settings)}. Limit now{" "}
            <span className="font-semibold">{formatMoney(currentLimit, settings)}</span>
            {boostedMoney(day) > 0 && (
              <>
                {" "}
                (includes +{formatMoney(boostedMoney(day), settings)} boost)
              </>
            )}
            , {boostRoom} boost pts left today.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="number"
              min={1}
              step={1}
              value={boostSteps}
              onChange={(e) => setBoostSteps(e.target.value)}
              className="w-20 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              step → {formatMoney(boostMoney, settings)} extra, limit becomes{" "}
              {formatMoney(currentLimit + boostMoney, settings)} ({boostCost} pts)
            </span>
            <button
              type="button"
              disabled={!boostValid}
              onClick={() =>
                run("Boost limit", async () => {
                  await boostDailyLimit({ userId, settings, dayKey, steps: stepsRequested });
                })
              }
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "Boost limit" ? "Working…" : "Boost"}
            </button>
          </div>
          {boostRoom === 0 && (
            <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
              Daily boost cap reached — try again tomorrow.
            </p>
          )}
          {boostRoom > 0 && boostCost > boostRoom && (
            <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
              Only {boostRoom} boost pts left today.
            </p>
          )}
          {boostRoom > 0 && boostCost <= boostRoom && boostCost > points.balance && (
            <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
              Not enough points.
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-sm font-medium text-red-500">{error}</p>}
      {message && <p className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">{message}</p>}
    </section>
  );
}
