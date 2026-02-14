"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, deleteDoc, Timestamp, updateDoc } from "firebase/firestore";
import { Expense } from "@/types/expense";
import { Trash2, Loader2, Calendar, FileText, Edit3, Check, X } from "lucide-react";

interface ExpenseListProps {
    userId: string;
    expenses: Expense[];
    loading: boolean;
    categories: string[];
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
    categories,
}: ExpenseListProps) {
    const safeCategories = categories.length ? categories : ["Other"];
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editAmount, setEditAmount] = useState("");
    const [editCategory, setEditCategory] = useState("");
    const [editDate, setEditDate] = useState("");
    const [editNotes, setEditNotes] = useState("");

    const handleDelete = async (id: string) => {
        if (!userId) return;
        try {
            const docRef = doc(db, "users", userId, "expenses", id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting document: ", error);
        }
    };

    const startEdit = (expense: Expense) => {
        setEditingId(expense.id);
        setEditAmount(expense.amount.toString());
        setEditCategory(
            safeCategories.includes(expense.category)
                ? expense.category
                : safeCategories[0]
        );
        setEditDate(expense.date.toDate().toISOString().split("T")[0]);
        setEditNotes(expense.notes || "");
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditAmount("");
        setEditCategory("");
        setEditDate("");
        setEditNotes("");
    };

    const saveEdit = async () => {
        if (!editingId || !userId) return;
        const numAmount = parseFloat(editAmount);
        if (Number.isNaN(numAmount) || numAmount <= 0) return;
        try {
            const docRef = doc(db, "users", userId, "expenses", editingId);
            await updateDoc(docRef, {
                amount: numAmount,
                category: editCategory,
                date: new Date(editDate),
                notes: editNotes,
            });
            cancelEdit();
        } catch (error) {
            console.error("Error updating document: ", error);
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
                        <div key={expense.id} className="space-y-3">
                            <div className="glass-card group flex items-center justify-between gap-4 p-5 hover:shadow-lg transition-all duration-200">
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
                                    {expense.cashUsage && Object.keys(expense.cashUsage).length > 0 && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Cash used: {Object.entries(expense.cashUsage)
                                                .filter(([, count]) => count > 0)
                                                .map(([id, count]) => `${id} x${count}`)
                                                .join(", ")}
                                        </p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => startEdit(expense)}
                                        className="glass-button flex-shrink-0 p-3 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-200 hover:scale-110"
                                        aria-label="Edit expense"
                                    >
                                        <Edit3 className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(expense.id)}
                                        className="glass-button flex-shrink-0 p-3 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-all duration-200 hover:scale-110"
                                        aria-label="Delete expense"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            {editingId === expense.id && (
                                <div className="glass-card p-4">
                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                                        <input
                                            type="number"
                                            value={editAmount}
                                            onChange={(e) => setEditAmount(e.target.value)}
                                            className="glass-input rounded-lg px-3 py-2 text-sm"
                                            placeholder="Amount"
                                            aria-label="Edit amount"
                                        />
                                        <select
                                            value={editCategory}
                                            onChange={(e) => setEditCategory(e.target.value)}
                                            className="glass-input rounded-lg px-3 py-2 text-sm"
                                            aria-label="Edit category"
                                        >
                                            {safeCategories.map((cat) => (
                                                <option key={cat} value={cat}>
                                                    {cat}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            type="date"
                                            value={editDate}
                                            onChange={(e) => setEditDate(e.target.value)}
                                            className="glass-input rounded-lg px-3 py-2 text-sm"
                                            aria-label="Edit date"
                                        />
                                        <input
                                            type="text"
                                            value={editNotes}
                                            onChange={(e) => setEditNotes(e.target.value)}
                                            className="glass-input rounded-lg px-3 py-2 text-sm"
                                            placeholder="Notes"
                                            aria-label="Edit notes"
                                        />
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={saveEdit}
                                            className="glass-button-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
                                        >
                                            <Check className="h-4 w-4" />
                                            Save
                                        </button>
                                        <button
                                            type="button"
                                            onClick={cancelEdit}
                                            className="glass-button flex items-center gap-2 rounded-lg px-4 py-2 text-sm"
                                        >
                                            <X className="h-4 w-4" />
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
            </div>
        </div>
    );
}