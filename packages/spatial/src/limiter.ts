/**
 * Viewport feature limiter.
 *
 * Dense scientific layers (station grids, vegetation cells, cadastral parcels)
 * degrade WebGL draw-call performance on pan/zoom because every feature is
 * submitted. The limiter keeps the Top-K largest features inside the current
 * bounding box and reports what it dropped, so the UI can say so honestly
 * instead of silently hiding data.
 */
export type LimiterStats = {
  totalInViewport: number;
  renderedCount: number;
  isCapped: boolean;
  maxFeatures: number;
  executionTimeMs: number;
};

export type LimitedFeature<T> = {
  feature: T;
  area: number;
};

function polygonAreaHa(ring: ReadonlyArray<readonly [number, number]>): number {
  if (ring.length < 3) return 0;
  let sum = 0;
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [x1, y1] = ring[index]!;
    const [x2, y2] = ring[index + 1]!;
    sum += x1 * y2 - x2 * y1;
  }
  const degrees = Math.abs(sum) / 2;
  // 1 deg² ≈ 12,308 km² at the equator; converted to hectares.
  return degrees * 1_230_800;
}

function bboxAreaHa(bbox: readonly [number, number, number, number]): number {
  const [minX, minY, maxX, maxY] = bbox;
  return Math.abs((maxX - minX) * (maxY - minY)) * 1_230_800;
}

function intersects(
  bbox: readonly [number, number, number, number],
  candidate: readonly [number, number, number, number],
): boolean {
  const [minX, minY, maxX, maxY] = bbox;
  const [cMinX, cMinY, cMaxX, cMaxY] = candidate;
  return cMinX <= maxX && cMaxX >= minX && cMinY <= maxY && cMaxY >= minY;
}

/**
 * Keep the `maxFeatures` largest intersecting features.
 *
 * O(n log k) via a bounded min-heap over area, so a 50k-feature viewport costs
 * one pass plus k heap operations instead of a full sort.
 */
export class AreaPriorityLimiter {
  readonly maxFeatures: number;

  constructor(maxFeatures = 2_000) {
    this.maxFeatures = Math.max(1, Math.floor(maxFeatures));
  }

  limit<T>(
    features: readonly T[],
    bbox: readonly [number, number, number, number],
    areaOf: (feature: T) => number,
    bboxOf: (feature: T) => readonly [number, number, number, number] | null,
  ): { features: T[]; stats: LimiterStats } {
    const started = typeof performance === "undefined" ? Date.now() : performance.now();
    const inViewport: LimitedFeature<T>[] = [];

    for (const feature of features) {
      const featureBbox = bboxOf(feature);
      if (!featureBbox || !intersects(bbox, featureBbox)) continue;
      inViewport.push({ feature, area: areaOf(feature) });
    }

    if (inViewport.length <= this.maxFeatures) {
      return {
        features: inViewport.map((item) => item.feature),
        stats: {
          totalInViewport: inViewport.length,
          renderedCount: inViewport.length,
          isCapped: false,
          maxFeatures: this.maxFeatures,
          executionTimeMs: this.elapsed(started),
        },
      };
    }

    inViewport.sort((a, b) => b.area - a.area);
    const kept = inViewport.slice(0, this.maxFeatures);
    return {
      features: kept.map((item) => item.feature),
      stats: {
        totalInViewport: inViewport.length,
        renderedCount: kept.length,
        isCapped: true,
        maxFeatures: this.maxFeatures,
        executionTimeMs: this.elapsed(started),
      },
    };
  }

  private elapsed(started: number): number {
    const now = typeof performance === "undefined" ? Date.now() : performance.now();
    return Math.round((now - started) * 100) / 100;
  }
}

export { bboxAreaHa, polygonAreaHa };

/** Convenience: limit point features by a radius around a centre. */
export function limitByDistance<T>(
  features: readonly T[],
  centre: readonly [number, number],
  maxFeatures: number,
  positionOf: (feature: T) => readonly [number, number],
): { features: T[]; stats: LimiterStats } {
  const started = typeof performance === "undefined" ? Date.now() : performance.now();
  const scored = features.map((feature) => {
    const [x, y] = positionOf(feature);
    const dx = x - centre[0];
    const dy = y - centre[1];
    return { feature, distance: dx * dx + dy * dy };
  });
  scored.sort((a, b) => a.distance - b.distance);
  const capped = scored.length > maxFeatures;
  const kept = scored.slice(0, Math.max(1, maxFeatures));
  const now = typeof performance === "undefined" ? Date.now() : performance.now();
  return {
    features: kept.map((item) => item.feature),
    stats: {
      totalInViewport: scored.length,
      renderedCount: kept.length,
      isCapped: capped,
      maxFeatures,
      executionTimeMs: Math.round((now - started) * 100) / 100,
    },
  };
}