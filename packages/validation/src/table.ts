import { z } from "zod";

/**
 * Table contract — URL as the single source of truth.
 *
 * Every list screen serialises page/limit/sort/dir/search/filters into the URL,
 * validates them with `resourceSearchSchema`, and feeds the parsed state to the
 * query layer. A refresh or a shared link therefore reproduces the same view.
 */
export const SORT_DIRECTIONS = ["asc", "desc"] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export const FILTER_OPERATORS = ["eq", "neq", "contains", "in", "gte", "lte"] as const;
export type FilterOperator = (typeof FILTER_OPERATORS)[number];

export const filterRuleSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(FILTER_OPERATORS).default("eq"),
  value: z.union([z.string(), z.number(), z.boolean()]),
});
export type FilterRule = z.infer<typeof filterRuleSchema>;

export const tableSortSchema = z.object({
  key: z.string().min(1),
  direction: z.enum(SORT_DIRECTIONS).default("asc"),
});
export type TableSort = z.infer<typeof tableSortSchema>;

export const resourceSearchSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sort: z.string().optional(),
  dir: z.enum(SORT_DIRECTIONS).optional(),
  search: z.string().optional(),
  /** JSON-encoded `FilterRule[]`, kept as a string so scalar types survive. */
  filters: z.string().optional(),
  /** Free-form escape hatch for screen-specific params (e.g. `view=grid`). */
  extra: z.record(z.string(), z.string()).optional(),
});
export type ResourceSearch = z.infer<typeof resourceSearchSchema>;

export const EMPTY_RESOURCE_SEARCH: ResourceSearch = { page: 1, limit: 10 };

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Parse untyped URL params into a validated, defaulted table state. */
export function parseResourceSearch(input: RawSearchParams): ResourceSearch {
  const result = resourceSearchSchema.safeParse({
    page: first(input.page) ?? undefined,
    limit: first(input.limit) ?? undefined,
    sort: first(input.sort) ?? undefined,
    dir: first(input.dir) ?? undefined,
    search: first(input.search) ?? undefined,
    filters: first(input.filters) ?? undefined,
  });
  return result.success ? result.data : { ...EMPTY_RESOURCE_SEARCH };
}

/** Parse a `filters` query-string value into rules, dropping malformed entries. */
export function parseFilterRules(raw: string | undefined): FilterRule[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((candidate) => {
      const result = filterRuleSchema.safeParse(candidate);
      return result.success ? [result.data] : [];
    });
  } catch {
    return [];
  }
}

/** Serialise table state back to URL params, omitting defaults. */
export function toSearchParams(state: ResourceSearch, extra?: Record<string, string | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  if (state.page > 1) params.set("page", String(state.page));
  if (state.limit !== EMPTY_RESOURCE_SEARCH.limit) params.set("limit", String(state.limit));
  if (state.sort) params.set("sort", state.sort);
  if (state.dir && state.dir !== "asc") params.set("dir", state.dir);
  if (state.search) params.set("search", state.search);
  if (state.filters) params.set("filters", state.filters);
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (value) params.set(key, value);
  }
  return params;
}

/** Convert rules into a stable, order-independent string for cache keys. */
export function filtersToQuery(rules: readonly FilterRule[]): Record<string, string> {
  const query: Record<string, string> = {};
  for (const rule of rules) {
    query[`${rule.field}[${rule.operator}]`] = String(rule.value);
  }
  return query;
}

/** Tri-state sort for a column header: asc → desc → none. */
export function nextSort(current: TableSort | null, key: string): TableSort | null {
  if (!current || current.key !== key) return { key, direction: "asc" };
  if (current.direction === "asc") return { key, direction: "desc" };
  return null;
}

export function offsetOf(page: number, limit: number): number {
  return (Math.max(1, page) - 1) * limit;
}

export function pageCountOf(total: number, limit: number): number {
  if (limit <= 0) return 1;
  return Math.max(1, Math.ceil(total / limit));
}