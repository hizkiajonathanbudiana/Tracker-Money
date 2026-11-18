"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ExpenseCategory } from "@/types/expense";
import { CashDenomination } from "@/hooks/useWallet";
import { Plus, Loader2, Minus, ChevronDown, CheckCircle2 } from "lucide-react";
import { useEconomyOverview, useProjectItems, useProjects } from "@/hooks/useEconomy";
import { recordJajanExpense, recordRawMaterialPurchase } from "@/lib/economyOps";
import {
    JAJAN_CATEGORY,
    RAW_MATERIAL_CATEGORY,
    dayLimit,
    remainingAllowance,
} from "@/lib/economy";
import { formatMoney } from "@/lib/money";

interface ExpenseFormProps {
    userId: string;
    categories: string[];
    denominations: CashDenomination[];
    onAdjustBalance?: (delta: number) => Promise<void> | void;
    onUpdateDenominations?: (denominations: CashDenomination[]) => Promise<void> | void;
}

type Purpose = "normal" | "jajan" | "raw_material";

export default function ExpenseForm({
    userId,
    categories,
    denominations,
    onAdjustBalance,
    onUpdateDenominations,
}: ExpenseFormProps) {
    const safeCategories = useMemo(
        () => (categories.length ? categories : ["Other"]),
        [categories]
    );
    const [notes, setNotes] = useState("");
    const [amount, setAmount] = useState("");
    const [category, setCategory] = useState<ExpenseCategory>(safeCategories[0]);
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [useCashBreakdown, setUseCashBreakdown] = useState(false);
    const [deductFromWallet, setDeductFromWallet] = useState(true);
    const [purpose, setPurpose] = useState<Purpose>("normal");
    const [projectId, setProjectId] = useState("");
    const [projectItemId, setProjectItemId] = useState("");
    const [allowOverBudget, setAllowOverBudget] = useState(false);

    const [cashUsage, setCashUsage] = useState<Record<string, number>>({});

    const { settings, day, dayKey: todayKey, loading: economyLoading } = useEconomyOverview(userId);
    const { projects } = useProjects(userId);
    const { items: projectItems } = useProjectItems(userId, projectId);

    const activeProjects = useMemo(
        () => projects.filter((project) => project.status === "active"),
        [projects]
    );
    const selectedProject = useMemo(
        () => projects.find((project) => project.id === projectId) ?? null,
        [projects, projectId]
    );
    const openItems = useMemo(
        () => projectItems.filter((item) => !item.purchased),
        [projectItems]
    );

    useEffect(() => {
        if (safeCategories.length > 0 && !safeCategories.includes(category)) {
            setCategory(safeCategories[0]);
        }
    }, [safeCategories, category]);

    useEffect(() => {
        if (purpose === "jajan" && safeCategories.includes(JAJAN_CATEGORY)) {
            setCategory(JAJAN_CATEGORY);
        }
        if (purpose === "normal" && !useCashBreakdown) {
            setProjectId("");
            setProjectItemId("");
        }
    }, [purpose, safeCategories, useCashBreakdown]);

    useEffect(() => {
        setProjectItemId("");
    }, [projectId]);

    const allowanceLeft = remainingAllowance(day, settings);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        if (!amount || !date) {
            setError("Please fill in Amount, Category, and Date.");
            return;
        }
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            setError("Please enter a valid positive amount.");
            return;
        }
        if (purpose === "raw_material" && (!projectId || !projectItemId)) {
            setError("Pick a project and the raw material you bought.");
            return;
        }

        setLoading(true);

        try {
            if (purpose === "jajan") {
                await recordJajanExpense({
                    userId,
                    settings,
                    dayKey: todayKey,
                    amount: numAmount,
                    notes,
                    category,
                    deductFromWallet,
                });
                setSuccess("Treat recorded against today's allowance.");
            } else if (purpose === "raw_material") {
                await recordRawMaterialPurchase({
                    userId,
                    settings,
                    projectId,
                    projectItemId,
                    amount: numAmount,
                    notes,
                    category: safeCategories.includes(RAW_MATERIAL_CATEGORY)
                        ? RAW_MATERIAL_CATEGORY
                        : category,
                    deductFromWallet,
                    allowOverBudget,
                });
                setSuccess("Raw material booked to the project.");
            } else {
                if (!category) {
                    setError("Please fill in Amount, Category, and Date.");
                    return;
                }
                const expenseData = {
                    uid: userId,
                    notes: notes,
                    amount: numAmount,
                    category,
                    date: new Date(date),
                    createdAt: serverTimestamp(),
                    cashBreakdown: useCashBreakdown ? cashUsage : null,
                };
                await addDoc(collection(db, "users", userId, "expenses"), expenseData);

                if (deductFromWallet && onAdjustBalance) {
                    await onAdjustBalance(-numAmount);
                }

                if (useCashBreakdown && onUpdateDenominations) {
                    const updatedDenoms = denominations.map((denom) => {
                        const usedCount = cashUsage[denom.id] || 0;
                        return {
                            ...denom,
                            count: Math.max(0, denom.count - usedCount),
                        };
                    });
                    await onUpdateDenominations(updatedDenoms);
                }
                setSuccess("Expense added.");
            }

            setNotes("");
            setAmount("");
            setCategory(safeCategories[0]);
            setDate(new Date().toISOString().split("T")[0]);
            setCashUsage({});
            setUseCashBreakdown(false);
            setProjectItemId("");
            setAllowOverBudget(false);
        } catch (err: any) {
            console.error("Error adding document: ", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCashUsageChange = (denomId: string, val: number) => {
        setCashUsage(prev => ({
            ...prev,
            [denomId]: Math.max(0, val)
        }));
    };

    const purposeOptions: Array<{ value: Purpose; label: string; hint: string }> = [
        { value: "normal", label: "Regular expense", hint: "Not counted against the daily treat limit" },
        { value: "jajan", label: "Treat", hint: "Counts against today's limit" },
        { value: "raw_material", label: "Raw material", hint: "Goes to a project, not the limit" },
    ];

    return (
        <section className="relative overflow-hidden card-glass">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
            <h2 className="text-xl font-bold mb-6 pl-2 text-slate-900 dark:text-white">New Expense</h2>

            <div className="mb-6 flex flex-col gap-2 pl-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-500">Purpose</span>
                <div className="flex flex-wrap gap-2">
                    {purposeOptions.map((option) => {
                        const active = purpose === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => setPurpose(option.value)}
                                title={option.hint}
                                className={`rounded-xl px-3 py-2 text-xs font-semibold transition-all border ${
                                    active
                                        ? "border-blue-500 bg-blue-600 text-white"
                                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900"
                                }`}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
                {purpose === "jajan" && (
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        {economyLoading
                            ? "Loading today's allowance..."
                            : `Today's treat allowance left: ${formatMoney(allowanceLeft, settings)} of ${formatMoney(dayLimit(day, settings), settings)}`}
                    </p>
                )}
                {purpose === "raw_material" && (
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Raw materials do not count against the treat limit, but they are still checked
                        against the project budget.
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">

                    {/* AMOUNT */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-500">Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">{settings.currencySymbol}</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-xl text-lg font-bold outline-none border transition-all bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* CATEGORY */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-500">
                            {purpose === "raw_material" ? "Category (optional)" : "Category"}
                        </label>
                        <div className="relative">
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                                className="w-full pl-4 pr-10 py-3.5 rounded-xl text-sm font-medium outline-none border appearance-none cursor-pointer bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            >
                                {safeCategories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" size={16} />
                        </div>
                    </div>

                    {/* DATE */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-500">Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            disabled={purpose !== "normal"}
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                        />
                        {purpose !== "normal" && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                Treats and raw materials are always booked to today (WIB).
                            </p>
                        )}
                    </div>

                    {/* NOTES */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-500">Notes</label>
                        <input
                            type="text"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Optional description..."
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
                        />
                    </div>
                </div>

                {purpose === "raw_material" && (
                    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pl-0">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-500">Project</label>
                            <div className="relative">
                                <select
                                    value={projectId}
                                    onChange={(e) => setProjectId(e.target.value)}
                                    className="w-full pl-4 pr-10 py-3.5 rounded-xl text-sm font-medium outline-none border appearance-none cursor-pointer bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                >
                                    <option value="">— pick a project —</option>
                                    {activeProjects.map((project) => (
                                        <option key={project.id} value={project.id}>
                                            {project.emoji} {project.title}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" size={16} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-500">Raw material</label>
                            <div className="relative">
                                <select
                                    value={projectItemId}
                                    onChange={(e) => setProjectItemId(e.target.value)}
                                    disabled={!projectId}
                                    className="w-full pl-4 pr-10 py-3.5 rounded-xl text-sm font-medium outline-none border appearance-none cursor-pointer bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                                >
                                    <option value="">— pick an item —</option>
                                    {openItems.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name} ({item.quantity} {item.unit})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" size={16} />
                            </div>
                        </div>
                        {selectedProject && (
                            <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span>
                                    Budget used: {formatMoney(selectedProject.spent, settings)} / {formatMoney(selectedProject.budget, settings)}
                                </span>
                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={allowOverBudget}
                                        onChange={(e) => setAllowOverBudget(e.target.checked)}
                                        className="accent-blue-600"
                                    />
                                    Allow going over budget
                                </label>
                            </div>
                        )}
                        {activeProjects.length === 0 && (
                            <p className="sm:col-span-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                                No active projects yet. Create one under Points → Projects.
                            </p>
                        )}
                    </div>
                )}

                {error && (
                    <div className="mb-4 text-sm font-medium text-red-500">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-4 flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" />
                        {success}
                    </div>
                )}

                {/* ADVANCED OPTIONS TOGGLE */}
                <div className="mb-6">
                    {purpose === "normal" && (
                        <button
                            type="button"
                            onClick={() => setUseCashBreakdown(!useCashBreakdown)}
                            className="text-xs font-bold flex items-center gap-1 mb-3 text-blue-600 dark:text-blue-400"
                        >
                            {useCashBreakdown ? 'Hide Cash Breakdown' : 'Show Cash Breakdown'}
                        </button>
                    )}

                    {useCashBreakdown && purpose === "normal" && (
                        <div className="p-4 rounded-xl border mb-4 animate-in fade-in slide-in-from-top-2 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                            <p className="text-xs mb-3 text-gray-500 dark:text-gray-400">Select denominations used:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {denominations.map(denom => (
                                    <div key={denom.id} className="flex flex-col items-center justify-between p-2 rounded border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] font-mono mb-1 text-gray-500">{denom.label}</span>
                                        <div className="flex items-center gap-1">
                                            <button
                                                type="button"
                                                onClick={() => handleCashUsageChange(denom.id, (cashUsage[denom.id] || 0) - 1)}
                                                className="w-7 h-7 flex items-center justify-center rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <input
                                                type="number"
                                                value={cashUsage[denom.id] || ""}
                                                onChange={(e) => handleCashUsageChange(denom.id, parseInt(e.target.value) || 0)}
                                                placeholder="0"
                                                className="w-8 text-center bg-transparent text-sm outline-none font-bold text-slate-900 dark:text-white"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleCashUsageChange(denom.id, (cashUsage[denom.id] || 0) + 1)}
                                                className="w-7 h-7 flex items-center justify-center rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => setDeductFromWallet(!deductFromWallet)}>
                        <div className={`w-11 h-6 rounded-full p-1 transition-colors ${deductFromWallet ? 'bg-blue-600' : 'bg-neutral-600'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${deductFromWallet ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Deduct from wallet balance</span>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl font-bold text-base shadow-lg shadow-blue-900/20 transform transition-all active:scale-[0.98] bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Plus className="h-5 w-5" strokeWidth={3} />
                    )}
                    {loading ? "Adding Expense..." : "Add Expense"}
                </button>
            </form>
        </section>
    );
}
