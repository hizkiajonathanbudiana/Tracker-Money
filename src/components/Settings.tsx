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
        notify("Backup cloud berhasil disimpan.");
      } else if (action === "restore") {
        setRestoreMode("backup");
        setCloudData(await cloud.restoreCloud());
      } else if (action === "migrate") {
        setRestoreMode("legacy");
        setCloudData(await cloud.migrateLegacy(today));
      } else if (action === "google") {
        setEmail((await cloud.loginCloudGoogle()) ?? "");
        notify("Akun Firebase terhubung.");
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
        description="Sesuaikan tampilan, aturan poin, dan koneksi sesuai kebutuhanmu."
      />
      <div className="settings-grid">
        <div>
          <section className="card">
            <h2>Profil & preferensi</h2>
            <p className="muted">
              Pengaturan pribadi untuk catatan yang terasa milikmu.
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
                      "Mata uang terkunci setelah ada catatan agar nominal tidak berganti arti.",
                    );
                  if (
                    tz !== st.settings.timeZone &&
                    Object.keys(st.days).length
                  )
                    throw Error(
                      "Zona waktu terkunci setelah ada jadwal agar hari dan penalti tidak bergeser.",
                    );
                  st.settings.name = String(f.get("name")).trim() || "Kamu";
                  st.settings.currency = currency;
                  st.settings.timeZone = tz;
                }, "Preferensi disimpan.");
              }}
            >
              <label>
                Nama panggilan
                <input
                  name="name"
                  defaultValue={s.settings.name}
                  required
                  maxLength={40}
                />
              </label>
              <div className="form-row">
                <label>
                  Mata uang
                  <select name="currency" defaultValue={s.settings.currency}>
                    <option value="TWD">TWD · NT$</option>
                    <option value="USD">USD · $</option>
                    <option value="IDR">IDR · Rp</option>
                  </select>
                </label>
                <label>
                  Zona waktu
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
              <button className="btn primary">Simpan preferensi</button>
            </form>
          </section>
          <section className="card">
            <h2>Tampilan yang nyaman</h2>
            <p className="muted">
              Warna teks, form, dialog, dan grafik mengikuti tema.
            </p>
            <div className="theme-options">
              {[
                ["light", "Terang", Sun],
                ["dark", "Gelap", Moon],
                ["system", "Ikuti sistem", Monitor],
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
              <h2>Aturan challenge</h2>
            </div>
            <p className="muted">
              Berlaku untuk challenge baru. Jadwal yang sudah dibuat tetap
              memakai aturan saat dibuat.
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
                }, "Aturan challenge baru disimpan.");
              }}
            >
              <div className="form-row triple">
                <label>
                  Poin selesai
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
                  Penalti terlewat
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
                  Bonus komplet
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
                Tanpa daily limit. Saldo poin tidak di-reset dan boleh negatif.
              </div>
              <button className="btn primary">Simpan aturan</button>
            </form>
          </section>
          <section className="card">
            <h2>Kategori budget</h2>
            <p className="muted">
              Atur nominal di Budget & poin atau tambahkan kategori baru.
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
                      throw Error("Nama kategori kosong atau sudah ada.");
                    const id = uid(),
                      limit = Number(f.get("limit"));
                    st.categories.push({ id, name, limit, color: "#a4a0c0" });
                    ensureMonth(st, today.slice(0, 7)).limits[id] = limit;
                  }, "Kategori ditambahkan.")
                )
                  form.reset();
              }}
            >
              <div className="form-row">
                <label>
                  Nama kategori
                  <input
                    name="name"
                    required
                    maxLength={60}
                    placeholder="Hobi, tabungan…"
                  />
                </label>
                <label>
                  Budget bulanan
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
              <button className="btn secondary">Tambah kategori</button>
            </form>
          </section>
        </div>
        <div>
          <section className="card install-card">
            <span className="export-icon">
              <Download size={25} />
            </span>
            <h2>Jadikan seperti app.</h2>
            <p>
              Pasang ke home screen untuk layar penuh dan navigasi bawah yang
              mudah dijangkau.
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
                    "Android/desktop: menu browser → Install app. iPhone: Safari → Share → Add to Home Screen.",
                  );
              }}
            >
              <Download size={16} /> Install app
            </button>
            <p className="fine-print">
              Android/desktop: menu browser → Install app. iPhone: Safari →
              Share → Add to Home Screen. Tersedia pada browser yang mendukung
              PWA.
            </p>
          </section>
          <section className="card">
            <div className="section-head">
              <div className="inline-heading">
                <CalendarDays size={20} />
                <h2>Google Calendar</h2>
              </div>
              <span className={"pill " + (google ? "green" : "neutral")}>
                {google ? "Terhubung sesi ini" : "Belum terhubung"}
              </span>
            </div>
            <p className="muted">
              Simpan challenge dan reminder di kalender utama. Tiap event
              dikirim saat tombol Sinkronkan ditekan.
            </p>
            <form
              className="form-stack"
              onSubmit={async (e) => {
                e.preventDefault();
                const f = new FormData(e.currentTarget);
                await mutate((st) => {
                  st.settings.googleClientId = String(f.get("clientid")).trim();
                  st.settings.reminder = Number(f.get("reminder"));
                }, "Pengaturan kalender disimpan.");
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
                Reminder sebelum mulai
                <select name="reminder" defaultValue={s.settings.reminder}>
                  {[0, 5, 10, 15, 30].map((n) => (
                    <option key={n} value={n}>
                      {n ? n + " menit" : "Saat mulai"}
                    </option>
                  ))}
                </select>
              </label>
              <button className="btn secondary">Simpan konfigurasi</button>
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
                    "Google Calendar terhubung. Buka Challenges untuk menyimpan event.",
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
                ? "Menghubungkan…"
                : google
                  ? "Putuskan koneksi"
                  : "Hubungkan Google Calendar"}
            </button>
            <details>
              <summary>Panduan konfigurasi</summary>
              <p>
                Aktifkan Google Calendar API di Google Cloud, buat OAuth Client
                bertipe Web, daftarkan origin website di Authorized JavaScript
                origins, lalu tambahkan test user bila mode testing. Client ID
                bukan client secret.
              </p>
              <p className="fine-print">
                Tanpa konfigurasi, gunakan tautan Google Calendar atau .ics pada
                Challenges. Sinkronisasi satu arah; menghapus challenge tidak
                menghapus event Google.
              </p>
            </details>
          </section>
          <section className="card">
            <div className="inline-heading">
              <Sparkles size={19} />
              <h2>Model AI</h2>
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
                    throw Error("Nama model tidak valid.");
                  st.settings.aiModel = model;
                }, "Model AI disimpan.");
              }}
            >
              <label>
                Nama model Gemini
                <input
                  name="model"
                  defaultValue={s.settings.aiModel}
                  required
                />
              </label>
              <p className="fine-print">
                Masukkan API key di AI companion. Key tidak disimpan. Penggunaan
                API mengikuti kuota dan biaya penyedia.
              </p>
              <button className="btn secondary">Simpan model</button>
            </form>
          </section>
          <section className="card">
            <div className="inline-heading">
              <Cloud size={20} />
              <h2>Akun & backup Firebase</h2>
            </div>
            <p className="muted">
              Gunakan akun proyek lama untuk backup manual atau mengambil data
              versi sebelumnya. Data utama tetap di perangkat ini.
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
                    Simpan backup cloud
                  </button>
                  <button
                    className="btn secondary"
                    disabled={!!busy}
                    onClick={() => void cloudAction("restore")}
                  >
                    Ambil backup cloud
                  </button>
                  <button
                    className="btn secondary"
                    disabled={!!busy}
                    onClick={() => void cloudAction("migrate")}
                  >
                    Baca data versi sebelumnya
                  </button>
                  <button
                    className="text-button"
                    disabled={!!busy}
                    onClick={() => void cloudAction("logout")}
                  >
                    Keluar akun
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
                      notify("Akun terhubung.");
                    } catch (err) {
                      notify(
                        "Login gagal. Periksa akun dan konfigurasi Firebase. " +
                          (err as Error).message,
                      );
                    } finally {
                      setBusy("");
                    }
                  }}
                >
                  <label>
                    Email akun lama
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
                    {busy === "login" ? "Masuk…" : "Masuk ke Firebase"}
                  </button>
                </form>
                <button
                  className="text-button"
                  disabled={!!busy}
                  onClick={() => void cloudAction("google")}
                >
                  Masuk dengan Google
                </button>
              </>
            )}
            <p className="fine-print">
              Memerlukan konfigurasi Firebase asli dan domain ini di Authorized
              domains. Backup cloud manual; belum ada sinkronisasi otomatis
              antarperangkat.
            </p>
          </section>
        </div>
      </div>
      {cloudData && (
        <Modal
          title={
            restoreMode === "legacy"
              ? "Tinjau migrasi data lama"
              : "Pulihkan backup cloud"
          }
          onClose={() => setCloudData(null)}
        >
          <p>
            {cloudData.transactions.length} transaksi ·{" "}
            {cloudData.ledger.length} entri poin · {cloudData.settings.currency}
            .
          </p>
          {restoreMode === "legacy" && (
            <p>
              Migrasi mengambil pengeluaran, pemasukan, dan saldo poin. Bulan
              lama dikunci tanpa bonus retroaktif. Data Firebase lama tidak
              diubah. Wallet manual, denominasi, proyek, dan riwayat challenge
              lama belum dipindahkan.
            </p>
          )}
          <p>
            Data perangkat akan diganti. Simpan backup melalui Export sebelum
            melanjutkan.
          </p>
          <div className="modal-actions">
            <button
              className="btn secondary"
              onClick={() => setCloudData(null)}
            >
              Batal
            </button>
            <button
              className="btn primary"
              onClick={async () => {
                if (await replace(cloudData)) window.location.reload();
              }}
            >
              Gunakan data ini
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
