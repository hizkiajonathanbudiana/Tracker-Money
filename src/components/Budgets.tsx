"use client";
import { useState } from "react";
import { Sparkles, Plus, ArrowRight, Wallet, LockKeyhole } from "lucide-react";
import { useStore } from "./Store";
import { Heading, useMoney, num, CategoryIcon, Modal, Empty } from "./UI";
import { budget, points, transfer, ensureMonth } from "@/lib/model";
export default function Budgets() {
  const { s, today, mutate } = useStore(),
    [month, setMonth] = useState(today.slice(0, 7)),
    [topup, setTopup] = useState<string | null>(null),
    [edit, setEdit] = useState<string | null>(null);
  const money = useMoney(),
    current = month === today.slice(0, 7),
    total = s.categories.reduce(
      (a, c) => a + budget(s, month, c.id).remaining,
      0,
    );
  return (
    <>
      <Heading
        eyebrow="MAKE ROOM FOR WHAT MATTERS"
        title="Budget & points."
        description="Batas yang jelas, pilihan yang tetap milikmu."
        actions={
          <input
            aria-label="Bulan budget"
            type="month"
            max={today.slice(0, 7)}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        }
      />
      <div className="budget-hero">
        <div>
          <div className="eyebrow">POIN YANG TERUS BERTUMBUH</div>
          <strong>
            {num(points(s))}
            <span> points</span>
          </strong>
          <p>
            Tidak di-reset. Tidak kedaluwarsa. Bisa dipakai untuk kategori apa
            saja.
          </p>
        </div>
        <div className="rate-box">
          <Sparkles size={22} />
          <b>1 poin = 1 {s.settings.currency}</b>
          <span>Tukar poin → tambah budget</span>
        </div>
      </div>
      {points(s) < 0 && (
        <div className="notice">
          Saldo poin sedang negatif karena penalti challenge. Poin baru akan
          menutup kekurangan sebelum bisa ditukar.
        </div>
      )}
      <div className="section-head standalone">
        <div>
          <h2>Budget kategori</h2>
          <p>
            Makan di luar dan bahan makanan mingguan sama-sama masuk Food &
            beverages.
          </p>
        </div>
        <span className="pill neutral">{money(total)} tersisa</span>
      </div>
      <div className="two-grid">
        {s.categories.map((c) => {
          const b = budget(s, month, c.id);
          return (
            <section className="card category-card" key={c.id}>
              <div className="section-head">
                <div className="inline-heading">
                  <span
                    className="category-tile"
                    style={{ background: c.color + "25", color: c.color }}
                  >
                    <CategoryIcon id={c.id} />
                  </span>
                  <h2>{c.name}</h2>
                </div>
                <button
                  className="text-button"
                  disabled={!current || b.closed}
                  onClick={() => setEdit(c.id)}
                >
                  Atur
                </button>
              </div>
              <div className="category-balance">
                <strong>{money(b.remaining)}</strong>
                <span>tersisa dari {money(b.total)}</span>
              </div>
              <div className="progress big">
                <span
                  style={{
                    background: b.remaining <= 0 ? "var(--danger)" : c.color,
                    width: Math.min(100, (b.spent / b.total) * 100 || 0) + "%",
                  }}
                />
              </div>
              <div className="category-meta">
                <span>
                  Terpakai <b>{money(b.spent)}</b>
                </span>
                <span>
                  Top up poin <b>+{money(b.topup)}</b>
                </span>
              </div>
              <div className="category-bottom">
                <span
                  className={
                    "pill " +
                    (b.closed ? "neutral" : b.remaining <= 0 ? "red" : "green")
                  }
                >
                  {b.closed ? (
                    <>
                      <LockKeyhole size={12} /> Sudah dikonversi
                    </>
                  ) : b.remaining <= 0 ? (
                    "Budget habis"
                  ) : (
                    "Budget tersedia"
                  )}
                </span>
                <button
                  className="text-button"
                  disabled={!current || b.closed || points(s) <= 0}
                  onClick={() => setTopup(c.id)}
                >
                  <Plus size={14} /> Tukar poin
                </button>
              </div>
            </section>
          );
        })}
      </div>
      <section className="card rules-strip">
        {[
          [`Selesai +${s.settings.reward}`, "Untuk setiap challenge harian."],
          [`Terlewat −${s.settings.penalty}`, "Diproses saat hari berganti."],
          [`Komplet +${s.settings.bonus}`, "Bonus semua challenge selesai."],
          ["Sisa budget → poin", "Otomatis saat bulan berganti."],
        ].map(([t, d], i) => (
          <div key={t}>
            <span className="rule-number">0{i + 1}</span>
            <b>{t}</b>
            <p>{d}</p>
          </div>
        ))}
      </section>
      <section className="card">
        <div className="section-head">
          <div>
            <h2>Perjalanan poinmu</h2>
            <p>Setiap penambahan dan pemakaian tercatat.</p>
          </div>
          <Sparkles size={19} />
        </div>
        {s.ledger.length ? (
          <div className="ledger-list">
            {[...s.ledger]
              .reverse()
              .slice(0, 50)
              .map((e) => (
                <div className="ledger-row" key={e.id}>
                  <span className="transaction-icon">
                    <Sparkles size={16} />
                  </span>
                  <div>
                    <b>{e.title}</b>
                    <small>
                      {e.date} ·{" "}
                      {(
                        {
                          challenge: "Challenge selesai",
                          penalty: "Challenge terlewat",
                          bonus: "Bonus harian",
                          saving: "Sisa budget",
                          topup: "Penukaran poin",
                          opening: "Saldo awal",
                        } as Record<string, string>
                      )[e.kind] ?? e.kind}
                    </small>
                  </div>
                  <strong className={e.points >= 0 ? "positive" : "negative"}>
                    {e.points > 0 ? "+" : ""}
                    {num(e.points)} pts
                  </strong>
                </div>
              ))}
          </div>
        ) : (
          <Empty
            title="Cerita poinmu dimulai di sini"
            description="Selesaikan challenge pertama untuk mendapat poin."
          />
        )}
      </section>
      <div className="subtle-note">
        <Wallet size={16} />
        Poin menambah izin belanja dalam budget, bukan uang masuk ke rekening.
        Saldo uang hanya berubah lewat transaksi.
      </div>
      {topup && (
        <Modal title="Tukar poin ke budget" onClose={() => setTopup(null)}>
          <p>
            Tambahkan budget {s.categories.find((c) => c.id === topup)?.name}.
            Tersedia <b>{num(points(s))} poin</b>.
          </p>
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const n = Number(new FormData(e.currentTarget).get("amount"));
              if (
                await mutate(
                  (st) => transfer(st, month, topup, n, today),
                  "Poin ditukar menjadi budget.",
                )
              )
                setTopup(null);
            }}
          >
            <label>
              Jumlah poin
              <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                max={points(s)}
                required
                autoFocus
              />
            </label>
            <div className="info-line">
              1 poin = 1 {s.settings.currency}. Saldo uang tidak berubah.
            </div>
            <button className="btn primary">
              Tukar sekarang <ArrowRight size={16} />
            </button>
          </form>
        </Modal>
      )}
      {edit && (
        <Modal title="Atur budget bulanan" onClose={() => setEdit(null)}>
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const amount = Number(
                new FormData(e.currentTarget).get("amount"),
              );
              if (
                await mutate((st) => {
                  const b = budget(st, month, edit);
                  if (amount < 0 || amount + b.topup < b.spent)
                    throw Error(
                      "Budget tidak boleh lebih rendah dari pengeluaran yang sudah tercatat.",
                    );
                  st.categories.find((c) => c.id === edit)!.limit = amount;
                  ensureMonth(st, month).limits[edit] = amount;
                }, "Budget bulan ini dan default bulan berikutnya diperbarui.")
              )
                setEdit(null);
            }}
          >
            <label>
              Budget dasar ({s.settings.currency})
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                defaultValue={budget(s, month, edit).limit}
                required
              />
            </label>
            <p className="muted">
              Mengubah alokasi bulan ini dan default bulan berikutnya. Riwayat
              bulan tertutup tetap sama.
            </p>
            <button className="btn primary">Simpan budget</button>
          </form>
        </Modal>
      )}
    </>
  );
}
