"use client";

import Link from "next/link";
import { ArrowLeft, Coins, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import {
  useChallenges,
  useEconomyDay,
  useEconomySettings,
  useLedger,
  usePointsSummary,
  useProjects,
  useRewards,
  useTodayCompletions,
  useTodayKey,
} from "@/hooks/useEconomy";
import { useCategories } from "@/hooks/useCategories";
import DailyLimitCard from "@/components/economy/DailyLimitCard";
import ChallengeList from "@/components/economy/ChallengeList";
import RewardsPanel from "@/components/economy/RewardsPanel";
import ProjectsPanel from "@/components/economy/ProjectsPanel";
import EconomySettingsPanel from "@/components/economy/EconomySettingsPanel";
import { pointsToMoney, RAW_MATERIAL_CATEGORY } from "@/lib/economy";
import PageHeader from "@/components/ui/PageHeader";
import { useResetCountdown } from "@/hooks/useAllowance";
import { formatMoney, formatPoints } from "@/lib/money";

export default function PointsPage() {
  const { user } = useAuth();
  const userId = user?.uid ?? "";
  const isEmailVerified = user?.emailVerified ?? false;

  const { settings } = useEconomySettings(userId);
  const { points } = usePointsSummary(userId);
  const dayKey = useTodayKey(settings.timeZone);
  const { day } = useEconomyDay(userId, dayKey);
  const { completions } = useTodayCompletions(userId, dayKey);
  const { challenges } = useChallenges(userId);
  const { rewards } = useRewards(userId);
  const { projects } = useProjects(userId);
  const { entries, loading: ledgerLoading } = useLedger(userId, 15);
  const { categories, addCategory } = useCategories(userId);
  const reset = useResetCountdown(settings.timeZone);

  if (!user || !isEmailVerified) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <PageHeader
        eyebrow="Daily life challenge"
        title="Points"
        description={`${formatPoints(points.balance)} · 1 pt = ${formatMoney(
          settings.moneyPerPoint,
          settings
        )} · worth ${formatMoney(pointsToMoney(points.balance, settings), settings)}`}
        meta={
          <>
            <span className="chip chip-accent">
              <Sparkles className="h-3 w-3" /> {dayKey}
            </span>
            <span className="chip chip-warn">Resets in {reset.label}</span>
            <span className="chip">{settings.timeZone}</span>
          </>
        }
        actions={
          <Link
            href="/app"
            className="glass-button flex items-center gap-2 px-4 py-2 text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Link>
        }
      />

      <DailyLimitCard settings={settings} day={day} dayKey={dayKey} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChallengeList
          userId={user.uid}
          settings={settings}
          day={day}
          dayKey={dayKey}
          challenges={challenges}
          completions={completions}
        />
        <RewardsPanel
          userId={user.uid}
          settings={settings}
          points={points}
          day={day}
          dayKey={dayKey}
          rewards={rewards}
        />
      </div>

      <ProjectsPanel
        userId={user.uid}
        settings={settings}
        dayKey={dayKey}
        projects={projects}
        hasRawMaterialCategory={categories.includes(RAW_MATERIAL_CATEGORY)}
        onAddCategory={addCategory}
      />

      <section className="card-glass">
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white">
          <Coins className="h-5 w-5 text-amber-500" /> Points history
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Every point movement: earned, redeemed for a treat, cashed out, or project bonus.
        </p>

        <div className="mt-3 space-y-1.5">
          {ledgerLoading && <Loader2 className="h-5 w-5 animate-spin text-blue-600" />}
          {!ledgerLoading && entries.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No point activity yet. Complete your first challenge.
            </p>
          )}
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/70 px-3 py-2 text-xs dark:border-slate-700/70"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                  {entry.title}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-slate-400">
                  {entry.kind} · {entry.dayKey}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={`font-bold ${
                    entry.points >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-500 dark:text-red-400"
                  }`}
                >
                  {entry.points >= 0 ? "+" : ""}
                  {entry.points} pts
                </p>
                <p className="text-[10px] text-slate-400">
                  {formatMoney(entry.moneyValue, settings)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <EconomySettingsPanel
        userId={user.uid}
        settings={settings}
        challenges={challenges}
        rewards={rewards}
      />
    </div>
  );
}
