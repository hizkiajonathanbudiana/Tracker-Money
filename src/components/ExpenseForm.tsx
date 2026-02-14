"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ExpenseCategory } from "@/types/expense";
import { CashDenomination } from "@/hooks/useWallet";
import { Plus, Loader2 } from "lucide-react";

interface ExpenseFormProps {
    userId: string;
    categories: string[];
    denominations: CashDenomination[];
    onAdjustBalance?: (delta: number) => Promise<void> | void;
    onUpdateDenominations?: (denominations: CashDenomination[]) => Promise<void> | void;
}

export default function ExpenseForm({
    userId,
    categories,
    denominations,
    onAdjustBalance,
    onUpdateDenominations,
}: ExpenseFormProps) {
    const safeCategories = categories.length ? categories : ["Other"];
    const [notes, setNotes] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState<ExpenseCategory>(safeCategories[0]);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [useCashBreakdown, setUseCashBreakdown] = useState(false);
    const [deductFromWallet, setDeductFromWallet] = useState(true);

    const [cashUsage, setCashUsage] = useState<Record<string, number>>({});

    useEffect(() => {
        if (safeCategories.length > 0 && !safeCategories.includes(category)) {
            setCategory(safeCategories[0]);
        }
    }, [safeCategories, category]);

    const cashTotal = useMemo(() => {
        return denominations.reduce((acc, denom) => {
            const count = cashUsage[denom.id] || 0;
            return acc + denom.value * count;
        }, 0);
    }, [cashUsage, denominations]);

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
                cashUsage: useCashBreakdown ? cashUsage : {},
            };
            await addDoc(collection(db, "users", userId, "expenses"), expenseData);

            if (deductFromWallet && onAdjustBalance) {
                await onAdjustBalance(-numAmount);
            }

            if (useCashBreakdown && onUpdateDenominations) {
                const updatedDenoms = denominations.map((denom) => {
                    const usedCount = cashUsage[denom.id] || 0;
                    return {
                        ...denom,
                        count: Math.max(0, denom.count - usedCount),
                    };
                });
                await onUpdateDenominations(updatedDenoms);
            }

            setNotes("");
            setAmount("");
            setCategory(safeCategories[0]);
            setDate(new Date().toISOString().split("T")[0]);
            setCashUsage({});
            setUseCashBreakdown(false);
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
                        {safeCategories.map((cat) => (
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

                <div className="space-y-3 rounded-xl border border-slate-200/60 p-4 dark:border-slate-700/60">
                    <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                        <input
                            type="checkbox"
                            checked={useCashBreakdown}
                            onChange={(e) => setUseCashBreakdown(e.target.checked)}
                            className="h-4 w-4"
                        />
                        Cash breakdown (optional)
                    </label>
                    {useCashBreakdown && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {denominations.map((denom) => (
                                <div key={denom.id} className="glass-card p-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                            {denom.label} ({denom.type})
                                        </span>
                                        <span className="text-xs text-slate-500">{denom.value}</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={cashUsage[denom.id] || 0}
                                        onChange={(e) =>
                                            setCashUsage((prev) => ({
                                                ...prev,
                                                [denom.id]: Number(e.target.value) || 0,
                                            }))
                                        }
                                        className="glass-input mt-2 w-full rounded-lg px-3 py-2 text-sm"
                                        placeholder="Count"
                                    />
                                </div>
                            ))}
                            <div className="glass-card p-3">
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                    Cash total
                                </p>
                                <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
                                    {cashTotal.toLocaleString("en-US")}
                                </p>
                            </div>
                        </div>
                    )}
                    <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <input
                            type="checkbox"
                            checked={deductFromWallet}
                            onChange={(e) => setDeductFromWallet(e.target.checked)}
                            className="h-4 w-4"
                        />
                        Deduct from wallet balance
                    </label>
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