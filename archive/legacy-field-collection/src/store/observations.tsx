import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
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

export function ObservationProvider({ children }: { children: ReactNode }) {
  const [observations, setObservations] = useState<Observation[]>(load);

  useEffect(() => {
    writePersisted(OBSERVATION_STORAGE_KEY, observations);
  }, [observations]);

  const submit = useCallback((siteName: string, notes: string): Observation => {
    const now = new Date().toISOString();
    const obs: Observation = {
      id: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      siteName: siteName.trim(),
      notes: notes.trim(),
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    setObservations((cur) => [obs, ...cur]);
    return obs;
  }, []);

  const retry = useCallback((id: string) => {
    setObservations((cur) =>
      cur.map((o) => (o.id === id ? { ...o, status: "pending", updatedAt: new Date().toISOString() } : o)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setObservations((cur) => cur.filter((o) => o.id !== id));
  }, []);

  const value = useMemo<Value>(() => ({ observations, submit, retry, remove }), [observations, submit, retry, remove]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useObservations(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error("useObservations must be used inside ObservationProvider");
  return v;
}