import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center px-4">
            {/* Theme Switcher di pojok kanan atas */}
            <div className="fixed top-4 right-4 z-50">
                <ThemeSwitcher />
            </div>

            {/* Card login/signup dengan glass morphism */}
            <div className="card-glass w-full max-w-md">
                {children}
            </div>
        </div>
    );
}