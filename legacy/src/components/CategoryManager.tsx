"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

interface CategoryManagerProps {
    categories: string[];
    onAdd: (name: string) => Promise<void> | void;
    onUpdate: (oldName: string, newName: string) => Promise<void> | void;
    onRemove: (name: string) => Promise<void> | void;
    showHeader?: boolean;
}

export default function CategoryManager({
    categories,
    onAdd,
    onUpdate,
    onRemove,
    showHeader = true,
}: CategoryManagerProps) {
    const [newCategory, setNewCategory] = useState("");
    const [editing, setEditing] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");
    const [status, setStatus] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const handleAdd = async () => {
        if (!newCategory.trim()) return;
        setSaving(true);
        setStatus(null);
        try {
            await onAdd(newCategory.trim());
            setNewCategory("");
            setStatus("Category added.");
        } catch (error) {
            console.error(error);
            setStatus("Failed to add category.");
        } finally {
            setSaving(false);
        }
    };

    const handleStartEdit = (category: string) => {
        setEditing(category);
        setEditValue(category);
    };

    const handleSaveEdit = async () => {
        if (!editing) return;
        const trimmed = editValue.trim();
        if (!trimmed) return;
        setSaving(true);
        setStatus(null);
        try {
            await onUpdate(editing, trimmed);
            setEditing(null);
            setEditValue("");
            setStatus("Category updated.");
        } catch (error) {
            console.error(error);
            setStatus("Failed to update category.");
        } finally {
            setSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setEditing(null);
        setEditValue("");
    };

    const handleRemove = async (category: string) => {
        if (categories.length <= 1) {
            setStatus("Keep at least one category.");
            return;
        }
        setSaving(true);
        setStatus(null);
        try {
            await onRemove(category);
            setStatus("Category removed.");
        } catch (error) {
            console.error(error);
            setStatus("Failed to remove category.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="card-glass">
            {showHeader && (
                <h2 className="mb-4 text-2xl font-bold text-slate-900 dark:text-white">
                    Categories
                </h2>
            )}
            {status && (
                <div className="mb-4 rounded-xl border border-slate-200/60 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-200">
                    {status}
                </div>
            )}
            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                    <label htmlFor="category-new" className="sr-only">
                        New category name
                    </label>
                    <input
                        type="text"
                        id="category-new"
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        placeholder="Add new category"
                        className="glass-input flex-1 rounded-xl px-4 py-3 text-base"
                    />
                    <button
                        type="button"
                        onClick={handleAdd}
                        disabled={saving}
                        className="glass-button-primary flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold disabled:opacity-60"
                    >
                        <Plus className="h-4 w-4" />
                        Add
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {categories.map((category) => (
                        <div
                            key={category}
                            className="glass-card flex items-center justify-between gap-3 p-4"
                        >
                            {editing === category ? (
                                <div className="flex flex-1 items-center gap-2">
                                    <input
                                        type="text"
                                        aria-label="Edit category name"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="glass-input flex-1 rounded-lg px-3 py-2 text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSaveEdit}
                                        className="text-emerald-500 hover:text-emerald-600"
                                        aria-label="Save"
                                    >
                                        <Check className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancelEdit}
                                        className="text-slate-500 hover:text-slate-600"
                                        aria-label="Cancel"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        {category}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => handleStartEdit(category)}
                                            disabled={saving}
                                            className="text-blue-500 hover:text-blue-600 disabled:opacity-60"
                                            aria-label="Edit category"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleRemove(category)}
                                            disabled={saving}
                                            className="text-red-500 hover:text-red-600 disabled:opacity-60"
                                            aria-label="Remove category"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
