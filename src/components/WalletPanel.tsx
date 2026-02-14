"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Save, Trash2, Minus } from "lucide-react";
import { CashDenomination } from "@/hooks/useWallet";

interface WalletPanelProps {
    balance: number;
    denominations: CashDenomination[];
    onUpdateBalance: (value: number) => Promise<void> | void;
    onUpdateDenominations: (denominations: CashDenomination[]) => Promise<void> | void;
    onAddIncome: (amount: number, note?: string) => Promise<void> | void;
    showHeader?: boolean;
}

export default function WalletPanel({
    balance,
    denominations,
    onUpdateBalance,
    onUpdateDenominations,
    onAddIncome,
    showHeader = true,
}: WalletPanelProps) {
    const [balanceInput, setBalanceInput] = useState(balance.toString());
    const [denomDrafts, setDenomDrafts] = useState<CashDenomination[]>(denominations);
    const [incomeAmount, setIncomeAmount] = useState("");
    const [incomeNote, setIncomeNote] = useState("");
    const [savingIncome, setSavingIncome] = useState(false);
    const [savingDenoms, setSavingDenoms] = useState(false);
    const [showDenominations, setShowDenominations] = useState(true);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const cashTotal = useMemo(
        () => denomDrafts.reduce((acc, denom) => acc + denom.value * denom.count, 0),
        [denomDrafts]
    );

    useEffect(() => {
        setBalanceInput(balance.toString());
    }, [balance]);

    useEffect(() => {
        setDenomDrafts(denominations);
    }, [denominations]);

    const handleBalanceSave = async () => {
        const parsed = parseFloat(balanceInput);
        if (Number.isNaN(parsed)) return;
        setStatusMessage(null);
        try {
            await onUpdateBalance(parsed);
            setStatusMessage("Balance saved.");
        } catch (error) {
            console.error(error);
            setStatusMessage("Failed to save balance.");
        }
    };

    const handleIncome = async () => {
        const parsed = parseFloat(incomeAmount);
        if (Number.isNaN(parsed) || parsed <= 0) return;
        setSavingIncome(true);
        setStatusMessage(null);
        try {
            await onAddIncome(parsed, incomeNote);
            setIncomeAmount("");
            setIncomeNote("");
            setStatusMessage("Income added.");
        } catch (error) {
            console.error(error);
            setStatusMessage("Failed to add income.");
        } finally {
            setSavingIncome(false);
        }
    };

    const handleDenomChange = (
        id: string,
        field: keyof CashDenomination,
        value: string
    ) => {
        setDenomDrafts((prev) =>
            prev.map((denom) => {
                if (denom.id !== id) return denom;
                if (field === "value" || field === "count") {
                    return {
                        ...denom,
                        [field]: Number(value) || 0,
                    };
                }
                return { ...denom, [field]: value } as CashDenomination;
            })
        );
    };

    const handleAddDenom = async () => {
        const next = [
            ...denomDrafts,
            {
                id: `custom-${Date.now()}`,
                label: "Custom",
                value: 0,
                type: "coin" as const,
                count: 0,
            },
        ];
        setDenomDrafts(next);
        setSavingDenoms(true);
        setStatusMessage(null);
        try {
            await onUpdateDenominations(next);
            setStatusMessage("Denomination added.");
        } catch (error) {
            console.error(error);
            setStatusMessage("Failed to add denomination.");
        } finally {
            setSavingDenoms(false);
        }
    };

    const handleRemoveDenom = async (id: string) => {
        const next = denomDrafts.filter((denom) => denom.id !== id);
        setDenomDrafts(next);
        setSavingDenoms(true);
        setStatusMessage(null);
        try {
            await onUpdateDenominations(next);
            setStatusMessage("Denomination removed.");
        } catch (error) {
            console.error(error);
            setStatusMessage("Failed to remove denomination.");
        } finally {
            setSavingDenoms(false);
        }
    };

    const handleSaveDenoms = async () => {
        setSavingDenoms(true);
        setStatusMessage(null);
        try {
            const cleaned = denomDrafts.map((denom) => ({
                ...denom,
                value: Number.isFinite(denom.value) ? Math.max(0, denom.value) : 0,
                count: Number.isFinite(denom.count) ? Math.max(0, denom.count) : 0,
                label: denom.label.trim() || "Custom",
            }));
            setDenomDrafts(cleaned);
            await onUpdateDenominations(cleaned);
            setStatusMessage("Denominations saved.");
        } catch (error) {
            console.error(error);
            setStatusMessage("Failed to save denominations.");
        } finally {
            setSavingDenoms(false);
        }
    };

    const incrementDenom = (id: string, currentCount: number) => {
        handleDenomChange(id, "count", (currentCount + 1).toString());
    };

    const decrementDenom = (id: string, currentCount: number) => {
        handleDenomChange(id, "count", Math.max(0, currentCount - 1).toString());
    };

    return (
        <section className="card-glass transition-colors duration-200">
            {showHeader && (
                <div
                    className="flex justify-between items-center mb-4 cursor-pointer select-none"
                    onClick={() => setShowDenominations(!showDenominations)}
                >
                    <h2 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <span className="text-blue-600 dark:text-blue-400">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v5" /><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" /><path d="M12 12v.01" /></svg>
                            </span>
                        </div>
                        Wallet
                    </h2>
                    <button className="glass-button p-1 rounded-md text-gray-600 dark:text-gray-300">
                        {showDenominations ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                </div>
            )}

            {showDenominations && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">

                    {/* CURRENT BALANCE CARD */}
                    <div className="relative overflow-hidden rounded-xl border border-blue-500/30 dark:border-blue-400/30 bg-gradient-to-br from-blue-600 to-indigo-700 p-5 text-white shadow-lg shadow-blue-900/20">
                        <div className="relative z-10">
                            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-blue-100">Current Balance</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-medium opacity-80">$</span>
                                <input
                                    type="number"
                                    value={balanceInput}
                                    onChange={(e) => setBalanceInput(e.target.value)}
                                    onBlur={handleBalanceSave}
                                    className="w-full bg-transparent text-3xl sm:text-4xl font-extrabold tracking-tight outline-none placeholder-blue-300/50"
                                />
                            </div>
                            {statusMessage && (
                                <p className="mt-2 text-xs font-medium text-emerald-300 animate-pulse">
                                    {statusMessage}
                                </p>
                            )}
                        </div>
                        {/* Decorative background circles */}
                        <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
                        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-24 w-24 rounded-full bg-blue-500/20 blur-xl"></div>
                    </div>

                    {/* ADD INCOME SECTION */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-500">
                            Quick Add
                        </label>
                        <div className="flex gap-2">
                            <div className="relative w-1/3">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={incomeAmount}
                                    onChange={(e) => setIncomeAmount(e.target.value)}
                                    className="w-full pl-7 pr-3 py-2.5 rounded-lg text-sm font-bold glass-input"
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Income source..."
                                value={incomeNote}
                                onChange={(e) => setIncomeNote(e.target.value)}
                                className="flex-1 px-3 py-2.5 rounded-lg text-sm glass-input"
                            />
                        </div>
                        <button
                            onClick={handleIncome}
                            disabled={savingIncome}
                            className="glass-button-primary w-full py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        >
                            {savingIncome ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                                <Plus size={16} />
                            )}
                            Add Funds
                        </button>
                    </div>

                    {/* DENOMINATIONS LIST */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-end px-1 mb-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-neutral-500">
                                Cash Drawer
                            </label>
                            <div className="text-right">
                                <p className="text-[10px] text-gray-400 uppercase font-bold">Total Physical</p>
                                <p className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                    ${cashTotal.toLocaleString()}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {denomDrafts.map((denom) => (
                                <div
                                    key={denom.id}
                                    className="flex items-center justify-between p-2 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-700/60"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${denom.value >= 100
                                            ? 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                                            : 'bg-yellow-100/80 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            {denom.value >= 100 ? '💵' : '🪙'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">
                                                {denom.label}
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-mono">
                                                Val: {denom.value}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => decrementDenom(denom.id, denom.count)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active:scale-95"
                                        >
                                            <Minus size={14} />
                                        </button>

                                        <input
                                            type="number"
                                            value={denom.count === 0 ? "" : denom.count}
                                            onChange={(e) => handleDenomChange(denom.id, "count", e.target.value)}
                                            placeholder="0"
                                            className="w-10 text-center bg-transparent font-bold text-slate-900 dark:text-white outline-none"
                                        />

                                        <button
                                            onClick={() => incrementDenom(denom.id, denom.count)}
                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors active:scale-95"
                                        >
                                            <Plus size={14} strokeWidth={3} />
                                        </button>

                                        {/* Optional delete button for custom denoms */}
                                        {denom.id.startsWith("custom-") && (
                                            <button
                                                onClick={() => handleRemoveDenom(denom.id)}
                                                className="ml-2 p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* ADD CUSTOM DENOM BUTTON */}
                        <button
                            onClick={handleAddDenom}
                            className="w-full py-2 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        >
                            + Custom Denomination
                        </button>

                        <button
                            onClick={handleSaveDenoms}
                            disabled={savingDenoms}
                            className="w-full py-3 rounded-xl text-sm font-bold bg-neutral-900 dark:bg-white text-white dark:text-black hover:opacity-90 transition-all flex items-center justify-center gap-2 mt-2"
                        >
                            {savingDenoms ? "Saving..." : (
                                <>
                                    <Save size={16} /> Save Drawer State
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}
