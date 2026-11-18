"use client";
import { ReactNode, useEffect, useRef } from "react";
import { X, Utensils, TrainFront, ShoppingBag, Receipt } from "lucide-react";
import { useStore } from "./Store";
export function useMoney() {
  const { s } = useStore();
  return (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: s.settings.currency,
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(n);
}
export const num = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(n);
export function CategoryIcon({ id }: { id: string }) {
  const Icon =
    id === "fnb"
      ? Utensils
      : id === "transport"
        ? TrainFront
        : id === "shopping"
          ? ShoppingBag
          : Receipt;
  return <Icon size={19} />;
}
export function Heading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="heading-actions">{actions}</div>
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const { feedback, notify } = useStore();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    notify("");
    const d = ref.current;
    d?.showModal();
    return () => d?.close();
  }, [notify]);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="modal-head">
        <h2>{title}</h2>
        <button className="icon-button" onClick={onClose} aria-label="Tutup">
          <X size={20} />
        </button>
      </div>
      {feedback && (
        <div className="dialog-feedback" role="alert">
          {feedback}
        </div>
      )}
      {children}
    </dialog>
  );
}
export function Empty({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Receipt size={26} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
export function Amount({ value, income }: { value: number; income?: boolean }) {
  const money = useMoney();
  return (
    <span className={"amount " + (income ? "positive" : "")}>
      {income ? "+" : "−"}
      {money(value)}
    </span>
  );
}
