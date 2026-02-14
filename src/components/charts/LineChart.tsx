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
    daysBack: number;
}

const processLineChartData = (
    expenses: Expense[],
    daysBack: number
): ChartData<"line", number[], string> => {
    const labels: string[] = [];
    const dataPoints: number[] = [];
    const dailyTotals: Record<string, number> = {};

    const today = new Date();
    const dates: Date[] = [];
    for (let i = daysBack - 1; i >= 0; i -= 1) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        date.setHours(0, 0, 0, 0);
        dates.push(date);
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
                backgroundColor: "rgba(59, 130, 246, 0.2)",
                borderColor: "rgba(59, 130, 246, 1)",
                tension: 0.2,
                pointBackgroundColor: "rgba(59, 130, 246, 1)",
                pointRadius: 3,
            },
        ],
    };
};

export default function LineChart({ expenses, daysBack }: LineChartProps) {
    const { theme } = useTheme();
    const chartData = useMemo(
        () => processLineChartData(expenses, daysBack),
        [expenses, daysBack]
    );

    const gridColor =
        theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)";
    const textColor = theme === "dark" ? "#e5e7eb" : "#374151";

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        let label = "Day " + context.label || "";
                        if (label) {
                            label += ": ";
                        }
                        if (context.parsed.y !== null) {
                            label += new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: "USD",
                            }).format(context.parsed.y);
                        }
                        return label;
                    },
                },
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: "x" as const,
                },
                zoom: {
                    wheel: {
                        enabled: true,
                    },
                    pinch: {
                        enabled: true,
                    },
                    mode: "x" as const,
                },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    color: textColor,
                },
                grid: {
                    color: gridColor,
                },
            },
            x: {
                title: {
                    display: true,
                    text: "Day of the Month",
                    color: textColor,
                },
                ticks: {
                    color: textColor,
                },
                grid: {
                    color: gridColor,
                },
            },
        },
    };

    return <Line data={chartData} options={options} />;
}