import { Timestamp } from "firebase/firestore";

export const EXPENSE_CATEGORIES = [
  "Food & Beverage",
  "Shopping",
  "Transport",
  "Bills",
  "Other",
] as const;

export type ExpenseCategory = string;

export interface Expense {
  id: string;
  notes: string; // Renamed from title
  amount: number;
  category: ExpenseCategory;
  date: Timestamp;
  createdAt: Timestamp;
  uid: string;
  cashBreakdown?: Record<string, number>;
  /** Set when the expense was created from the points/challenge economy. */
  economyKind?: "jajan" | "raw_material";
  /** WIB day key the expense was booked into (`jajan`, and the first share of `raw_material`). */
  dayKey?: string;
  /** Project that a `raw_material` purchase belongs to. */
  projectId?: string;
  projectItemId?: string;
  /** How many days a `raw_material` purchase is split over (1 = all in one day). */
  spreadDays?: number;
  /** True when the wallet balance was already adjusted for this expense. */
  walletApplied?: boolean;
}
