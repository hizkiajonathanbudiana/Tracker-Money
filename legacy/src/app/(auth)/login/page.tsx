"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Mail, Lock, LogIn, ArrowRight } from "lucide-react";

const GoogleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.3v2.84C4.13 20.73 7.7 23 12 23z" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.3C1.48 8.68 1 10.29 1 12s.48 3.32 1.3 4.93l3.54-2.84z" />
        <path d="M12 5.38c1.63 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 4.13 3.27 2.3 6.86l3.54 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
);

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            if (userCredential.user.emailVerified) {
                router.push("/app");
            } else {
                setError("Please verify your email before logging in.");
                router.push("/verify-email");
            }
        } catch (err: any) {
            if (err.code === "auth/invalid-credential") {
                setError("Invalid email or password. Please try again.");
            } else {
                setError(err.message);
            }
            setLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            if (result.user.emailVerified) {
                router.push("/app");
            } else {
                setError("Please verify your email.");
                router.push("/verify-email");
            }
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <>
            <h2 className="mb-6 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">
                Log In
            </h2>
            {error && (
                <p className="mb-4 rounded-md bg-red-100 p-3 text-center text-sm text-red-700">
                    {error}
                </p>
            )}
            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Email address
                    </label>
                    <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Mail className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="glass-input block w-full rounded-xl pl-10 py-3 text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                            placeholder="you@example.com"
                        />
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Password
                    </label>
                    <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Lock className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="glass-input block w-full rounded-xl pl-10 py-3 text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                            placeholder="••••••••"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end">
                    <div className="text-sm">
                        <Link
                            href="/forgot"
                            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                        >
                            Forgot your password?
                        </Link>
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="glass-button-primary group relative flex w-full justify-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <LogIn className="h-5 w-5 text-blue-200 group-hover:text-white transition-colors" />
                        </span>
                        {loading ? "Logging in..." : "Log In"}
                    </button>
                </div>
            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="bg-white/80 px-2 text-slate-700 dark:bg-black/80 dark:text-slate-300">
                        Or continue with
                    </span>
                </div>
            </div>

            <div>
                <button
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="glass-button group relative flex w-full justify-center rounded-xl px-4 py-3 text-sm font-medium text-slate-700 transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 dark:text-slate-200"
                >
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                        <GoogleIcon />
                    </span>
                    Sign in with Google
                </button>
            </div>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                Not a member?{" "}
                <Link
                    href="/signup"
                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                    Sign up now
                    <ArrowRight className="ml-1 inline h-4 w-4" />
                </Link>
            </p>
        </>
    );
}