import { Timestamp } from "firebase/firestore";

export const EXPENSE_CATEGORIES = [
  "Food & Beverage",
  "Shopping",
  "Transport",
  "Bills",
  "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: string;
  notes: string; // Diubah dari title
  amount: number;
  category: ExpenseCategory;
  date: Timestamp;
  createdAt: Timestamp;
  uid: string;
}
