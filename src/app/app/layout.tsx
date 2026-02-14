import type { Metadata } from "next";
import Header from "@/components/Header";
import InstallPWA from "@/components/InstallPWA";
import OnlineStatus from "@/components/OnlineStatus";
import PWAUpdater from "@/components/PWAUpdater";

export const metadata: Metadata = {
    title: "Money Tracker Dashboard",
    description: "Track expenses, income, categories, and your wallet balance in one place.",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        // Background inherited from html - FIXED!
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="mx-auto w-full max-w-4xl flex-1 p-4 sm:p-6">
                {children}
            </main>
            <footer className="py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Money Tracker MVP
            </footer>
            <OnlineStatus />
            <PWAUpdater />
            <InstallPWA />
        </div>
    );
}