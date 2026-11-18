"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { EXPENSE_CATEGORIES } from "@/types/expense";

interface CategoryDoc {
  categories: string[];
  updatedAt?: unknown;
}

export const useCategories = (userId: string) => {
  const [categories, setCategories] = useState<string[]>([...EXPENSE_CATEGORIES]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, "users", userId, "settings", "categories");

    const unsubscribe = onSnapshot(docRef, async (snapshot) => {
      if (!snapshot.exists()) {
        const initialDoc: CategoryDoc = {
          categories: [...EXPENSE_CATEGORIES],
          updatedAt: serverTimestamp(),
        };
        await setDoc(docRef, initialDoc);
        setCategories(initialDoc.categories);
        setLoading(false);
        return;
      }

      const data = snapshot.data() as CategoryDoc;
      setCategories(data.categories || [...EXPENSE_CATEGORIES]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const addCategory = useCallback(
    async (name: string) => {
      if (!userId) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      const next = Array.from(new Set([...categories, trimmed]));
      const docRef = doc(db, "users", userId, "settings", "categories");
      await setDoc(
        docRef,
        {
        categories: next,
        updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },
    [userId, categories]
  );

  const updateCategory = useCallback(
    async (oldName: string, newName: string) => {
      if (!userId) return;
      const trimmed = newName.trim();
      if (!trimmed) return;
      const next = categories.map((cat) => (cat === oldName ? trimmed : cat));
      const docRef = doc(db, "users", userId, "settings", "categories");
      await setDoc(
        docRef,
        {
          categories: Array.from(new Set(next)),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },
    [userId, categories]
  );

  const removeCategory = useCallback(
    async (name: string) => {
      if (!userId) return;
      const next = categories.filter((cat) => cat !== name);
      if (next.length === 0) return;
      const docRef = doc(db, "users", userId, "settings", "categories");
      await setDoc(
        docRef,
        {
          categories: next,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    },
    [userId, categories]
  );

  const value = useMemo(
    () => ({ categories, loading, addCategory, updateCategory, removeCategory }),
    [categories, loading, addCategory, updateCategory, removeCategory]
  );

  return value;
};
