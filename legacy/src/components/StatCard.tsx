import { ReactNode } from "react";

interface StatCardProps {
    title: string;
    value: string;
    icon: ReactNode;
    description?: string;
}

export default function StatCard({
    title,
    value,
    icon,
    description,
}: StatCardProps) {
    return (
        <div className="card-glass group overflow-hidden">
            <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    {title}
                </p>
                <div className="text-slate-500 dark:text-slate-400 transition-transform group-hover:scale-110">{icon}</div>
            </div>
            <div className="mt-3 min-w-0">
                <p className="truncate text-xl font-bold text-slate-900 dark:text-white sm:text-2xl lg:text-3xl">
                    {value}
                </p>
                {description && (
                    <p className="mt-1 break-words text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}