"use client";
import { useState, FormEvent } from "react";
import {
  Plus,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Sparkles,
  Clock,
  Trash2,
  ExternalLink,
  Download,
  CalendarPlus,
  Bookmark,
  X,
  Pencil,
} from "lucide-react";
import { useStore } from "./Store";
import { Heading, Modal, Empty } from "./UI";
import {
  addChallenge,
  addDays,
  setChallenge,
  removeChallenge,
  editChallenge,
  copyDay,
  uid,
} from "@/lib/model";
import {
  calendarLink,
  calendarICS,
  download,
  syncCalendar,
} from "@/lib/integrations";
export default function Challenges() {
  const { s, today, mutate, notify } = useStore(),
    [date, setDate] = useState(today),
    [modal, setModal] = useState<"add" | "copy" | "template" | "edit" | null>(
      null,
    ),
    [editId, setEditId] = useState(""),
    [source, setSource] = useState(addDays(today, -1)),
    [tab, setTab] = useState("date"),
    [template, setTemplate] = useState(s.templates[0]?.id ?? ""),
    [syncing, setSyncing] = useState("");
  const day = s.days[date],
    items = day?.items ?? [],
    done = items.filter((c) => c.status === "done").length,
    locked = date < today || day?.closed,
    week = Array.from({ length: 7 }, (_, i) => addDays(date, i - 3)),
    editing = items.find((c) => c.id === editId);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const ok = await mutate((st) => {
      const title = String(f.get("title")),
        time = String(f.get("time")),
        duration = Number(f.get("duration"));
      if (modal === "edit")
        editChallenge(st, date, editId, title, time, duration, today);
      else addChallenge(st, date, title, time, duration, today);
    }, "Jadwal challenge disimpan.");
    if (ok) setModal(null);
  }
  return (
    <>
      <Heading
        eyebrow="SHOW UP FOR YOURSELF"
        title="Small steps. Real progress."
        description="Jadwal boleh berbeda. Kebiasaan baik tetap bertumbuh."
        actions={
          <>
            <button className="btn secondary" onClick={() => setModal("copy")}>
              <Copy size={16} /> Salin jadwal
            </button>
            <button
              className="btn primary"
              disabled={locked}
              onClick={() => setModal("add")}
            >
              <Plus size={17} /> Challenge baru
            </button>
          </>
        }
      />
      <div className="challenge-layout">
        <div>
          <section className="card calendar-strip">
            <div className="section-head">
              <div className="inline-heading">
                <CalendarDays size={18} />
                <h2>
                  {new Intl.DateTimeFormat("id-ID", {
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(new Date(date + "T12:00:00Z"))}
                </h2>
              </div>
              <div className="inline-actions">
                <button className="text-button" onClick={() => setDate(today)}>
                  Hari ini
                </button>
                <input
                  aria-label="Tanggal challenge"
                  type="date"
                  value={date}
                  onChange={(e) => {
                    if (e.target.value) setDate(e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="week-strip">
              <button
                aria-label="Hari sebelumnya"
                className="icon-button"
                onClick={() => setDate(addDays(date, -1))}
              >
                <ChevronLeft size={18} />
              </button>
              {week.map((d) => (
                <button
                  className={"day-button " + (d === date ? "selected" : "")}
                  onClick={() => setDate(d)}
                  key={d}
                >
                  <small>
                    {new Intl.DateTimeFormat("id-ID", {
                      weekday: "short",
                      timeZone: "UTC",
                    }).format(new Date(d + "T12:00:00Z"))}
                  </small>
                  <b>{Number(d.slice(8))}</b>
                  <i className={s.days[d]?.items.length ? "has-items" : ""} />
                </button>
              ))}
              <button
                aria-label="Hari berikutnya"
                className="icon-button"
                onClick={() => setDate(addDays(date, 1))}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </section>
          <section className="card">
            <div className="section-head">
              <div>
                <h2>
                  {date === today ? "Rencanamu hari ini" : "Rencana " + date}
                </h2>
                <p>
                  {done} dari {items.length} selesai
                  {locked ? " · Riwayat terkunci" : ""}
                </p>
              </div>
              {items.length > 0 && (
                <span className="pill green">
                  {done === items.length
                    ? `Bonus +${day.bonus} didapat!`
                    : `Bonus komplet +${day.bonus}`}
                </span>
              )}
            </div>
            {items.length ? (
              <div className="full-challenge-list">
                {[...items]
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((c) => (
                    <div className={"full-challenge " + c.status} key={c.id}>
                      <button
                        className={"check-button " + c.status}
                        aria-label={
                          (c.status === "done" ? "Batalkan " : "Selesaikan ") +
                          c.title
                        }
                        disabled={date !== today || day.closed}
                        onClick={() =>
                          void mutate(
                            (st) =>
                              setChallenge(
                                st,
                                date,
                                c.id,
                                c.status === "done" ? "pending" : "done",
                                today,
                              ),
                            c.status === "done"
                              ? "Status dibatalkan."
                              : "Nice! Poin bertambah.",
                          )
                        }
                      >
                        {c.status === "done" ? (
                          <Check size={16} />
                        ) : c.status === "missed" ? (
                          <X size={14} />
                        ) : null}
                      </button>
                      <div className="challenge-body">
                        <h3>{c.title}</h3>
                        <div className="challenge-detail">
                          <span>
                            <Clock size={13} />
                            {c.time} · {c.duration} menit
                          </span>
                          <span>
                            {c.status === "done"
                              ? `+${c.reward} poin`
                              : c.status === "missed"
                                ? `−${c.penalty} poin`
                                : `+${c.reward} selesai / −${c.penalty} terlewat`}
                          </span>
                        </div>
                        <div className="challenge-actions">
                          <a
                            target="_blank"
                            rel="noreferrer"
                            href={calendarLink(date, c, s.settings.timeZone)}
                          >
                            <ExternalLink size={12} /> Google Calendar
                          </a>
                          <button
                            disabled={!!syncing}
                            onClick={async () => {
                              setSyncing(c.id);
                              try {
                                const id = await syncCalendar(date, c, s);
                                await mutate((st) => {
                                  const target = st.days[date].items.find(
                                    (i) => i.id === c.id,
                                  );
                                  if (target) target.calendarId = id;
                                }, "Event & reminder tersimpan di Google Calendar.");
                              } catch (e) {
                                notify((e as Error).message);
                              } finally {
                                setSyncing("");
                              }
                            }}
                          >
                            <CalendarPlus size={12} />
                            {syncing === c.id
                              ? "Menyimpan…"
                              : c.calendarId
                                ? "Update event"
                                : "Sinkronkan"}
                          </button>
                          {date === today && (
                            <button
                              disabled={day.closed}
                              onClick={() =>
                                void mutate(
                                  (st) =>
                                    setChallenge(
                                      st,
                                      date,
                                      c.id,
                                      c.status === "missed"
                                        ? "pending"
                                        : "missed",
                                      today,
                                    ),
                                  c.status === "missed"
                                    ? "Status dibatalkan."
                                    : "Challenge ditandai terlewat.",
                                )
                              }
                            >
                              {c.status === "missed"
                                ? "Batalkan terlewat"
                                : "Tandai terlewat"}
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <button
                          aria-label={"Ubah " + c.title}
                          className="icon-button"
                          disabled={locked || c.status !== "pending"}
                          onClick={() => {
                            setEditId(c.id);
                            setModal("edit");
                          }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          aria-label={"Hapus " + c.title}
                          className="icon-button"
                          disabled={locked || c.status !== "pending"}
                          onClick={() =>
                            void mutate(
                              (st) => removeChallenge(st, date, c.id, today),
                              "Challenge dihapus.",
                            )
                          }
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <Empty
                title="Hari baru, rencana baru"
                description="Susun challenge sendiri atau gunakan template. Hari tanpa challenge tidak dikenai penalti."
              >
                <button
                  className="btn primary"
                  disabled={locked}
                  onClick={() => {
                    setTab("template");
                    setModal("copy");
                  }}
                >
                  Gunakan template
                </button>
              </Empty>
            )}
          </section>
        </div>
        <aside className="challenge-aside">
          <section className="card soft-card">
            <Sparkles size={25} />
            <h2>Usaha kecil tetap berarti.</h2>
            <p>
              Selesaikan 10 challenge untuk mendapat{" "}
              {10 * s.settings.reward + s.settings.bonus} poin, termasuk bonus +
              {s.settings.bonus}.
            </p>
            <div className="rules-list">
              <div>
                <span>Selesai</span>
                <b className="positive">+{s.settings.reward} poin</b>
              </div>
              <div>
                <span>Terlewat</span>
                <b className="negative">−{s.settings.penalty} poin</b>
              </div>
              <div>
                <span>Semua selesai</span>
                <b>+{s.settings.bonus} bonus</b>
              </div>
            </div>
            <p className="fine-print">
              Challenge pending dipotong setelah harinya berakhir, saat app
              dibuka atau aktif kembali. Saldo dapat negatif. Jadwal tidak
              berulang otomatis.
            </p>
          </section>
          <section className="card">
            <h2>Jadikan rutinitasmu lebih mudah</h2>
            <p className="muted">
              Simpan susunan hari ini sebagai template atau bawa ke kalender.
            </p>
            <button
              className="btn secondary full"
              disabled={!items.length}
              onClick={() => setModal("template")}
            >
              <Bookmark size={15} /> Simpan template
            </button>
            <button
              className="btn secondary full"
              disabled={!items.length}
              onClick={() => {
                download(
                  "challenges-" + date + ".ics",
                  calendarICS(date, items, s),
                  "text/calendar",
                );
                notify(
                  "File kalender diunduh. Impor ke Google/Apple Calendar untuk reminder.",
                );
              }}
            >
              <Download size={15} /> Export kalender (.ics)
            </button>
            <p className="fine-print">
              Sinkronkan memerlukan koneksi Google di Pengaturan. Tautan Google
              Calendar dan .ics dapat digunakan tanpa koneksi app.
            </p>
          </section>
        </aside>
      </div>
      {(modal === "add" || modal === "edit") && (
        <Modal
          title={modal === "edit" ? "Ubah challenge" : "Challenge baru"}
          onClose={() => setModal(null)}
        >
          <form className="form-stack" onSubmit={submit}>
            <label>
              Apa yang ingin kamu lakukan?
              <input
                name="title"
                required
                maxLength={150}
                defaultValue={modal === "edit" ? editing?.title : ""}
                placeholder="Contoh: Siapkan bekal untuk besok"
                autoFocus
              />
            </label>
            <div className="form-row">
              <label>
                Jam mulai
                <input
                  name="time"
                  type="time"
                  defaultValue={modal === "edit" ? editing?.time : "09:00"}
                  required
                />
              </label>
              <label>
                Durasi (menit)
                <input
                  name="duration"
                  type="number"
                  min="1"
                  max="1440"
                  defaultValue={modal === "edit" ? editing?.duration : 15}
                  required
                />
              </label>
            </div>
            <div className="info-line">
              {date} · {s.settings.timeZone}
            </div>
            {editing?.calendarId && modal === "edit" && (
              <p className="fine-print">
                Klik Update event setelah menyimpan agar Google Calendar ikut
                diperbarui.
              </p>
            )}
            <button className="btn primary">Simpan challenge</button>
          </form>
        </Modal>
      )}
      {modal === "copy" && (
        <Modal title="Salin jadwal challenge" onClose={() => setModal(null)}>
          <p>
            Tujuan: <b>{date}</b>. Status dan poin tidak ikut disalin. Tanggal
            tujuan harus kosong.
          </p>
          <div className="segmented">
            <button
              className={tab === "date" ? "active" : ""}
              onClick={() => setTab("date")}
            >
              Dari tanggal
            </button>
            <button
              className={tab === "template" ? "active" : ""}
              onClick={() => setTab("template")}
            >
              Dari template
            </button>
          </div>
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              if (
                await mutate(
                  (st) =>
                    copyDay(
                      st,
                      tab === "date"
                        ? (st.days[source]?.items ?? [])
                        : (st.templates.find((t) => t.id === template)?.items ??
                            []),
                      date,
                      today,
                    ),
                  "Jadwal berhasil disalin.",
                )
              )
                setModal(null);
            }}
          >
            {tab === "date" ? (
              <label>
                Tanggal sumber
                <input
                  type="date"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  required
                />
              </label>
            ) : (
              <label>
                Template
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                >
                  {s.templates.map((t) => (
                    <option value={t.id} key={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button className="btn primary">Salin ke {date}</button>
          </form>
        </Modal>
      )}
      {modal === "template" && (
        <Modal title="Simpan sebagai template" onClose={() => setModal(null)}>
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const name = String(new FormData(e.currentTarget).get("name"));
              if (
                await mutate((st) => {
                  st.templates.push({
                    id: uid(),
                    name,
                    items: items.map((c) => ({
                      ...c,
                      status: "pending",
                      calendarId: undefined,
                    })),
                  });
                }, "Template tersimpan.")
              )
                setModal(null);
            }}
          >
            <label>
              Nama template
              <input
                name="name"
                required
                maxLength={100}
                placeholder="Rutinitas hari kerja"
              />
            </label>
            <button className="btn primary">
              Simpan {items.length} challenge
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
