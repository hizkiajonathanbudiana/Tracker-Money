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
        <section className="relative overflow-hidden card-glass mb-20 sm:mb-0">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
            <h2 className="text-xl font-bold mb-6 pl-2 text-slate-900 dark:text-white">
                Recent Transactions
            </h2>

            <div className="space-y-3">
                {loading && (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                )}
                {!loading && expenses.length === 0 && (
                    <div className="text-center py-12 rounded-xl border-2 border-dashed border-gray-200 dark:border-neutral-800">
                        <p className="text-gray-500 dark:text-gray-400 font-medium">
                            No expenses found
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            Add your first expense above!
                        </p>
                    </div>
                )}
                {!loading &&
                    expenses.map((expense) => (
                        <div
                            key={expense.id}
                            className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200"
                        >
                            {editingId === expense.id ? (
                                <div className="w-full space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="number"
                                            value={editAmount}
                                            onChange={(e) => setEditAmount(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black border border-gray-200 dark:border-neutral-700 text-sm font-bold"
                                            placeholder="Amount"
                                        />
                                        <input
                                            type="date"
                                            value={editDate}
                                            onChange={(e) => setEditDate(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black border border-gray-200 dark:border-neutral-700 text-sm"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={editNotes}
                                        onChange={(e) => setEditNotes(e.target.value)}
                                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-black border border-gray-200 dark:border-neutral-700 text-sm"
                                        placeholder="Notes"
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={cancelEdit}
                                            className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-neutral-800"
                                        >
                                            <X size={16} />
                                        </button>
                                        <button
                                            onClick={saveEdit}
                                            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500"
                                        >
                                            <Check size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-start gap-4 mb-3 sm:mb-0">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white text-base">
                                                {expense.category}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                                                <Calendar size={10} />
                                                {formatDate(expense.date)}
                                            </p>
                                            {expense.notes && (
                                                <p className="text-xs text-slate-500 italic mt-1 line-clamp-1">
                                                    {expense.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
                                        <span className="font-black text-lg text-slate-900 dark:text-white">
                                            {formatCurrency(expense.amount)}
                                        </span>
                                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEdit(expense)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(expense.id)}
                                                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
            </div>
        </section>
    );
}