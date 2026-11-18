import {
  State,
  validateState,
  newState,
  uid,
  ensureMonth,
  dateKey,
} from "./model";
import { auth, db } from "./firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, setDoc, getDocs, collection } from "firebase/firestore";
export async function loginCloud(email: string, password: string) {
  return (await signInWithEmailAndPassword(auth, email, password)).user.email;
}
export async function loginCloudGoogle() {
  return (await signInWithPopup(auth, new GoogleAuthProvider())).user.email;
}
export async function logoutCloud() {
  await signOut(auth);
}
export async function restoredCloudEmail() {
  await auth.authStateReady();
  return auth.currentUser?.email ?? "";
}
export async function saveCloud(s: State) {
  const user = auth.currentUser;
  if (!user) throw Error("Sign in to Firebase first.");
  if (s.demo)
    throw Error("Start with your own data before creating a cloud backup.");
  const payload = JSON.stringify(s);
  if (new TextEncoder().encode(payload).length > 900000)
    throw Error(
      "This backup is too large for cloud storage. Download a JSON backup instead.",
    );
  await setDoc(doc(db, "users", user.uid, "trackerV2", "backup"), {
    payload,
    updatedAt: new Date().toISOString(),
    version: 2,
  });
}
export async function restoreCloud() {
  const user = auth.currentUser;
  if (!user) throw Error("Sign in to Firebase first.");
  const snap = await getDoc(doc(db, "users", user.uid, "trackerV2", "backup"));
  if (!snap.exists()) throw Error("No v2 backup found for this account.");
  return validateState(JSON.parse(snap.data().payload));
}
export async function migrateLegacy(today: string): Promise<State> {
  const user = auth.currentUser;
  if (!user) throw Error("Sign in to your previous Firebase account first.");
  const s = newState(today);
  s.settings.name = user.displayName ?? user.email?.split("@")[0] ?? "You";
  const [expenses, incomes, summary, settings] = await Promise.all([
      getDocs(collection(db, "users", user.uid, "expenses")),
      getDocs(collection(db, "users", user.uid, "incomes")),
      getDoc(doc(db, "users", user.uid, "points", "summary")),
      getDoc(doc(db, "users", user.uid, "settings", "economy")),
    ]),
    cfg = settings.data();
  if (cfg) {
    s.settings.currency = cfg.currencyCode ?? "TWD";
    s.settings.timeZone = cfg.timeZone ?? "Asia/Taipei";
    s.categories[0].limit = cfg.monthlyRegularAllowance ?? 6000;
  }
  const day = (v: unknown) => {
    if (v && typeof (v as { toDate?: unknown }).toDate === "function")
      return dateKey(
        s.settings.timeZone,
        (v as { toDate: () => Date }).toDate(),
      );
    if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v))
      return v.slice(0, 10);
    throw Error(
      "A date in the previous records could not be read. Import canceled to protect your records.",
    );
  };
  const regular = (cfg?.regularCategories ?? [
    "food",
    "food & beverages",
    "food & drink",
    "fnb",
    "makanan",
    "groceries",
  ]) as string[];
  expenses.forEach((doc) => {
    const e = doc.data(),
      name = String(e.category ?? "Other");
    let category = regular.some((c) => c.toLowerCase() === name.toLowerCase())
      ? "fnb"
      : s.categories.find((c) => c.name.toLowerCase() === name.toLowerCase())
          ?.id;
    if (!category) {
      category = "legacy-" + uid();
      s.categories.push({ id: category, name, limit: 0, color: "#a4a0c0" });
    }
    s.transactions.push({
      id: "legacy-" + doc.id,
      title: String(e.notes || e.title || name),
      amount: Number(e.amount),
      category,
      kind: "expense",
      date: day(e.date ?? e.createdAt),
    });
  });
  incomes.forEach((doc) => {
    const e = doc.data();
    s.transactions.push({
      id: "legacy-income-" + doc.id,
      title: String(e.notes || e.source || e.title || "Previous income"),
      amount: Number(e.amount),
      category: "income",
      kind: "income",
      date: day(e.date ?? e.createdAt),
    });
  });
  const p = summary.data()?.balance;
  if (typeof p === "number" && p !== 0)
    s.ledger.push({
      id: "legacy-opening",
      title: "Opening point balance from previous version",
      points: p,
      date: today,
      kind: "opening",
    });
  s.months = {};
  for (const t of s.transactions) {
    const m = ensureMonth(s, t.date.slice(0, 7));
    if (t.date.slice(0, 7) < today.slice(0, 7)) m.closed = true;
  }
  ensureMonth(s, today.slice(0, 7));
  for (const c of s.categories) {
    const spent = s.transactions
      .filter(
        (t) =>
          t.kind === "expense" &&
          t.category === c.id &&
          t.date.startsWith(today.slice(0, 7)),
      )
      .reduce((a, t) => a + t.amount, 0);
    s.months[today.slice(0, 7)].limits[c.id] = Math.max(c.limit, spent);
  }
  if (!expenses.size && !incomes.size && !summary.exists())
    throw Error("No records found to import from the previous version.");
  return validateState(s);
}
