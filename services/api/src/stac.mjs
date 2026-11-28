/**
 * STAC search adapter (fixture-backed).
 * Phase 3.80 — upstream pgSTAC integration seam.
 * Returns deterministic fixture data; no external service, no API key.
 */

const FIXTURE_COLLECTION = {
  id: "eco-nojin-fixture",
  type: "Collection",
  description: "Deterministic fixture collection for local development.",
  license: "MIT",
  extent: {
    spatial: { bbox: [[-180, -90, 180, 90]] },
    temporal: { interval: [["2026-01-01T00:00:00Z", null]] },
  },
};

const FIXTURE_ITEMS = [
  {
    id: "fixture-item-1",
    type: "Feature",
    collection: "eco-nojin-fixture",
    properties: { datetime: "2026-01-01T00:00:00Z", source: "fixture" },
    geometry: { type: "Point", coordinates: [0, 0] },
    assets: {},
  },
];

export function searchStac(_query = {}) {
  return { items: FIXTURE_ITEMS, nextCursor: null, total: FIXTURE_ITEMS.length };
}

export function getStacCollection(id) {
  return id === FIXTURE_COLLECTION.id ? FIXTURE_COLLECTION : null;
}