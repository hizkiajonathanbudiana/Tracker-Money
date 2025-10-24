"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Mail, Lock, UserPlus } from "lucide-react";

export default function SignUpPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== passwordConfirm) {
            setError("Passwords do not match");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            await sendEmailVerification(userCredential.user);

            router.push("/verify-email");
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <>
            <h2 className="mb-6 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">
                Create Account
            </h2>
            {error && (
                <p className="mb-4 rounded-md bg-red-100 p-3 text-center text-sm text-red-700">
                    {error}
                </p>
            )}
            <form onSubmit={handleSignUp} className="space-y-6">
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
                            autoComplete="new-password"
                            required
                            minLength={6}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="glass-input block w-full rounded-xl pl-10 py-3 text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                            placeholder="Minimum 6 characters"
                        />
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="passwordConfirm"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Confirm Password
                    </label>
                    <div className="relative mt-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Lock className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                        </div>
                        <input
                            id="passwordConfirm"
                            name="passwordConfirm"
                            type="password"
                            autoComplete="new-password"
                            required
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            className="glass-input block w-full rounded-xl pl-10 py-3 text-sm transition-all duration-200 focus:ring-2 focus:ring-blue-500/50 focus:outline-none"
                            placeholder="Confirm your password"
                        />
                    </div>
                </div>

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="glass-button-primary group relative flex w-full justify-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <UserPlus className="h-5 w-5 text-blue-200 group-hover:text-white transition-colors" />
                        </span>
                        {loading ? "Creating account..." : "Sign Up"}
                    </button>
                </div>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                    Log in
                </Link>
            </p>
        </>
    );
}