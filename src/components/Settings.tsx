"use client";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Sun,
  Moon,
  Monitor,
  CalendarDays,
  Link as LinkIcon,
  Download,
  Cloud,
  LogIn,
  Sparkles,
  Check,
} from "lucide-react";
import { useStore } from "./Store";
import { Heading, Modal } from "./UI";
import {
  connectGoogle,
  disconnectGoogle,
  googleConnected,
} from "@/lib/integrations";
import { State, ensureMonth, uid } from "@/lib/model";
export default function Settings() {
  const { s, today, mutate, replace, notify } = useStore();
  const { theme, setTheme } = useTheme();
  const [google, setGoogle] = useState(false),
    [busy, setBusy] = useState(""),
    [install, setInstall] = useState<Window["moneyInstallPrompt"]>(),
    [email, setEmail] = useState(""),
    [cloudData, setCloudData] = useState<State | null>(null),
    [restoreMode, setRestoreMode] = useState("backup"),
    [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    setGoogle(googleConnected());
    setInstall(window.moneyInstallPrompt);
    let live = true;
    import("@/lib/cloud")
      .then(async (cloud) => {
        const restored = await cloud.restoredCloudEmail();
        if (live) setEmail(restored);
      })
      .catch(() => {});
    const fn = (e: Event) => {
      e.preventDefault();
      setInstall(e as NonNullable<Window["moneyInstallPrompt"]>);
    };
    window.addEventListener("beforeinstallprompt", fn);
    return () => {
      live = false;
      window.removeEventListener("beforeinstallprompt", fn);
    };
  }, []);
  async function cloudAction(action: string) {
    setBusy(action);
    try {
      const cloud = await import("@/lib/cloud");
      if (action === "save") {
        await cloud.saveCloud(s);
        notify("Cloud backup saved.");
      } else if (action === "restore") {
        setRestoreMode("backup");
        setCloudData(await cloud.restoreCloud());
      } else if (action === "migrate") {
        setRestoreMode("legacy");
        setCloudData(await cloud.migrateLegacy(today));
      } else if (action === "google") {
        setEmail((await cloud.loginCloudGoogle()) ?? "");
        notify("Connected to Firebase.");
      } else if (action === "logout") {
        await cloud.logoutCloud();
        setEmail("");
      }
    } catch (e) {
      notify("Cloud: " + (e as Error).message);
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <Heading
        eyebrow="MAKE YOURSELF AT HOME"
        title="Your space. Your rules."
        description="Manage appearance, point rules, and integrations."
      />
      <div className="settings-grid">
        <div>
          <section className="card">
            <h2>Profile & preferences</h2>
            <p className="muted">
              Set your display name, currency, and time zone.
            </p>
            <form
              className="form-stack"
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                await mutate((st) => {
                  const currency = String(f.get("currency")),
                    tz = String(f.get("timezone"));
                  if (
                    currency !== st.settings.currency &&
                    (st.transactions.length || st.ledger.length)
                  )
                    throw Error(
                      "Currency is locked after you record transactions or points.",
                    );
                  if (
                    tz !== st.settings.timeZone &&
                    Object.keys(st.days).length
                  )
                    throw Error(
                      "Time zone is locked after you schedule challenges.",
                    );
                  st.settings.name = String(f.get("name")).trim() || "You";
                  st.settings.currency = currency;
                  st.settings.timeZone = tz;
                }, "Preferences saved.");
              }}
            >
              <label>
                Display name
                <input
                  name="name"
                  defaultValue={s.settings.name}
                  required
                  maxLength={40}
                />
              </label>
              <div className="form-row">
                <label>
                  Currency
                  <select name="currency" defaultValue={s.settings.currency}>
                    <option value="TWD">TWD · NT$</option>
                    <option value="USD">USD · $</option>
                    <option value="IDR">IDR · Rp</option>
                  </select>
                </label>
                <label>
                  Time zone
                  <select name="timezone" defaultValue={s.settings.timeZone}>
                    <option value="Asia/Taipei">Taipei (UTC+8)</option>
                    <option value="Asia/Jakarta">Jakarta (WIB)</option>
                    <option value="Asia/Makassar">Makassar (WITA)</option>
                    <option value="Asia/Jayapura">Jayapura (WIT)</option>
                    <option value="Australia/Perth">Perth (AWST)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </label>
              </div>
              <button className="btn primary">Save preferences</button>
            </form>
          </section>
          <section className="card">
            <h2>Appearance</h2>
            <p className="muted">
              Choose a light or dark theme, or follow your device settings.
            </p>
            <div className="theme-options">
              {[
                ["light", "Light", Sun],
                ["dark", "Dark", Moon],
                ["system", "System", Monitor],
              ].map(([value, label, Icon]) => {
                const I = Icon as typeof Sun;
                return (
                  <button
                    key={value as string}
                    className={mounted && theme === value ? "selected" : ""}
                    onClick={() => setTheme(value as string)}
                  >
                    <I size={24} />
                    <span>{label as string}</span>
                    {mounted && theme === value && <Check size={13} />}
                  </button>
                );
              })}
            </div>
          </section>
          <section className="card">
            <div className="inline-heading">
              <Sparkles size={19} />
              <h2>Challenge rules</h2>
            </div>
            <p className="muted">
              New challenge use these rules. Existing schedules keep the rules
              they were created with.
            </p>
            <form
              className="form-stack"
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                await mutate((st) => {
                  st.settings.reward = Number(f.get("reward"));
                  st.settings.penalty = Number(f.get("penalty"));
                  st.settings.bonus = Number(f.get("bonus"));
                }, "Challenge rules saved.");
              }}
            >
              <div className="form-row triple">
                <label>
                  Completion points
                  <input
                    name="reward"
                    type="number"
                    min="0"
                    max="100000"
                    step="1"
                    defaultValue={s.settings.reward}
                    required
                  />
                </label>
                <label>
                  Missed penalty
                  <input
                    name="penalty"
                    type="number"
                    min="0"
                    max="100000"
                    step="1"
                    defaultValue={s.settings.penalty}
                    required
                  />
                </label>
                <label>
                  Completion bonus
                  <input
                    name="bonus"
                    type="number"
                    min="0"
                    max="100000"
                    step="1"
                    defaultValue={s.settings.bonus}
                    required
                  />
                </label>
              </div>
              <div className="info-line">
                Points have no daily cap, carry over, and can go negative.
              </div>
              <button className="btn primary">Save rules</button>
            </form>
          </section>
          <section className="card">
            <h2>Budget categories</h2>
            <p className="muted">
              Edit amounts in Budgets & points or add a category here.
            </p>
            <div className="category-settings">
              {s.categories.map((c) => (
                <div key={c.id}>
                  <i style={{ background: c.color }} />
                  <span>{c.name}</span>
                </div>
              ))}
            </div>
            <form
              className="form-stack"
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget),
                  form = e.currentTarget;
                if (
                  await mutate((st) => {
                    const name = String(f.get("name")).trim();
                    if (
                      !name ||
                      st.categories.some(
                        (c) => c.name.toLowerCase() === name.toLowerCase(),
                      )
                    )
                      throw Error(
                        "Enter a category name that is not already in use.",
                      );
                    const id = uid(),
                      limit = Number(f.get("limit"));
                    st.categories.push({ id, name, limit, color: "#a4a0c0" });
                    ensureMonth(st, today.slice(0, 7)).limits[id] = limit;
                  }, "Category added.")
                )
                  form.reset();
              }}
            >
              <div className="form-row">
                <label>
                  Category name
                  <input
                    name="name"
                    required
                    maxLength={60}
                    placeholder="Hobbies, savings…"
                  />
                </label>
                <label>
                  Monthly budget
                  <input
                    name="limit"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    placeholder="0"
                  />
                </label>
              </div>
              <button className="btn secondary">Add category</button>
            </form>
          </section>
        </div>
        <div>
          <section className="card install-card">
            <span className="export-icon">
              <Download size={25} />
            </span>
            <h2>Install Money Tracker</h2>
            <p>
              Add Money Tracker to your home screen and open it in its own
              window.
            </p>
            <button
              className="btn primary full"
              onClick={async () => {
                if (install) {
                  await install.prompt();
                  await install.userChoice;
                  setInstall(undefined);
                  delete window.moneyInstallPrompt;
                } else
                  notify(
                    "Android or desktop: browser menu → Install app. iPhone: Safari → Share → Add to Home Screen.",
                  );
              }}
            >
              <Download size={16} /> Install app
            </button>
            <p className="fine-print">
              Android or desktop: browser menu → Install app. iPhone: Safari →
              Share → Add to Home Screen.
            </p>
          </section>
          <section className="card">
            <div className="section-head">
              <div className="inline-heading">
                <CalendarDays size={20} />
                <h2>Google Calendar</h2>
              </div>
              <span className={"pill " + (google ? "green" : "neutral")}>
                {google ? "Connected for this session" : "Disconnected"}
              </span>
            </div>
            <p className="muted">
              Add challenges and reminders to your primary calendar by selecting
              Sync on each challenge.
            </p>
            <form
              className="form-stack"
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                await mutate((st) => {
                  st.settings.googleClientId = String(f.get("clientid")).trim();
                  st.settings.reminder = Number(f.get("reminder"));
                }, "Calendar settings saved.");
              }}
            >
              <label>
                Google OAuth Web Client ID
                <input
                  name="clientid"
                  defaultValue={s.settings.googleClientId}
                  placeholder="…apps.googleusercontent.com"
                />
              </label>
              <label>
                Remind me before the start
                <select name="reminder" defaultValue={s.settings.reminder}>
                  {[0, 5, 10, 15, 30].map((n) => (
                    <option key={n} value={n}>
                      {n ? n + " min" : "At start time"}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn secondary">Save configuration</button>
            </form>
            <button
              className="btn primary full"
              disabled={!!busy}
              onClick={async () => {
                if (google) {
                  disconnectGoogle();
                  setGoogle(false);
                  return;
                }
                setBusy("calendar");
                try {
                  await connectGoogle(s.settings.googleClientId);
                  setGoogle(true);
                  notify(
                    "Connected to Google Calendar. Open Challenges to sync events.",
                  );
                } catch (e) {
                  notify((e as Error).message);
                } finally {
                  setBusy("");
                }
              }}
            >
              <LinkIcon size={15} />
              {busy === "calendar"
                ? "Connecting…"
                : google
                  ? "Disconnect"
                  : "Connect Google Calendar"}
            </button>
            <details>
              <summary>Setup guide</summary>
              <p>
                Enable the Google Calendar API in Google Cloud and create a Web
                OAuth client. Add this site&apos;s origin to Authorized JavaScript
                origins. If the app is in testing mode, add your Google account
                as a test user.
              </p>
              <p className="fine-print">
                You can also use the Google Calendar link or export an .ics file
                from Challenges. Sync sends changes to Google Calendar. If you
                delete a challenge, remove its calendar event separately.
              </p>
            </details>
          </section>
          <section className="card">
            <div className="inline-heading">
              <Sparkles size={19} />
              <h2>AI model</h2>
            </div>
            <form
              className="form-stack"
              onSubmit={async (e) => {
                e.preventDefault();
                const model = String(
                  new FormData(e.currentTarget).get("model"),
                ).trim();
                await mutate((st) => {
                  if (!/^[a-zA-Z0-9.\-]+$/.test(model))
                    throw Error("Invalid model name.");
                  st.settings.aiModel = model;
                }, "AI model saved.");
              }}
            >
              <label>
                Gemini model name
                <input
                  name="model"
                  defaultValue={s.settings.aiModel}
                  required
                />
              </label>
              <p className="fine-print">
                Enter your API key on the AI companion page. API quotas and
                charges depend on your provider account.
              </p>
              <button className="btn secondary">Save model</button>
            </form>
          </section>
          <section className="card">
            <div className="inline-heading">
              <Cloud size={20} />
              <h2>Firebase account & backup</h2>
            </div>
            <p className="muted">
              Sign in to create a manual cloud backup or import data from the
              previous version. Your primary records are saved on this device.
            </p>
            {email ? (
              <>
                <span className="pill green">{email}</span>
                <div className="button-stack">
                  <button
                    className="btn secondary"
                    disabled={!!busy}
                    onClick={() => void cloudAction("save")}
                  >
                    Save cloud backup
                  </button>
                  <button
                    className="btn secondary"
                    disabled={!!busy}
                    onClick={() => void cloudAction("restore")}
                  >
                    Restore cloud backup
                  </button>
                  <button
                    className="btn secondary"
                    disabled={!!busy}
                    onClick={() => void cloudAction("migrate")}
                  >
                    Load data from previous version
                  </button>
                  <button
                    className="text-button"
                    disabled={!!busy}
                    onClick={() => void cloudAction("logout")}
                  >
                    Sign out
                  </button>
                </div>
              </>
            ) : (
              <>
                <form
                  className="form-stack"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    setBusy("login");
                    try {
                      const cloud = await import("@/lib/cloud");
                      setEmail(
                        (await cloud.loginCloud(
                          String(f.get("email")),
                          String(f.get("password")),
                        )) ?? "",
                      );
                      notify("Signed in.");
                    } catch (err) {
                      notify(
                        "Sign-in failed. Check your account and Firebase configuration. " +
                          (err as Error).message,
                      );
                    } finally {
                      setBusy("");
                    }
                  }}
                >
                  <label>
                    Previous account email
                    <input
                      type="email"
                      name="email"
                      required
                      autoComplete="username"
                    />
                  </label>
                  <label>
                    Password
                    <input
                      name="password"
                      type="password"
                      required
                      autoComplete="current-password"
                    />
                  </label>
                  <button className="btn secondary" disabled={!!busy}>
                    <LogIn size={15} />
                    {busy === "login" ? "Signing in…" : "Sign in to Firebase"}
                  </button>
                </form>
                <button
                  className="text-button"
                  disabled={!!busy}
                  onClick={() => void cloudAction("google")}
                >
                  Sign in with Google
                </button>
              </>
            )}
            <p className="fine-print">
              This requires the original Firebase configuration and this
              hostname in Authorized domains. To move data between devices, save
              a backup on one device and restore it on the other.
            </p>
          </section>
        </div>
      </div>
      {cloudData && (
        <Modal
          title={
            restoreMode === "legacy"
              ? "Review previous version data"
              : "Restore cloud backup"
          }
          onClose={() => setCloudData(null)}
        >
          <p>
            {cloudData.transactions.length} transactions ·{" "}
            {cloudData.ledger.length} point entries ·{" "}
            {cloudData.settings.currency}.
          </p>
          {restoreMode === "legacy" && (
            <p>
              The import includes expenses, income, and the point balance. Older
              months are locked with no retroactive bonuses. Previous Firebase
              records are preserved. Wallet adjustments, denominations,
              projects, and challenge history stay in the previous version.
            </p>
          )}
          <p>
            Restoring replaces data on this device. Download a backup from
            Export before continuing.
          </p>
          <div className="modal-actions">
            <button
              className="btn secondary"
              onClick={() => setCloudData(null)}
            >
              Cancel
            </button>
            <button
              className="btn primary"
              onClick={async () => {
                if (await replace(cloudData)) window.location.reload();
              }}
            >
              Use this data
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
