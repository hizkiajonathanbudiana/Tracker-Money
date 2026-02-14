import { useMemo } from "react";
import { Expense } from "@/types/expense";

interface MonthSelectorProps {
    expenses: Expense[];
    selectedMonth: string;
    setSelectedMonth: (month: string) => void;
}

const getYearMonth = (date: Date) => {
    return date.toISOString().slice(0, 7);
};

const formatMonthDisplay = (yearMonth: string) => {
    const [year, month] = yearMonth.split("-");
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString("en-US", { month: "long", year: "numeric" });
};

export default function MonthSelector({
    expenses,
    selectedMonth,
    setSelectedMonth,
}: MonthSelectorProps) {
    const uniqueMonths = useMemo(() => {
        const months = new Set<string>();
        months.add(getYearMonth(new Date()));
        expenses.forEach((expense) => {
            months.add(getYearMonth(expense.date.toDate()));
        });
        return Array.from(months).sort((a, b) => b.localeCompare(a));
    }, [expenses]);

    return (
        <div className="mt-3">
            <label
                htmlFor="monthFilter"
                className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
            >
                Filter by Month
            </label>
            <select
                id="monthFilter"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="mt-2 block w-full rounded-lg glass-input px-3 py-2 text-sm font-semibold focus:ring-0"
            >
                {uniqueMonths.map((month) => (
                    <option key={month} value={month}>
                        {formatMonthDisplay(month)}
                    </option>
                ))}
            </select>
        </div>
    );
}