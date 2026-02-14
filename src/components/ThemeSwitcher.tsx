"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export const ThemeSwitcher = () => {
    const [mounted, setMounted] = useState(false);
    const { theme, setTheme, resolvedTheme } = useTheme();

    useEffect(() => {
        setMounted(true);
        console.log('ThemeSwitcher mounted, theme:', theme, 'resolvedTheme:', resolvedTheme);
    }, [theme, resolvedTheme]);

    if (!mounted) {
        return (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-200 dark:bg-gray-800"></div>
        );
    }

    const isDark = theme === 'dark' || (theme === 'system' && resolvedTheme === 'dark');

    const handleToggle = () => {
        const newTheme = isDark ? "light" : "dark";
        console.log('Toggling theme from', theme, 'to', newTheme);
        setTheme(newTheme);
    };

    return (
        <button
            onClick={handleToggle}
            className="glass-button flex h-10 w-10 items-center justify-center rounded-xl text-gray-700 transition-all duration-200 hover:scale-105 dark:text-gray-300"
            aria-label="Toggle theme"
        >
            {isDark ? (
                <Sun size={18} className="transition-transform hover:rotate-12" />
            ) : (
                <Moon size={18} className="transition-transform hover:rotate-12" />
            )}
        </button>
    );
};