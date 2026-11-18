export type UnitKey =
  | "mm"
  | "mmYear"
  | "m3"
  | "percent"
  | "degC"
  | "dsM"
  | "ph"
  | "index"
  | "ha"
  | "kgHa"
  | "days";

export type Quality = "good" | "medium" | "low";
export type DataStatus = "DEMO" | "NOT_CONNECTED" | "STALE";
export type Domain = "water" | "soil" | "climate" | "vegetation";

export type Indicator = {
  id: string;
  domain: Domain;
  labelKey: string;
  unit: UnitKey;
  value: number;
  decimals: number;
  quality: Quality;
  status: DataStatus;
  model: { id: string; version: string };
  source: string;
  updatedAt: string;
  uncertaintyPct: number;
  series: number[];
};

export type Alert = { id: string; severity: "high" | "medium" | "low"; labelKey: string };

export type StudyArea = {
  id: string;
  nameKey: string;
  center: [number, number];
  areaHa: number;
  bbox: [number, number, number, number];
};

/** Deterministic PRNG so every chart is stable across reloads and tests. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function series(seed: number, base: number, amplitude: number, points = 36): number[] {
  const random = mulberry32(seed);
  return Array.from({ length: points }, (_, index) => {
    const trend = (index / points) * amplitude * 0.35;
    const season = Math.sin((index / 12) * Math.PI * 2) * amplitude;
    const noise = (random() - 0.5) * amplitude * 0.6;
    return Math.max(0, base + trend + season + noise);
  });
}

const UPDATED = "2026-11-17T06:40:00.000Z";

const make = (
  id: string,
  domain: Domain,
  labelKey: string,
  unit: UnitKey,
  base: number,
  amplitude: number,
  decimals: number,
  seed: number,
  quality: Quality,
  uncertaintyPct: number,
  source: string,
): Indicator => {
  const data = series(seed, base, amplitude);
  const value = data[data.length - 1] ?? base;
  return {
    id,
    domain,
    labelKey,
    unit,
    value: Number(value.toFixed(decimals)),
    decimals,
    quality,
    status: "DEMO",
    model: { id: `hydroma-${domain}`, version: "0.1-demo" },
    source,
    updatedAt: UPDATED,
    uncertaintyPct,
    series: data.map((item) => Number(item.toFixed(decimals))),
  };
};

export const INDICATORS: Indicator[] = [
  make("precipitation", "water", "hydro.indicators.precipitation", "mm", 34, 26, 1, 11, "medium", 18, "CHIRPS-like demo series"),
  make("et", "water", "hydro.indicators.et", "mm", 88, 32, 1, 12, "medium", 22, "MOD16-like demo series"),
  make("runoff", "water", "hydro.indicators.runoff", "mm", 9, 6, 1, 13, "low", 35, "rainfall–runoff demo"),
  make("groundwater", "water", "hydro.indicators.groundwater", "m3", 12.4, 1.8, 1, 14, "low", 40, "well-level demo series"),
  make("soilMoisture", "water", "hydro.indicators.soilMoisture", "percent", 21, 7, 1, 15, "medium", 20, "SMAP-like demo series"),
  make("droughtIndex", "climate", "hydro.indicators.droughtIndex", "index", 1.6, 0.7, 2, 16, "medium", 25, "SPI-like demo"),
  make("soilOrganic", "soil", "hydro.indicators.soilOrganic", "percent", 1.34, 0.18, 2, 21, "medium", 15, "soil sample demo"),
  make("salinity", "soil", "hydro.indicators.salinity", "dsM", 2.7, 0.8, 1, 22, "medium", 18, "EC demo transect"),
  make("ph", "soil", "hydro.indicators.ph", "ph", 7.6, 0.25, 1, 23, "good", 8, "soil sample demo"),
  make("erosion", "soil", "hydro.indicators.erosion", "percent", 18.5, 5.5, 1, 24, "low", 30, "RUSLE-like demo"),
  make("temperature", "climate", "hydro.climate.temperature", "degC", 18.2, 8.4, 1, 31, "good", 10, "station demo series"),
  make("ndvi", "vegetation", "hydro.indicators.ndvi", "index", 0.42, 0.16, 2, 41, "medium", 12, "Sentinel-2-like demo"),
  make("evi", "vegetation", "hydro.indicators.evi", "index", 0.31, 0.12, 2, 42, "medium", 15, "Sentinel-2-like demo"),
  make("savi", "vegetation", "hydro.indicators.savi", "index", 0.38, 0.14, 2, 43, "medium", 16, "Sentinel-2-like demo"),
  make("lai", "vegetation", "hydro.indicators.lai", "index", 1.4, 0.6, 1, 44, "low", 28, "MODIS-like demo"),
  make("biomass", "vegetation", "hydro.indicators.biomass", "kgHa", 2150, 620, 0, 45, "low", 32, "biomass demo"),
  make("waterProductivity", "water", "hydro.indicators.waterProductivity", "kgHa", 1.1, 0.35, 2, 46, "low", 30, "yield per water demo"),
  make("rangelandCover", "vegetation", "hydro.indicators.rangelandCover", "percent", 34, 11, 1, 47, "medium", 22, "cover demo"),
];

export const ALERTS: Alert[] = [
  { id: "alert-drought", severity: "high", labelKey: "hydro.dashboard.alertDrought" },
  { id: "alert-heat", severity: "medium", labelKey: "hydro.dashboard.alertHeat" },
  { id: "alert-erosion", severity: "medium", labelKey: "hydro.dashboard.alertErosion" },
];

export const STUDY_AREAS: StudyArea[] = [
  { id: "karaj", nameKey: "hydro.landscapes.karaj", center: [50.98, 35.93], areaHa: 12450, bbox: [50.72, 35.76, 51.24, 36.1] },
  { id: "taleghan", nameKey: "hydro.landscapes.taleghan", center: [50.75, 36.18], areaHa: 8620, bbox: [50.52, 36.02, 50.98, 36.34] },
  { id: "kondor", nameKey: "hydro.landscapes.kondor", center: [51.2, 35.62], areaHa: 4180, bbox: [51.04, 35.5, 51.36, 35.74] },
];

export const DATA_UPDATED_AT = UPDATED;

export const byDomain = (domain: Domain): Indicator[] => INDICATORS.filter((item) => item.domain === domain);

export function indicatorById(id: string): Indicator | undefined {
  return INDICATORS.find((item) => item.id === id);
}

/** Scenario comparison values (demonstration only). */
export const SCENARIOS = [
  {
    id: "baseline",
    labelKey: "hydro.simulation.base",
    values: { et: 92, runoff: 11.4, soilMoisture: 18.6, ndvi: 0.37, erosion: 21.2, biomass: 1980 },
  },
  {
    id: "restoration",
    labelKey: "hydro.simulation.alternative",
    values: { et: 89, runoff: 9.1, soilMoisture: 23.4, ndvi: 0.46, erosion: 15.8, biomass: 2420 },
  },
] as const;

export const SCENARIO_LABELS = [
  { id: "et", labelKey: "hydro.water.et", unit: "mm" },
  { id: "runoff", labelKey: "hydro.water.runoff", unit: "mm" },
  { id: "soilMoisture", labelKey: "hydro.water.soilMoisture", unit: "%" },
  { id: "ndvi", labelKey: "hydro.vegetation.ndvi", unit: "index" },
  { id: "erosion", labelKey: "hydro.soil.erosion", unit: "%" },
  { id: "biomass", labelKey: "hydro.vegetation.biomass", unit: "kg/ha" },
] as const;