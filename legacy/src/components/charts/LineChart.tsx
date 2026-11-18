"use client";

import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ChartData,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { Expense } from "@/types/expense";
import { useTheme } from "next-themes";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    zoomPlugin
);

interface LineChartProps {
    expenses: Expense[];
    daysBack?: number;
    rangeStart?: Date;
    rangeEnd?: Date;
}

const processLineChartData = (
    expenses: Expense[],
    daysBack: number,
    rangeStart?: Date,
    rangeEnd?: Date
): ChartData<"line", number[], string> => {
    const labels: string[] = [];
    const dataPoints: number[] = [];
    const dailyTotals: Record<string, number> = {};

    const dates: Date[] = [];

    if (rangeStart && rangeEnd) {
        const cursor = new Date(rangeStart);
        cursor.setHours(0, 0, 0, 0);
        const end = new Date(rangeEnd);
        end.setHours(0, 0, 0, 0);

        while (cursor <= end) {
            dates.push(new Date(cursor));
            cursor.setDate(cursor.getDate() + 1);
        }
    } else {
        const today = new Date();
        for (let i = daysBack - 1; i >= 0; i -= 1) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            date.setHours(0, 0, 0, 0);
            dates.push(date);
        }
    }

    dates.forEach((date) => {
        const key = date.toISOString().split("T")[0];
        dailyTotals[key] = 0;
        labels.push(
            date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            })
        );
    });

    expenses.forEach((expense) => {
        const expenseDate = expense.date.toDate();
        const key = expenseDate.toISOString().split("T")[0];
        if (dailyTotals[key] !== undefined) {
            dailyTotals[key] += expense.amount;
        }
    });

    Object.keys(dailyTotals).forEach((key) => {
        dataPoints.push(dailyTotals[key]);
    });

    return {
        labels,
        datasets: [
            {
                label: "Spending",
                data: dataPoints,
                fill: true,
                backgroundColor: (context: any) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, "rgba(59, 130, 246, 0.5)"); // Blue 500
                    gradient.addColorStop(1, "rgba(59, 130, 246, 0.0)");
                    return gradient;
                },
                borderColor: "#3b82f6", // Blue 500
                borderWidth: 2,
                tension: 0.4, // Smooth curve
                pointBackgroundColor: "#3b82f6",
                pointRadius: 0, // No points by default
                pointHoverRadius: 6,
                pointHoverBackgroundColor: "#fff",
                pointHoverBorderColor: "#3b82f6",
                pointHoverBorderWidth: 3,
            },
        ],
    };
};

export default function LineChart({ expenses, daysBack = 7, rangeStart, rangeEnd }: LineChartProps) {
    const { theme } = useTheme();
    const chartData = useMemo(
        () => processLineChartData(expenses, daysBack, rangeStart, rangeEnd),
        [expenses, daysBack, rangeEnd, rangeStart]
    );

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: "rgba(0,0,0,0.9)",
                padding: 12,
                titleFont: {
                    size: 13,
                    family: "'Inter', sans-serif",
                },
                bodyFont: {
                    size: 14,
                    family: "'Inter', sans-serif",
                    weight: 700,
                },
                cornerRadius: 8,
                displayColors: false,
                callbacks: {
                    label: (context: any) => `$${context.parsed.y.toFixed(2)}`,
                },
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    maxTicksLimit: 7,
                    font: {
                        size: 10,
                    },
                    color: theme === "dark" ? "#525252" : "#9ca3af",
                },
                border: {
                    display: false,
                },
            },
            y: {
                beginAtZero: true,
                grid: {
                    color: theme === "dark" ? "#262626" : "#f3f4f6",
                },
                ticks: {
                    font: {
                        size: 10,
                    },
                    color: theme === "dark" ? "#525252" : "#9ca3af",
                    callback: (value: any) => `$${value}`,
                },
                border: {
                    display: false,
                },
            },
        },
        interaction: {
            mode: "index" as const,
            intersect: false,
        },
    };

    return <Line data={chartData} options={options} />;
}