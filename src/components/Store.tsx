"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { State, newState, dateKey, settle, validateState } from "@/lib/model";
import { localizeSavedLabels } from "@/lib/english-labels";

const KEY = "money-tracker-v2";
type Store = {
  s: State;
  today: string;
  feedback: string;
  mutate: (fn: (s: State) => void, message?: string) => Promise<boolean>;
  replace: (s: State) => Promise<boolean>;
  notify: (text: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
};
const C = createContext<Store | null>(null);
export const useStore = () => useContext(C)!;
export default function StoreProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<State | null>(null),
    [toast, setToast] = useState(""),
    [error, setError] = useState(""),
    [apiKey, setApiKey] = useState(
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "",
    );
  const notify = useCallback((text: string) => setToast(text), []);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      const next = raw
        ? localizeSavedLabels(validateState(JSON.parse(raw)))
        : newState(dateKey(), true);
      settle(next, dateKey(next.settings.timeZone));
      localStorage.setItem(KEY, JSON.stringify(next));
      setS(next);
    } catch (e) {
      setError("Your saved data was preserved. " + (e as Error).message);
    }
    const listener = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) {
        try {
          setS(localizeSavedLabels(validateState(JSON.parse(e.newValue))));
        } catch {
          setError("Invalid data received from another tab.");
        }
      }
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 6000);
      return () => clearTimeout(t);
    }
  }, [toast]);
  const mutate = useCallback(
    async (fn: (s: State) => void, message?: string) => {
      const update = () => {
        try {
          const raw = localStorage.getItem(KEY);
          if (!raw) throw Error("Data is unavailable. Reload the page.");
          const next = localizeSavedLabels(validateState(JSON.parse(raw)));
          settle(next, dateKey(next.settings.timeZone));
          fn(next);
          validateState(next);
          next.revision++;
          localStorage.setItem(KEY, JSON.stringify(next));
          setS(next);
          if (message) notify(message);
          return true;
        } catch (e) {
          notify((e as Error).message);
          return false;
        }
      };
      return navigator.locks ? navigator.locks.request(KEY, update) : update();
    },
    [notify],
  );
  const replace = useCallback(
    async (next: State) =>
      mutate((s) => {
        const value = localizeSavedLabels(validateState(next));
        settle(value, dateKey(value.settings.timeZone));
        Object.assign(s, value);
      }, "Data ready."),
    [mutate],
  );
  useEffect(() => {
    if (!s) return;
    let lastDay = dateKey(s.settings.timeZone);
    const tick = () => {
      const today = dateKey(s.settings.timeZone);
      const changed = today !== lastDay;
      lastDay = today;
      if (
        changed ||
        Object.keys(s.days).some((d) => d < today && !s.days[d].closed) ||
        !s.months[today.slice(0, 7)]
      )
        void mutate(() => {});
    };
    const timer = setInterval(tick, 30000);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", tick);
    };
  }, [s, mutate]);
  if (error)
    return (
      <main className="recovery">
        <h1>Check your saved data</h1>
        <p>{error}</p>
        <button
          onClick={() => {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(
              new Blob([localStorage.getItem(KEY) ?? ""], {
                type: "application/json",
              }),
            );
            a.download = "money-tracker-recovery.json";
            a.click();
          }}
        >
          Download recovery data
        </button>
      </main>
    );
  if (!s)
    return (
      <div className="loading">
        <span className="brand-symbol">
          m<span>↗</span>
        </span>
        <p>Opening Money Tracker…</p>
      </div>
    );
  return (
    <C.Provider
      value={{
        s,
        today: dateKey(s.settings.timeZone),
        feedback: toast,
        mutate,
        replace,
        notify,
        apiKey,
        setApiKey,
      }}
    >
      {children}
      {toast && (
        <div className="toast" role="status">
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            ×
          </button>
        </div>
      )}
    </C.Provider>
  );
}
