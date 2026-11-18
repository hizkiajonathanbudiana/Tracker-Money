"use client";

import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, User, Landmark, LayoutDashboard, Sparkles } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";

export default function Header() {
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    const navItems = [
        { href: "/app", label: "Dashboard", icon: LayoutDashboard },
        { href: "/app/points", label: "Points", icon: Sparkles },
    ];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200/60 bg-white/75 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b0d12]/80">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                    <Landmark className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                    <h1 className="hidden text-2xl font-bold text-slate-900 dark:text-white sm:block">
                        Money Tracker
                    </h1>
                    <nav className="flex items-center gap-1 sm:ml-4">
                        {navItems.map((item) => {
                            const active =
                                item.href === "/app"
                                    ? pathname === "/app"
                                    : pathname.startsWith(item.href);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
                                        active
                                            ? "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                                            : "text-slate-600 hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/10"
                                    }`}
                                >
                                    <Icon className="h-4 w-4" />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden items-center gap-2 sm:flex">
                        <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                            {user ? user.email : ""}
                        </span>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="glass-button group flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 transition-all duration-200 hover:scale-105"
                    >
                        <LogOut className="h-4 w-4 transition-transform group-hover:scale-110" />
                        <span className="hidden sm:block">Sign Out</span>
                    </button>
                    <ThemeSwitcher />
                </div>
            </div>
        </header>
    );
}
