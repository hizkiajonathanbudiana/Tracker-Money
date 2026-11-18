"use client";
import { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Plus,
  KeyRound,
  Lightbulb,
  Target,
  Receipt,
  Check,
} from "lucide-react";
import { useStore } from "./Store";
import { Heading, useMoney } from "./UI";
import { budget, addChallenge } from "@/lib/model";
import { askAI } from "@/lib/integrations";
export default function Insights() {
  const { s, today, mutate, notify, apiKey, setApiKey } = useStore(),
    [question, setQuestion] = useState(
      "Analisis keuangan dan konsistensi challenge saya. Sarankan 3 challenge realistis untuk hari ini.",
    ),
    [busy, setBusy] = useState(false),
    [result, setResult] = useState<{
      summary: string;
      suggestions: { title: string; time: string; reason: string }[];
    } | null>(null),
    [added, setAdded] = useState<string[]>([]);
  const money = useMoney(),
    month = today.slice(0, 7),
    budgets = s.categories.map((c) => ({ ...c, ...budget(s, month, c.id) })),
    highest = [...budgets].sort(
      (a, b) =>
        (b.total ? b.spent / b.total : 0) - (a.total ? a.spent / a.total : 0),
    )[0],
    recent = Object.entries(s.days)
      .filter(([d]) => d <= today)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7),
    count = recent.reduce((a, [, d]) => a + d.items.length, 0),
    done = recent.reduce(
      (a, [, d]) => a + d.items.filter((c) => c.status === "done").length,
      0,
    ),
    unpaid = s.bills.filter((b) => !b.paid);
  const suggestions = [
    {
      title: "Review pengeluaran selama 5 menit",
      time: "20:00",
      reason: "Bantu menjaga catatan keuangan tetap lengkap.",
    },
    {
      title: "Siapkan satu porsi makan di rumah",
      time: "18:00",
      reason: "Pilihan sederhana untuk menjaga budget makan.",
    },
    {
      title: "Cek tagihan dan tanggal jatuh tempo",
      time: "09:00",
      reason: `Ada ${unpaid.length} tagihan yang belum dibayar.`,
    },
  ];
  return (
    <>
      <Heading
        eyebrow="A THOUGHTFUL LITTLE COMPANION"
        title="A clearer picture."
        description="Kenali pola keuanganmu. Temukan langkah kecil berikutnya."
        actions={
          <span className="pill green">
            <Sparkles size={14} /> Your everyday companion
          </span>
        }
      />
      <section className="insight-intro">
        <div>
          <span className="eyebrow">INSIGHT DARI CATATANMU</span>
          <h2>
            Lebih sadar hari ini.
            <br />
            <em>Lebih siap untuk besok.</em>
          </h2>
          <p>
            Ringkasan otomatis tersedia langsung. Gunakan AI untuk melihat
            kebiasaan dari sudut pandang baru.
          </p>
        </div>
        <div className="insight-art">
          <div className="art-circle">
            <Sparkles size={42} />
          </div>
          <span className="floating-tag first">small wins ✳</span>
          <span className="floating-tag second">better habits ↗</span>
        </div>
      </section>
      <div className="three-grid insights-stat">
        <section className="card">
          <span className="stat-icon green">
            <Lightbulb size={19} />
          </span>
          <h3>Perhatikan {highest.name}</h3>
          <p>
            {money(highest.spent)} dari {money(highest.total)} telah dipakai.
            Tersisa {money(highest.remaining)} untuk bulan ini.
          </p>
        </section>
        <section className="card">
          <span className="stat-icon sand">
            <Target size={19} />
          </span>
          <h3>
            {count ? Math.round((done / count) * 100) : 0}% challenge selesai
          </h3>
          <p>
            {done} dari {count} challenge pada {recent.length} hari tercatat
            terakhir. Mulai dari rencana yang realistis dan konsisten.
          </p>
        </section>
        <section className="card">
          <span className="stat-icon purple">
            <Receipt size={19} />
          </span>
          <h3>
            {money(unpaid.reduce((a, b) => a + b.amount, 0))} belum dibayar
          </h3>
          <p>
            {unpaid.length} tagihan pending. Sisihkan dana sebelum melakukan
            pembelian tambahan.
          </p>
        </section>
      </div>
      <p className="fine-print section-note">
        Ringkasan di atas dihitung dari data lokal; bukan jawaban model AI.
      </p>
      <div className="two-grid align-start">
        <section className="card ai-panel">
          <div className="section-head">
            <div className="inline-heading">
              <Sparkles size={20} />
              <h2>Tanya AI companion</h2>
            </div>
            <span className="pill neutral">Gemini</span>
          </div>
          <p className="muted">
            Saat menekan Analisis, ringkasan budget, saldo, tagihan, dan
            nama/status challenge dikirim ke Google Gemini. AI memberi saran;
            perubahan data tetap melalui klikmu.
          </p>
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              try {
                setResult(await askAI(s, today, apiKey, question));
                setAdded([]);
              } catch (e) {
                notify((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              <span className="inline-heading">
                <KeyRound size={14} /> Gemini API key
              </span>
              <input
                type="password"
                autoComplete="off"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Masukkan key pribadi untuk sesi ini"
                required
              />
            </label>
            <span className="fine-print">
              Key hanya di memori sesi, tidak masuk backup atau penyimpanan
              browser. Model: {s.settings.aiModel} ·{" "}
              <Link href="/settings/">Atur model</Link>
            </span>
            <label>
              Apa yang ingin kamu pahami?
              <textarea
                rows={4}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                maxLength={1500}
              />
            </label>
            <button className="btn primary" disabled={busy}>
              <Sparkles size={16} />
              {busy ? "Sedang menganalisis…" : "Analisis dengan AI"}
            </button>
          </form>
          {result && (
            <div className="ai-result">
              <span className="eyebrow">JAWABAN AI</span>
              <p>{result.summary}</p>
              <span className="fine-print">
                Tinjau saran AI; hasilnya dapat keliru.
              </span>
            </div>
          )}
        </section>
        <section className="card">
          <div className="section-head">
            <div>
              <h2>
                {result
                  ? "Saran challenge dari AI"
                  : "Ide untuk langkah berikutnya"}
              </h2>
              <p>
                {result
                  ? "Tambahkan yang cocok untuk harimu."
                  : "Saran awal berbasis aturan, tanpa koneksi AI."}
              </p>
            </div>
          </div>
          <div className="suggestions">
            {(result?.suggestions ?? suggestions).map((x, i) => (
              <div className="suggestion" key={i}>
                <span className="suggestion-no">0{i + 1}</span>
                <div>
                  <h3>{x.title}</h3>
                  <p>{x.reason}</p>
                  <span className="fine-print">
                    Hari ini · {x.time} · 15 menit
                  </span>
                </div>
                <button
                  className="icon-button"
                  disabled={added.includes(x.title)}
                  aria-label={"Tambah " + x.title}
                  onClick={async () => {
                    if (
                      await mutate(
                        (st) =>
                          addChallenge(st, today, x.title, x.time, 15, today),
                        "Saran ditambahkan ke challenge hari ini.",
                      )
                    )
                      setAdded((a) => [...a, x.title]);
                  }}
                >
                  {added.includes(x.title) ? (
                    <Check size={17} />
                  ) : (
                    <Plus size={18} />
                  )}
                </button>
              </div>
            ))}
          </div>
          <div className="subtle-note">
            <Target size={16} /> Pilih langkah yang realistis untuk harimu.
          </div>
        </section>
      </div>
    </>
  );
}
