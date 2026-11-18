"use client";
import { useState, FormEvent } from "react";
import { useStore } from "./Store";
import { Modal, useMoney } from "./UI";
import { addTransaction, budget, uid } from "@/lib/model";
export default function TransactionForm({
  onClose,
  initial = "expense",
}: {
  onClose: () => void;
  initial?: "income" | "expense";
}) {
  const { s, today, mutate } = useStore();
  const [kind, setKind] = useState(initial),
    [cat, setCat] = useState(s.categories[0].id),
    [date, setDate] = useState(today),
    [busy, setBusy] = useState(false);
  const money = useMoney();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const f = new FormData(e.currentTarget);
    const ok = await mutate(
      (st) =>
        addTransaction(
          st,
          {
            id: uid(),
            title: String(f.get("title")),
            kind,
            amount: Number(f.get("amount")),
            category: kind === "income" ? "income" : cat,
            date,
            note: String(f.get("note") ?? ""),
          },
          today,
        ),
      "Transaction saved.",
    );
    setBusy(false);
    if (ok) onClose();
  }
  return (
    <Modal title="Add transaction" onClose={onClose}>
      <div className="segmented">
        <button
          className={kind === "expense" ? "active" : ""}
          onClick={() => setKind("expense")}
        >
          Expense
        </button>
        <button
          className={kind === "income" ? "active" : ""}
          onClick={() => setKind("income")}
        >
          Income
        </button>
      </div>
      <form onSubmit={submit} className="form-stack">
        <label>
          Description
          <input
            autoFocus
            name="title"
            placeholder={
              kind === "income"
                ? "Salary, freelance work, gift…"
                : "Lunch, weekly groceries…"
            }
            required
            maxLength={120}
          />
        </label>
        <div className="form-row">
          <label>
            Amount ({s.settings.currency})
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="0"
            />
          </label>
          <label>
            Date
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
        </div>
        {kind === "expense" && (
          <>
            <label>
              Category
              <select value={cat} onChange={(e) => setCat(e.target.value)}>
                {s.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="info-line">
              Available budget:{" "}
              <b>{money(budget(s, date.slice(0, 7), cat).remaining)}</b>
            </div>
          </>
        )}
        <label>
          Note <span className="muted">(optional)</span>
          <input name="note" placeholder="Add details" maxLength={300} />
        </label>
        <button className="btn primary" disabled={busy}>
          {busy
            ? "Saving…"
            : "Save " + (kind === "income" ? "income" : "expense")}
        </button>
      </form>
    </Modal>
  );
}
