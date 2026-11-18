"use client";

import { useEffect, useMemo, useState } from "react";
import { Expense } from "@/types/expense";
import LineChart from "./charts/LineChart";
import PieChart from "./charts/PieChart";

interface ChartPanelProps {
  expenses: Expense[];
}

const DEFAULT_PRESETS = [7, 14, 3];
const PRESET_STORAGE_KEY = "chart-presets";

export default function ChartPanel({ expenses }: ChartPanelProps) {
  const [presets, setPresets] = useState<number[]>(DEFAULT_PRESETS);
  const [activeRange, setActiveRange] = useState(7);
  const [editingPresets, setEditingPresets] = useState(false);
  const [customRange, setCustomRange] = useState("");
  const [editPresets, setEditPresets] = useState<string[]>(
    DEFAULT_PRESETS.map((preset) => preset.toString())
  );
  const [rangeMode, setRangeMode] = useState<"days" | "month">("days");

  useEffect(() => {
    const stored = localStorage.getItem(PRESET_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as number[];
        if (parsed.length === 3) {
          setPresets(parsed);
          setActiveRange(parsed[0]);
          setEditPresets(parsed.map((preset) => preset.toString()));
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, []);


  const { rangeStart, rangeEnd } = useMemo(() => {
    const now = new Date();
    if (rangeMode === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { rangeStart: start, rangeEnd: end };
    }

    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(end.getDate() - (activeRange - 1));
    start.setHours(0, 0, 0, 0);
    return { rangeStart: start, rangeEnd: end };
  }, [activeRange, rangeMode]);

  const filteredExpenses = useMemo(() => {
    if (expenses.length === 0) return [];
    return expenses.filter((expense) => {
      const expenseDate = expense.date.toDate();
      return expenseDate >= rangeStart && expenseDate <= rangeEnd;
    });
  }, [expenses, rangeEnd, rangeStart]);

  return (
    <section className="relative overflow-hidden card-glass">
      <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>
      <div className="p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold pl-2 text-slate-900 dark:text-white">
            Analytics
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border border-slate-200/70 dark:border-slate-700/70 bg-white/80 dark:bg-slate-900/70 p-1">
              {presets.map((days, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setRangeMode("days");
                    setActiveRange(days);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${activeRange === days
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                >
                  {days} Days
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={customRange}
                onChange={(event) => setCustomRange(event.target.value.replace(/[^0-9]/g, ""))}
                placeholder="Custom days"
                className="w-28 rounded-lg glass-input px-3 py-2 text-xs font-semibold"
              />
              <button
                onClick={() => {
                  const parsed = parseInt(customRange, 10);
                  if (!Number.isNaN(parsed) && parsed > 0) {
                    setRangeMode("days");
                    setActiveRange(parsed);
                  }
                }}
                className="glass-button px-3 py-2 text-xs font-semibold"
              >
                Apply
              </button>
            </div>

            <button
              onClick={() => {
                const now = new Date();
                const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                setRangeMode("month");
                setActiveRange(daysInMonth);
              }}
              className="glass-button px-3 py-2 text-xs font-semibold"
            >
              This Month
            </button>

            <button
              onClick={() => {
                if (editingPresets) {
                  const updated = editPresets.map((value, idx) => {
                    const parsed = parseInt(value, 10);
                    if (!Number.isNaN(parsed) && parsed > 0) {
                      return parsed;
                    }
                    return presets[idx];
                  });
                  setPresets(updated);
                  setActiveRange(updated[0]);
                  localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(updated));
                  setEditingPresets(false);
                } else {
                  setEditPresets(presets.map((preset) => preset.toString()));
                  setEditingPresets(true);
                }
              }}
              className="glass-button px-3 py-2 text-xs font-semibold"
            >
              {editingPresets ? "Done" : "Edit"}
            </button>
          </div>
        </div>

        {editingPresets && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {editPresets.map((value, idx) => (
              <label key={idx} className="flex flex-col gap-1 text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                Preset {idx + 1}
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={value}
                  onChange={(event) => {
                    const next = [...editPresets];
                    next[idx] = event.target.value.replace(/[^0-9]/g, "");
                    setEditPresets(next);
                  }}
                  className="rounded-lg glass-input px-3 py-2 text-sm font-semibold"
                />
              </label>
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div className="bg-white/80 dark:bg-slate-900/70 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Total Spending ({rangeMode === "month" ? "This Month" : `${activeRange} days`})
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                $
                {filteredExpenses
                  .reduce((acc, curr) => acc + curr.amount, 0)
                  .toLocaleString()}
              </p>
            </div>

            <div className="h-[260px] w-full">
              <LineChart
                expenses={expenses}
                daysBack={rangeMode === "days" ? activeRange : undefined}
                rangeStart={rangeMode === "month" ? rangeStart : undefined}
                rangeEnd={rangeMode === "month" ? rangeEnd : undefined}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/70 p-4">
            <h3 className="text-sm font-bold mb-4 text-slate-900 dark:text-white">
              Category Breakdown
            </h3>
            <div className="h-[280px] w-full flex items-center justify-center">
              <PieChart expenses={filteredExpenses} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}