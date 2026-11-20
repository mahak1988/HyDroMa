import { describe, expect, it } from "vitest";
import {
  EMPTY_RESOURCE_SEARCH,
  filtersToQuery,
  nextSort,
  offsetOf,
  pageCountOf,
  parseFilterRules,
  parseResourceSearch,
  toSearchParams,
} from "../src/table";

describe("parseResourceSearch", () => {
  it("applies defaults for an empty query", () => {
    expect(parseResourceSearch({})).toEqual(EMPTY_RESOURCE_SEARCH);
  });

  it("coerces numbers and keeps sort/dir", () => {
    const state = parseResourceSearch({ page: "3", limit: "25", sort: "name", dir: "desc", search: "sara" });
    expect(state.page).toBe(3);
    expect(state.limit).toBe(25);
    expect(state.sort).toBe("name");
    expect(state.dir).toBe("desc");
    expect(state.search).toBe("sara");
  });

  it("clamps an out-of-range limit back to defaults", () => {
    expect(parseResourceSearch({ limit: "5000" })).toEqual(EMPTY_RESOURCE_SEARCH);
  });

  it("takes the first value from a repeated param", () => {
    expect(parseResourceSearch({ page: ["2", "9"] }).page).toBe(2);
  });
});

describe("parseFilterRules", () => {
  it("parses valid rules and drops malformed ones", () => {
    const raw = JSON.stringify([
      { field: "role", operator: "eq", value: "viewer" },
      { field: "status", operator: "in" },
      { nope: true },
    ]);
    expect(parseFilterRules(raw)).toEqual([{ field: "role", operator: "eq", value: "viewer" }]);
  });

  it("returns an empty list for invalid JSON", () => {
    expect(parseFilterRules("{not json")).toEqual([]);
    expect(parseFilterRules(undefined)).toEqual([]);
  });
});

describe("toSearchParams", () => {
  it("omits defaults", () => {
    expect(toSearchParams(EMPTY_RESOURCE_SEARCH).toString()).toBe("");
  });

  it("round-trips non-default state", () => {
    const params = toSearchParams({ page: 2, limit: 25, sort: "name", dir: "desc", search: "sara" });
    expect(params.get("page")).toBe("2");
    expect(params.get("limit")).toBe("25");
    expect(params.get("sort")).toBe("name");
    expect(params.get("dir")).toBe("desc");
    expect(params.get("search")).toBe("sara");
  });
});

describe("nextSort", () => {
  it("cycles asc → desc → none", () => {
    const asc = nextSort(null, "name");
    expect(asc).toEqual({ key: "name", direction: "asc" });
    const desc = nextSort(asc, "name");
    expect(desc).toEqual({ key: "name", direction: "desc" });
    expect(nextSort(desc, "name")).toBeNull();
  });

  it("restarts at asc for a new column", () => {
    expect(nextSort({ key: "name", direction: "desc" }, "email")).toEqual({ key: "email", direction: "asc" });
  });
});

describe("pagination helpers", () => {
  it("computes offset and page count", () => {
    expect(offsetOf(3, 10)).toBe(20);
    expect(pageCountOf(0, 10)).toBe(1);
    expect(pageCountOf(21, 10)).toBe(3);
  });
});

describe("filtersToQuery", () => {
  it("builds stable bracketed keys", () => {
    expect(filtersToQuery([{ field: "role", operator: "eq", value: "viewer" }])).toEqual({ "role[eq]": "viewer" });
  });
});