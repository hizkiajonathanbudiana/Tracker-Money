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
        description="Simpan yang belum dibayar. Tandai lunas saat uang benar-benar keluar."
        actions={
          <button className="btn primary" onClick={() => setAdd(true)}>
            <Plus size={17} /> Tambah tagihan
          </button>
        }
      />
      <div className="three-grid">
        <div className="card compact-stat">
          <span>Total belum dibayar</span>
          <strong>{money(pending.reduce((a, b) => a + b.amount, 0))}</strong>
        </div>
        <div className="card compact-stat">
          <span>Lewat jatuh tempo</span>
          <strong className="negative">
            {pending.filter((b) => b.due < today).length} tagihan
          </strong>
        </div>
        <div className="card compact-stat">
          <span>Sudah lunas</span>
          <strong className="positive">
            {s.bills.filter((b) => b.paid).length} tagihan
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
              Belum dibayar
            </button>
            <button
              className={filter === "paid" ? "active" : ""}
              onClick={() => setFilter("paid")}
            >
              Sudah lunas
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
                      ? "Lunas"
                      : b.due < today
                        ? "Lewat jatuh tempo"
                        : "Menunggu pembayaran"}
                  </span>
                </div>
                <strong>{money(b.amount)}</strong>
                {!b.paid && (
                  <div className="inline-actions">
                    <button
                      className="btn secondary"
                      onClick={() => setPay(b.id)}
                    >
                      <Check size={15} /> Bayar
                    </button>
                    <button
                      className="icon-button"
                      aria-label={"Hapus tagihan " + b.title}
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
            title={
              filter === "paid"
                ? "Belum ada tagihan lunas"
                : "Semua terasa lebih ringan"
            }
            description={
              filter === "paid"
                ? "Tagihan yang dibayar akan tampil di sini."
                : "Tidak ada tagihan menunggu. Tambahkan pembayaran mendatang agar tidak terlupa."
            }
          />
        )}
      </section>
      <div className="subtle-note">
        Tagihan pending belum mengurangi saldo atau budget. Saat dibayar, satu
        pengeluaran otomatis dicatat dengan tanggal hari ini.
      </div>
      {add && (
        <Modal title="Tambah tagihan" onClose={() => setAdd(false)}>
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
                }, "Tagihan ditambahkan.")
              )
                setAdd(false);
            }}
          >
            <label>
              Nama tagihan
              <input
                name="title"
                placeholder="Internet, listrik, cicilan…"
                required
                maxLength={120}
              />
            </label>
            <div className="form-row">
              <label>
                Nominal ({s.settings.currency})
                <input
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                />
              </label>
              <label>
                Jatuh tempo
                <input name="due" type="date" defaultValue={today} required />
              </label>
            </div>
            <label>
              Kategori
              <select name="category">
                {s.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="btn primary">Simpan tagihan</button>
          </form>
        </Modal>
      )}
      {pay && (
        <Modal title="Catat pembayaran?" onClose={() => setPay(null)}>
          <p>
            <b>{s.bills.find((b) => b.id === pay)?.title}</b> ditandai lunas dan
            mengurangi budget kategori. Jika budget tidak cukup, tukar poin
            terlebih dahulu.
          </p>
          <div className="modal-actions">
            <button className="btn secondary" onClick={() => setPay(null)}>
              Batal
            </button>
            <button
              className="btn primary"
              onClick={async () => {
                if (
                  await mutate(
                    (st) => payBill(st, pay, today),
                    "Tagihan lunas. Pengeluaran otomatis tercatat.",
                  )
                )
                  setPay(null);
              }}
            >
              Sudah saya bayar
            </button>
          </div>
        </Modal>
      )}
      {del && (
        <Modal title="Hapus tagihan pending?" onClose={() => setDel(null)}>
          <p>Menghapus tagihan pending tidak mengubah saldo atau budget.</p>
          <div className="modal-actions">
            <button className="btn secondary" onClick={() => setDel(null)}>
              Batal
            </button>
            <button
              className="btn danger"
              onClick={async () => {
                if (
                  await mutate((st) => {
                    st.bills = st.bills.filter((b) => b.id !== del);
                  }, "Tagihan dihapus.")
                )
                  setDel(null);
              }}
            >
              Hapus
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
