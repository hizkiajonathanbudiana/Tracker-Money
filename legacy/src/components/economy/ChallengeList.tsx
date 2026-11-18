"use client";

import { Check, Loader2, Lock } from "lucide-react";
import { Challenge, ChallengeCompletion, EconomyDay, EconomySettings } from "@/types/economy";
import { remainingEarnable } from "@/lib/economy";
import { formatPoints } from "@/lib/money";
import { completeChallenge } from "@/lib/economyOps";
import { useEconomyAction } from "@/hooks/useEconomy";

interface Props {
  userId: string;
  settings: EconomySettings;
  day: EconomyDay | null;
  dayKey: string;
  challenges: Challenge[];
  completions: Record<string, ChallengeCompletion>;
}

export default function ChallengeList({
  userId,
  settings,
  day,
  dayKey,
  challenges,
  completions,
}: Props) {
  const { busy, error, message, run } = useEconomyAction();
  const room = remainingEarnable(day, settings);
  const doneCount = Object.keys(completions).length;

  return (
    <section className="card-glass">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Daily challenges</h2>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
          {doneCount}/{challenges.length} done
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Tick one only when you actually did it. Points are credited automatically.
      </p>

      <div className="mt-4 space-y-2">
        {challenges.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No challenges yet. Add some under Settings → Challenges.
          </p>
        )}

        {challenges.map((challenge) => {
          const completion = completions[challenge.id];
          const isDone = Boolean(completion);
          const willAward = Math.min(challenge.points, room);

          return (
            <div
              key={challenge.id}
              className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${
                isDone
                  ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                  : "border-slate-200/80 bg-white/70 dark:border-slate-700/70 dark:bg-slate-900/60"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="text-xl">{challenge.emoji || "✅"}</span>
                <div className="min-w-0">
                  <p
                    className={`truncate text-sm font-semibold ${
                      isDone
                        ? "text-emerald-800 line-through dark:text-emerald-300"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {challenge.title}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {formatPoints(challenge.points)}
                    {isDone && completion
                      ? ` · earned ${formatPoints(completion.points)}`
                      : !isDone && willAward < challenge.points
                        ? ` · only ${willAward} pts left in today's cap`
                        : ""}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isDone || busy !== null || willAward <= 0}
                onClick={() =>
                  run(challenge.title, async () => {
                    await completeChallenge({ userId, settings, dayKey, challenge });
                  })
                }
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all ${
                  isDone
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : willAward <= 0
                      ? "border-slate-300 text-slate-400 dark:border-slate-700"
                      : "border-slate-300 text-slate-400 hover:border-emerald-500 hover:text-emerald-600 dark:border-slate-600"
                } disabled:cursor-not-allowed`}
                title={isDone ? "Already done today" : "Mark as done"}
              >
                {busy === challenge.title ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isDone ? (
                  <Check className="h-4 w-4" strokeWidth={3} />
                ) : willAward <= 0 ? (
                  <Lock className="h-3.5 w-3.5" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {error && <p className="mt-3 text-sm font-medium text-red-500">{error}</p>}
      {message && <p className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">{message}</p>}
    </section>
  );
}
