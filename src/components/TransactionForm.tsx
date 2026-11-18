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
      "Transaksi tersimpan.",
    );
    setBusy(false);
    if (ok) onClose();
  }
  return (
    <Modal title="Catat transaksi" onClose={onClose}>
      <div className="segmented">
        <button
          className={kind === "expense" ? "active" : ""}
          onClick={() => setKind("expense")}
        >
          Pengeluaran
        </button>
        <button
          className={kind === "income" ? "active" : ""}
          onClick={() => setKind("income")}
        >
          Pemasukan
        </button>
      </div>
      <form onSubmit={submit} className="form-stack">
        <label>
          Keterangan
          <input
            autoFocus
            name="title"
            placeholder={
              kind === "income"
                ? "Gaji, freelance, hadiah…"
                : "Makan siang, belanja mingguan…"
            }
            required
            maxLength={120}
          />
        </label>
        <div className="form-row">
          <label>
            Nominal ({s.settings.currency})
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
            Tanggal
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
              Kategori
              <select value={cat} onChange={(e) => setCat(e.target.value)}>
                {s.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="info-line">
              Budget tersedia:{" "}
              <b>{money(budget(s, date.slice(0, 7), cat).remaining)}</b>
            </div>
          </>
        )}
        <label>
          Catatan <span className="muted">(opsional)</span>
          <input name="note" placeholder="Tambahkan detail" maxLength={300} />
        </label>
        <button className="btn primary" disabled={busy}>
          {busy
            ? "Menyimpan…"
            : "Simpan " + (kind === "income" ? "pemasukan" : "pengeluaran")}
        </button>
      </form>
    </Modal>
  );
}
