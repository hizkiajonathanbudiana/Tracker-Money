"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  doc,
  limit as limitFn,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Challenge,
  ChallengeCompletion,
  EconomyDay,
  EconomySettings,
  PointsLedgerEntry,
  PointsSummary,
  Project,
  ProjectItem,
  Reward,
} from "@/types/economy";
import { DEFAULT_ECONOMY_SETTINGS, migrateSettings } from "@/lib/economy";
import { dayKeyFor, msUntilNextDay } from "@/lib/economyDay";
import { applyPendingCharges, ensureEconomySeed } from "@/lib/economyOps";

const EMPTY_SUMMARY: PointsSummary = {
  balance: 0,
  earnedLifetime: 0,
  spentLifetime: 0,
};

export const useEconomySettings = (userId: string) => {
  const [settings, setSettings] = useState<EconomySettings>(DEFAULT_ECONOMY_SETTINGS);
  const [loading, setLoading] = useState(true);
  const seeded = useRef(false);
  const chargesChecked = useRef(false);
  const migrating = useRef(false);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const ref = doc(db, "users", userId, "settings", "economy");
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        if (!snapshot.exists()) {
          if (!seeded.current) {
            seeded.current = true;
            ensureEconomySeed(userId).catch((error) =>
              console.error("Failed to seed economy defaults:", error)
            );
          }
          setLoading(false);
          return;
        }
        const data = snapshot.data() as Partial<EconomySettings>;
        const patch = migrateSettings(data);
        const merged = { ...DEFAULT_ECONOMY_SETTINGS, ...data, ...(patch ?? {}) };
        if (patch && !migrating.current) {
          migrating.current = true;
          setDoc(ref, { ...patch, updatedAt: serverTimestamp() }, { merge: true })
            .catch((error) => console.error("Failed to migrate economy settings:", error))
            .finally(() => {
              migrating.current = false;
            });
        }
        setSettings(merged);
        setLoading(false);
        if (!chargesChecked.current && merged.spreadRawMaterials) {
          chargesChecked.current = true;
          applyPendingCharges({ userId, settings: merged }).catch((error) =>
            console.error("Failed to apply pending raw-material charges:", error)
          );
        }
      },
      (error) => {
        console.error("Economy settings listener failed:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [userId]);

  return { settings, loading };
};

export const usePointsSummary = (userId: string) => {
  const [points, setPoints] = useState<PointsSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const ref = doc(db, "users", userId, "points", "summary");
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setPoints(snapshot.exists() ? (snapshot.data() as PointsSummary) : EMPTY_SUMMARY);
        setLoading(false);
      },
      (error) => {
        console.error("Points listener failed:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [userId]);

  return { points, loading };
};

/** Today's key in the configured timezone, refreshed exactly at local midnight. */
export const useTodayKey = (timeZone: string) => {
  const [key, setKey] = useState(() => dayKeyFor(new Date(), timeZone));

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const schedule = () => {
      setKey(dayKeyFor(new Date(), timeZone));
      timer = setTimeout(schedule, msUntilNextDay(new Date(), timeZone));
    };

    schedule();
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        setKey(dayKeyFor(new Date(), timeZone));
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [timeZone]);

  return key;
};

export const useEconomyDay = (userId: string, dayKey: string) => {
  const [day, setDay] = useState<EconomyDay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !dayKey) {
      setLoading(false);
      return;
    }
    setDay(null);
    setLoading(true);
    const ref = doc(db, "users", userId, "days", dayKey);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setDay(snapshot.exists() ? (snapshot.data() as EconomyDay) : null);
        setLoading(false);
      },
      (error) => {
        console.error("Economy day listener failed:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [userId, dayKey]);

  return { day, loading };
};

export const useTodayCompletions = (userId: string, dayKey: string) => {
  const [completions, setCompletions] = useState<Record<string, ChallengeCompletion>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !dayKey) {
      setLoading(false);
      return;
    }
    setCompletions({});
    const ref = collection(db, "users", userId, "days", dayKey, "completions");
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const next: Record<string, ChallengeCompletion> = {};
        snapshot.forEach((docSnap) => {
          next[docSnap.id] = docSnap.data() as ChallengeCompletion;
        });
        setCompletions(next);
        setLoading(false);
      },
      (error) => {
        console.error("Completions listener failed:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [userId, dayKey]);

  return { completions, loading };
};

export const useChallenges = (userId: string) => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const ref = collection(db, "users", userId, "challenges");
    const unsubscribe = onSnapshot(
      query(ref, orderBy("sortOrder", "asc")),
      (snapshot) => {
        const next: Challenge[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.active === false) return;
          next.push({ id: docSnap.id, ...(data as Omit<Challenge, "id">) });
        });
        setChallenges(next);
        setLoading(false);
      },
      (error) => {
        console.error("Challenges listener failed:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [userId]);

  return { challenges, loading };
};

export const useRewards = (userId: string) => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const ref = collection(db, "users", userId, "rewards");
    const unsubscribe = onSnapshot(
      query(ref, orderBy("sortOrder", "asc")),
      (snapshot) => {
        const next: Reward[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.active === false) return;
          next.push({ id: docSnap.id, ...(data as Omit<Reward, "id">) });
        });
        setRewards(next);
        setLoading(false);
      },
      (error) => {
        console.error("Rewards listener failed:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [userId]);

  return { rewards, loading };
};

export const useProjects = (userId: string) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const ref = collection(db, "users", userId, "projects");
    const unsubscribe = onSnapshot(
      query(ref, orderBy("createdAt", "desc")),
      (snapshot) => {
        const next: Project[] = [];
        snapshot.forEach((docSnap) =>
          next.push({ id: docSnap.id, ...(docSnap.data() as Omit<Project, "id">) })
        );
        setProjects(next);
        setLoading(false);
      },
      (error) => {
        console.error("Projects listener failed:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [userId]);

  return { projects, loading };
};

export const useProjectItems = (userId: string, projectId: string) => {
  const [items, setItems] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !projectId) {
      setItems([]);
      setLoading(false);
      return;
    }
    const ref = collection(db, "users", userId, "projects", projectId, "items");
    const unsubscribe = onSnapshot(
      query(ref, orderBy("createdAt", "asc")),
      (snapshot) => {
        const next: ProjectItem[] = [];
        snapshot.forEach((docSnap) =>
          next.push({ id: docSnap.id, ...(docSnap.data() as Omit<ProjectItem, "id">) })
        );
        setItems(next);
        setLoading(false);
      },
      (error) => {
        console.error("Project items listener failed:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [userId, projectId]);

  return { items, loading };
};

/** Recent point movements (earn / treat / cash-out / project). */
export const useLedger = (userId: string, limit = 12) => {
  const [entries, setEntries] = useState<Array<PointsLedgerEntry & { id: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    const ref = collection(db, "users", userId, "ledger");
    const unsubscribe = onSnapshot(
      query(ref, orderBy("createdAt", "desc"), limitFn(limit)),
      (snapshot) => {
        const next: Array<PointsLedgerEntry & { id: string }> = [];
        snapshot.forEach((docSnap) => {
          next.push({ id: docSnap.id, ...(docSnap.data() as Omit<PointsLedgerEntry, "id">) });
        });
        setEntries(next);
        setLoading(false);
      },
      (error) => {
        console.error("Ledger listener failed:", error);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [userId, limit]);

  return { entries, loading };
};

/** Everything the dashboard / expense form needs, in one hook. */
export const useEconomyOverview = (userId: string) => {
  const { settings, loading: settingsLoading } = useEconomySettings(userId);
  const { points, loading: pointsLoading } = usePointsSummary(userId);
  const dayKey = useTodayKey(settings.timeZone);
  const { day, loading: dayLoading } = useEconomyDay(userId, dayKey);

  return useMemo(
    () => ({
      settings,
      points,
      day,
      dayKey,
      loading: settingsLoading || pointsLoading || dayLoading,
    }),
    [settings, points, day, dayKey, settingsLoading, pointsLoading, dayLoading]
  );
};

/** Wraps an async economy action with busy state and a user facing message. */
export const useEconomyAction = () => {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (label: string, action: () => Promise<void>) => {
    setBusy(label);
    setError(null);
    setMessage(null);
    try {
      await action();
      setMessage(`${label} done.`);
      return true;
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
      return false;
    } finally {
      setBusy(null);
    }
  }, []);

  const clear = useCallback(() => {
    setMessage(null);
    setError(null);
  }, []);

  return { busy, message, error, run, clear, setMessage, setError };
};
