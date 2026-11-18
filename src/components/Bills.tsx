"use client";
import { useState } from "react";
import { Plus, Receipt, Check, Trash2 } from "lucide-react";
import { useStore } from "./Store";
import { Heading, useMoney, Modal, Empty } from "./UI";
import { uid, payBill } from "@/lib/model";
export default function Bills() {
  const { s, today, mutate } = useStore(),
    [add, setAdd] = useState(false),
    [pay, setPay] = useState<string | null>(null),
    [del, setDel] = useState<string | null>(null),
    [filter, setFilter] = useState("pending");
  const money = useMoney(),
    pending = s.bills.filter((b) => !b.paid),
    list = s.bills
      .filter((b) => (filter === "paid" ? b.paid : !b.paid))
      .sort((a, b) => a.due.localeCompare(b.due));
  return (
    <>
      <Heading
        eyebrow="ONE LESS THING ON YOUR MIND"
        title="Bills, under control."
        description="Track unpaid bills and record payments when you make them."
        actions={
          <button className="btn primary" onClick={() => setAdd(true)}>
            <Plus size={17} /> Add bill
          </button>
        }
      />
      <div className="three-grid">
        <div className="card compact-stat">
          <span>Total unpaid</span>
          <strong>{money(pending.reduce((a, b) => a + b.amount, 0))}</strong>
        </div>
        <div className="card compact-stat">
          <span>Overdue</span>
          <strong className="negative">
            {pending.filter((b) => b.due < today).length} bills
          </strong>
        </div>
        <div className="card compact-stat">
          <span>Paid</span>
          <strong className="positive">
            {s.bills.filter((b) => b.paid).length} bills
          </strong>
        </div>
      </div>
      <section className="card">
        <div className="section-head">
          <div className="segmented">
            <button
              className={filter === "pending" ? "active" : ""}
              onClick={() => setFilter("pending")}
            >
              Unpaid
            </button>
            <button
              className={filter === "paid" ? "active" : ""}
              onClick={() => setFilter("paid")}
            >
              Paid
            </button>
          </div>
        </div>
        {list.length ? (
          <div className="bill-list">
            {list.map((b) => (
              <div className="bill-row" key={b.id}>
                <span className="transaction-icon">
                  <Receipt size={20} />
                </span>
                <div className="bill-info">
                  <h3>{b.title}</h3>
                  <p>
                    {s.categories.find((c) => c.id === b.category)?.name} ·{" "}
                    {b.due}
                  </p>
                  <span
                    className={
                      "pill " +
                      (b.paid ? "green" : b.due < today ? "red" : "sand")
                    }
                  >
                    {b.paid
                      ? "Paid"
                      : b.due < today
                        ? "Overdue"
                        : "Awaiting payment"}
                  </span>
                </div>
                <strong>{money(b.amount)}</strong>
                {!b.paid && (
                  <div className="inline-actions">
                    <button
                      className="btn secondary"
                      onClick={() => setPay(b.id)}
                    >
                      <Check size={15} /> Record payment
                    </button>
                    <button
                      className="icon-button"
                      aria-label={"Delete bill " + b.title}
                      onClick={() => setDel(b.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty
            title={filter === "paid" ? "No paid bills yet" : "No unpaid bills"}
            description={
              filter === "paid"
                ? "Paid bills will appear here."
                : "Add upcoming bills to keep track of their due dates."
            }
          />
        )}
      </section>
      <div className="subtle-note">
        Unpaid bills do not affect your balance or budget. Recording a payment
        adds an expense dated today.
      </div>
      {add && (
        <Modal title="Add bill" onClose={() => setAdd(false)}>
          <form
            className="form-stack"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              if (
                await mutate((st) => {
                  st.bills.push({
                    id: uid(),
                    title: String(f.get("title")).trim(),
                    amount: Number(f.get("amount")),
                    category: String(f.get("category")),
                    due: String(f.get("due")),
                    paid: false,
                  });
                }, "Bill added.")
              )
                setAdd(false);
            }}
          >
            <label>
              Bill name
              <input
                name="title"
                placeholder="Internet, electricity, installments…"
                required
                maxLength={120}
              />
            </label>
            <div className="form-row">
              <label>
                Amount ({s.settings.currency})
                <input
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                />
              </label>
              <label>
                Due date
                <input name="due" type="date" defaultValue={today} required />
              </label>
            </div>
            <label>
              Category
              <select name="category">
                {s.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn primary">Save bill</button>
          </form>
        </Modal>
      )}
      {pay && (
        <Modal title="Record this payment?" onClose={() => setPay(null)}>
          <p>
            <b>{s.bills.find((b) => b.id === pay)?.title}</b> will be marked as
            paid and deducted from its category budget. If the budget is too
            low, redeem points first.
          </p>
          <div className="modal-actions">
            <button className="btn secondary" onClick={() => setPay(null)}>
              Cancel
            </button>
            <button
              className="btn primary"
              onClick={async () => {
                if (
                  await mutate(
                    (st) => payBill(st, pay, today),
                    "Bill paid. Expense recorded.",
                  )
                )
                  setPay(null);
              }}
            >
              Mark as paid
            </button>
          </div>
        </Modal>
      )}
      {del && (
        <Modal title="Delete unpaid bill?" onClose={() => setDel(null)}>
          <p>
            Deleting this unpaid bill leaves your balance and budget unchanged.
          </p>
          <div className="modal-actions">
            <button className="btn secondary" onClick={() => setDel(null)}>
              Cancel
            </button>
            <button
              className="btn danger"
              onClick={async () => {
                if (
                  await mutate((st) => {
                    st.bills = st.bills.filter((b) => b.id !== del);
                  }, "Bill deleted.")
                )
                  setDel(null);
              }}
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
