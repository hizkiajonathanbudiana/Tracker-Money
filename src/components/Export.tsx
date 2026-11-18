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
        description="Download reports, make a backup, or move your data to another device."
      />
      <div className="two-grid">
        <section className="card export-card">
          <span className="export-icon">
            <FileSpreadsheet size={27} />
          </span>
          <h2>Transaction report</h2>
          <p>Export income and expenses as a CSV for Excel or Google Sheets.</p>
          <label>
            Period
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
                      "Date",
                      "Type",
                      "Description",
                      "Category",
                      "Amount",
                      "Currency",
                      "Note",
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
                notify(tx.length + " transactions exported.");
              }}
            >
              <Download size={16} /> Export CSV
            </button>
            <button className="text-button" onClick={() => setMonth("")}>
              All periods
            </button>
          </div>
        </section>
        <section className="card export-card">
          <span className="export-icon sand">
            <Database size={27} />
          </span>
          <h2>Full backup</h2>
          <p>
            Save transactions, budgets, points, bills, challenges, templates,
            and settings in one JSON file.
          </p>
          <div className="backup-counts">
            <span>{s.transactions.length} transactions</span>
            <span>{s.ledger.length} point entries</span>
            <span>{Object.keys(s.days).length} days</span>
          </div>
          <button
            className="btn primary"
            onClick={() => {
              download(
                "money-tracker-backup-" + today + ".json",
                JSON.stringify(s, null, 2),
                "application/json",
              );
              notify("Backup downloaded.");
            }}
          >
            <Download size={16} /> Download backup
          </button>
        </section>
        <section className="card export-card">
          <span className="export-icon purple">
            <Upload size={27} />
          </span>
          <h2>Restore data</h2>
          <p>
            Import a Money Tracker v2 backup. Review the summary before
            replacing data on this device.
          </p>
          <div className="notice small-notice">
            Download a backup of your current data before restoring.
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
                  throw Error("Backup files must be 10 MB or smaller.");
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
            <Upload size={16} /> Choose backup file
          </button>
        </section>
        <section className="card export-card">
          <span className="export-icon">
            <CalendarDays size={27} />
          </span>
          <h2>Calendar & points history</h2>
          <p>
            Export challenges to Google Calendar or Apple Calendar, or download
            your points history.
          </p>
          <label>
            Challenge date
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
                  return notify("No challenges scheduled for this date.");
                download(
                  "challenges-" + date + ".ics",
                  calendarICS(date, items, s),
                  "text/calendar",
                );
              }}
            >
              <Download size={15} /> Calendar (.ics)
            </button>
            <button
              className="btn secondary"
              onClick={() =>
                download(
                  "points-" + today + ".csv",
                  csv([
                    ["Date", "Description", "Type", "Points"],
                    ...s.ledger.map((e) => [e.date, e.title, e.kind, e.points]),
                  ]),
                  "text/csv;charset=utf-8",
                )
              }
            >
              Points CSV
            </button>
          </div>
        </section>
      </div>
      <div className="subtle-note">
        Data is saved in this browser. Use JSON backups to move data between
        devices and CSV files for reports.
      </div>
      {backup && (
        <Modal title="Restore this backup?" onClose={() => setBackup(null)}>
          <p>
            <b>{backup.settings.name}</b> · {backup.transactions.length}{" "}
            transactions · {backup.ledger.length} point entries ·{" "}
            {Object.keys(backup.days).length} challenge days.
          </p>
          <p>
            This replaces your current data. Missed challenges and unused
            budgets are processed when you restore.
          </p>
          <div className="modal-actions">
            <button className="btn secondary" onClick={() => setBackup(null)}>
              Cancel
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
              Restore data
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
