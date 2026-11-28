/**
 * STAC contract wiring (fixture-backed).
 * Binds the STAC search port contract to the local fixture adapter.
 * No external service, no API key.
 */
import { searchStac, getStacCollection } from "./stac.mjs";

export const stacContract = {
  version: "0.1.0",
  search: (query) => searchStac(query),
  getCollection: (id) => getStacCollection(id),
};