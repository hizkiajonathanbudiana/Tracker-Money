"use client";
import { useState } from "react";
import { Plus, Search, Trash2, ArrowDownLeft } from "lucide-react";
import { useStore } from "./Store";
import { Heading, useMoney, CategoryIcon, Amount, Empty, Modal } from "./UI";
import { deleteTransaction } from "@/lib/model";
import TransactionForm from "./TransactionForm";
export default function Tracker() {
  const { s, today, mutate } = useStore(),
    [form, setForm] = useState(false),
    [filter, setFilter] = useState("all"),
    [query, setQuery] = useState(""),
    [month, setMonth] = useState(today.slice(0, 7)),
    [remove, setRemove] = useState<string | null>(null);
  const money = useMoney(),
    tx = s.transactions.filter((t) => t.date.startsWith(month)),
    list = [...tx]
      .reverse()
      .filter(
        (t) =>
          (filter === "all" || t.kind === filter) &&
          t.title.toLowerCase().includes(query.toLowerCase()),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  return (
    <>
      <Heading
        eyebrow="EVERY LITTLE TRANSACTION"
        title="Money tracker."
        description="Pemasukan dan pengeluaran, semuanya punya tempat."
        actions={
          <button className="btn primary" onClick={() => setForm(true)}>
            <Plus size={17} /> Catat transaksi
          </button>
        }
      />
      <div className="three-grid">
        <div className="card compact-stat">
          <span>Pemasukan</span>
          <strong className="positive">
            {money(
              tx
                .filter((t) => t.kind === "income")
                .reduce((a, t) => a + t.amount, 0),
            )}
          </strong>
        </div>
        <div className="card compact-stat">
          <span>Pengeluaran</span>
          <strong>
            {money(
              tx
                .filter((t) => t.kind === "expense")
                .reduce((a, t) => a + t.amount, 0),
            )}
          </strong>
        </div>
        <div className="card compact-stat">
          <span>Arus kas bersih</span>
          <strong>
            {money(
              tx.reduce(
                (a, t) => a + (t.kind === "income" ? t.amount : -t.amount),
                0,
              ),
            )}
          </strong>
        </div>
      </div>
      <section className="card">
        <div className="toolbar">
          <div className="segmented">
            {[
              ["all", "Semua"],
              ["expense", "Pengeluaran"],
              ["income", "Pemasukan"],
            ].map(([v, l]) => (
              <button
                key={v}
                className={filter === v ? "active" : ""}
                onClick={() => setFilter(v)}
              >
                {l}
              </button>
            ))}
          </div>
          <div className="toolbar-right">
            <label className="search">
              <Search size={17} />
              <input
                aria-label="Cari transaksi"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari transaksi…"
              />
            </label>
            <input
              aria-label="Bulan transaksi"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
        </div>
        {list.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Transaksi</th>
                  <th>Tanggal</th>
                  <th>Kategori</th>
                  <th className="align-right">Nominal</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div className="table-title">
                        <span
                          className={
                            "transaction-icon " +
                            (t.kind === "income" ? "income" : "")
                          }
                        >
                          {t.kind === "income" ? (
                            <ArrowDownLeft size={18} />
                          ) : (
                            <CategoryIcon id={t.category} />
                          )}
                        </span>
                        <div>
                          <b>{t.title}</b>
                          {t.note && <small>{t.note}</small>}
                        </div>
                      </div>
                    </td>
                    <td>{t.date}</td>
                    <td>
                      <span className="pill neutral">
                        {t.kind === "income"
                          ? "Pemasukan"
                          : s.categories.find((c) => c.id === t.category)?.name}
                      </span>
                    </td>
                    <td className="align-right">
                      <Amount value={t.amount} income={t.kind === "income"} />
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label={"Hapus " + t.title}
                        disabled={s.months[month]?.closed}
                        onClick={() => setRemove(t.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="Belum ada transaksi di sini"
            description="Coba bulan atau pencarian lain, atau catat transaksi baru."
          />
        )}
        <div className="table-footer">
          {list.length} transaksi · {s.settings.currency}
          {s.months[month]?.closed
            ? " · Riwayat terkunci setelah tutup bulan"
            : ""}
        </div>
      </section>
      {form && <TransactionForm onClose={() => setForm(false)} />}{" "}
      {remove && (
        <Modal title="Hapus transaksi ini?" onClose={() => setRemove(null)}>
          <p>
            Saldo dan budget dihitung ulang. Tagihan terkait kembali belum
            dibayar.
          </p>
          <div className="modal-actions">
            <button className="btn secondary" onClick={() => setRemove(null)}>
              Batal
            </button>
            <button
              className="btn danger"
              onClick={async () => {
                if (
                  await mutate(
                    (st) => deleteTransaction(st, remove),
                    "Transaksi dihapus.",
                  )
                )
                  setRemove(null);
              }}
            >
              Hapus transaksi
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
