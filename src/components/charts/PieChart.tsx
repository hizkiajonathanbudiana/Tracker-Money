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