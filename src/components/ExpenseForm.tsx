"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { EXPENSE_CATEGORIES, ExpenseCategory } from "@/types/expense";
import { Plus, Loader2 } from "lucide-react";

interface ExpenseFormProps {
    userId: string;
}

export default function ExpenseForm({ userId }: ExpenseFormProps) {
    const [notes, setNotes] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState<ExpenseCategory>("Food & Beverage");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!amount || !category || !date) {
            setError("Please fill in Amount, Category, and Date.");
            return;
        }
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError("Please enter a valid positive amount.");
            return;
        }

        setLoading(true);

        try {
            const expenseData = {
                uid: userId,
                notes: notes,
                amount: numAmount,
                category,
                date: new Date(date),
                createdAt: serverTimestamp(),
            };
            await addDoc(collection(db, "users", userId, "expenses"), expenseData);

            setNotes("");
            setAmount("");
            setCategory("Food & Beverage");
            setDate(new Date().toISOString().split("T")[0]);
        } catch (err: any) {
            console.error("Error adding document: ", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card-glass">
            <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
                Add Expense
            </h2>
            {error && (
                <div className="mb-6 rounded-xl bg-red-100/80 backdrop-blur-sm border border-red-200/50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-300">
                    {error}
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label
                        htmlFor="amount"
                        className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                    >
                        Amount ($)
                    </label>
                    <input
                        type="number"
                        id="amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        min="0.01"
                        step="0.01"
                        className="glass-input block w-full rounded-xl py-3 px-4 text-lg font-medium placeholder-slate-400 transition-all duration-200 focus:ring-2 focus:ring-blue-400/50 focus:outline-none"
                        placeholder="0.00"
                    />
                </div>

                <div>
                    <label
                        htmlFor="category"
                        className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                    >
                        Category
                    </label>
                    <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                        required
                        className="glass-input block w-full rounded-xl py-3 px-4 text-lg font-medium transition-all duration-200 focus:ring-2 focus:ring-blue-400/50 focus:outline-none"
                    >
                        {EXPENSE_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat} className="bg-white dark:bg-black">
                                {cat}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label
                        htmlFor="date"
                        className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                    >
                        Date
                    </label>
                    <input
                        type="date"
                        id="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className="glass-input block w-full rounded-xl py-3 px-4 text-lg font-medium transition-all duration-200 focus:ring-2 focus:ring-blue-400/50 focus:outline-none"
                    />
                </div>

                <div>
                    <label
                        htmlFor="notes"
                        className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                    >
                        Notes (Optional)
                    </label>
                    <input
                        type="text"
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="glass-input block w-full rounded-xl py-3 px-4 text-lg font-medium placeholder-slate-400 transition-all duration-200 focus:ring-2 focus:ring-blue-400/50 focus:outline-none"
                        placeholder="e.g., Coffee with client"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="glass-button-primary group w-full py-4 px-6 rounded-xl text-lg font-semibold transition-all duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
                >
                    {loading ? (
                        <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                        <Plus className="mr-3 h-6 w-6 transition-transform group-hover:scale-110" />
                    )}
                    {loading ? "Adding..." : "Add Expense"}
                </button>
            </form>
        </div>
    );
}