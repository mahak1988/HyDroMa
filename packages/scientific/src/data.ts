import type { SpatialMetadata } from "./spatial";

/**
 * Data contracts for the scientific engine.
 *
 * `DataArtifact` is a reference, not a blob. Large rasters, grids and result
 * files stay in file/object storage; metadata and checksums live here.
 */
export const DATA_KINDS = [
  "raw",
  "processed",
  "model_ready",
  "observation",
  "simulation_result",
  "reference",
] as const;

export type DataKind = (typeof DATA_KINDS)[number];

export type DataQuality = Readonly<{
  /** Fraction of expected values present, 0..1. */
  completeness?: number;
  missingValueCount?: number;
  flags: readonly string[];
}>;

export type TemporalRange = Readonly<{
  start: string;
  end: string;
  /** ISO-8601 duration or an explicit interval label. */
  interval?: string;
}>;

export type DataArtifact = Readonly<{
  id: string;
  kind: DataKind;
  /** Stable URI or storage key; never a local absolute path in a public API. */
  uri: string;
  mediaType: string;
  checksum?: string;
  unit?: string;
  spatial?: SpatialMetadata;
  temporal?: TemporalRange;
  license?: string;
  quality?: DataQuality;
}>;

export function isDataArtifact(value: unknown): value is DataArtifact {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    typeof candidate.kind === "string" &&
    DATA_KINDS.includes(candidate.kind as DataKind) &&
    typeof candidate.uri === "string" &&
    candidate.uri.length > 0 &&
    typeof candidate.mediaType === "string" &&
    candidate.mediaType.length > 0
  );
}