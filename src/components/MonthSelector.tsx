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
        <div>
            <label
                htmlFor="monthFilter"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
                Filter by Month
            </label>
            <select
                id="monthFilter"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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