import type { State } from "./model";

const categoryNames: Record<string, string[]> = {
  transport: ["Transportasi", "Transportation"],
  shopping: ["Belanja & lifestyle", "Shopping & lifestyle"],
  bills: ["Tagihan & lainnya", "Bills & other"],
};
const starterTitles: Record<string, string> = {
  "Minum air setelah bangun": "Drink water after waking up",
  "Gerak 15 menit": "Move for 15 minutes",
  "Sarapan di rumah": "Eat breakfast at home",
  "Catat pengeluaran": "Log an expense",
  "Bawa botol minum": "Bring a water bottle",
  "Fokus belajar 30 menit": "Study for 30 minutes",
  "Siapkan makan sendiri": "Cook a meal at home",
  "Rapikan meja": "Tidy your desk",
  "Review budget hari ini": "Review today's budget",
  "Baca sebelum tidur": "Read before bed",
};
const demoTransactions: Record<string, string[]> = {
  "demo-income": ["Gaji bulanan", "Monthly salary"],
  "demo-0": ["Belanja bahan masakan", "Groceries"],
  "demo-1": ["Makan siang", "Lunch"],
  "demo-3": ["Buku baru", "New book"],
  "demo-4": ["Kopi & brunch", "Coffee & brunch"],
  "demo-5": ["Internet rumah", "Home internet"],
  "demo-6": ["Belanja mingguan", "Weekly groceries"],
  "demo-7": ["Kebutuhan harian", "Household essentials"],
  "demo-8": ["Makan & belanja dapur", "Meals & groceries"],
  "demo-9": ["Transport bulan ini", "Monthly transport"],
};
const demoBills: Record<string, string[]> = {
  "demo-bill1": ["Langganan musik", "Music subscription"],
  "demo-bill2": ["Tagihan listrik", "Electricity bill"],
};

function translatedLabel(
  labels: Record<string, string[]>,
  id: string,
  value: string,
) {
  const pair = Object.hasOwn(labels, id) ? labels[id] : undefined;
  return pair?.[0] === value ? pair[1] : value;
}

// Translate known built-in labels without replacing custom user records.
export function localizeSavedLabels(state: State): State {
  if (state.settings.name === "Kamu") state.settings.name = "You";
  for (const category of state.categories)
    category.name = translatedLabel(categoryNames, category.id, category.name);
  for (const template of state.templates) {
    if (template.id !== "starter") continue;
    if (template.name === "Rutinitas seimbang · 10 challenge")
      template.name = "Balanced routine · 10 challenges";
    for (const challenge of template.items)
      if (Object.hasOwn(starterTitles, challenge.title))
        challenge.title = starterTitles[challenge.title];
  }
  if (state.demo) {
    for (const [id, day] of Object.entries(state.days)) {
      if (id !== state.created) continue;
      for (const challenge of day.items) {
        if (!Object.hasOwn(starterTitles, challenge.title)) continue;
        const oldTitle = challenge.title;
        challenge.title = starterTitles[oldTitle];
        const entry = state.ledger.find(
          (item) => item.id === "challenge-" + id + "-" + challenge.id,
        );
        if (entry?.title === oldTitle) entry.title = challenge.title;
      }
    }
    for (const transaction of state.transactions) {
      const id = transaction.billId ?? transaction.id;
      transaction.title = translatedLabel(
        transaction.billId ? demoBills : demoTransactions,
        id,
        transaction.title,
      );
    }
    for (const bill of state.bills)
      bill.title = translatedLabel(demoBills, bill.id, bill.title);
  }
  for (const entry of state.ledger) {
    if (entry.kind === "bonus" && entry.title === "Semua challenge selesai")
      entry.title = "All challenges completed";
    if (entry.kind === "saving" && entry.title.startsWith("Sisa "))
      entry.title = "Unused budget: " + entry.title.slice(5);
    if (
      entry.id === "demo-points" &&
      entry.title === "Poin sebelumnya (contoh)"
    )
      entry.title = "Previous points (sample)";
    if (
      entry.id === "legacy-opening" &&
      entry.title === "Saldo poin awal dari versi sebelumnya"
    )
      entry.title = "Opening point balance from previous version";
  }
  return state;
}
