export type Category = {
  id: string;
  name: string;
  limit: number;
  color: string;
};
export type Transaction = {
  id: string;
  title: string;
  amount: number;
  kind: "income" | "expense";
  category: string;
  date: string;
  note?: string;
  billId?: string;
};
export type Challenge = {
  id: string;
  title: string;
  time: string;
  duration: number;
  status: "pending" | "done" | "missed";
  reward: number;
  penalty: number;
  calendarId?: string;
};
export type Day = { items: Challenge[]; bonus: number; closed: boolean };
export type Entry = {
  id: string;
  title: string;
  points: number;
  date: string;
  kind: string;
};
export type Month = {
  limits: Record<string, number>;
  topups: Record<string, number>;
  closed: boolean;
};
export type Bill = {
  id: string;
  title: string;
  amount: number;
  category: string;
  due: string;
  paid: boolean;
};
export type Settings = {
  name: string;
  currency: string;
  timeZone: string;
  reward: number;
  penalty: number;
  bonus: number;
  googleClientId: string;
  aiModel: string;
  reminder: number;
};
export type State = {
  version: 2;
  demo: boolean;
  settings: Settings;
  categories: Category[];
  transactions: Transaction[];
  days: Record<string, Day>;
  months: Record<string, Month>;
  ledger: Entry[];
  bills: Bill[];
  templates: { id: string; name: string; items: Challenge[] }[];
  created: string;
  revision: number;
};
export const round = (v: number) =>
  Math.round((v + Number.EPSILON) * 100) / 100;
export const uid = () => crypto.randomUUID().replaceAll("-", "");
export function dateKey(timeZone = "Asia/Taipei", date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function addDays(key: string, n: number) {
  const d = new Date(key + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const points = (s: State) =>
  round(s.ledger.reduce((a, e) => a + e.points, 0));
export const wallet = (s: State) =>
  round(
    s.transactions.reduce(
      (a, t) => a + (t.kind === "income" ? t.amount : -t.amount),
      0,
    ),
  );
export function ensureMonth(s: State, key: string) {
  if (!s.months[key])
    s.months[key] = {
      limits: Object.fromEntries(s.categories.map((c) => [c.id, c.limit])),
      topups: {},
      closed: false,
    };
  return s.months[key];
}
export function budget(s: State, key: string, id: string) {
  const m = s.months[key];
  const limit = m
    ? (m.limits[id] ?? 0)
    : (s.categories.find((c) => c.id === id)?.limit ?? 0);
  const topup = m?.topups[id] ?? 0;
  const spent = round(
    s.transactions
      .filter(
        (t) =>
          t.kind === "expense" && t.category === id && t.date.startsWith(key),
      )
      .reduce((a, t) => a + t.amount, 0),
  );
  return {
    limit,
    topup,
    spent,
    total: round(limit + topup),
    remaining: round(limit + topup - spent),
    closed: m?.closed ?? false,
  };
}
function entry(s: State, e: Entry) {
  s.ledger = s.ledger.filter((l) => l.id !== e.id);
  if (e.points !== 0) s.ledger.push(e);
}
function scoreDay(s: State, key: string) {
  const d = s.days[key];
  for (const c of d.items)
    entry(s, {
      id: "challenge-" + key + "-" + c.id,
      title: c.title,
      points:
        c.status === "done" ? c.reward : c.status === "missed" ? -c.penalty : 0,
      date: key,
      kind: c.status === "done" ? "challenge" : "penalty",
    });
  entry(s, {
    id: "bonus-" + key,
    title: "Semua challenge selesai",
    points:
      d.items.length > 0 && d.items.every((c) => c.status === "done")
        ? d.bonus
        : 0,
    date: key,
    kind: "bonus",
  });
}
export function setChallenge(
  s: State,
  key: string,
  id: string,
  status: Challenge["status"],
  today: string,
) {
  const d = s.days[key];
  if (!d || d.closed || key !== today)
    throw Error(
      "Challenge hanya dapat diselesaikan pada hari yang dijadwalkan.",
    );
  const c = d.items.find((c) => c.id === id);
  if (!c) throw Error("Challenge tidak ditemukan.");
  c.status = status;
  scoreDay(s, key);
}
export function addChallenge(
  s: State,
  key: string,
  title: string,
  time: string,
  duration: number,
  today: string,
) {
  if (key < today || s.days[key]?.closed)
    throw Error("Jadwal yang sudah lewat terkunci.");
  if (!title.trim()) throw Error("Isi nama challenge.");
  if (
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
    !Number.isFinite(duration) ||
    duration < 1 ||
    duration > 1440
  )
    throw Error("Jam atau durasi tidak valid.");
  s.days[key] ??= { items: [], bonus: s.settings.bonus, closed: false };
  s.days[key].items.push({
    id: uid(),
    title: title.trim(),
    time,
    duration,
    status: "pending",
    reward: s.settings.reward,
    penalty: s.settings.penalty,
  });
  scoreDay(s, key);
}
export function removeChallenge(
  s: State,
  key: string,
  id: string,
  today: string,
) {
  const d = s.days[key];
  if (key < today || d.closed)
    throw Error("Riwayat hari yang sudah lewat terkunci.");
  const c = d.items.find((c) => c.id === id);
  if (c?.status !== "pending")
    throw Error("Batalkan status challenge sebelum menghapus.");
  d.items = d.items.filter((c) => c.id !== id);
  scoreDay(s, key);
}
export function editChallenge(
  s: State,
  key: string,
  id: string,
  title: string,
  time: string,
  duration: number,
  today: string,
) {
  const d = s.days[key],
    c = d?.items.find((c) => c.id === id);
  if (key < today || d?.closed || !c || c.status !== "pending")
    throw Error("Hanya challenge pending yang bisa diubah.");
  if (
    !title.trim() ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
    duration < 1 ||
    duration > 1440
  )
    throw Error("Detail challenge tidak valid.");
  Object.assign(c, { title: title.trim(), time, duration });
}
export function copyDay(
  s: State,
  source: Challenge[],
  target: string,
  today: string,
) {
  if (target < today || s.days[target]?.closed)
    throw Error("Pilih hari ini atau tanggal mendatang.");
  if (!source.length) throw Error("Tidak ada challenge di sumber.");
  if (s.days[target]?.items.length)
    throw Error(
      "Tanggal tujuan sudah memiliki challenge. Pilih tanggal kosong agar tidak terduplikasi.",
    );
  s.days[target] = {
    bonus: s.settings.bonus,
    closed: false,
    items: source.map((c) => ({
      ...c,
      id: uid(),
      status: "pending",
      reward: s.settings.reward,
      penalty: s.settings.penalty,
      calendarId: undefined,
    })),
  };
}
export function addTransaction(s: State, t: Transaction, today: string) {
  if (!Number.isFinite(t.amount) || round(t.amount) <= 0)
    throw Error("Nominal harus lebih dari 0.");
  if (!t.title.trim()) throw Error("Isi keterangan transaksi.");
  if (t.date > today)
    throw Error("Untuk pembayaran mendatang, gunakan halaman Tagihan.");
  const month = t.date.slice(0, 7);
  if (month < today.slice(0, 7) && !s.months[month])
    throw Error(
      "Periode lama belum memiliki budget. Gunakan migrasi riwayat agar tidak menciptakan bonus retroaktif.",
    );
  if (s.transactions.some((x) => x.id === t.id)) return;
  ensureMonth(s, month);
  if (s.months[month].closed)
    throw Error("Bulan ini sudah ditutup. Riwayat tidak dapat diubah.");
  if (t.kind === "expense") {
    if (!s.categories.some((c) => c.id === t.category))
      throw Error("Pilih kategori.");
    if (round(t.amount) > budget(s, month, t.category).remaining)
      throw Error(
        "Budget kategori tidak cukup. Tukar poin untuk menambah budget terlebih dahulu.",
      );
  }
  s.transactions.push({ ...t, amount: round(t.amount) });
}
export function deleteTransaction(s: State, id: string) {
  const t = s.transactions.find((t) => t.id === id);
  if (!t) return;
  if (s.months[t.date.slice(0, 7)]?.closed)
    throw Error("Bulan yang sudah ditutup tidak dapat diubah.");
  s.transactions = s.transactions.filter((t) => t.id !== id);
  if (t.billId) {
    const b = s.bills.find((b) => b.id === t.billId);
    if (b) b.paid = false;
  }
}
export function transfer(
  s: State,
  month: string,
  category: string,
  amount: number,
  today: string,
) {
  if (month !== today.slice(0, 7))
    throw Error("Top up hanya untuk bulan berjalan.");
  ensureMonth(s, month);
  if (s.months[month].closed) throw Error("Bulan sudah ditutup.");
  if (!s.categories.some((c) => c.id === category))
    throw Error("Kategori tidak ditemukan.");
  if (
    !Number.isFinite(amount) ||
    round(amount) <= 0 ||
    round(amount) > points(s)
  )
    throw Error("Poin tidak cukup atau nominal tidak valid.");
  amount = round(amount);
  s.months[month].topups[category] = round(
    (s.months[month].topups[category] ?? 0) + amount,
  );
  entry(s, {
    id: uid(),
    title: "Top up " + s.categories.find((c) => c.id === category)?.name,
    points: -amount,
    date: today,
    kind: "topup",
  });
}
export function closeMonth(s: State, key: string, today: string) {
  if (key >= today.slice(0, 7))
    throw Error("Tutup bulan tersedia setelah bulan berakhir.");
  const m = ensureMonth(s, key);
  if (m.closed) return;
  for (const c of s.categories) {
    const b = budget(s, key, c.id);
    entry(s, {
      id: "saving-" + key + "-" + c.id,
      title: "Sisa " + c.name + " · " + key,
      points: Math.max(0, b.remaining),
      date: today,
      kind: "saving",
    });
  }
  m.closed = true;
}
export function settle(s: State, today: string) {
  for (const [key, d] of Object.entries(s.days)) {
    if (key < today && !d.closed) {
      d.items.forEach((c) => {
        if (c.status === "pending") c.status = "missed";
      });
      scoreDay(s, key);
      d.closed = true;
    }
  }
  for (const key of Object.keys(s.months).sort())
    if (key < today.slice(0, 7)) closeMonth(s, key, today);
  ensureMonth(s, today.slice(0, 7));
}
export function payBill(s: State, id: string, today: string) {
  const b = s.bills.find((b) => b.id === id);
  if (!b) throw Error("Tagihan tidak ditemukan.");
  if (b.paid) return;
  addTransaction(
    s,
    {
      id: "bill-" + b.id,
      title: b.title,
      amount: b.amount,
      category: b.category,
      date: today,
      kind: "expense",
      billId: b.id,
    },
    today,
  );
  b.paid = true;
}
export function newState(today: string, demo = false): State {
  const s: State = {
    version: 2,
    demo,
    settings: {
      name: "Kamu",
      currency: "TWD",
      timeZone: "Asia/Taipei",
      reward: 2,
      penalty: 2,
      bonus: 5,
      googleClientId: "",
      aiModel: "gemini-2.5-flash",
      reminder: 10,
    },
    categories: [
      { id: "fnb", name: "Food & beverages", limit: 6000, color: "#86a394" },
      {
        id: "transport",
        name: "Transportasi",
        limit: demo ? 1500 : 0,
        color: "#c3a47a",
      },
      {
        id: "shopping",
        name: "Belanja & lifestyle",
        limit: demo ? 2500 : 0,
        color: "#a4a0c0",
      },
      {
        id: "bills",
        name: "Tagihan & lainnya",
        limit: demo ? 5000 : 0,
        color: "#7fa7bd",
      },
    ],
    transactions: [],
    days: {},
    months: {},
    ledger: [],
    bills: [],
    templates: [],
    created: today,
    revision: 0,
  };
  ensureMonth(s, today.slice(0, 7));
  s.templates = [
    {
      id: "starter",
      name: "Rutinitas seimbang · 10 challenge",
      items: [
        "Minum air setelah bangun",
        "Gerak 15 menit",
        "Sarapan di rumah",
        "Catat pengeluaran",
        "Bawa botol minum",
        "Fokus belajar 30 menit",
        "Siapkan makan sendiri",
        "Rapikan meja",
        "Review budget hari ini",
        "Baca sebelum tidur",
      ].map((title, i) => ({
        id: "starter" + i,
        title,
        time: [
          "07:00",
          "07:30",
          "08:00",
          "10:00",
          "12:00",
          "14:00",
          "17:00",
          "18:00",
          "20:00",
          "21:00",
        ][i],
        duration: i === 5 ? 30 : 15,
        status: "pending",
        reward: 2,
        penalty: 2,
      })),
    },
  ];
  if (demo) {
    s.settings.name = "Adi";
    const m = today.slice(0, 7);
    s.transactions = [
      {
        id: "demo-income",
        title: "Gaji bulanan",
        amount: 18000,
        kind: "income",
        category: "income",
        date: m + "-01",
      },
      ...[
        [420, "Belanja bahan masakan", "fnb"],
        [85, "Makan siang", "fnb"],
        [60, "MRT & bus", "transport"],
        [290, "Buku baru", "shopping"],
        [180, "Kopi & brunch", "fnb"],
        [999, "Internet rumah", "bills"],
        [1260, "Belanja mingguan", "fnb"],
        [520, "Kebutuhan harian", "shopping"],
        [760, "Makan & belanja dapur", "fnb"],
        [350, "Transport bulan ini", "transport"],
      ].map((x, i) => ({
        id: "demo-" + i,
        amount: x[0] as number,
        title: x[1] as string,
        category: x[2] as string,
        kind: "expense" as const,
        date:
          i < 3
            ? today
            : addDays(
                today,
                -Math.min(Number(today.slice(-2)) - 1, 1 + (i % 8)),
              ),
      })),
    ];
    s.ledger = [
      {
        id: "demo-points",
        title: "Poin sebelumnya (contoh)",
        points: 320,
        date: today,
        kind: "opening",
      },
    ];
    copyDay(s, s.templates[0].items, today, today);
    s.days[today].items.slice(0, 6).forEach((c) => {
      c.status = "done";
    });
    scoreDay(s, today);
    s.bills = [
      {
        id: "demo-bill1",
        title: "Langganan musik",
        amount: 149,
        category: "bills",
        due: addDays(today, 2),
        paid: false,
      },
      {
        id: "demo-bill2",
        title: "Tagihan listrik",
        amount: 680,
        category: "bills",
        due: addDays(today, 5),
        paid: false,
      },
    ];
  }
  return s;
}
export function validateState(v: unknown): State {
  const s = v as State;
  const finite = (x: unknown) =>
    typeof x === "number" && Number.isFinite(x) && Math.abs(x) < 1e12;
  const date = (x: unknown) =>
    typeof x === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(x) &&
    !Number.isNaN(Date.parse(x));
  const safeId = (x: unknown) =>
    typeof x === "string" &&
    x.length > 0 &&
    !["__proto__", "constructor", "prototype"].includes(x);
  const unique = (xs: { id: string }[]) =>
    xs.every((x) => safeId(x.id)) &&
    new Set(xs.map((x) => x.id)).size === xs.length;
  if (
    !s ||
    s.version !== 2 ||
    typeof s.demo !== "boolean" ||
    !s.settings ||
    !Array.isArray(s.categories) ||
    !s.categories.length ||
    !Array.isArray(s.transactions) ||
    !Array.isArray(s.ledger) ||
    !Array.isArray(s.bills) ||
    !Array.isArray(s.templates) ||
    !s.days ||
    !s.months
  )
    throw Error("File backup Money Tracker v2 tidak valid.");
  if (
    typeof s.settings.name !== "string" ||
    !["TWD", "USD", "IDR"].includes(s.settings.currency)
  )
    throw Error("Profil backup tidak valid.");
  new Intl.DateTimeFormat("en", { timeZone: s.settings.timeZone });
  for (const n of [
    s.settings.reward,
    s.settings.penalty,
    s.settings.bonus,
    s.settings.reminder,
  ])
    if (!finite(n) || n < 0) throw Error("Aturan poin tidak valid.");
  for (const list of [
    s.categories,
    s.transactions,
    s.ledger,
    s.bills,
    s.templates,
  ])
    if (!unique(list)) throw Error("ID backup duplikat atau tidak valid.");
  const ids = new Set(s.categories.map((c) => c.id));
  for (const c of s.categories)
    if (!finite(c.limit) || c.limit < 0 || typeof c.name !== "string")
      throw Error("Kategori tidak valid.");
  for (const t of s.transactions)
    if (
      !finite(t.amount) ||
      t.amount <= 0 ||
      !["income", "expense"].includes(t.kind) ||
      typeof t.title !== "string" ||
      !date(t.date) ||
      (t.kind === "expense" && !ids.has(t.category))
    )
      throw Error("Transaksi tidak valid.");
  for (const e of s.ledger)
    if (!finite(e.points) || typeof e.title !== "string" || !date(e.date))
      throw Error("Ledger tidak valid.");
  const checkItems = (items: Challenge[]) => {
    if (!Array.isArray(items) || !unique(items))
      throw Error("Jadwal tidak valid.");
    for (const c of items)
      if (
        !["pending", "done", "missed"].includes(c.status) ||
        !finite(c.reward) ||
        c.reward < 0 ||
        !finite(c.penalty) ||
        c.penalty < 0 ||
        typeof c.title !== "string" ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(c.time) ||
        !finite(c.duration) ||
        c.duration < 1 ||
        c.duration > 1440
      )
        throw Error("Challenge tidak valid.");
  };
  for (const [key, d] of Object.entries(s.days)) {
    if (!date(key) || !finite(d.bonus) || typeof d.closed !== "boolean")
      throw Error("Jadwal tidak valid.");
    checkItems(d.items);
  }
  for (const t of s.templates) {
    if (typeof t.name !== "string") throw Error("Template tidak valid.");
    checkItems(t.items);
  }
  for (const [key, m] of Object.entries(s.months)) {
    if (
      !/^\d{4}-\d{2}$/.test(key) ||
      !m.limits ||
      !m.topups ||
      typeof m.closed !== "boolean"
    )
      throw Error("Bulan tidak valid.");
    for (const n of [...Object.values(m.limits), ...Object.values(m.topups)])
      if (!finite(n) || n < 0) throw Error("Budget tidak valid.");
  }
  for (const b of s.bills)
    if (
      !finite(b.amount) ||
      b.amount <= 0 ||
      !ids.has(b.category) ||
      typeof b.title !== "string" ||
      !date(b.due) ||
      typeof b.paid !== "boolean"
    )
      throw Error("Tagihan tidak valid.");
  return s;
}
