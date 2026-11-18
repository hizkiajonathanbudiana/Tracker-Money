"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Mail, Send, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            await sendPasswordResetEmail(auth, email);
            setMessage("Password reset email sent. Check your inbox.");
        } catch (err: any) {
            setError(err.message);
        }
        setLoading(false);
    };

    return (
        <>
            <h2 className="mb-6 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">
                Reset Password
            </h2>
            {error && (
                <p className="mb-4 rounded-md bg-red-100 p-3 text-center text-sm text-red-700">
                    {error}
                </p>
            )}
            {message && (
                <p className="mb-4 rounded-md bg-green-100 p-3 text-center text-sm text-green-700 dark:bg-green-800 dark:text-green-100">
                    {message}
                </p>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    <button
                        type="submit"
                        disabled={loading}
                        className="glass-button-primary group relative flex w-full justify-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <Send className="h-5 w-5 text-blue-200 group-hover:text-white transition-colors" />
                        </span>
                        {loading ? "Sending..." : "Send Reset Email"}
                    </button>
                </div>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                <Link
                    href="/login"
                    className="flex items-center justify-center font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
                >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to log in
                </Link>
            </p>
        </>
    );
}