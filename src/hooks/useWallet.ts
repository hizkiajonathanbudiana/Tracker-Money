"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

export type DenominationType = "bill" | "coin";

export interface CashDenomination {
  id: string;
  label: string;
  value: number;
  type: DenominationType;
  count: number;
}

export interface WalletSummary {
  balance: number;
  denominations: CashDenomination[];
  updatedAt?: unknown;
}

const DEFAULT_DENOMINATIONS: CashDenomination[] = [
  { id: "usd-100", label: "$100", value: 100, type: "bill", count: 0 },
  { id: "usd-50", label: "$50", value: 50, type: "bill", count: 0 },
  { id: "usd-20", label: "$20", value: 20, type: "bill", count: 0 },
  { id: "usd-10", label: "$10", value: 10, type: "bill", count: 0 },
  { id: "usd-5", label: "$5", value: 5, type: "bill", count: 0 },
  { id: "usd-1", label: "$1", value: 1, type: "bill", count: 0 },
  { id: "usd-0.25", label: "25¢", value: 0.25, type: "coin", count: 0 },
  { id: "usd-0.1", label: "10¢", value: 0.1, type: "coin", count: 0 },
];

/**
 * Wallets created before the switch to dollars still hold NT$/Rp notes.
 * Those labels would show the wrong currency, so they are replaced with the
 * dollar set the moment the wallet is read.
 */
const isLegacyDenomination = (denominations: CashDenomination[]) =>
  denominations.length > 0 &&
  denominations.every((denom) => /^(NT\$|Rp|IDR)/i.test(denom.label.trim()));

export const useWallet = (userId: string) => {
  const [wallet, setWallet] = useState<WalletSummary>({
    balance: 0,
    denominations: DEFAULT_DENOMINATIONS,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, "users", userId, "wallet", "summary");

    const unsubscribe = onSnapshot(docRef, async (snapshot) => {
      if (!snapshot.exists()) {
        const initialWallet: WalletSummary = {
          balance: 0,
          denominations: DEFAULT_DENOMINATIONS,
          updatedAt: serverTimestamp(),
        };
        await setDoc(docRef, initialWallet);
        setWallet(initialWallet);
        setLoading(false);
        return;
      }

      const data = snapshot.data() as WalletSummary;
      const storedDenoms = data.denominations ?? [];
      const legacy = isLegacyDenomination(storedDenoms);
      setWallet({
        balance: data.balance ?? 0,
        denominations: legacy
          ? DEFAULT_DENOMINATIONS
          : storedDenoms.length
            ? storedDenoms
            : DEFAULT_DENOMINATIONS,
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const updateBalance = useCallback(
    async (value: number) => {
      if (!userId) return;
      const docRef = doc(db, "users", userId, "wallet", "summary");
      await setDoc(
        docRef,
        {
          balance: value,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },
    [userId]
  );

  const adjustBalance = useCallback(
    async (delta: number) => {
      if (!userId) return;
      const docRef = doc(db, "users", userId, "wallet", "summary");
      await setDoc(
        docRef,
        {
          balance: increment(delta),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },
    [userId]
  );

  const updateDenominations = useCallback(
    async (denominations: CashDenomination[]) => {
      if (!userId) return;
      const docRef = doc(db, "users", userId, "wallet", "summary");
      await setDoc(
        docRef,
        {
          denominations,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },
    [userId]
  );

  const addIncome = useCallback(
    async (amount: number, note?: string) => {
      if (!userId) return;
      await addDoc(collection(db, "users", userId, "incomes"), {
        amount,
        note: note || "",
        createdAt: serverTimestamp(),
      });
      await adjustBalance(amount);
    },
    [userId, adjustBalance]
  );

  const value = useMemo(
    () => ({
      wallet,
      loading,
      updateBalance,
      adjustBalance,
      updateDenominations,
      addIncome,
      defaultDenominations: DEFAULT_DENOMINATIONS,
    }),
    [wallet, loading, updateBalance, adjustBalance, updateDenominations, addIncome]
  );

  return value;
};
