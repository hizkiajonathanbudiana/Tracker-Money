"use client";

import {
  collection,
  deleteDoc,
  doc,
  DocumentReference,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Challenge,
  EconomyDay,
  EconomySettings,
  PendingCharge,
  Project,
  ProjectItem,
  Reward,
} from "@/types/economy";
import { Expense } from "@/types/expense";
import {
  DEFAULT_CHALLENGES,
  DEFAULT_ECONOMY_SETTINGS,
  DEFAULT_REWARDS,
  SETTINGS_SCHEMA_VERSION,
  dailyBaseLimit,
  dayLimit,
  pointsToMoney,
  splitAcrossDays,
} from "@/lib/economy";
import { roundMoney } from "@/lib/money";
import { dayKeyFor, dayKeyPlus, todayKey } from "@/lib/economyDay";

export class EconomyError extends Error {}

export function makeOpId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

const economyRef = (userId: string) => doc(db, "users", userId, "settings", "economy");
const pointsRef = (userId: string) => doc(db, "users", userId, "points", "summary");
const walletRef = (userId: string) => doc(db, "users", userId, "wallet", "summary");
const dayRef = (userId: string, dayKey: string) => doc(db, "users", userId, "days", dayKey);
const completionRef = (userId: string, dayKey: string, challengeId: string) =>
  doc(db, "users", userId, "days", dayKey, "completions", challengeId);
const ledgerRef = (userId: string, opId: string) => doc(db, "users", userId, "ledger", opId);
const redemptionRef = (userId: string, opId: string) =>
  doc(db, "users", userId, "redemptions", opId);
const projectRef = (userId: string, projectId: string) =>
  doc(db, "users", userId, "projects", projectId);
const projectItemRef = (userId: string, projectId: string, itemId: string) =>
  doc(db, "users", userId, "projects", projectId, "items", itemId);
const expenseRef = (userId: string, expenseId: string) =>
  doc(db, "users", userId, "expenses", expenseId);
const chargesCol = (userId: string) => collection(db, "users", userId, "charges");
const chargeRef = (userId: string, chargeId: string) =>
  doc(db, "users", userId, "charges", chargeId);


function emptyDay(dayKey: string, settings: EconomySettings): EconomyDay {
  return {
    dayKey,
    earnedPoints: 0,
    spentMoney: 0,
    earnCap: settings.dailyEarnCap,
    limit: dailyBaseLimit(settings, dayKey),
    boostedMoney: 0,
    boostedPoints: 0,
    completedChallenges: 0,
  };
}

/** Creates the settings doc, default challenges and default rewards exactly once. */
export async function ensureEconomySeed(userId: string): Promise<void> {
  if (!userId) return;
  const settingsSnap = await runTransaction(db, async (tx) => {
    const ref = economyRef(userId);
    const snap = await tx.get(ref);
    if (!snap.exists()) {
      tx.set(ref, {
        ...DEFAULT_ECONOMY_SETTINGS,
        seeded: false,
        updatedAt: serverTimestamp(),
      });
      return { seeded: false } as const;
    }
    return { seeded: Boolean(snap.data()?.seeded) } as const;
  });

  if (settingsSnap.seeded) return;

  const batch = writeBatch(db);
  DEFAULT_CHALLENGES.forEach((challenge, index) => {
    batch.set(
      doc(db, "users", userId, "challenges", `challenge-${index + 1}`),
      { ...challenge, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
      { merge: true }
    );
  });
  DEFAULT_REWARDS.forEach((reward, index) => {
    batch.set(
      doc(db, "users", userId, "rewards", `reward-${index + 1}`),
      { ...reward, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
      { merge: true }
    );
  });
  batch.set(economyRef(userId), { seeded: true }, { merge: true });
  await batch.commit();
}

export interface CompleteChallengeResult {
  awarded: number;
  alreadyDone: boolean;
  capped: boolean;
}

export async function completeChallenge(params: {
  userId: string;
  settings: EconomySettings;
  dayKey: string;
  challenge: Challenge;
}): Promise<CompleteChallengeResult> {
  const { userId, settings, dayKey, challenge } = params;
  const dRef = dayRef(userId, dayKey);
  const pRef = pointsRef(userId);
  const cRef = completionRef(userId, dayKey, challenge.id);

  return runTransaction(db, async (tx) => {
    const [daySnap, , completionSnap] = await Promise.all([
      tx.get(dRef),
      tx.get(pRef),
      tx.get(cRef),
    ]);

    if (completionSnap.exists()) {
      return { awarded: 0, alreadyDone: true, capped: false };
    }

    const day: EconomyDay = daySnap.exists()
      ? (daySnap.data() as EconomyDay)
      : emptyDay(dayKey, settings);
    const room = Math.max(0, (day.earnCap ?? settings.dailyEarnCap) - (day.earnedPoints ?? 0));
    const awarded = Math.max(0, Math.min(Math.trunc(challenge.points), room));

    if (awarded <= 0) {
      throw new EconomyError(
        "Daily point cap already reached. Points reset at midnight WIB."
      );
    }

    const ledgerId = `earn_${dayKey}_${challenge.id}`;

    tx.set(cRef, {
      challengeId: challenge.id,
      title: challenge.title,
      points: awarded,
      completedAt: serverTimestamp(),
    });
    tx.set(ledgerRef(userId, ledgerId), {
      kind: "earn",
      points: awarded,
      moneyValue: pointsToMoney(awarded, settings),
      dayKey,
      sourceId: challenge.id,
      title: challenge.title,
      createdAt: serverTimestamp(),
    });
    tx.set(
      pRef,
      {
        balance: increment(awarded),
        earnedLifetime: increment(awarded),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    tx.set(
      dRef,
      {
        dayKey,
        earnedPoints: increment(awarded),
        spentMoney: increment(0),
        earnCap: day.earnCap ?? settings.dailyEarnCap,
        limit: day.limit ?? dailyBaseLimit(settings, dayKey),
        completedChallenges: increment(1),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { awarded, alreadyDone: false, capped: awarded < challenge.points };
  });
}

export interface RedeemResult {
  moneyValue: number;
  points: number;
}

/** Buys a treat with points. Counts against today's treat allowance, never the wallet. */
export async function redeemTreat(params: {
  userId: string;
  settings: EconomySettings;
  dayKey: string;
  reward: Reward;
}): Promise<RedeemResult> {
  const { userId, settings, dayKey, reward } = params;
  const cost = Math.max(1, Math.trunc(reward.costPoints));
  const moneyValue = roundMoney(pointsToMoney(cost, settings));
  const opId = makeOpId("treat");
  const dRef = dayRef(userId, dayKey);
  const pRef = pointsRef(userId);

  return runTransaction(db, async (tx) => {
    const [pointsSnap, daySnap] = await Promise.all([tx.get(pRef), tx.get(dRef)]);
    const balance = (pointsSnap.data()?.balance as number | undefined) ?? 0;
    if (balance < cost) {
      throw new EconomyError(
        `Not enough points: need ${cost}, you have ${balance}.`
      );
    }
    const day: EconomyDay = daySnap.exists()
      ? (daySnap.data() as EconomyDay)
      : emptyDay(dayKey, settings);
    const limit = dayLimit(day, settings);
    const remaining = roundMoney(limit - (day.spentMoney ?? 0));
    if (moneyValue > remaining) {
      throw new EconomyError(
        `Today's treat allowance only has ${remaining} left, this treat needs ${moneyValue}.`
      );
    }

    tx.set(redemptionRef(userId, opId), {
      rewardId: reward.id,
      title: reward.title,
      kind: "treat",
      costPoints: cost,
      moneyValue,
      dayKey,
      status: "completed",
      createdAt: serverTimestamp(),
    });
    tx.set(ledgerRef(userId, opId), {
      kind: "treat",
      points: -cost,
      moneyValue,
      dayKey,
      sourceId: reward.id,
      title: reward.title,
      createdAt: serverTimestamp(),
    });
    tx.set(
      pRef,
      {
        balance: increment(-cost),
        spentLifetime: increment(cost),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    tx.set(
      dRef,
      {
        dayKey,
        earnedPoints: increment(0),
        spentMoney: increment(moneyValue),
        earnCap: day.earnCap ?? settings.dailyEarnCap,
        limit,
        completedChallenges: increment(0),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { moneyValue, points: cost };
  });
}

export interface BoostResult {
  steps: number;
  costPoints: number;
  moneyAdded: number;
  limit: number;
}

/**
 * Converts points into extra treat allowance for today, on top of the base daily limit.
 * This is the only way to go past the limit: base 10 + one boost step = 15.
 * Capped by `maxBoostPointsPerDay` so the limit cannot be raised forever.
 */
export async function boostDailyLimit(params: {
  userId: string;
  settings: EconomySettings;
  dayKey: string;
  steps?: number;
}): Promise<BoostResult> {
  const { userId, settings, dayKey } = params;
  if (!settings.limitBoostEnabled) {
    throw new EconomyError("Limit boost is turned off in settings.");
  }
  const stepPoints = Math.max(1, Math.trunc(settings.boostStepPoints));
  const steps = Math.max(1, Math.trunc(params.steps ?? 1));
  const cost = stepPoints * steps;
  const moneyAdded = roundMoney(pointsToMoney(cost, settings));
  if (moneyAdded <= 0) throw new EconomyError("Conversion rate is not valid.");
  const capPoints = Math.max(0, Math.trunc(settings.maxBoostPointsPerDay));
  const opId = makeOpId("boost");
  const dRef = dayRef(userId, dayKey);
  const pRef = pointsRef(userId);

  return runTransaction(db, async (tx) => {
    const [pointsSnap, daySnap] = await Promise.all([tx.get(pRef), tx.get(dRef)]);
    const balance = (pointsSnap.data()?.balance as number | undefined) ?? 0;
    if (balance < cost) {
      throw new EconomyError(`Not enough points: need ${cost}, you have ${balance}.`);
    }
    const day: EconomyDay = daySnap.exists()
      ? (daySnap.data() as EconomyDay)
      : emptyDay(dayKey, settings);
    const alreadyBoosted = Math.max(0, day.boostedPoints ?? 0);
    if (alreadyBoosted + cost > capPoints) {
      const room = Math.max(0, capPoints - alreadyBoosted);
      throw new EconomyError(
        `Daily boost cap is ${capPoints} points, only ${room} left today.`
      );
    }

    tx.set(ledgerRef(userId, opId), {
      kind: "boost",
      points: -cost,
      moneyValue: moneyAdded,
      dayKey,
      sourceId: opId,
      title: `Extra limit +${moneyAdded}`,
      createdAt: serverTimestamp(),
    });
    tx.set(
      pRef,
      {
        balance: increment(-cost),
        spentLifetime: increment(cost),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    tx.set(
      dRef,
      {
        dayKey,
        earnedPoints: increment(0),
        spentMoney: increment(0),
        earnCap: day.earnCap ?? settings.dailyEarnCap,
        limit: day.limit ?? dailyBaseLimit(settings, dayKey),
        boostedMoney: increment(moneyAdded),
        boostedPoints: increment(cost),
        completedChallenges: increment(0),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return {
      steps,
      costPoints: cost,
      moneyAdded,
      limit: roundMoney((day.limit ?? dailyBaseLimit(settings, dayKey)) + (day.boostedMoney ?? 0) + moneyAdded),
    };
  });
}

/**
 * Converts points into real wallet money at the configured rate.
 * Does NOT consume the daily jajan allowance: the money is only counted when it is
 * actually spent (jajan expenses), which keeps wallet maths honest.
 */
export async function cashoutPoints(params: {
  userId: string;
  settings: EconomySettings;
  dayKey: string;
  points: number;
}): Promise<RedeemResult> {
  const { userId, settings, dayKey } = params;
  const step = Math.max(1, Math.trunc(settings.cashoutStep));
  const points = Math.trunc(params.points);
  if (points <= 0) throw new EconomyError("Enter how many points to cash out.");
  if (points % step !== 0) {
    throw new EconomyError(`Cash-out must be a multiple of ${step} points.`);
  }
  const moneyValue = roundMoney(pointsToMoney(points, settings));
  if (moneyValue <= 0) throw new EconomyError("Conversion rate is not valid.");
  const opId = makeOpId("cashout");
  const pRef = pointsRef(userId);
  const wRef = walletRef(userId);
  const incomeRef = doc(collection(db, "users", userId, "incomes"));

  return runTransaction(db, async (tx) => {
    const [pointsSnap] = await Promise.all([tx.get(pRef), tx.get(wRef)]);
    const balance = (pointsSnap.data()?.balance as number | undefined) ?? 0;
    if (balance < points) {
      throw new EconomyError(`Not enough points: need ${points}, you have ${balance}.`);
    }

    tx.set(redemptionRef(userId, opId), {
      rewardId: "cashout",
      title: `Cash out ${points} pts`,
      kind: "cashout",
      costPoints: points,
      moneyValue,
      dayKey,
      status: "completed",
      createdAt: serverTimestamp(),
    });
    tx.set(ledgerRef(userId, opId), {
      kind: "cashout",
      points: -points,
      moneyValue,
      dayKey,
      sourceId: "cashout",
      title: `Cash out ${points} pts`,
      createdAt: serverTimestamp(),
    });
    tx.set(
      pRef,
      {
        balance: increment(-points),
        spentLifetime: increment(points),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    tx.set(
      wRef,
      { balance: increment(moneyValue), updatedAt: serverTimestamp() },
      { merge: true }
    );
    tx.set(incomeRef, {
      amount: moneyValue,
      note: `Points cash-out (${points} pts)`,
      source: "points_cashout",
      createdAt: serverTimestamp(),
    });

    return { moneyValue, points };
  });
}

export interface JajanExpenseInput {
  userId: string;
  settings: EconomySettings;
  dayKey: string;
  amount: number;
  notes: string;
  category: string;
  deductFromWallet: boolean;
}

/** A treat purchase paid from the wallet. Enforces today's allowance atomically. */
export async function recordJajanExpense(input: JajanExpenseInput): Promise<string> {
  const { userId, settings, dayKey, deductFromWallet } = input;
  const amount = roundMoney(input.amount);
  if (amount <= 0) throw new EconomyError("Amount must be greater than 0.");
  const dRef = dayRef(userId, dayKey);
  const wRef = walletRef(userId);
  const newExpenseRef = doc(collection(db, "users", userId, "expenses"));

  return runTransaction(db, async (tx) => {
    const [daySnap, walletSnap] = await Promise.all([tx.get(dRef), tx.get(wRef)]);
    const day: EconomyDay = daySnap.exists()
      ? (daySnap.data() as EconomyDay)
      : emptyDay(dayKey, settings);
    const limit = dayLimit(day, settings);
    const remaining = roundMoney(limit - (day.spentMoney ?? 0));
    if (amount > remaining) {
      throw new EconomyError(
        `Over today's treat allowance: only ${remaining} left of ${limit}.`
      );
    }
    const balance = (walletSnap.data()?.balance as number | undefined) ?? 0;
    if (deductFromWallet && amount > balance) {
      throw new EconomyError(`Wallet balance is only ${balance}.`);
    }

    tx.set(newExpenseRef, {
      uid: userId,
      notes: input.notes,
      amount,
      category: input.category,
      date: Timestamp.fromDate(new Date()),
      createdAt: serverTimestamp(),
      cashBreakdown: null,
      economyKind: "jajan",
      dayKey,
      walletApplied: deductFromWallet,
    });
    tx.set(
      dRef,
      {
        dayKey,
        earnedPoints: increment(0),
        spentMoney: increment(amount),
        earnCap: day.earnCap ?? settings.dailyEarnCap,
        limit,
        completedChallenges: increment(0),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    if (deductFromWallet) {
      tx.set(
        wRef,
        { balance: increment(-amount), updatedAt: serverTimestamp() },
        { merge: true }
      );
    }
    return newExpenseRef.id;
  });
}

export interface RawMaterialInput {
  userId: string;
  settings: EconomySettings;
  projectId: string;
  projectItemId: string;
  amount: number;
  notes: string;
  category: string;
  deductFromWallet: boolean;
  allowOverBudget?: boolean;
  /** How many days this purchase is spread over. 1 = charge it all to today. */
  spreadDays?: number;
}

/**
 * Buys one raw-material line for a project: creates a normal expense tagged
 * `raw_material`, updates project + item totals and (optionally) the wallet.
 *
 * Raw-material money is part of the daily limit, but a single grocery run cannot
 * fit inside one day, so the amount is split over `spreadDays`: today's share is
 * charged to today's `spentMoney` right away, the remaining shares wait in
 * `users/{uid}/charges` and are folded into their own day when that day arrives
 * (see `applyPendingCharges`). The purchase is never blocked by the daily limit;
 * only the project budget and the wallet balance can refuse it.
 */
export async function recordRawMaterialPurchase(input: RawMaterialInput): Promise<string> {
  const { userId, settings, projectId, projectItemId, deductFromWallet } = input;
  const amount = roundMoney(input.amount);
  if (amount <= 0) throw new EconomyError("Amount must be greater than 0.");
  const spreadDays = settings.spreadRawMaterials
    ? Math.min(90, Math.max(1, Math.trunc(input.spreadDays ?? settings.defaultSpreadDays ?? 1)))
    : 1;
  const shares = splitAcrossDays(amount, spreadDays);
  const chargeDayKey = todayKey(settings.timeZone);
  const pRef = projectRef(userId, projectId);
  const iRef = projectItemRef(userId, projectId, projectItemId);
  const wRef = walletRef(userId);
  const dRef = dayRef(userId, chargeDayKey);
  const newExpenseRef = doc(collection(db, "users", userId, "expenses"));

  return runTransaction(db, async (tx) => {
    const [projectSnap, itemSnap, walletSnap, daySnap] = await Promise.all([
      tx.get(pRef),
      tx.get(iRef),
      tx.get(wRef),
      settings.spreadRawMaterials ? tx.get(dRef) : Promise.resolve(null),
    ]);
    if (!projectSnap.exists()) throw new EconomyError("Project not found.");
    if (!itemSnap.exists()) throw new EconomyError("Project item not found.");

    const project = projectSnap.data() as Project;
    const item = itemSnap.data() as ProjectItem;
    const spent = (project.spent ?? 0) + amount;
    const budget = project.budget ?? 0;
    if (budget > 0 && spent > budget && !input.allowOverBudget) {
      throw new EconomyError(
        `Over project budget: ${spent} of ${budget}. Increase the budget or allow the overrun.`
      );
    }
    const balance = (walletSnap.data()?.balance as number | undefined) ?? 0;
    if (deductFromWallet && amount > balance) {
      throw new EconomyError(`Wallet balance is only ${balance}.`);
    }

    const label = input.notes || `${project.title}: ${item.name}`;
    tx.set(newExpenseRef, {
      uid: userId,
      notes: label,
      amount,
      category: input.category,
      date: Timestamp.fromDate(new Date()),
      createdAt: serverTimestamp(),
      cashBreakdown: null,
      economyKind: "raw_material",
      dayKey: chargeDayKey,
      spreadDays,
      projectId,
      projectItemId,
      walletApplied: deductFromWallet,
    });
    tx.set(
      pRef,
      { spent: increment(amount), updatedAt: serverTimestamp() },
      { merge: true }
    );
    tx.set(
      iRef,
      {
        purchased: true,
        actualCost: roundMoney((item.actualCost ?? 0) + amount),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    if (settings.spreadRawMaterials) {
      const day: EconomyDay = daySnap?.exists()
        ? (daySnap.data() as EconomyDay)
        : emptyDay(chargeDayKey, settings);
      tx.set(
        dRef,
        {
          dayKey: chargeDayKey,
          spentMoney: increment(shares[0]),
          rawMaterialSpent: increment(shares[0]),
          earnCap: day.earnCap ?? settings.dailyEarnCap,
          limit: dayLimit(day, settings, chargeDayKey),
          completedChallenges: increment(0),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      for (let i = 1; i < spreadDays; i += 1) {
        tx.set(chargeRef(userId, `${newExpenseRef.id}_${i}`), {
          expenseId: newExpenseRef.id,
          projectId,
          projectItemId,
          dayKey: dayKeyPlus(chargeDayKey, i),
          amount: shares[i],
          applied: false,
          title: label,
        });
      }
    }

    if (deductFromWallet) {
      tx.set(
        wRef,
        { balance: increment(-amount), updatedAt: serverTimestamp() },
        { merge: true }
      );
    }
    return newExpenseRef.id;
  });
}

export interface ApplyChargesResult {
  applied: number;
  chargedMoney: number;
}

/**
 * Folds pending raw-material shares into the day they belong to. Safe to call on
 * every load: each charge is marked `applied` inside the same transaction that
 * adds its money to the day, so a share is counted exactly once.
 */
export async function applyPendingCharges(params: {
  userId: string;
  settings: EconomySettings;
  upToDayKey?: string;
}): Promise<ApplyChargesResult> {
  const { userId, settings } = params;
  if (!userId || !settings.spreadRawMaterials) return { applied: 0, chargedMoney: 0 };
  const upTo = params.upToDayKey ?? todayKey(settings.timeZone);
  const snap = await getDocs(query(chargesCol(userId), where("applied", "==", false)));

  const byDay = new Map<string, string[]>();
  snap.forEach((d) => {
    const data = d.data() as PendingCharge;
    if (!data?.dayKey || data.dayKey > upTo) return;
    const ids = byDay.get(data.dayKey) ?? [];
    ids.push(d.id);
    byDay.set(data.dayKey, ids);
  });

  let applied = 0;
  let chargedMoney = 0;
  for (const [key, ids] of Array.from(byDay.entries())) {
    const result = await runTransaction(db, async (tx) => {
      const dRef = dayRef(userId, key);
      const refs = ids.map((id) => chargeRef(userId, id));
      const [daySnap, ...chargeSnaps] = await Promise.all([
        tx.get(dRef),
        ...refs.map((r) => tx.get(r)),
      ]);
      const day: EconomyDay = daySnap.exists()
        ? (daySnap.data() as EconomyDay)
        : emptyDay(key, settings);
      let sum = 0;
      let count = 0;
      chargeSnaps.forEach((cs, i) => {
        const data = cs.data() as PendingCharge | undefined;
        if (!cs.exists() || !data || data.applied) return;
        sum = roundMoney(sum + (data.amount ?? 0));
        count += 1;
        tx.set(refs[i], { applied: true, appliedAt: serverTimestamp() }, { merge: true });
      });
      if (count === 0) return { count: 0, sum: 0 };
      tx.set(
        dRef,
        {
          dayKey: key,
          spentMoney: increment(sum),
          rawMaterialSpent: increment(sum),
          earnCap: day.earnCap ?? settings.dailyEarnCap,
          limit: dayLimit(day, settings, key),
          completedChallenges: increment(0),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      return { count, sum };
    });
    applied += result.count;
    chargedMoney = roundMoney(chargedMoney + result.sum);
  }
  return { applied, chargedMoney };
}

/**
 * Undoes the daily-limit side of a raw-material purchase: today's own share and
 * every share already folded into a later day, then drops the pending charges so
 * the money is never charged again.
 */
async function reverseRawMaterialCharges(params: {
  userId: string;
  expense: Expense;
}): Promise<void> {
  const { userId, expense } = params;
  const snap = await getDocs(
    query(chargesCol(userId), where("expenseId", "==", expense.id))
  );
  const perDay = new Map<string, number>();
  const ids: string[] = [];
  snap.forEach((d) => {
    const charge = d.data() as PendingCharge;
    ids.push(d.id);
    if (charge.applied) {
      perDay.set(charge.dayKey, roundMoney((perDay.get(charge.dayKey) ?? 0) + charge.amount));
    }
  });

  if (expense.dayKey) {
    const share = splitAcrossDays(expense.amount, Math.max(1, expense.spreadDays ?? 1))[0];
    perDay.set(expense.dayKey, roundMoney((perDay.get(expense.dayKey) ?? 0) + share));
  }
  if (perDay.size === 0 && ids.length === 0) return;

  const batch = writeBatch(db);
  perDay.forEach((money, key) => {
    if (money <= 0) return;
    batch.set(
      dayRef(userId, key),
      {
        spentMoney: increment(-money),
        rawMaterialSpent: increment(-money),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
  ids.forEach((id) => batch.delete(chargeRef(userId, id)));
  await batch.commit();
}

/**
 * Deletes an economy-tagged expense and reverses every derived total:
 * today's jajan spend, project totals, item state and the wallet balance.
 */
export async function deleteEconomyExpense(params: {
  userId: string;
  expense: Expense;
}): Promise<void> {
  const { userId, expense } = params;
  const eRef = expenseRef(userId, expense.id);
  const wRef = walletRef(userId);

  if (expense.economyKind === "jajan" && expense.dayKey) {
    const dRef = dayRef(userId, expense.dayKey);
    await runTransaction(db, async (tx) => {
      const [daySnap, walletSnap] = await Promise.all([tx.get(dRef), tx.get(wRef)]);
      const day = daySnap.data() as EconomyDay | undefined;
      tx.delete(eRef);
      if (daySnap.exists()) {
        const nextSpent = Math.max(0, roundMoney((day?.spentMoney ?? 0) - expense.amount));
        tx.set(dRef, { spentMoney: nextSpent, updatedAt: serverTimestamp() }, { merge: true });
      }
      if (expense.walletApplied) {
        const balance = (walletSnap.data()?.balance as number | undefined) ?? 0;
        tx.set(wRef, { balance: balance + expense.amount, updatedAt: serverTimestamp() });
      }
    });
    return;
  }

  if (expense.economyKind === "raw_material" && expense.projectId) {
    const pRef = projectRef(userId, expense.projectId);
    const iRef = expense.projectItemId
      ? projectItemRef(userId, expense.projectId, expense.projectItemId)
      : null;
    await runTransaction(db, async (tx) => {
      const [projectSnap, itemSnap, walletSnap] = await Promise.all([
        tx.get(pRef),
        iRef ? tx.get(iRef) : Promise.resolve(null),
        tx.get(wRef),
      ]);
      const project = projectSnap.data() as Project | undefined;
      const item = itemSnap?.data() as ProjectItem | undefined;
      tx.delete(eRef);
      if (projectSnap.exists()) {
        tx.set(
          pRef,
          {
            spent: Math.max(0, roundMoney((project?.spent ?? 0) - expense.amount)),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      if (iRef && itemSnap?.exists()) {
        tx.set(
          iRef,
          {
            purchased: false,
            actualCost: Math.max(0, roundMoney((item?.actualCost ?? 0) - expense.amount)),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
      if (expense.walletApplied) {
        const balance = (walletSnap.data()?.balance as number | undefined) ?? 0;
        tx.set(wRef, { balance: balance + expense.amount, updatedAt: serverTimestamp() });
      }
    });
    await reverseRawMaterialCharges({ userId, expense });
    return;
  }

  await deleteDoc(eRef);
}

export interface NewProjectInput {
  title: string;
  emoji: string;
  budget: number;
  outputName: string;
  outputQuantity: number;
  outputUnit: string;
}

export async function createProject(userId: string, input: NewProjectInput): Promise<string> {
  const title = input.title.trim();
  if (!title) throw new EconomyError("Project name is required.");
  const ref = doc(collection(db, "users", userId, "projects"));
  await setDoc(ref, {
    title,
    emoji: input.emoji || "🧺",
    budget: roundMoney(Math.max(0, input.budget)),
    spent: 0,
    outputName: input.outputName.trim(),
    outputQuantity: Math.max(1, Math.trunc(input.outputQuantity) || 1),
    outputUnit: input.outputUnit.trim() || "pcs",
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function addProjectItem(params: {
  userId: string;
  projectId: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
}): Promise<void> {
  const name = params.name.trim();
  if (!name) throw new EconomyError("Item name is required.");
  const ref = doc(collection(db, "users", params.userId, "projects", params.projectId, "items"));
  await setDoc(ref, {
    name,
    quantity: Math.max(1, params.quantity || 1),
    unit: params.unit.trim() || "pcs",
    estimatedCost: roundMoney(Math.max(0, params.estimatedCost)),
    purchased: false,
    actualCost: 0,
    createdAt: serverTimestamp(),
  });
}

export async function removeProjectItem(params: {
  userId: string;
  projectId: string;
  itemId: string;
}): Promise<void> {
  await deleteDoc(projectItemRef(params.userId, params.projectId, params.itemId));
}

/** Marks a project finished; awards the project bonus respecting the daily earn cap. */
export async function completeProject(params: {
  userId: string;
  settings: EconomySettings;
  dayKey: string;
  project: Project;
}): Promise<{ awarded: number; capped: boolean }> {
  const { userId, settings, dayKey, project } = params;
  const bonus = Math.max(0, Math.trunc(settings.projectBonusPoints));
  const pRef = projectRef(userId, project.id);
  const pOints = pointsRef(userId);
  const dRef = dayRef(userId, dayKey);

  return runTransaction(db, async (tx) => {
    const [projectSnap, , daySnap] = await Promise.all([
      tx.get(pRef),
      tx.get(pOints),
      tx.get(dRef),
    ]);
    if (!projectSnap.exists()) throw new EconomyError("Project not found.");
    const current = projectSnap.data() as Project;
    if (current.status === "completed") {
      throw new EconomyError("This project is already finished.");
    }

    const day: EconomyDay = daySnap.exists()
      ? (daySnap.data() as EconomyDay)
      : emptyDay(dayKey, settings);
    const room = Math.max(0, (day.earnCap ?? settings.dailyEarnCap) - (day.earnedPoints ?? 0));
    const awarded = Math.min(bonus, room);
    const opId = `project_${project.id}`;

    tx.set(
      pRef,
      { status: "completed", completedAt: serverTimestamp(), updatedAt: serverTimestamp() },
      { merge: true }
    );
    if (awarded > 0) {
      tx.set(ledgerRef(userId, opId), {
        kind: "project",
        points: awarded,
        moneyValue: pointsToMoney(awarded, settings),
        dayKey,
        sourceId: project.id,
        title: `${project.title} finished`,
        createdAt: serverTimestamp(),
      });
      tx.set(
        pOints,
        {
          balance: increment(awarded),
          earnedLifetime: increment(awarded),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      tx.set(
        dRef,
        {
          dayKey,
          earnedPoints: increment(awarded),
          spentMoney: increment(0),
          earnCap: day.earnCap ?? settings.dailyEarnCap,
          limit: day.limit ?? dailyBaseLimit(settings, dayKey),
          completedChallenges: increment(0),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    }
    return { awarded, capped: awarded < bonus };
  });
}

export async function saveEconomySettings(
  userId: string,
  settings: EconomySettings
): Promise<void> {
  await setDoc(
    economyRef(userId),
    { ...settings, schemaVersion: SETTINGS_SCHEMA_VERSION, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function addChallenge(
  userId: string,
  input: { title: string; points: number; emoji: string }
): Promise<void> {
  const title = input.title.trim();
  if (!title) throw new EconomyError("Challenge title is required.");
  const ref = doc(collection(db, "users", userId, "challenges"));
  await setDoc(ref, {
    title,
    points: Math.max(1, Math.trunc(input.points) || 1),
    emoji: input.emoji || "✅",
    active: true,
    sortOrder: Date.now(),
    createdAt: serverTimestamp(),
  });
}

export async function removeChallenge(userId: string, challengeId: string): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "challenges", challengeId));
}

export async function addReward(
  userId: string,
  input: { title: string; emoji: string; kind: "treat" | "cashout"; costPoints: number }
): Promise<void> {
  const title = input.title.trim();
  if (!title) throw new EconomyError("Reward title is required.");
  const ref = doc(collection(db, "users", userId, "rewards"));
  await setDoc(ref, {
    title,
    emoji: input.emoji || "🎁",
    kind: input.kind,
    costPoints: Math.max(1, Math.trunc(input.costPoints) || 1),
    active: true,
    sortOrder: Date.now(),
    createdAt: serverTimestamp(),
  });
}

export async function removeReward(userId: string, rewardId: string): Promise<void> {
  await deleteDoc(doc(db, "users", userId, "rewards", rewardId));
}

/** Helper used by the dashboard: day key for "now" in the configured timezone. */
export function currentDayKey(settings: EconomySettings): string {
  return dayKeyFor(new Date(), settings.timeZone || "Asia/Jakarta");
}

export function assertNoUserMismatch(ref: DocumentReference, uid: string): void {
  if (!ref.path.startsWith(`users/${uid}/`)) {
    throw new EconomyError("Refusing to write outside the signed-in user's data.");
  }
}
