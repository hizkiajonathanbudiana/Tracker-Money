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
    }, "Challenge saved.");
    if (ok) setModal(null);
  }
  return (
    <>
      <Heading
        eyebrow="SHOW UP FOR YOURSELF"
        title="Small steps. Real progress."
        description="Plan challenges for each day and track your progress."
        actions={
          <>
            <button className="btn secondary" onClick={() => setModal("copy")}>
              <Copy size={16} /> Copy schedule
            </button>
            <button
              className="btn primary"
              disabled={locked}
              onClick={() => setModal("add")}
            >
              <Plus size={17} /> New challenge
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
                  {new Intl.DateTimeFormat("en-US", {
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(new Date(date + "T12:00:00Z"))}
                </h2>
              </div>
              <div className="inline-actions">
                <button className="text-button" onClick={() => setDate(today)}>
                  Today
                </button>
                <input
                  aria-label="Challenge date"
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
                aria-label="Previous day"
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
                    {new Intl.DateTimeFormat("en-US", {
                      weekday: "short",
                      timeZone: "UTC",
                    }).format(new Date(d + "T12:00:00Z"))}
                  </small>
                  <b>{Number(d.slice(8))}</b>
                  <i className={s.days[d]?.items.length ? "has-items" : ""} />
                </button>
              ))}
              <button
                aria-label="Next day"
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
                  {date === today ? "Today's plan" : "Schedule for " + date}
                </h2>
                <p>
                  {done} of {items.length} completed
                  {locked ? " · Past schedule locked" : ""}
                </p>
              </div>
              {items.length > 0 && (
                <span className="pill green">
                  {done === items.length
                    ? `Bonus +${day.bonus} earned!`
                    : `Completion bonus +${day.bonus}`}
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
                          (c.status === "done" ? "Undo " : "Complete ") +
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
                              ? "Status cleared."
                              : "Challenge completed. Points added.",
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
                            {c.time} · {c.duration} min
                          </span>
                          <span>
                            {c.status === "done"
                              ? `+${c.reward} points`
                              : c.status === "missed"
                                ? `−${c.penalty} points`
                                : `+${c.reward} completed / −${c.penalty} missed`}
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
                                }, "Event and reminder saved to Google Calendar.");
                              } catch (e) {
                                notify((e as Error).message);
                              } finally {
                                setSyncing("");
                              }
                            }}
                          >
                            <CalendarPlus size={12} />
                            {syncing === c.id
                              ? "Saving…"
                              : c.calendarId
                                ? "Update event"
                                : "Sync"}
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
                                    ? "Status cleared."
                                    : "Challenge marked as missed.",
                                )
                              }
                            >
                              {c.status === "missed"
                                ? "Clear missed status"
                                : "Mark as missed"}
                            </button>
                          )}
                        </div>
                      </div>
                      <div>
                        <button
                          aria-label={"Edit " + c.title}
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
                          aria-label={"Delete " + c.title}
                          className="icon-button"
                          disabled={locked || c.status !== "pending"}
                          onClick={() =>
                            void mutate(
                              (st) => removeChallenge(st, date, c.id, today),
                              "Challenge deleted.",
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
                title="No challenges scheduled"
                description="Create your own challenges or use a template. Days without challenges have no penalty."
              >
                <button
                  className="btn primary"
                  disabled={locked}
                  onClick={() => {
                    setTab("template");
                    setModal("copy");
                  }}
                >
                  Use template
                </button>
              </Empty>
            )}
          </section>
        </div>
        <aside className="challenge-aside">
          <section className="card soft-card">
            <Sparkles size={25} />
            <h2>How points work</h2>
            <p>
              Complete 10 challenges to earn{" "}
              {10 * s.settings.reward + s.settings.bonus} points, including a +
              {s.settings.bonus}.
            </p>
            <div className="rules-list">
              <div>
                <span>Completed</span>
                <b className="positive">+{s.settings.reward} points</b>
              </div>
              <div>
                <span>Missed</span>
                <b className="negative">−{s.settings.penalty} points</b>
              </div>
              <div>
                <span>All completed</span>
                <b>+{s.settings.bonus} bonus</b>
              </div>
            </div>
            <p className="fine-print">
              Pending challenges are marked missed after their scheduled day
              ends and you open or return to the app. Your balance can go
              negative. Schedules do not repeat automatically.
            </p>
          </section>
          <section className="card">
            <h2>Reuse your schedule</h2>
            <p className="muted">
              Save this day&apos;s plan as a template or export it to your calendar.
            </p>
            <button
              className="btn secondary full"
              disabled={!items.length}
              onClick={() => setModal("template")}
            >
              <Bookmark size={15} /> Save template
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
                  "Calendar file downloaded. Import it into Google Calendar or Apple Calendar for reminders.",
                );
              }}
            >
              <Download size={15} /> Export calendar (.ics)
            </button>
            <p className="fine-print">
              Connect Google Calendar in Settings to sync events. You can also
              open calendar links or export an .ics file.
            </p>
          </section>
        </aside>
      </div>
      {(modal === "add" || modal === "edit") && (
        <Modal
          title={modal === "edit" ? "Edit challenge" : "New challenge"}
          onClose={() => setModal(null)}
        >
          <form className="form-stack" onSubmit={submit}>
            <label>
              What do you want to do?
              <input
                name="title"
                required
                maxLength={150}
                defaultValue={modal === "edit" ? editing?.title : ""}
                placeholder="Example: Pack lunch for tomorrow"
                autoFocus
              />
            </label>
            <div className="form-row">
              <label>
                Start time
                <input
                  name="time"
                  type="time"
                  defaultValue={modal === "edit" ? editing?.time : "09:00"}
                  required
                />
              </label>
              <label>
                Duration (minutes)
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
                After saving, select Update event to update Google Calendar.
              </p>
            )}
            <button className="btn primary">Save challenge</button>
          </form>
        </Modal>
      )}
      {modal === "copy" && (
        <Modal title="Copy challenge schedule" onClose={() => setModal(null)}>
          <p>
            Destination: <b>{date}</b>. Only the schedule is copied. Choose a
            date with no existing challenges.
          </p>
          <div className="segmented">
            <button
              className={tab === "date" ? "active" : ""}
              onClick={() => setTab("date")}
            >
              From a date
            </button>
            <button
              className={tab === "template" ? "active" : ""}
              onClick={() => setTab("template")}
            >
              From a template
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
                  "Schedule copied.",
                )
              )
                setModal(null);
            }}
          >
            {tab === "date" ? (
              <label>
                Source date
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
            <button className="btn primary">Copy to {date}</button>
          </form>
        </Modal>
      )}
      {modal === "template" && (
        <Modal title="Save as template" onClose={() => setModal(null)}>
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
                }, "Template saved.")
              )
                setModal(null);
            }}
          >
            <label>
              Template name
              <input
                name="name"
                required
                maxLength={100}
                placeholder="Weekday routine"
              />
            </label>
            <button className="btn primary">
              Save {items.length} challenges
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
