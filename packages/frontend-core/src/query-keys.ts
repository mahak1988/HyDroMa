import { Registry } from "./registry";
import type { RegistryItem, RegistryOptions } from "./registry";

/**
 * Query-key factory — one shape for every resource.
 *
 * Keys are structured as `[name, scope?, "list"|"detail", ...]`. `scope` is the
 * tenant (organization) or environment id, so switching tenant invalidates the
 * cache instead of leaking rows across tenants.
 *
 *   queryKeys.all                 → ["users"]
 *   queryKeys.lists()             → ["users", "list"]
 *   queryKeys.list(query)         → ["users", "list", query]
 *   queryKeys.details()           → ["users", "detail"]
 *   queryKeys.detail(id, query)   → ["users", "detail", id, query]
 */
export type QueryKey = readonly unknown[];

export type QueryKeys<TName extends string> = {
  /** The resource name, kept on the type so callers can build derived keys. */
  readonly name: TName;
  all: QueryKey;
  lists: () => QueryKey;
  list: (query?: unknown) => QueryKey;
  details: () => QueryKey;
  detail: (id: string, query?: unknown) => QueryKey;
};

export function queryKeysFactory<TName extends string>(name: TName): QueryKeys<TName> {
  return {
    name,
    all: [name],
    lists: () => [name, "list"],
    list: (query?: unknown) => (query === undefined ? [name, "list"] : [name, "list", query]),
    details: () => [name, "detail"],
    detail: (id: string, query?: unknown) =>
      query === undefined ? [name, "detail", id] : [name, "detail", id, query],
  };
}

/**
 * Prefix every key with a scope (tenant/environment). Idempotent: calling it
 * twice with the same scope yields one prefix, not two.
 */
export function withScope(scope: string | null | undefined, key: QueryKey): QueryKey {
  if (!scope) return key;
  const [head] = key;
  if (head === scope) return key;
  return [scope, ...key] as unknown as QueryKey;
}

/** Keys that must be invalidated after a mutation on one resource. */
export function invalidationKeys(keys: QueryKeys<string>, id?: string): QueryKey[] {
  return id === undefined ? [keys.lists()] : [keys.lists(), keys.detail(id)];
}

export const infiniteKeySuffix = "__infinite";

/**
 * Infinite queries store `InfiniteData<T>` while page queries store `T`. Adding
 * this suffix keeps the two shapes from colliding in the cache.
 */
export function infiniteKey(key: QueryKey): QueryKey {
  return [...key, infiniteKeySuffix];
}

export { Registry, type RegistryItem, type RegistryOptions };