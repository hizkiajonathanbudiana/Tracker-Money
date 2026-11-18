"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CheckCheck,
  Wallet,
  Receipt,
  Sparkles,
  Download,
  Settings,
  Sun,
  Moon,
  ArrowUpRight,
  PanelLeftClose,
  Menu,
  X,
} from "lucide-react";
import { useStore } from "./Store";
import { newState, dateKey } from "@/lib/model";
declare global {
  interface Window {
    moneyInstallPrompt?: Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: string }>;
    };
  }
}
const nav = [
  ["/", "Overview", LayoutDashboard],
  ["/tracker/", "Tracker", ArrowLeftRight],
  ["/budget/", "Budgets & points", Wallet],
  ["/challenges/", "Challenges", CheckCheck],
  ["/bills/", "Bills", Receipt],
  ["/insights/", "AI companion", Sparkles],
] as const;
const extras = [
  ["/export/", "Export data", Download],
  ["/settings/", "Settings", Settings],
] as const;
export default function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { s, replace } = useStore();
  const { resolvedTheme, setTheme } = useTheme();
  const [menu, setMenu] = useState(false),
    [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const install = (e: Event) => {
      e.preventDefault();
      window.moneyInstallPrompt = e as NonNullable<
        Window["moneyInstallPrompt"]
      >;
    };
    const installed = () => {
      delete window.moneyInstallPrompt;
    };
    window.addEventListener("beforeinstallprompt", install);
    window.addEventListener("appinstalled", installed);
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production")
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => {
      window.removeEventListener("beforeinstallprompt", install);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  useEffect(() => setMenu(false), [path]);
  const active = (p: string) =>
    p === "/" ? path === "/" : path.startsWith(p.replace(/\/$/, ""));
  return (
    <div className="app-shell">
      <aside className={"sidebar " + (menu ? "open" : "")}>
        <Link href="/" className="brand">
          <span className="brand-symbol">
            m<span>↗</span>
          </span>
          <span>
            money<span className="brand-sub">TRACKER</span>
          </span>
        </Link>
        <button
          className="sidebar-close icon-button"
          onClick={() => setMenu(false)}
          aria-label="Close menu"
        >
          <X />
        </button>
        <div className="sidebar-caption">YOUR EVERYDAY SPACE</div>
        <nav>
          {nav.map(([p, label, Icon]) => (
            <Link
              key={p}
              href={p}
              className={active(p) ? "nav-item active" : "nav-item"}
            >
              <Icon size={19} />
              <span>{label}</span>
              {p === "/bills/" && s.bills.some((b) => !b.paid) && (
                <i>{s.bills.filter((b) => !b.paid).length}</i>
              )}
              {p === "/insights/" && <small>NEW</small>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span>Small habits.</span>
            <strong>Big possibilities.</strong>
            <p>Build habits one day at a time.</p>
            <span className="note-spark">✳</span>
          </div>
          {extras.map(([p, label, Icon]) => (
            <Link
              key={p}
              href={p}
              className={active(p) ? "nav-item active" : "nav-item"}
            >
              <Icon size={19} />
              {label}
            </Link>
          ))}
          <div className="profile">
            <span className="avatar">
              {s.settings.name.slice(0, 1).toUpperCase()}
            </span>
            <div>
              <b>{s.settings.name}</b>
              <small>My personal space</small>
            </div>
            <PanelLeftClose size={16} />
          </div>
        </div>
      </aside>
      {menu && <div className="nav-overlay" onClick={() => setMenu(false)} />}
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="Open menu"
              onClick={() => setMenu(true)}
            >
              <Menu size={21} />
            </button>
            <span>My workspace</span>
            <span>/</span>
            <b>
              {[...nav, ...extras].find((n) => active(n[0]))?.[1] ?? "Overview"}
            </b>
          </div>
          <div className="top-actions">
            <span className="local-status">
              <i /> Saved on this device
            </span>
            <button
              aria-label="Toggle theme"
              className="icon-button"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
            >
              {mounted && resolvedTheme === "dark" ? (
                <Sun size={19} />
              ) : (
                <Moon size={19} />
              )}
            </button>
            <span className="avatar small">
              {s.settings.name.slice(0, 1).toUpperCase()}
            </span>
          </div>
        </header>
        <main>
          {s.demo && (
            <div className="demo-banner">
              <span>
                <b>Demo mode</b> · Explore with sample data.
              </span>
              <button
                onClick={() =>
                  void replace(newState(dateKey(s.settings.timeZone)))
                }
              >
                Start with my own data <ArrowUpRight size={14} />
              </button>
            </div>
          )}
          {children}
          <footer className="page-footer">
            <span>Made for a more intentional everyday.</span>
            <span>
              Money Tracker <i>✳</i>
            </span>
          </footer>
        </main>
      </div>
      <nav className="bottom-nav">
        {[nav[0], nav[1], nav[3], nav[2]].map(([p, label, Icon]) => (
          <Link key={p} href={p} className={active(p) ? "selected" : ""}>
            <Icon size={21} />
            <span>{label === "Budgets & points" ? "Budget" : label}</span>
          </Link>
        ))}
        <button
          onClick={() => setMenu(true)}
          className={
            extras.some((n) => active(n[0])) ||
            active("/bills/") ||
            active("/insights/")
              ? "selected"
              : ""
          }
        >
          <Menu size={21} />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
