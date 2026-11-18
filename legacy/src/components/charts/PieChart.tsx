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
import { Expense } from "@/types/expense";
import { useTheme } from "next-themes"; // Impor useTheme

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface PieChartProps {
    expenses: Expense[];
}

const BASE_COLORS = [
    "#3B82F6",
    "#EC4899",
    "#F59E0B",
    "#10B981",
    "#8B5CF6",
    "#EF4444",
    "#14B8A6",
    "#F97316",
];

const hashString = (value: string) => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
        hash = value.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash);
};

const getCategoryColor = (category: string) => {
    const idx = hashString(category) % BASE_COLORS.length;
    return BASE_COLORS[idx];
};

const processPieChartData = (
    expenses: Expense[]
): ChartData<"pie", number[], string> => {
    const categoryTotals: { [key: string]: number } = {};

    expenses.forEach((expense) => {
        categoryTotals[expense.category] =
            (categoryTotals[expense.category] || 0) + expense.amount;
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);
    const backgroundColors = labels.map((label) => getCategoryColor(label));

    return {
        labels,
        datasets: [
            {
                label: "Spending by Category",
                data,
                backgroundColor: backgroundColors,
                borderWidth: 0,
                hoverOffset: 15,
            },
        ],
    };
};

export default function PieChart({ expenses }: PieChartProps) {
    const { theme } = useTheme();
    const isDark =
        theme === "dark" ||
        (typeof window !== "undefined" &&
            document.documentElement.classList.contains("dark"));

    const chartData = useMemo(() => {
        const data = processPieChartData(expenses);
        if (data.datasets[0]) {
            data.datasets[0].borderColor = isDark ? "#171717" : "#ffffff";
            data.datasets[0].borderWidth = 2;
        }
        return data;
    }, [expenses, isDark]);

    const totalSpend = useMemo(
        () => expenses.reduce((acc, exp) => acc + exp.amount, 0),
        [expenses]
    );

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "right" as const,
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    padding: 20,
                    font: {
                        size: 11,
                        family: "'Inter', sans-serif",
                        weight: 600,
                    },
                    color: isDark ? "#d4d4d4" : "#4b5563",
                },
            },
            tooltip: {
                backgroundColor: "rgba(0,0,0,0.9)",
                padding: 12,
                titleFont: {
                    size: 13,
                },
                bodyFont: {
                    size: 13,
                    weight: 700,
                },
                cornerRadius: 8,
                callbacks: {
                    label: (context: any) => {
                        const value = context.parsed;
                        const percentage = ((value / totalSpend) * 100).toFixed(1);
                        return ` $${value.toLocaleString()} (${percentage}%)`;
                    },
                },
            },
            datalabels: {
                display: false, // Cleaner look without dynamic labels on the chart
            },
        },
    };

    if (expenses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p className="text-sm">No data available</p>
            </div>
        );
    }

    return <Pie data={chartData} options={options} />;
}