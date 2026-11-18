import { Timestamp } from "firebase/firestore";

/**
 * Points + daily-life-challenge economy.
 *
 * Firestore layout (all under `users/{uid}/`):
 *   settings/economy                 -> EconomySettings
 *   points/summary                   -> PointsSummary
 *   ledger/{opId}                    -> PointsLedgerEntry   (append only)
 *   days/{yyyy-MM-dd}                -> EconomyDay
 *   days/{yyyy-MM-dd}/completions/{challengeId} -> ChallengeCompletion
 *   challenges/{challengeId}         -> Challenge
 *   rewards/{rewardId}               -> Reward
 *   redemptions/{opId}               -> Redemption
 *   projects/{projectId}             -> Project
 *   projects/{projectId}/items/{id}  -> ProjectItem
 */

export type CurrencyCode = "IDR" | "TWD" | "USD";

export interface EconomySettings {
  enabled: boolean;
  currencyCode: CurrencyCode;
  currencySymbol: string;
  locale: string;
  decimals: number;
  /** Money value of a single point, in the currency above. e.g. 1 => 1 point = $1 */
  moneyPerPoint: number;
  /**
   * Optional hard cap of money that may be spent on treats in one day.
   * 0 means "derive it from the monthly allowance" (allowance / days in month).
   */
  dailyLimit: number;
  /** Monthly food & drink allowance. Everything in `regularCategories` counts against it. */
  monthlyRegularAllowance: number;
  /** Monthly raw-material / project allowance (ingredient purchases). */
  monthlyProjectAllowance: number;
  /**
   * Categories counted as regular food & drink spending (case-insensitive).
   * Anything else — rent, bills, transport, shopping — is tracked but not
   * charged to the food allowance.
   */
  regularCategories: string[];
  /** Hard cap of points that can be earned in one day (challenges + project bonus). */
  dailyEarnCap: number;
  /** Points earned for finishing a project, before the daily cap is applied. */
  projectBonusPoints: number;
  /** Cash-out must be a multiple of this many points. */
  cashoutStep: number;
  /** Allow points to raise today's treat limit above the base limit. */
  limitBoostEnabled: boolean;
  /** Points spent per boost step; one step adds that many points' worth of money. */
  boostStepPoints: number;
  /** Hard cap of points that may be turned into extra limit in a single day. */
  maxBoostPointsPerDay: number;
  /** Count raw-material purchases against the daily limit (spread over several days). */
  spreadRawMaterials: boolean;
  /** Default number of days a single raw-material purchase is spread over. */
  defaultSpreadDays: number;
  timeZone: string;
  /** Bumped when the settings shape changes; drives the client-side migration. */
  schemaVersion?: number;
  seeded?: boolean;
  updatedAt?: Timestamp | unknown;
}

export interface PointsSummary {
  balance: number;
  earnedLifetime: number;
  spentLifetime: number;
  updatedAt?: Timestamp | unknown;
}

export type LedgerKind = "earn" | "treat" | "cashout" | "project" | "boost";

export interface PointsLedgerEntry {
  kind: LedgerKind;
  points: number; // signed: positive = earned, negative = spent
  moneyValue: number;
  dayKey: string;
  sourceId: string;
  title: string;
  createdAt: Timestamp | unknown;
}

/**
 * Frozen per-day aggregate. The limit/cap are copied from settings when the day is
 * first touched so that changing settings never rewrites history.
 */
export interface EconomyDay {
  dayKey: string;
  earnedPoints: number;
  spentMoney: number; // treats + raw-material shares charged to this day
  /** Part of `spentMoney` that came from raw-material purchases. */
  rawMaterialSpent?: number;
  earnCap: number;
  /** Base limit frozen from settings when the day was first touched. */
  limit: number;
  /** Extra allowance bought with points today (on top of `limit`). */
  boostedMoney?: number;
  /** Points already converted into extra allowance today. */
  boostedPoints?: number;
  completedChallenges: number;
  updatedAt?: Timestamp | unknown;
}

/**
 * One day's share of a raw-material purchase. The purchase is split over
 * `spreadDays`; today's share is charged immediately and the rest sits here
 * until that day arrives, when it is folded into `days/{yyyy-MM-dd}.spentMoney`.
 */
export interface PendingCharge {
  expenseId: string;
  projectId?: string;
  projectItemId?: string;
  /** The day this share belongs to (yyyy-MM-dd). */
  dayKey: string;
  amount: number;
  applied: boolean;
  title: string;
  appliedAt?: Timestamp | unknown;
}

export interface Challenge {
  id: string;
  title: string;
  points: number;
  emoji: string;
  active: boolean;
  sortOrder: number;
}

export interface ChallengeCompletion {
  challengeId: string;
  title: string;
  points: number; // actually awarded (may be clipped by the daily cap)
  completedAt: Timestamp | unknown;
}

export type RewardKind = "treat" | "cashout";

export interface Reward {
  id: string;
  title: string;
  emoji: string;
  kind: RewardKind;
  /** Points required. For `cashout` rewards this is the minimum amount. */
  costPoints: number;
  active: boolean;
  sortOrder: number;
}

export interface Redemption {
  id: string;
  rewardId: string;
  title: string;
  kind: RewardKind;
  costPoints: number;
  moneyValue: number;
  dayKey: string;
  status: "completed" | "reversed";
  createdAt: Timestamp | unknown;
}

export type ProjectStatus = "active" | "completed";

export interface Project {
  id: string;
  title: string;
  emoji: string;
  budget: number;
  spent: number;
  outputName: string;
  outputQuantity: number;
  outputUnit: string;
  status: ProjectStatus;
  createdAt?: Timestamp | unknown;
  completedAt?: Timestamp | unknown;
}

export interface ProjectItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  purchased: boolean;
  actualCost: number;
}

/** Extra optional fields on `Expense` used by the economy. */
export interface EconomyExpenseFields {
  economyKind?: "jajan" | "raw_material";
  dayKey?: string;
  projectId?: string;
  projectItemId?: string;
  redemptionId?: string;
  walletApplied?: boolean;
  /** How many days a raw-material purchase was spread over (1 = charged in full today). */
  spreadDays?: number;
}
