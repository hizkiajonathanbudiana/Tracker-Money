"use client";

import { useAuth } from "@/lib/AuthContext";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { LogOut, User, Landmark } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";

export default function Header() {
    const { user } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

    return (
        <header className="sticky top-0 z-50 w-full glass-card-strong border-b border-slate-200/50 dark:border-white/10 backdrop-blur-xl">
            <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
                <div className="flex items-center gap-3">
                    <Landmark className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Money Tracker
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                        <span className="hidden text-sm font-medium text-slate-600 dark:text-slate-300 sm:block">
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