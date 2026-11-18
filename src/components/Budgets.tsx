"use client";
import { useState } from "react";
import { Sparkles, Plus, ArrowRight, Wallet, LockKeyhole } from "lucide-react";
import { useStore } from "./Store";
import { Heading, useMoney, num, CategoryIcon, Modal, Empty } from "./UI";
import { budget, points, transfer, ensureMonth } from "@/lib/model";
export default function Budgets() {
  const { s, today, mutate } = useStore(),
    [month, setMonth] = useState(today.slice(0, 7)),
    [topup, setTopup] = useState<string | null>(null),
    [edit, setEdit] = useState<string | null>(null);
  const money = useMoney(),
    current = month === today.slice(0, 7),
    total = s.categories.reduce(
      (a, c) => a + budget(s, month, c.id).remaining,
      0,
    );
  return (
    <>
      <Heading
        eyebrow="MAKE ROOM FOR WHAT MATTERS"
        title="Budget & points."
        description="Set monthly budgets and redeem points for extra spending room."
        actions={
          <input
            aria-label="Budget month"
            type="month"
            max={today.slice(0, 7)}
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        }
      />
      <div className="budget-hero">
        <div>
          <div className="eyebrow">POINT BALANCE</div>
          <strong>
            {num(points(s))}
            <span> points</span>
          </strong>
          <p>
            Points carry over without expiring and can be redeemed in any
            category.
          </p>
        </div>
        <div className="rate-box">
          <Sparkles size={22} />
          <b>1 point = 1 {s.settings.currency}</b>
          <span>Redeem points to increase your budget</span>
        </div>
      </div>
      {points(s) < 0 && (
        <div className="notice">
          Your point balance is negative. New points will cover the shortfall
          before you can redeem them.
        </div>
      )}
      <div className="section-head standalone">
        <div>
          <h2>Category budgets</h2>
          <p>Dining out and groceries both count toward Food & beverages.</p>
        </div>
        <span className="pill neutral">{money(total)} remaining</span>
      </div>
      <div className="two-grid">
        {s.categories.map((c) => {
          const b = budget(s, month, c.id);
          return (
            <section className="card category-card" key={c.id}>
              <div className="section-head">
                <div className="inline-heading">
                  <span
                    className="category-tile"
                    style={{ background: c.color + "25", color: c.color }}
                  >
                    <CategoryIcon id={c.id} />
                  </span>
                  <h2>{c.name}</h2>
                </div>
                <button
                  className="text-button"
                  disabled={!current || b.closed}
                  onClick={() => setEdit(c.id)}
                >
                  Edit
                </button>
              </div>
              <div className="category-balance">
                <strong>{money(b.remaining)}</strong>
                <span>remaining of {money(b.total)}</span>
              </div>
              <div className="progress big">
                <span
                  style={{
                    background: b.remaining <= 0 ? "var(--danger)" : c.color,
                    width: Math.min(100, (b.spent / b.total) * 100 || 0) + "%",
                  }}
                />
              </div>
              <div className="category-meta">
                <span>
                  Spent <b>{money(b.spent)}</b>
                </span>
                <span>
                  Added with points <b>+{money(b.topup)}</b>
                </span>
              </div>
              <div className="category-bottom">
                <span
                  className={
                    "pill " +
                    (b.closed ? "neutral" : b.remaining <= 0 ? "red" : "green")
                  }
                >
                  {b.closed ? (
                    <>
                      <LockKeyhole size={12} /> Converted to points
                    </>
                  ) : b.remaining <= 0 ? (
                    "Budget exhausted"
                  ) : (
                    "Budget available"
                  )}
                </span>
                <button
                  className="text-button"
                  disabled={!current || b.closed || points(s) <= 0}
                  onClick={() => setTopup(c.id)}
                >
                  <Plus size={14} /> Redeem points
                </button>
              </div>
            </section>
          );
        })}
      </div>
      <section className="card rules-strip">
        {[
          [
            `Completed +${s.settings.reward}`,
            "For each completed daily challenge.",
          ],
          [
            `Missed −${s.settings.penalty}`,
            "Applied after the scheduled day ends.",
          ],
          [
            `All completed +${s.settings.bonus}`,
            "Bonus for completing every scheduled challenge that day.",
          ],
          ["Unused budget → points", "Applied when a new month starts."],
        ].map(([t, d], i) => (
          <div key={t}>
            <span className="rule-number">0{i + 1}</span>
            <b>{t}</b>
            <p>{d}</p>
          </div>
        ))}
      </section>
      <section className="card">
        <div className="section-head">
          <div>
            <h2>Points history</h2>
            <p>See where your points came from and how you used them.</p>
          </div>
          <Sparkles size={19} />
        </div>
        {s.ledger.length ? (
          <div className="ledger-list">
            {[...s.ledger]
              .reverse()
              .slice(0, 50)
              .map((e) => (
                <div className="ledger-row" key={e.id}>
                  <span className="transaction-icon">
                    <Sparkles size={16} />
                  </span>
                  <div>
                    <b>{e.title}</b>
                    <small>
                      {e.date} ·{" "}
                      {(
                        {
                          challenge: "Challenge completed",
                          penalty: "Challenge missed",
                          bonus: "Daily bonus",
                          saving: "Unused budget",
                          topup: "Points redeemed",
                          opening: "Opening balance",
                        } as Record<string, string>
                      )[e.kind] ?? e.kind}
                    </small>
                  </div>
                  <strong className={e.points >= 0 ? "positive" : "negative"}>
                    {e.points > 0 ? "+" : ""}
                    {num(e.points)} pts
                  </strong>
                </div>
              ))}
          </div>
        ) : (
          <Empty
            title="No points yet"
            description="Complete your first challenge to earn points."
          />
        )}
      </section>
      <div className="subtle-note">
        <Wallet size={16} />
        Points increase your category budget. Your cash balance changes only
        when you record a transaction.
      </div>
      {topup && (
        <Modal title="Redeem points for budget" onClose={() => setTopup(null)}>
          <p>
            Increase your budget for{" "}
            {s.categories.find((c) => c.id === topup)?.name}. Available balance:{" "}
            <b>{num(points(s))} points</b>.
          </p>
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const n = Number(new FormData(e.currentTarget).get("amount"));
              if (
                await mutate(
                  (st) => transfer(st, month, topup, n, today),
                  "Points redeemed.",
                )
              )
                setTopup(null);
            }}
          >
            <label>
              Points to redeem
              <input
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                max={points(s)}
                required
                autoFocus
              />
            </label>
            <div className="info-line">
              1 point = 1 {s.settings.currency}. Your cash balance stays the
              same.
            </div>
            <button className="btn primary">
              Redeem points <ArrowRight size={16} />
            </button>
          </form>
        </Modal>
      )}
      {edit && (
        <Modal title="Edit monthly budget" onClose={() => setEdit(null)}>
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const amount = Number(
                new FormData(e.currentTarget).get("amount"),
              );
              if (
                await mutate((st) => {
                  const b = budget(st, month, edit);
                  if (amount < 0 || amount + b.topup < b.spent)
                    throw Error(
                      "The budget must cover expenses already recorded.",
                    );
                  st.categories.find((c) => c.id === edit)!.limit = amount;
                  ensureMonth(st, month).limits[edit] = amount;
                }, "Budget updated for this month and set as the default for future months.")
              )
                setEdit(null);
            }}
          >
            <label>
              Base budget ({s.settings.currency})
              <input
                name="amount"
                type="number"
                min="0"
                step="0.01"
                defaultValue={budget(s, month, edit).limit}
                required
              />
            </label>
            <p className="muted">
              This updates the current allocation and the default for future
              months. Closed months keep their existing budgets.
            </p>
            <button className="btn primary">Save budget</button>
          </form>
        </Modal>
      )}
    </>
  );
}
