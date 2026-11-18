import test from "node:test";
import assert from "node:assert/strict";
import {
  newState,
  copyDay,
  setChallenge,
  points,
  settle,
  addTransaction,
  budget,
  transfer,
  wallet,
  closeMonth,
  payBill,
  deleteTransaction,
  addChallenge,
  editChallenge,
  validateState,
} from "../src/lib/model.ts";
const today = "2026-11-18";
function fresh() {
  return newState(today);
}
function scheduled() {
  const s = fresh();
  copyDay(s, s.templates[0].items, today, today);
  return s;
}
function expense(s, n, id = "expense", day = today) {
  addTransaction(
    s,
    {
      id,
      title: "Belanja makanan",
      amount: n,
      kind: "expense",
      category: "fnb",
      date: day,
    },
    today,
  );
}
test("10 complete: 20 points plus 5 bonus, repeat and undo remain correct", () => {
  const s = scheduled();
  for (const c of s.days[today].items)
    setChallenge(s, today, c.id, "done", today);
  assert.equal(points(s), 25);
  setChallenge(s, today, s.days[today].items[0].id, "done", today);
  assert.equal(points(s), 25);
  setChallenge(s, today, s.days[today].items[0].id, "pending", today);
  assert.equal(points(s), 18);
});
test("insufficient points can go negative and earnings repay the deficit", () => {
  const s = scheduled();
  s.ledger.push({
    id: "opening",
    title: "Awal",
    points: 1,
    date: today,
    kind: "opening",
  });
  setChallenge(s, today, s.days[today].items[0].id, "missed", today);
  assert.equal(points(s), -1);
  setChallenge(s, today, s.days[today].items[1].id, "done", today);
  assert.equal(points(s), 1);
});
test("9 done and 1 missed scores 16, no complete bonus", () => {
  const s = scheduled();
  s.days[today].items
    .slice(0, 9)
    .forEach((c) => setChallenge(s, today, c.id, "done", today));
  settle(s, "2026-11-19");
  assert.equal(points(s), 16);
  settle(s, "2026-11-19");
  assert.equal(points(s), 16);
  assert.throws(() =>
    setChallenge(s, today, s.days[today].items[0].id, "pending", "2026-11-19"),
  );
});
test("no daily spending cap; full category allocation may be spent once", () => {
  const s = fresh();
  expense(s, 6000);
  assert.equal(budget(s, "2026-11", "fnb").remaining, 0);
  assert.throws(() => expense(s, 1, "second"));
  assert.equal(s.transactions.length, 1);
});
test("point topup permits more spending without inventing money", () => {
  const s = fresh();
  expense(s, 6000);
  s.ledger.push({
    id: "opening",
    title: "Awal",
    points: 100,
    date: today,
    kind: "opening",
  });
  const before = wallet(s);
  transfer(s, "2026-11", "fnb", 60, today);
  assert.equal(wallet(s), before);
  assert.equal(points(s), 40);
  expense(s, 60, "second");
  assert.equal(budget(s, "2026-11", "fnb").remaining, 0);
  assert.throws(() => transfer(s, "2026-11", "fnb", 41, today));
});
test("6000 minus 4680 converts 1320 once and starts a fresh monthly budget", () => {
  const s = fresh();
  expense(s, 4680);
  settle(s, "2026-12-01");
  assert.equal(points(s), 1320);
  assert.equal(budget(s, "2026-12", "fnb").remaining, 6000);
  settle(s, "2026-12-01");
  assert.equal(points(s), 1320);
  assert.throws(() => deleteTransaction(s, "expense"));
  assert.throws(() => expense(s, 5, "late"));
});
test("inactive months do not generate imaginary savings", () => {
  const s = fresh();
  expense(s, 6000);
  settle(s, "2027-02-01");
  assert.deepEqual(Object.keys(s.months), ["2026-11", "2027-02"]);
  assert.equal(points(s), 0);
});
test("unused point topup is recovered once at month end", () => {
  const s = fresh();
  expense(s, 6000);
  s.ledger.push({
    id: "opening",
    title: "Awal",
    points: 100,
    date: today,
    kind: "opening",
  });
  transfer(s, "2026-11", "fnb", 100, today);
  settle(s, "2026-12-01");
  assert.equal(points(s), 100);
  settle(s, "2026-12-01");
  assert.equal(points(s), 100);
});
test("bill payment is idempotent; removing expense reopens bill", () => {
  const s = fresh();
  s.bills.push({
    id: "bill",
    title: "Makanan",
    amount: 100,
    category: "fnb",
    due: today,
    paid: false,
  });
  payBill(s, "bill", today);
  payBill(s, "bill", today);
  assert.equal(s.transactions.length, 1);
  assert.equal(s.bills[0].paid, true);
  deleteTransaction(s, "bill-bill");
  assert.equal(s.bills[0].paid, false);
  assert.equal(budget(s, "2026-11", "fnb").remaining, 6000);
  payBill(s, "bill", today);
  assert.equal(s.transactions.length, 1);
});
test("insufficient budget leaves pending bill unchanged", () => {
  const s = fresh();
  s.bills.push({
    id: "bill",
    title: "Makanan",
    amount: 6001,
    category: "fnb",
    due: today,
    paid: false,
  });
  assert.throws(() => payBill(s, "bill", today));
  assert.equal(s.bills[0].paid, false);
  assert.equal(s.transactions.length, 0);
});
test("copying a schedule resets status with fresh IDs and prevents duplicate targets", () => {
  const s = scheduled();
  const source = s.days[today].items;
  setChallenge(s, today, source[0].id, "done", today);
  copyDay(s, source, "2026-11-19", today);
  assert.ok(s.days["2026-11-19"].items.every((c) => c.status === "pending"));
  assert.notEqual(source[0].id, s.days["2026-11-19"].items[0].id);
  assert.throws(() => copyDay(s, source, "2026-11-19", today));
  assert.throws(() =>
    setChallenge(
      s,
      "2026-11-19",
      s.days["2026-11-19"].items[0].id,
      "done",
      today,
    ),
  );
});
test("challenge rewards are frozen per item and there is no challenge count limit", () => {
  const s = scheduled();
  s.settings.reward = 9;
  s.settings.bonus = 20;
  setChallenge(s, today, s.days[today].items[0].id, "done", today);
  assert.equal(points(s), 2);
  assert.equal(s.days[today].bonus, 5);
  for (let i = 0; i < 50; i++)
    addChallenge(s, today, "Task " + i, "12:00", 15, today);
  assert.equal(s.days[today].items.length, 60);
  assert.equal(s.days[today].items[59].reward, 9);
});
test("editing pending challenge preserves earned rules and validates times", () => {
  const s = scheduled(),
    c = s.days[today].items[0];
  editChallenge(s, today, c.id, "Bekal", "11:30", 30, today);
  assert.equal(c.time, "11:30");
  assert.equal(c.reward, 2);
  assert.throws(() =>
    editChallenge(s, today, c.id, "Bekal", "25:00", 30, today),
  );
  setChallenge(s, today, c.id, "done", today);
  assert.throws(() =>
    editChallenge(s, today, c.id, "Other", "12:00", 20, today),
  );
});
test("backup validates structure, unique IDs, amounts, and schedule fields", () => {
  const s = scheduled();
  assert.deepEqual(validateState(structuredClone(s)), s);
  const bad = structuredClone(s);
  bad.days[today].items[0].time = "25:99";
  assert.throws(() => validateState(bad));
  const duplicate = structuredClone(s);
  duplicate.categories.push(duplicate.categories[0]);
  assert.throws(() => validateState(duplicate));
  const nan = structuredClone(s);
  nan.categories[0].limit = NaN;
  assert.throws(() => validateState(nan));
  assert.throws(() => validateState({ version: 2 }));
});
test("unknown historical periods cannot mint retrospective budget rewards", () => {
  const s = fresh();
  assert.throws(() => expense(s, 10, "old", "2026-10-01"));
  assert.ok(!s.months["2026-10"]);
  assert.throws(() => closeMonth(s, "2026-11", today));
});
test("new categories have no unallocated budget in older opened months", () => {
  const s = fresh();
  s.categories.push({ id: "hobby", name: "Hobi", limit: 200, color: "#aaa" });
  assert.equal(budget(s, "2026-11", "hobby").remaining, 0);
});
test("income is independent of points and category allocations", () => {
  const s = fresh();
  addTransaction(
    s,
    {
      id: "income",
      title: "Gaji",
      amount: 18000,
      kind: "income",
      category: "income",
      date: today,
    },
    today,
  );
  assert.equal(wallet(s), 18000);
  assert.equal(points(s), 0);
  assert.equal(budget(s, "2026-11", "fnb").remaining, 6000);
});
test("a day without any planned challenges incurs no penalty", () => {
  const s = fresh();
  settle(s, "2026-11-19");
  assert.equal(points(s), 0);
  assert.equal(Object.keys(s.days).length, 0);
});
