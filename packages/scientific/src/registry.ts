import {
  assertModelDefinition,
  type ModelDefinition,
  type ModelDomain,
  type ModelExecutionMode,
  type ScientificModel,
} from "./model";
import type { ModelMaturity } from "./maturity";

/**
 * Model registry.
 *
 * Entries are immutable and versioned: `id@version` is the key. Registering the
 * same id/version twice is an error, so a registry can never silently replace a
 * model that a past run depended on. A model may be registered with
 * `executionMode: "remote"` and no local executor; discovery and validation do
 * not require a browser runtime.
 */
export type ModelRegistryEntry<TInput = unknown, TOutput = unknown> = Readonly<{
  model: ScientificModel<TInput, TOutput>;
  definition: ModelDefinition;
}>;

export type ModelRegistryFilter = Readonly<{
  domain?: ModelDomain;
  maturity?: ModelMaturity;
  executionMode?: ModelExecutionMode;
}>;

export type ModelRegistry = Readonly<{
  register<TInput, TOutput>(model: ScientificModel<TInput, TOutput>): ModelRegistryEntry<TInput, TOutput>;
  get<TInput = unknown, TOutput = unknown>(
    id: string,
    version?: string,
  ): ModelRegistryEntry<TInput, TOutput> | undefined;
  has(id: string, version?: string): boolean;
  list(filter?: ModelRegistryFilter): ModelRegistryEntry[];
  versionsOf(id: string): string[];
  ids(): string[];
  size(): number;
  clear(): void;
}>;

function key(id: string, version: string): string {
  return `${id}@${version}`;
}

function compareVersion(a: string, b: string): number {
  return a.localeCompare(b, "en", { numeric: true, sensitivity: "base" });
}

export function createModelRegistry(): ModelRegistry {
  const entries = new Map<string, ModelRegistryEntry>();

  const register = <TInput, TOutput>(
    model: ScientificModel<TInput, TOutput>,
  ): ModelRegistryEntry<TInput, TOutput> => {
    assertModelDefinition(model.definition);
    const id = model.definition.id;
    const version = model.definition.version;
    const registryKey = key(id, version);
    if (entries.has(registryKey)) {
      throw new Error(`Model registry: duplicate model version "${registryKey}"`);
    }
    const entry: ModelRegistryEntry<TInput, TOutput> = Object.freeze({
      model,
      definition: model.definition,
    });
    entries.set(registryKey, entry as ModelRegistryEntry);
    return entry;
  };

  const get = <TInput = unknown, TOutput = unknown>(
    id: string,
    version?: string,
  ): ModelRegistryEntry<TInput, TOutput> | undefined => {
    if (version !== undefined) {
      return entries.get(key(id, version)) as ModelRegistryEntry<TInput, TOutput> | undefined;
    }
    const versions = versionsOf(id);
    const latest = versions[versions.length - 1];
    return latest === undefined
      ? undefined
      : (entries.get(key(id, latest)) as ModelRegistryEntry<TInput, TOutput> | undefined);
  };

  const has = (id: string, version?: string): boolean => {
    if (version !== undefined) return entries.has(key(id, version));
    return versionsOf(id).length > 0;
  };

  const list = (filter: ModelRegistryFilter = {}): ModelRegistryEntry[] => {
    return [...entries.values()]
      .filter((entry) => {
        if (filter.domain && entry.definition.domain !== filter.domain) return false;
        if (filter.maturity && entry.definition.maturity !== filter.maturity) return false;
        if (filter.executionMode && entry.definition.executionMode !== filter.executionMode) return false;
        return true;
      })
      .sort((a, b) =>
        a.definition.id === b.definition.id
          ? compareVersion(b.definition.version, a.definition.version)
          : a.definition.id.localeCompare(b.definition.id),
      );
  };

  const versionsOf = (id: string): string[] =>
    [...entries.values()]
      .filter((entry) => entry.definition.id === id)
      .map((entry) => entry.definition.version)
      .sort(compareVersion);

  const ids = (): string[] => [...new Set([...entries.values()].map((entry) => entry.definition.id))].sort();

  return Object.freeze({
    register,
    get,
    has,
    list,
    versionsOf,
    ids,
    size: () => entries.size,
    clear: () => entries.clear(),
  });
}