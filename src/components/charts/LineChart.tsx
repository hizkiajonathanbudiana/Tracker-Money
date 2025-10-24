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
    Filler
);

interface LineChartProps {
    expenses: Expense[];
}

const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
};

const processLineChartData = (
    expenses: Expense[]
): ChartData<"line", number[], string> => {
    const labels: string[] = [];
    const dataPoints: number[] = [];
    const dailyTotals: { [key: number]: number } = {};

    let year = new Date().getFullYear();
    let month = new Date().getMonth() + 1;

    if (expenses.length > 0) {
        const firstExpenseDate = expenses[0].date.toDate();
        year = firstExpenseDate.getFullYear();
        month = firstExpenseDate.getMonth() + 1;
    }

    const daysInMonth = getDaysInMonth(year, month);

    for (let i = 1; i <= daysInMonth; i++) {
        labels.push(i.toString());
        dailyTotals[i] = 0;
    }

    expenses.forEach((expense) => {
        const expenseDate = expense.date.toDate();
        const dayOfMonth = expenseDate.getDate();
        dailyTotals[dayOfMonth] += expense.amount;
    });

    labels.forEach((day) => {
        dataPoints.push(dailyTotals[parseInt(day)]);
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
                tension: 0.1,
                pointBackgroundColor: "rgba(59, 130, 246, 1)",
            },
        ],
    };
};

export default function LineChart({ expenses }: LineChartProps) {
    const { theme } = useTheme();
    const chartData = useMemo(
        () => processLineChartData(expenses),
        [expenses]
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