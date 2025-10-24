import Header from "@/components/Header";

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
        </div>
    );
}