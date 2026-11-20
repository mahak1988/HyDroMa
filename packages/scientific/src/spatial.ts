/**
 * Scientific spatial metadata.
 *
 * This is deliberately smaller than the MapLibre layer model in
 * `packages/spatial`: it describes what a model consumes or produces, not how
 * a map renders it. H3 is one optional domain, never a global requirement.
 */
export type SpatialCrsKind = "geographic" | "projected" | "local";

export type SpatialCrs = Readonly<{
  code: string;
  kind: SpatialCrsKind;
}>;

export type Bbox = readonly [minX: number, minY: number, maxX: number, maxY: number];

export type SpatialExtent = Readonly<{
  bbox: Bbox;
  crs: string;
}>;

export type SpatialResolution = Readonly<{
  x: number;
  y: number;
  unit: string;
}>;

export type SpatialDomain =
  | Readonly<{ kind: "raster"; crs: string; resolution?: SpatialResolution; extent?: SpatialExtent }>
  | Readonly<{ kind: "vector"; crs: string; geometryTypes: readonly ("point" | "line" | "polygon")[] }>
  | Readonly<{ kind: "grid"; crs: string; cellSize: number; unit: string }>
  | Readonly<{ kind: "h3"; resolution: number }>
  | Readonly<{ kind: "point"; crs: string }>
  | Readonly<{ kind: "polygon"; crs: string }>;

export const SPATIAL_DOMAIN_KINDS = ["raster", "vector", "grid", "h3", "point", "polygon"] as const;

export type SpatialMetadata = Readonly<{
  crs: string;
  domain: SpatialDomain;
  extent?: SpatialExtent;
  resolution?: SpatialResolution;
}>;

export function isBbox(value: unknown): value is Bbox {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every((entry) => typeof entry === "number" && Number.isFinite(entry))
  );
}

export function isSpatialMetadata(value: unknown): value is SpatialMetadata {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.crs !== "string" || candidate.crs.length === 0) return false;
  if (typeof candidate.domain !== "object" || candidate.domain === null) return false;
  const domain = candidate.domain as Record<string, unknown>;
  if (typeof domain.kind !== "string" || !SPATIAL_DOMAIN_KINDS.includes(domain.kind as (typeof SPATIAL_DOMAIN_KINDS)[number])) {
    return false;
  }
  if (domain.kind === "h3") {
    return typeof domain.resolution === "number" && Number.isFinite(domain.resolution);
  }
  if (domain.kind === "grid") {
    return (
      typeof domain.cellSize === "number" &&
      Number.isFinite(domain.cellSize) &&
      typeof domain.unit === "string"
    );
  }
  if (domain.kind === "vector") {
    return Array.isArray(domain.geometryTypes);
  }
  return true;
}