"use client";

import { useMemo } from "react";
import { Pie } from "react-chartjs-2";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    ChartData,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { Expense, EXPENSE_CATEGORIES } from "@/types/expense";
import { useTheme } from "next-themes"; // Impor useTheme

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface PieChartProps {
    expenses: Expense[];
}

const CATEGORY_COLORS = {
    "Food & Beverage": "#3B82F6",
    Shopping: "#EC4899",
    Transport: "#F59E0B",
    Bills: "#EF4444",
    Other: "#8B5CF6",
};

const processPieChartData = (
    expenses: Expense[]
): ChartData<"pie", number[], string> => {
    const categoryTotals: { [key: string]: number } = {};

    EXPENSE_CATEGORIES.forEach((cat) => {
        categoryTotals[cat] = 0;
    });

    expenses.forEach((expense) => {
        if (categoryTotals.hasOwnProperty(expense.category)) {
            categoryTotals[expense.category] += expense.amount;
        }
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const backgroundColors = labels.map(
        (label) =>
            CATEGORY_COLORS[label as keyof typeof CATEGORY_COLORS] || "#6B7280"
    );

    return {
        labels,
        datasets: [
            {
                label: "Spending by Category",
                data,
                backgroundColor: backgroundColors,
                borderColor: "#ffffff",
                borderWidth: 1,
            },
        ],
    };
};

export default function PieChart({ expenses }: PieChartProps) {
    const { theme } = useTheme(); // Dapatkan tema saat ini
    const chartData = useMemo(() => processPieChartData(expenses), [expenses]);
    const totalSpend = useMemo(
        () => expenses.reduce((acc, exp) => acc + exp.amount, 0),
        [expenses]
    );

    // Atur warna teks legenda berdasarkan tema
    const legendColor = theme === "dark" ? "#9ca3af" : "#4b5563"; // gray-400 / gray-600

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "top" as const,
                labels: {
                    color: legendColor, // Gunakan warna dinamis
                },
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        let label = context.label || "";
                        if (label) {
                            label += ": ";
                        }
                        if (context.parsed !== null) {
                            label += new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                            }).format(context.parsed);
                        }
                        return label;
                    },
                },
            },
            datalabels: {
                formatter: (value: number, ctx: any) => {
                    if (totalSpend === 0) return "0%";
                    const percentage = ((value / totalSpend) * 100).toFixed(1) + "%";
                    return (value / totalSpend) * 100 > 5 ? percentage : "";
                },
                color: "#fff",
                font: {
                    weight: "bold" as "bold",
                },
            },
        },
    };

    return <Pie data={chartData} options={options} />;
}