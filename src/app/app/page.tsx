"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import ExpenseForm from "@/components/ExpenseForm";
import ExpenseList from "@/components/ExpenseList";
import ChartPanel from "@/components/ChartPanel";
import MonthSelector from "@/components/MonthSelector";
import StatCard from "@/components/StatCard";
import { useExpenses } from "@/hooks/useExpenses";
import {
    Loader2,
    BarChart2,
    EyeOff,
    ArrowRight,
    DollarSign,
    TrendingUp,
    ArrowUpCircle,
    Tag,
} from "lucide-react";
import { Expense, ExpenseCategory } from "@/types/expense";

const getYearMonth = (date: Date) => {
    return date.toISOString().slice(0, 7);
};

const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
    });
};

const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
};

export default function AppPage() {
    const { user } = useAuth();
    const router = useRouter();

    // Early return BEFORE any other hooks to prevent hooks order mismatch
    if (!user) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!user.emailVerified) {
        return (
            <div className="flex h-[80vh] w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
            </div>
        );
    }

    const [selectedMonth, setSelectedMonth] = useState(getYearMonth(new Date()));
    const [chartsVisible, setChartsVisible] = useState(false);

    const {
        expenses,
        loading: expensesLoading,
        error: expensesError,
    } = useExpenses(user.uid);

    const monthlyExpenses = useMemo(() => {
        return expenses.filter(
            (expense) => getYearMonth(expense.date.toDate()) === selectedMonth
        );
    }, [expenses, selectedMonth]);

    const stats = useMemo(() => {
        const totalSpend = monthlyExpenses.reduce(
            (acc, exp) => acc + exp.amount,
            0
        );

        const [year, month] = selectedMonth.split("-").map(Number);
        const daysInMonth = getDaysInMonth(year, month);
        const avgSpendPerDay = totalSpend === 0 ? 0 : totalSpend / daysInMonth;

        const biggestExpense = monthlyExpenses.reduce(
            (max, exp) => (exp.amount > max.amount ? exp : max),
            { amount: 0, notes: "N/A" } as Expense
        );

        const categoryTotals: Record<ExpenseCategory, number> = {} as any;
        monthlyExpenses.forEach((exp) => {
            categoryTotals[exp.category] =
                (categoryTotals[exp.category] || 0) + exp.amount;
        });

        const topCategory = Object.entries(categoryTotals).reduce(
            (max, [cat, amount]) => (amount > max.amount ? { cat, amount } : max),
            { cat: "N/A", amount: 0 }
        );

        return {
            totalSpend,
            avgSpendPerDay,
            biggestExpense,
            topCategory,
        };
    }, [monthlyExpenses, selectedMonth]);

    useEffect(() => {
        // This useEffect should not be needed since we already check emailVerified above
        // but keeping it as backup in case user state changes after component mounts
        if (user && !user.emailVerified) {
            router.push("/verify-email");
        }
    }, [user, router]);

    const recentExpenses = useMemo(() => {
        return monthlyExpenses.slice(0, 5);
    }, [monthlyExpenses]);

    return (
        <div className="flex flex-col gap-6">
            <div className="card-glass">
                <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">
                    Monthly Summary
                </h2>
                <MonthSelector
                    expenses={expenses}
                    selectedMonth={selectedMonth}
                    setSelectedMonth={setSelectedMonth}
                />
                <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                    <StatCard
                        title="Total Spending"
                        value={formatCurrency(stats.totalSpend)}
                        icon={<DollarSign size={20} />}
                    />
                    <StatCard
                        title="Avg. Spend / Day"
                        value={formatCurrency(stats.avgSpendPerDay)}
                        icon={<TrendingUp size={20} />}
                    />
                    <StatCard
                        title="Biggest Expense"
                        value={formatCurrency(stats.biggestExpense.amount)}
                        icon={<ArrowUpCircle size={20} />}
                        description={stats.biggestExpense.notes || "N/A"}
                    />
                    <StatCard
                        title="Top Category"
                        value={stats.topCategory.cat}
                        icon={<Tag size={20} />}
                        description={formatCurrency(stats.topCategory.amount)}
                    />
                </div>
            </div>

            <ExpenseForm userId={user.uid} />

            <div className="card-glass">
                <button
                    onClick={() => setChartsVisible(!chartsVisible)}
                    className="glass-button flex w-full items-center justify-between rounded-xl p-4 text-lg font-semibold text-slate-800 transition-all duration-200 hover:scale-[1.01] dark:text-slate-100"
                >
                    <div className="flex items-center gap-3">
                        <BarChart2 className="h-5 w-5" />
                        <span>Spending Charts</span>
                    </div>
                    {chartsVisible ? (
                        <EyeOff className="h-5 w-5 text-slate-500" />
                    ) : (
                        <BarChart2 className="h-5 w-5 text-slate-500" />
                    )}
                </button>

                {chartsVisible && (
                    <div className="mt-4 space-y-4">
                        {expensesLoading && (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                                <span className="ml-2 text-gray-500 dark:text-gray-400">
                                    Loading charts...
                                </span>
                            </div>
                        )}
                        {!expensesLoading && !expensesError && (
                            <ChartPanel expenses={monthlyExpenses} />
                        )}
                        {expensesError && (
                            <p className="text-center text-red-500">{expensesError}</p>
                        )}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-4">
                <ExpenseList
                    userId={user.uid}
                    expenses={recentExpenses}
                    loading={expensesLoading}
                />
                {monthlyExpenses.length > 5 && (
                    <button
                        onClick={() => router.push(`/app/all-expenses?month=${selectedMonth}`)}
                        className="glass-button group flex items-center justify-center gap-3 rounded-xl p-4 text-center font-medium text-blue-600 transition-all duration-200 hover:scale-[1.02] hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        View All Transactions for this Month
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                )}
            </div>
        </div>
    );
}