"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Plus, Save, Trash2 } from "lucide-react";
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
    const [savingBalance, setSavingBalance] = useState(false);
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
        setSavingBalance(true);
        setStatusMessage(null);
        try {
            await onUpdateBalance(parsed);
            setStatusMessage("Balance saved.");
        } catch (error) {
            console.error(error);
            setStatusMessage("Failed to save balance.");
        } finally {
            setSavingBalance(false);
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

    const handleSyncBalance = async () => {
        setSavingBalance(true);
        setStatusMessage(null);
        try {
            await onUpdateBalance(cashTotal);
            setBalanceInput(cashTotal.toString());
            setStatusMessage("Balance synced to cash total.");
        } catch (error) {
            console.error(error);
            setStatusMessage("Failed to sync balance.");
        } finally {
            setSavingBalance(false);
        }
    };

    return (
        <div className="card-glass">
            <div className="flex flex-col gap-6">
                {showHeader && (
                    <div>
                        <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
                            Wallet Summary
                        </h2>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Track your current cash, paper bills, and update your balance.
                        </p>
                    </div>
                )}

                {statusMessage && (
                    <div className="rounded-xl border border-slate-200/60 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-200">
                        {statusMessage}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="glass-card p-4">
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                            Current Balance
                        </p>
                        <div className="mt-3 flex flex-col gap-3">
                            <label htmlFor="wallet-balance" className="sr-only">
                                Current balance
                            </label>
                            <input
                                type="number"
                                id="wallet-balance"
                                value={balanceInput}
                                onChange={(e) => setBalanceInput(e.target.value)}
                                className="glass-input w-full rounded-xl px-4 py-2 text-lg font-semibold"
                            />
                            <button
                                type="button"
                                onClick={handleBalanceSave}
                                disabled={savingBalance}
                                className="glass-button-primary flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm disabled:opacity-60"
                            >
                                <Save className="h-4 w-4" />
                                {savingBalance ? "Saving..." : "Save Balance"}
                            </button>
                        </div>
                    </div>

                    <div className="glass-card p-4">
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                            Add Income
                        </p>
                        <div className="mt-3 flex flex-col gap-3">
                            <label htmlFor="wallet-income" className="sr-only">
                                Income amount
                            </label>
                            <input
                                type="number"
                                id="wallet-income"
                                value={incomeAmount}
                                onChange={(e) => setIncomeAmount(e.target.value)}
                                placeholder="Income amount"
                                className="glass-input w-full rounded-xl px-4 py-2 text-lg font-semibold"
                            />
                            <label htmlFor="wallet-income-note" className="sr-only">
                                Income note
                            </label>
                            <input
                                type="text"
                                id="wallet-income-note"
                                value={incomeNote}
                                onChange={(e) => setIncomeNote(e.target.value)}
                                placeholder="Notes (optional)"
                                className="glass-input w-full rounded-xl px-4 py-2 text-sm"
                            />
                            <button
                                type="button"
                                onClick={handleIncome}
                                disabled={savingIncome}
                                className="glass-button-primary rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60"
                            >
                                {savingIncome ? "Saving..." : "Add Income"}
                            </button>
                        </div>
                    </div>

                    <div className="glass-card p-4">
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                            Cash Total
                        </p>
                        <div className="mt-3">
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {cashTotal.toLocaleString("en-US")}
                            </p>
                            <button
                                type="button"
                                onClick={handleSyncBalance}
                                disabled={savingBalance}
                                className="mt-3 glass-button rounded-xl px-3 py-2 text-sm font-semibold disabled:opacity-60"
                            >
                                Use as Balance
                            </button>
                        </div>
                    </div>
                </div>

                <div>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Denominations
                        </h3>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setShowDenominations((prev) => !prev)}
                                className="glass-button flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold"
                            >
                                {showDenominations ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                {showDenominations ? "Hide" : "Show"}
                            </button>
                            <button
                                type="button"
                                onClick={handleAddDenom}
                                className="glass-button flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold"
                            >
                                <Plus className="h-4 w-4" />
                                Add Denomination
                            </button>
                        </div>
                    </div>
                    {showDenominations && (
                        <>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {denomDrafts.map((denom) => (
                                    <div
                                        key={denom.id}
                                        className="glass-card flex flex-col gap-2 p-4"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <label htmlFor={`denom-label-${denom.id}`} className="sr-only">
                                                Denomination label
                                            </label>
                                            <input
                                                type="text"
                                                id={`denom-label-${denom.id}`}
                                                value={denom.label}
                                                onChange={(e) =>
                                                    handleDenomChange(denom.id, "label", e.target.value)
                                                }
                                                className="glass-input flex-1 rounded-lg px-3 py-2 text-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveDenom(denom.id)}
                                                className="text-red-500 hover:text-red-600"
                                                aria-label="Remove denomination"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <label htmlFor={`denom-value-${denom.id}`} className="sr-only">
                                                Denomination value
                                            </label>
                                            <input
                                                type="number"
                                                id={`denom-value-${denom.id}`}
                                                value={denom.value}
                                                onChange={(e) =>
                                                    handleDenomChange(denom.id, "value", e.target.value)
                                                }
                                                className="glass-input rounded-lg px-3 py-2 text-sm"
                                                placeholder="Value"
                                            />
                                            <label htmlFor={`denom-type-${denom.id}`} className="sr-only">
                                                Denomination type
                                            </label>
                                            <select
                                                id={`denom-type-${denom.id}`}
                                                value={denom.type}
                                                onChange={(e) =>
                                                    handleDenomChange(
                                                        denom.id,
                                                        "type",
                                                        e.target.value
                                                    )
                                                }
                                                className="glass-input rounded-lg px-3 py-2 text-sm"
                                            >
                                                <option value="bill">Bill</option>
                                                <option value="coin">Coin</option>
                                            </select>
                                            <label htmlFor={`denom-count-${denom.id}`} className="sr-only">
                                                Denomination count
                                            </label>
                                            <input
                                                type="number"
                                                id={`denom-count-${denom.id}`}
                                                value={denom.count}
                                                onChange={(e) =>
                                                    handleDenomChange(denom.id, "count", e.target.value)
                                                }
                                                className="glass-input rounded-lg px-3 py-2 text-sm"
                                                placeholder="Count"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={handleSaveDenoms}
                                disabled={savingDenoms}
                                className="mt-4 glass-button-primary flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
                            >
                                <Save className="h-4 w-4" />
                                {savingDenoms ? "Saving..." : "Save Denominations"}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
