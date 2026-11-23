import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRealSession } from "@eco-nojin/auth-client";
import { readPersisted, writePersisted } from "@eco-nojin/utilities";
import { OBSERVATION_STORAGE_KEY, parseObservations, type Observation } from "../lib/observations";

type Value = {
  observations: Observation[];
  submit: (siteName: string, notes: string) => Observation;
  retry: (id: string) => void;
  remove: (id: string) => void;
};

const Ctx = createContext<Value | null>(null);

function load(): Observation[] {
  return readPersisted<Observation[]>(OBSERVATION_STORAGE_KEY, (raw) => parseObservations(raw)) ?? [];
}

/**
 * Field observations queue.
 *
 * Records are persisted locally first (offline-first), then synced for real:
 * an authenticated session POSTs each pending record to `/v1/resources/surveys`
 * and the status (`pending` / `synced` / `failed`) comes from the API result. A
 * guest keeps the record queued until sign-in; nothing is marked synced locally.
 */
export function ObservationProvider({ children }: { children: ReactNode }) {
  const session = useRealSession();
  const [observations, setObservations] = useState<Observation[]>(load);
  const sessionRef = useRef(session);
  const syncing = useRef(new Set<string>());

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    writePersisted(OBSERVATION_STORAGE_KEY, observations);
  }, [observations]);

  const sync = useCallback(async (observation: Observation) => {
    if (syncing.current.has(observation.id)) return;
    const current = sessionRef.current;
    if (current.status !== "authenticated") return;

    syncing.current.add(observation.id);
    try {
      const created = await current.api.resources.create("surveys", {
        siteName: observation.siteName,
        notes: observation.notes,
        clientId: observation.id,
        collectedAt: observation.createdAt,
      });
      setObservations((cur) =>
        cur.map((item) =>
          item.id === observation.id
            ? { ...item, status: "synced", remoteId: String(created.id ?? ""), updatedAt: new Date().toISOString() }
            : item,
        ),
      );
    } catch {
      setObservations((cur) =>
        cur.map((item) =>
          item.id === observation.id ? { ...item, status: "failed", updatedAt: new Date().toISOString() } : item,
        ),
      );
    } finally {
      syncing.current.delete(observation.id);
    }
  }, []);

  const submit = useCallback((siteName: string, notes: string): Observation => {
    const now = new Date().toISOString();
    const observation: Observation = {
      id: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      siteName: siteName.trim(),
      notes: notes.trim(),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    setObservations((cur) => [observation, ...cur]);
    return observation;
  }, []);

  const retry = useCallback((id: string) => {
    setObservations((cur) =>
      cur.map((item) => (item.id === id ? { ...item, status: "pending", updatedAt: new Date().toISOString() } : item)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setObservations((cur) => cur.filter((item) => item.id !== id));
  }, []);

  // Drain the queue whenever a real session is available (initial load, sign-in,
  // or a retry that reset a record to `pending`).
  useEffect(() => {
    if (session.status !== "authenticated") return;
    for (const observation of observations) {
      if (observation.status === "pending") void sync(observation);
    }
  }, [session.status, observations, sync]);

  const value = useMemo<Value>(
    () => ({ observations, submit, retry, remove }),
    [observations, submit, retry, remove],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useObservations(): Value {
  const value = useContext(Ctx);
  if (!value) throw new Error("useObservations must be used inside ObservationProvider");
  return value;
}