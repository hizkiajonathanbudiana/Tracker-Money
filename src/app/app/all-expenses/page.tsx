"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useExpenses } from "@/hooks/useExpenses";
import ExpenseList from "@/components/ExpenseList";
import MonthSelector from "@/components/MonthSelector";
import { Loader2, ArrowLeft, FileDown } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EXPENSE_CATEGORIES, ExpenseCategory } from "@/types/expense";
import { exportToCSV } from "@/lib/csvExporter";

const getYearMonth = (date: Date) => {
    return date.toISOString().slice(0, 7);
};

const getISODate = (date: Date) => {
    return date.toISOString().split("T")[0];
};

function AllExpensesContent() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const initialMonth =
        searchParams.get("month") || getYearMonth(new Date());

    const {
        expenses,
        loading: expensesLoading,
        error: expensesError,
    } = useExpenses(user ? user.uid : "");

    const [selectedMonth, setSelectedMonth] = useState(initialMonth);
    const [selectedCategory, setSelectedCategory] =
        useState<ExpenseCategory | "All">("All");

    const [startDate, setStartDate] = useState(getISODate(new Date()));
    const [endDate, setEndDate] = useState(getISODate(new Date()));

    useEffect(() => {
        const monthFromURL = searchParams.get("month");
        if (monthFromURL) {
            setSelectedMonth(monthFromURL);
        }
    }, [searchParams]);

    const filteredExpenses = useMemo(() => {
        return expenses.filter((expense) => {
            const expenseMonth = getYearMonth(expense.date.toDate());
            const monthMatch = expenseMonth === selectedMonth;
            const categoryMatch =
                selectedCategory === "All" || expense.category === selectedCategory;
            return monthMatch && categoryMatch;
        });
    }, [expenses, selectedMonth, selectedCategory]);

    const handleMonthlyExport = () => {
        const fileName = `expenses_${selectedMonth}.csv`;
        exportToCSV(filteredExpenses, fileName);
    };

    const handleCustomExport = () => {
        if (!startDate || !endDate) {
            alert("Please select both a start and end date.");
            return;
        }

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        if (start > end) {
            alert("Start date cannot be after end date.");
            return;
        }

        const customFilteredExpenses = expenses.filter((expense) => {
            const expenseDate = expense.date.toDate();
            return expenseDate >= start && expenseDate <= end;
        });

        const fileName = `expenses_custom_${startDate}_to_${endDate}.csv`;
        exportToCSV(customFilteredExpenses, fileName);
    };

    if (!user) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <Link
                href="/app"
                className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
            </Link>

            <div className="card-glass">
                <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    Monthly View & Export
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <MonthSelector
                        expenses={expenses}
                        selectedMonth={selectedMonth}
                        setSelectedMonth={setSelectedMonth}
                    />
                    <div>
                        <label
                            htmlFor="categoryFilter"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Filter by Category
                        </label>
                        <select
                            id="categoryFilter"
                            value={selectedCategory}
                            onChange={(e) =>
                                setSelectedCategory(e.target.value as ExpenseCategory | "All")
                            }
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        >
                            <option value="All">All Categories</option>
                            {EXPENSE_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <button
                    onClick={handleMonthlyExport}
                    disabled={expensesLoading || filteredExpenses.length === 0}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <FileDown className="h-5 w-5" />
                    Export {filteredExpenses.length} items (Monthly)
                </button>
            </div>

            <div className="card-glass">
                <h2 className="mb-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                    Custom Date Range Export
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label
                            htmlFor="startDate"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            Start Date
                        </label>
                        <input
                            type="date"
                            id="startDate"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="endDate"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                            End Date
                        </label>
                        <input
                            type="date"
                            id="endDate"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        />
                    </div>
                </div>
                <button
                    onClick={handleCustomExport}
                    disabled={expensesLoading}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <FileDown className="h-5 w-5" />
                    Export Custom Range
                </button>
            </div>

            {expensesError && (
                <p className="text-center text-red-500">{expensesError}</p>
            )}

            <ExpenseList
                userId={user.uid}
                expenses={filteredExpenses}
                loading={expensesLoading}
            />
        </div>
    );
}

export default AllExpensesContent;