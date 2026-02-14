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
  notes: string; // Diubah dari title
  amount: number;
  category: ExpenseCategory;
  date: Timestamp;
  createdAt: Timestamp;
  uid: string;
  cashBreakdown?: Record<string, number>;
}
