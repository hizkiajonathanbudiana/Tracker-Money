"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sendEmailVerification, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { Mail, Send, ArrowLeft, Loader2 } from "lucide-react";

const FullPageLoader = () => (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-950">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
    </div>
);

export default function VerifyEmailPage() {
    const { user } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (user && user.emailVerified) {
            router.push("/app");
        }
    }, [user, router]);

    const handleResendVerification = async () => {
        setLoading(true);
        setError(null);
        setMessage(null);

        if (!user) {
            setError("You are not logged in.");
            setLoading(false);
            return;
        }

        try {
            await sendEmailVerification(user);
            setMessage("New verification email sent. Check your inbox.");
        } catch (err: any) {
            setError(err.message);
        }
        setLoading(false);
    };

    const handleSignOutAndLogin = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (!user || user.emailVerified) {
        return <FullPageLoader />;
    }

    return (
        <>
            <div className="text-center">
                <Mail className="mx-auto h-12 w-12 text-blue-600" />
                <h2 className="mt-4 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">
                    Verify Your Email
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
                    We have sent a verification link to{" "}
                    <strong className="text-gray-900 dark:text-gray-100">
                        {user.email}
                    </strong>
                    . Please check your inbox (and spam folder) to continue.
                </p>
            </div>

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

            <div className="mt-6 space-y-4">
                <button
                    onClick={handleResendVerification}
                    disabled={loading}
                    className="glass-button-primary group relative flex w-full justify-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:hover:scale-100"
                >
                    {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <Send className="mr-2 h-5 w-5" />
                    )}
                    {loading ? "Sending..." : "Resend Verification Email"}
                </button>

                <p className="text-center text-sm text-gray-600">
                    <button
                        onClick={handleSignOutAndLogin}
                        className="flex w-full items-center justify-center rounded-md py-2 font-medium text-blue-600 hover:bg-gray-100 dark:text-blue-400 dark:hover:bg-gray-700"
                    >
                        <ArrowLeft className="mr-1 h-4 w-4" />
                        Back to log in
                    </button>
                </p>
            </div>
        </>
    );
}