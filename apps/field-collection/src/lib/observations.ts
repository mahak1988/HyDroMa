export type Observation = {
  id: string;
  siteName: string;
  notes: string;
  status: "pending" | "synced" | "failed";
  createdAt: string;
  updatedAt: string;
};

export const OBSERVATION_STORAGE_KEY = "eco.field.observations";

export function isObservation(value: unknown): value is Observation {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.siteName === "string" &&
    typeof v.notes === "string" &&
    (v.status === "pending" || v.status === "synced" || v.status === "failed") &&
    typeof v.createdAt === "string" &&
    typeof v.updatedAt === "string"
  );
}

export function parseObservations(raw: unknown): Observation[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isObservation);
}