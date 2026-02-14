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
  { id: "twd-1000", label: "NT$1000", value: 1000, type: "bill", count: 0 },
  { id: "twd-500", label: "NT$500", value: 500, type: "bill", count: 0 },
  { id: "twd-200", label: "NT$200", value: 200, type: "bill", count: 0 },
  { id: "twd-100", label: "NT$100", value: 100, type: "bill", count: 0 },
  { id: "twd-50", label: "NT$50", value: 50, type: "coin", count: 0 },
  { id: "twd-10", label: "NT$10", value: 10, type: "coin", count: 0 },
  { id: "twd-5", label: "NT$5", value: 5, type: "coin", count: 0 },
  { id: "twd-1", label: "NT$1", value: 1, type: "coin", count: 0 },
];

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
      setWallet({
        balance: data.balance ?? 0,
        denominations: data.denominations?.length
          ? data.denominations
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
