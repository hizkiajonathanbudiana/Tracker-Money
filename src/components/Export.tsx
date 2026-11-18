"use client";
import { useState, useRef } from "react";
import {
  Download,
  Upload,
  FileSpreadsheet,
  Database,
  CalendarDays,
} from "lucide-react";
import { useStore } from "./Store";
import { Heading, Modal } from "./UI";
import { State, validateState } from "@/lib/model";
import { download, csv, calendarICS } from "@/lib/integrations";
export default function Export() {
  const { s, today, replace, notify } = useStore(),
    [month, setMonth] = useState(today.slice(0, 7)),
    [date, setDate] = useState(today),
    [backup, setBackup] = useState<State | null>(null),
    ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <Heading
        eyebrow="YOUR DATA, ALWAYS YOURS"
        title="Take it with you."
        description="Export laporan, simpan backup, atau pindahkan data ke perangkat lain."
      />
      <div className="two-grid">
        <section className="card export-card">
          <span className="export-icon">
            <FileSpreadsheet size={27} />
          </span>
          <h2>Laporan transaksi</h2>
          <p>
            Pemasukan dan pengeluaran dalam CSV untuk Excel atau Google Sheets.
          </p>
          <label>
            Periode
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>
          <div className="inline-actions">
            <button
              className="btn primary"
              onClick={() => {
                const tx = s.transactions.filter(
                  (t) => !month || t.date.startsWith(month),
                );
                download(
                  "money-tracker-" + (month || "all") + ".csv",
                  csv([
                    [
                      "Tanggal",
                      "Jenis",
                      "Keterangan",
                      "Kategori",
                      "Nominal",
                      "Mata uang",
                      "Catatan",
                    ],
                    ...tx.map((t) => [
                      t.date,
                      t.kind,
                      t.title,
                      s.categories.find((c) => c.id === t.category)?.name ??
                        "Income",
                      t.amount,
                      s.settings.currency,
                      t.note ?? "",
                    ]),
                  ]),
                  "text/csv;charset=utf-8",
                );
                notify(tx.length + " transaksi diexport.");
              }}
            >
              <Download size={16} /> Export CSV
            </button>
            <button className="text-button" onClick={() => setMonth("")}>
              Semua periode
            </button>
          </div>
        </section>
        <section className="card export-card">
          <span className="export-icon sand">
            <Database size={27} />
          </span>
          <h2>Backup lengkap</h2>
          <p>
            Semua transaksi, budget, poin, tagihan, challenge, template, dan
            pengaturan dalam satu file JSON.
          </p>
          <div className="backup-counts">
            <span>{s.transactions.length} transaksi</span>
            <span>{s.ledger.length} entri poin</span>
            <span>{Object.keys(s.days).length} hari</span>
          </div>
          <button
            className="btn primary"
            onClick={() => {
              download(
                "money-tracker-backup-" + today + ".json",
                JSON.stringify(s, null, 2),
                "application/json",
              );
              notify("Backup lengkap diunduh.");
            }}
          >
            <Download size={16} /> Download backup
          </button>
        </section>
        <section className="card export-card">
          <span className="export-icon purple">
            <Upload size={27} />
          </span>
          <h2>Pulihkan data</h2>
          <p>
            Impor backup Money Tracker v2. Tinjau ringkasan sebelum mengganti
            data perangkat.
          </p>
          <div className="notice small-notice">
            Download backup data saat ini sebelum memulihkan.
          </div>
          <input
            ref={ref}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (!f) return;
              try {
                if (f.size > 10 * 1024 * 1024)
                  throw Error("Backup maksimal 10 MB.");
                setBackup(validateState(JSON.parse(await f.text())));
              } catch (err) {
                notify((err as Error).message);
              }
            }}
          />
          <button
            className="btn secondary"
            onClick={() => ref.current?.click()}
          >
            <Upload size={16} /> Pilih file backup
          </button>
        </section>
        <section className="card export-card">
          <span className="export-icon">
            <CalendarDays size={27} />
          </span>
          <h2>Jadwal & riwayat poin</h2>
          <p>
            Bawa challenge ke Google Calendar/Apple Calendar atau export
            perjalanan poin.
          </p>
          <label>
            Tanggal challenge
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <div className="inline-actions wrap">
            <button
              className="btn secondary"
              onClick={() => {
                const items = s.days[date]?.items ?? [];
                if (!items.length)
                  return notify("Tidak ada challenge pada tanggal ini.");
                download(
                  "challenges-" + date + ".ics",
                  calendarICS(date, items, s),
                  "text/calendar",
                );
              }}
            >
              <Download size={15} /> Kalender .ics
            </button>
            <button
              className="btn secondary"
              onClick={() =>
                download(
                  "points-" + today + ".csv",
                  csv([
                    ["Tanggal", "Keterangan", "Jenis", "Poin"],
                    ...s.ledger.map((e) => [e.date, e.title, e.kind, e.points]),
                  ]),
                  "text/csv;charset=utf-8",
                )
              }
            >
              Poin CSV
            </button>
          </div>
        </section>
      </div>
      <div className="subtle-note">
        Data tersimpan di browser/perangkat ini. Backup JSON untuk pemindahan
        data; CSV untuk pelaporan.
      </div>
      {backup && (
        <Modal title="Pulihkan backup ini?" onClose={() => setBackup(null)}>
          <p>
            <b>{backup.settings.name}</b> · {backup.transactions.length}{" "}
            transaksi · {backup.ledger.length} entri poin ·{" "}
            {Object.keys(backup.days).length} hari challenge.
          </p>
          <p>
            Data saat ini akan diganti. Challenge lewat dan sisa budget bulan
            sebelumnya diproses sesuai aturan saat dipulihkan.
          </p>
          <div className="modal-actions">
            <button className="btn secondary" onClick={() => setBackup(null)}>
              Batal
            </button>
            <button
              className="btn primary"
              onClick={async () => {
                if (await replace(backup)) {
                  setBackup(null);
                  window.location.reload();
                }
              }}
            >
              Pulihkan data
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
