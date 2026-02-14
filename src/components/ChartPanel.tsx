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

  useEffect(() => {
    const stored = localStorage.getItem(PRESET_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as number[];
        if (parsed.length === 3) {
          setPresets(parsed);
          setActiveRange(parsed[0]);
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, []);

  const filteredExpenses = useMemo(() => {
    if (expenses.length === 0) return [];
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setDate(now.getDate() - (activeRange - 1));
    start.setHours(0, 0, 0, 0);
    return expenses.filter((expense) => {
      const expenseDate = expense.date.toDate();
      return expenseDate >= start && expenseDate <= now;
    });
  }, [expenses, activeRange]);

  const handlePresetChange = (index: number, value: string) => {
    const parsed = parseInt(value, 10);
    setPresets((prev) => {
      const next = [...prev];
      next[index] = Number.isNaN(parsed) ? prev[index] : parsed;
      return next;
    });
  };

  const savePresets = () => {
    const cleaned = presets.map((preset) => Math.max(1, preset));
    setPresets(cleaned);
    localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(cleaned));
    setActiveRange(cleaned[0]);
    setEditingPresets(false);
  };

  const applyCustomRange = () => {
    const parsed = parseInt(customRange, 10);
    if (Number.isNaN(parsed) || parsed <= 0) return;
    setActiveRange(parsed);
    setCustomRange("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Spending Dashboard
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing the last {activeRange} day{activeRange > 1 ? "s" : ""}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {presets.map((preset, index) => (
            <button
              key={`${preset}-${index}`}
              type="button"
              onClick={() => setActiveRange(preset)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${activeRange === preset
                ? "bg-emerald-500 text-white shadow"
                : "bg-white/70 text-slate-700 shadow-sm hover:bg-white dark:bg-slate-900/40 dark:text-slate-200"
                }`}
            >
              {preset} days
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEditingPresets((prev) => !prev)}
            className="rounded-full border border-slate-200/70 px-3 py-2 text-xs font-semibold text-slate-600 transition-all hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
          >
            {editingPresets ? "Done" : "Edit buttons"}
          </button>
        </div>
      </div>

      {editingPresets && (
        <div className="glass-card space-y-3 p-4">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            Customize quick range buttons
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {presets.map((preset, index) => (
              <input
                key={`preset-input-${index}`}
                type="number"
                min="1"
                value={preset}
                onChange={(e) => handlePresetChange(index, e.target.value)}
                className="glass-input rounded-lg px-3 py-2 text-sm"
                placeholder="Days"
              />
            ))}
          </div>
          <button
            type="button"
            onClick={savePresets}
            className="glass-button-primary rounded-xl px-4 py-2 text-sm font-semibold"
          >
            Save preset buttons
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor="chart-custom-range" className="sr-only">
          Custom range in days
        </label>
        <input
          type="number"
          min="1"
          id="chart-custom-range"
          value={customRange}
          onChange={(e) => setCustomRange(e.target.value)}
          className="glass-input rounded-xl px-4 py-2 text-sm"
          placeholder="Custom days"
        />
        <button
          type="button"
          onClick={applyCustomRange}
          className="glass-button rounded-xl px-4 py-2 text-sm font-semibold"
        >
          Apply custom range
        </button>
      </div>

      {filteredExpenses.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          No expenses found for this range.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200/70 bg-white/70 p-4 shadow-sm dark:border-gray-700/70 dark:bg-slate-900/40">
            <h3 className="mb-1 text-center text-lg font-semibold text-gray-800 dark:text-gray-200">
              Daily Spending
            </h3>
            <p className="mb-3 text-center text-xs text-gray-500 dark:text-gray-400">
              Tip: Use scroll or pinch to zoom, drag to pan.
            </p>
            <div className="relative h-64">
              <LineChart expenses={filteredExpenses} daysBack={activeRange} />
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200/70 bg-white/70 p-4 shadow-sm dark:border-gray-700/70 dark:bg-slate-900/40">
            <h3 className="mb-3 text-center text-lg font-semibold text-gray-800 dark:text-gray-200">
              Spending by Category
            </h3>
            <div className="relative mx-auto h-64 max-w-xs">
              <PieChart expenses={filteredExpenses} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}