"use client";

import { db } from "@/lib/firebase";
import { doc, deleteDoc, Timestamp } from "firebase/firestore";
import { Expense } from "@/types/expense";
import { Trash2, Loader2, Calendar, FileText } from "lucide-react";

interface ExpenseListProps {
    userId: string;
    expenses: Expense[];
    loading: boolean;
}

const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
    });
};

const formatDate = (timestamp: Timestamp) => {
    return timestamp.toDate().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
};

export default function ExpenseList({
    userId,
    expenses,
    loading,
}: ExpenseListProps) {
    const handleDelete = async (id: string) => {
        if (!userId) return;
        try {
            const docRef = doc(db, "users", userId, "expenses", id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    };

    return (
        <div className="card-glass">
            <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
                Recent Expenses
            </h2>
            <div className="space-y-4">
                {loading && (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500 dark:text-blue-400" />
                    </div>
                )}
                {!loading && expenses.length === 0 && (
                    <p className="text-center text-slate-600 dark:text-slate-400 py-8">
                        No expenses found. Add your first expense above!
                    </p>
                )}
                {!loading &&
                    expenses.map((expense) => (
                        <div
                            key={expense.id}
                            className="glass-card group flex items-center justify-between gap-4 p-5 hover:shadow-lg transition-all duration-200"
                        >
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                        {expense.category}
                                    </h3>
                                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                                        {formatCurrency(expense.amount)}
                                    </span>
                                </div>
                                <div className="flex flex-col text-sm text-slate-600 dark:text-slate-400 sm:flex-row sm:gap-6">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        {formatDate(expense.date)}
                                    </div>
                                    {expense.notes && (
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            <span className="truncate">{expense.notes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => handleDelete(expense.id)}
                                className="glass-button flex-shrink-0 p-3 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-all duration-200 hover:scale-110"
                                aria-label="Delete expense"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    ))}
            </div>
        </div>
    );
}