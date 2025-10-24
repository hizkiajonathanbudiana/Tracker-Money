import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { Expense } from "@/types/expense";

export const useExpenses = (userId: string) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const expensesCol = collection(db, "users", userId, "expenses");
    // const q = query(expensesCol, orderBy("date", "desc"));
    const q = query(expensesCol, orderBy("createdAt", "desc"));


    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const expensesData: Expense[] = [];
        querySnapshot.forEach((doc) => {
          expensesData.push({ id: doc.id, ...doc.data() } as Expense);
        });
        setExpenses(expensesData);
        setLoading(false);
      },
      (err: any) => {
        console.error("Error fetching expenses: ", err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { expenses, loading, error };
};