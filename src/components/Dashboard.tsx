"use client";
import Link from "next/link";
import { useState } from "react";
import {
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  Sparkles,
  CalendarDays,
  Check,
  Wallet,
  Target,
  ChevronRight,
  Receipt,
} from "lucide-react";
import { useStore } from "./Store";
import { Heading, useMoney, num, CategoryIcon, Amount, Empty } from "./UI";
import { points, wallet, budget, setChallenge, addDays } from "@/lib/model";
import TransactionForm from "./TransactionForm";
export default function Dashboard() {
  const { s, today, mutate } = useStore();
  const money = useMoney(),
    [form, setForm] = useState<"income" | "expense" | null>(null);
  const month = today.slice(0, 7),
    monthLabel = new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(today + "T12:00:00Z"));
  const tx = s.transactions.filter((t) => t.date.startsWith(month));
  const spent = tx
      .filter((t) => t.kind === "expense")
      .reduce((a, t) => a + t.amount, 0),
    income = tx
      .filter((t) => t.kind === "income")
      .reduce((a, t) => a + t.amount, 0),
    day = s.days[today],
    done = day?.items.filter((c) => c.status === "done").length ?? 0,
    total = day?.items.length ?? 0,
    remaining = s.categories.reduce(
      (a, c) => a + budget(s, month, c.id).remaining,
      0,
    ),
    unpaid = s.bills.filter((b) => !b.paid);
  const chart = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(today, i - 6);
    return {
      date,
      amount: s.transactions
        .filter((t) => t.kind === "expense" && t.date === date)
        .reduce((a, t) => a + t.amount, 0),
    };
  });
  const max = Math.max(1, ...chart.map((d) => d.amount)),
    fnb = budget(s, month, "fnb");
  return (
    <>
      <Heading
        eyebrow="A LITTLE PROGRESS, EVERY DAY"
        title={`Halo, ${s.settings.name}.`}
        description="Keuangan lebih terarah. Kebiasaan baik makin berarti."
        actions={
          <>
            <span className="date-chip">
              <CalendarDays size={16} />
              {monthLabel}
            </span>
            <button className="btn primary" onClick={() => setForm("expense")}>
              <Plus size={17} /> Catat transaksi
            </button>
          </>
        }
      />
      <div className="stats-grid">
        <div className="stat-card wallet-card">
          <div className="stat-label">
            Saldo tercatat <Wallet size={18} />
          </div>
          <strong>{money(wallet(s))}</strong>
          <div className="stat-foot">
            <span className="dot" /> Pemasukan dikurangi pengeluaran
          </div>
          <span className="wallet-orbit" />
        </div>
        <div className="stat-card">
          <div className="stat-label">
            Pemasukan bulan ini{" "}
            <span className="stat-icon green">
              <ArrowDownLeft size={17} />
            </span>
          </div>
          <strong>{money(income)}</strong>
          <button className="text-button" onClick={() => setForm("income")}>
            Tambah pemasukan <Plus size={13} />
          </button>
        </div>
        <div className="stat-card">
          <div className="stat-label">
            Pengeluaran bulan ini{" "}
            <span className="stat-icon sand">
              <ArrowUpRight size={17} />
            </span>
          </div>
          <strong>{money(spent)}</strong>
          <div className="stat-foot">
            {tx.filter((t) => t.kind === "expense").length} transaksi tercatat
          </div>
        </div>
        <Link className="stat-card points-card" href="/budget/">
          <div className="stat-label">
            Poin kamu <Sparkles size={18} />
          </div>
          <strong>
            {num(points(s))}
            <small> pts</small>
          </strong>
          <div className="stat-foot">
            Terus terkumpul, tanpa kedaluwarsa <ArrowUpRight size={14} />
          </div>
        </Link>
      </div>
      <div className="dashboard-columns">
        <div className="left-column">
          <section className="card budget-overview">
            <div className="section-head">
              <div>
                <h2>Ruang untuk bulan ini</h2>
                <p>Budget bulanan, tanpa batas harian.</p>
              </div>
              <Link className="text-button" href="/budget/">
                Atur budget <ArrowUpRight size={15} />
              </Link>
            </div>
            <div className="budget-total">
              <strong>{money(remaining)}</strong>
              <span>total budget tersisa</span>
            </div>
            <div className="budget-breakdown">
              {s.categories.slice(0, 4).map((c) => {
                const b = budget(s, month, c.id);
                return (
                  <div className="budget-row" key={c.id}>
                    <div className="budget-row-label">
                      <span className="category-label">
                        <span
                          className="category-dot"
                          style={{ background: c.color }}
                        />
                        {c.name}
                      </span>
                      <span>
                        <b>{money(b.spent)}</b>{" "}
                        <span className="muted">/ {money(b.total)}</span>
                      </span>
                    </div>
                    <div className="progress">
                      <span
                        style={{
                          width:
                            Math.min(
                              100,
                              Math.max(0, (b.spent / b.total) * 100 || 0),
                            ) + "%",
                          background: c.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="subtle-note">
              <Sparkles size={15} />
              <span>
                Sisa budget akhir bulan otomatis menjadi poin. 1{" "}
                {s.settings.currency} = 1 poin.
              </span>
            </div>
          </section>
          <section className="card">
            <div className="section-head">
              <div>
                <h2>Ritme pengeluaran</h2>
                <p>Langkah kecil untuk lebih sadar belanja.</p>
              </div>
              <span className="pill neutral">7 hari terakhir</span>
            </div>
            <div className="chart">
              <div className="chart-axis">
                <span>{money(max)}</span>
                <span>{money(max / 2)}</span>
                <span>0</span>
              </div>
              <div className="chart-bars">
                {chart.map((d, i) => (
                  <div className="bar-column" key={d.date}>
                    <span className="bar-value">
                      {d.amount ? money(d.amount) : ""}
                    </span>
                    <div
                      className={"bar " + (i === 6 ? "current" : "")}
                      style={{
                        height: Math.max(3, (d.amount / max) * 115) + "px",
                      }}
                      title={money(d.amount)}
                    />
                    <span className={i === 6 ? "current-label" : ""}>
                      {new Intl.DateTimeFormat("id-ID", {
                        weekday: "short",
                        timeZone: "UTC",
                      }).format(new Date(d.date + "T12:00:00Z"))}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
          <section className="card">
            <div className="section-head">
              <div>
                <h2>Transaksi terbaru</h2>
                <p>Setiap catatan membantu melihat gambaran besarnya.</p>
              </div>
              <Link href="/tracker/" className="text-button">
                Lihat semua <ArrowRight size={15} />
              </Link>
            </div>
            {s.transactions.length === 0 ? (
              <Empty
                title="Mulai dari satu catatan"
                description="Tambahkan pemasukan atau pengeluaran pertamamu."
              />
            ) : (
              <div className="transaction-list">
                {[...s.transactions]
                  .reverse()
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 4)
                  .map((t) => (
                    <div className="transaction-row" key={t.id}>
                      <span
                        className={
                          "transaction-icon " +
                          (t.kind === "income" ? "income" : "")
                        }
                      >
                        {t.kind === "income" ? (
                          <ArrowDownLeft size={19} />
                        ) : (
                          <CategoryIcon id={t.category} />
                        )}
                      </span>
                      <div>
                        <b>{t.title}</b>
                        <small>
                          {t.kind === "income"
                            ? "Pemasukan"
                            : s.categories.find((c) => c.id === t.category)
                                ?.name}{" "}
                          ·{" "}
                          {t.date === today
                            ? "Hari ini"
                            : t.date.slice(8) + "/" + t.date.slice(5, 7)}
                        </small>
                      </div>
                      <Amount value={t.amount} income={t.kind === "income"} />
                    </div>
                  ))}
              </div>
            )}
          </section>
        </div>
        <div className="right-column">
          <section className="card challenges-preview">
            <div className="section-head">
              <div className="inline-heading">
                <span className="tiny-icon">
                  <Target size={17} />
                </span>
                <h2>Challenge hari ini</h2>
              </div>
              <span className="pill green">
                {done}/{total}
              </span>
            </div>
            <div className="challenge-ring-row">
              <div
                className="ring"
                style={{
                  background: `conic-gradient(var(--accent) ${total ? (done / total) * 100 : 0}%, var(--track) 0)`,
                }}
              >
                <span>
                  {total ? Math.round((done / total) * 100) : 0}
                  <small>%</small>
                </span>
              </div>
              <div>
                <h3>
                  {done === total && total
                    ? "Kamu menuntaskannya!"
                    : "Sedikit lagi, lebih baik."}
                </h3>
                <p>
                  {total
                    ? done === total
                      ? "Bonus komplet sudah didapat."
                      : "Selesaikan semuanya untuk bonus"
                    : "Susun rutinitas versimu sendiri."}
                </p>
                {total > 0 && (
                  <span className="bonus-tag">
                    <Sparkles size={13} /> +{day.bonus} poin bonus
                  </span>
                )}
              </div>
            </div>
            <div className="challenge-mini-list">
              {day?.items.slice(0, 4).map((c) => (
                <div
                  className={
                    "mini-challenge " + (c.status === "done" ? "done" : "")
                  }
                  key={c.id}
                >
                  <button
                    aria-label={
                      (c.status === "done" ? "Batalkan " : "Selesaikan ") +
                      c.title
                    }
                    className={"check-button " + c.status}
                    onClick={() =>
                      void mutate((st) =>
                        setChallenge(
                          st,
                          today,
                          c.id,
                          c.status === "done" ? "pending" : "done",
                          today,
                        ),
                      )
                    }
                  >
                    {c.status === "done" && <Check size={13} />}
                  </button>
                  <div>
                    <b>{c.title}</b>
                    <span>{c.time}</span>
                  </div>
                  <small>+{c.reward}</small>
                </div>
              ))}
            </div>
            <Link className="btn full secondary" href="/challenges/">
              {total ? "Lihat semua challenge" : "Susun challenge hari ini"}{" "}
              <ArrowRight size={15} />
            </Link>
          </section>
          <section className="insight-card">
            <div className="insight-eyebrow">
              <Sparkles size={16} /> A LITTLE INSIGHT
            </div>
            <h2>
              {fnb.remaining > 0
                ? "Masih ada ruang untuk pilihan yang baik."
                : "Saatnya cek kembali budget makan."}
            </h2>
            <p>
              {fnb.remaining > 0
                ? `Budget makan tersisa ${money(fnb.remaining)}. Coba jadwalkan masak di rumah untuk membantu menjaga pengeluaran.`
                : "Budget makan sudah habis. Tukar poin terlebih dahulu sebelum mencatat pengeluaran berikutnya."}
            </p>
            <Link href="/insights/">
              Temukan insight lainnya <ArrowUpRight size={16} />
            </Link>
            <span className="insight-flower">✳</span>
          </section>
          <section className="card pending-card">
            <div className="section-head">
              <h2>Jangan sampai terlewat</h2>
              <span className="notification-dot" />
            </div>
            {unpaid.length ? (
              unpaid
                .sort((a, b) => a.due.localeCompare(b.due))
                .slice(0, 2)
                .map((b) => (
                  <div className="pending-row" key={b.id}>
                    <span className="transaction-icon">
                      <Receipt size={18} />
                    </span>
                    <div>
                      <b>{b.title}</b>
                      <small>
                        {b.due < today
                          ? "Sudah jatuh tempo"
                          : `Jatuh tempo ${b.due.slice(8)}/${b.due.slice(5, 7)}`}
                      </small>
                    </div>
                    <strong>{money(b.amount)}</strong>
                  </div>
                ))
            ) : (
              <p className="muted">
                Tidak ada tagihan menunggu. Satu hal lebih ringan hari ini.
              </p>
            )}
            <Link href="/bills/" className="text-button">
              Kelola tagihan <ChevronRight size={15} />
            </Link>
          </section>
        </div>
      </div>
      {form && <TransactionForm initial={form} onClose={() => setForm(null)} />}
    </>
  );
}
