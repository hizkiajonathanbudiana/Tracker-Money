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
            <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                    {title}
                </p>
                <div className="text-slate-500 dark:text-slate-400 transition-transform group-hover:scale-110">{icon}</div>
            </div>
            <div className="mt-3">
                <p className="truncate text-3xl font-bold text-slate-900 dark:text-white">
                    {value}
                </p>
                {description && (
                    <p className="truncate text-sm text-slate-600 dark:text-slate-400 mt-1">
                        {description}
                    </p>
                )}
            </div>
        </div>
    );
}