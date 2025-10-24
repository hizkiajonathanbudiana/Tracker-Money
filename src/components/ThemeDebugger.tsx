"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export const ThemeDebugger = () => {
    const [mounted, setMounted] = useState(false);
    const { theme, resolvedTheme, setTheme, systemTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="text-sm text-gray-500">Loading theme info...</div>;
    }

    return (
        <div className="fixed bottom-4 left-4 p-3 bg-white/90 dark:bg-black/90 border border-gray-300 dark:border-white/20 rounded-lg text-xs font-mono">
            <div>Theme: {theme}</div>
            <div>Resolved: {resolvedTheme}</div>
            <div>System: {systemTheme}</div>
            <div>HTML Class: {typeof window !== 'undefined' ? document.documentElement.className : 'N/A'}</div>
            <div className="mt-2 space-x-2">
                <button
                    onClick={() => setTheme('light')}
                    className="px-2 py-1 bg-yellow-200 rounded"
                >
                    Light
                </button>
                <button
                    onClick={() => setTheme('dark')}
                    className="px-2 py-1 bg-gray-800 text-white rounded"
                >
                    Dark
                </button>
            </div>
        </div>
    );
};