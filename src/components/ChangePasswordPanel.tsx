"use client";

import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { KeyRound } from "lucide-react";

export default function ChangePasswordPanel() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!auth.currentUser || !auth.currentUser.email) {
            setMessage("Please log in again to change your password.");
            return;
        }

        if (newPassword.length < 6) {
            setMessage("New password must be at least 6 characters.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setMessage("New password and confirmation do not match.");
            return;
        }

        setSaving(true);
        try {
            const credential = EmailAuthProvider.credential(
                auth.currentUser.email,
                currentPassword
            );
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);
            setMessage("Password updated successfully.");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error(error);
            setMessage(error?.message || "Failed to update password.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="card-glass">
            <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-emerald-500" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Change Password
                </h2>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Update your password anytime. You will need your current password.
            </p>
            {message && (
                <div className="mt-4 rounded-xl border border-slate-200/60 bg-white/70 px-4 py-3 text-sm text-slate-700 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/40 dark:text-slate-200">
                    {message}
                </div>
            )}
            <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
                <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="glass-input w-full rounded-xl px-4 py-2 text-sm"
                    required
                />
                <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="glass-input w-full rounded-xl px-4 py-2 text-sm"
                    required
                />
                <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="glass-input w-full rounded-xl px-4 py-2 text-sm"
                    required
                />
                <button
                    type="submit"
                    disabled={saving}
                    className="glass-button-primary w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60"
                >
                    {saving ? "Updating..." : "Update Password"}
                </button>
            </form>
        </div>
    );
}
