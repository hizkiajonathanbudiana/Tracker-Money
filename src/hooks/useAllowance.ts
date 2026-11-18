"use client";

import { useEffect, useMemo, useState } from "react";
import { Expense } from "@/types/expense";
import { EconomySettings } from "@/types/economy";
import { dayKeyFor, msUntilNextDay } from "@/lib/economyDay";
import { computeAllowance, SpendRecord, monthSpend, isRegularCategory } from "@/lib/allowance";
import { useTodayKey } from "@/hooks/useEconomy";

/** Converts Firestore expenses into the flat records the allowance maths needs. */
export function useSpendRecords(expenses: Expense[], settings: EconomySettings): SpendRecord[] {
  return useMemo(() => {
    const timeZone = settings.timeZone;
    return expenses
      .map((expense) => {
        const date = expense.date as unknown as { toDate?: () => Date } | undefined;
        const asDate = typeof date?.toDate === "function" ? date.toDate() : new Date();
        return {
          amount: Number(expense.amount) || 0,
          category: expense.category ?? "",
          dayKey: dayKeyFor(asDate, timeZone),
        };
      })
      .filter((record) => record.dayKey);
  }, [expenses, settings.timeZone]);
}

/** Monthly allowance buckets + today's pace. */
export function useAllowance(expenses: Expense[], settings: EconomySettings) {
  const today = useTodayKey(settings.timeZone);
  const records = useSpendRecords(expenses, settings);
  const { spend, pace } = useMemo(
    () => computeAllowance(records, settings, today),
    [records, settings, today]
  );
  return { today, records, spend, pace };
}

/** Countdown until the day (and therefore the challenges) reset in the user's zone. */
export function useResetCountdown(timeZone: string) {
  const [ms, setMs] = useState(() => msUntilNextDay(new Date(), timeZone));

  useEffect(() => {
    setMs(msUntilNextDay(new Date(), timeZone));
    const timer = setInterval(() => setMs(msUntilNextDay(new Date(), timeZone)), 30_000);
    return () => clearInterval(timer);
  }, [timeZone]);

  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const label = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  return { ms, label, hours, minutes };
}

/** Category helper for the settings screen preview. */
export function isCountedAsFood(category: string, settings: EconomySettings): boolean {
  return isRegularCategory(category, settings);
}

export { monthSpend };
