/**
 * Registry — a keyed store with duplicate protection and async loaders.
 *
 * This is the backbone for every plugin-style catalogue in the product: map
 * layers, chart types, panel types, field types, navigation contributions.
 * Registration is data; consumption is lookup. Nothing here imports React.
 */
export type RegistryItem<T> = { value: T } | { loader: () => Promise<T> };

export type RegistryOptions = {
  /** What to do when an id is registered twice. */
  onDuplicate?: "error" | "warn" | "replace";
  /** Optional human-readable label used in duplicate warnings. */
  name?: string;
};

export class Registry<T> {
  private readonly items = new Map<string, RegistryItem<T>>();
  private readonly options: RegistryOptions;

  constructor(options: RegistryOptions = {}) {
    this.options = options;
  }

  register(id: string, item: RegistryItem<T>): this {
    if (this.items.has(id)) {
      if (this.options.onDuplicate === "error") {
        throw new Error(`Registry${this.options.name ? ` (${this.options.name})` : ""}: duplicate id "${id}"`);
      }
      if (this.options.onDuplicate === "warn") {
        console.warn(`Registry${this.options.name ? ` (${this.options.name})` : ""}: replacing "${id}"`);
      }
    }
    this.items.set(id, item);
    return this;
  }

  registerValue(id: string, value: T): this {
    return this.register(id, { value });
  }

  registerLoader(id: string, loader: () => Promise<T>): this {
    return this.register(id, { loader });
  }

  has(id: string): boolean {
    return this.items.has(id);
  }

  get(id: string): T | undefined {
    const item = this.items.get(id);
    if (!item) return undefined;
    return "value" in item ? item.value : undefined;
  }

  getIfExists(id: string): T | undefined {
    return this.get(id);
  }

  async getAsPromise(id: string): Promise<T | undefined> {
    const item = this.items.get(id);
    if (!item) return undefined;
    if ("value" in item) return item.value;
    return item.loader();
  }

  list(): T[] {
    return [...this.items.values()].map((item) => ("value" in item ? item.value : undefined)).filter((v): v is T => v !== undefined);
  }

  ids(): string[] {
    return [...this.items.keys()];
  }

  entries(): Array<[string, T]> {
    return [...this.items.entries()]
      .filter(([, item]) => "value" in item)
      .map(([id, item]) => [id, (item as { value: T }).value]);
  }

  unregister(id: string): boolean {
    return this.items.delete(id);
  }

  /** Remove every entry registered by an owner (plugin teardown). */
  unregisterByOwner(owner: string, ownerOf: (value: T) => string): number {
    let removed = 0;
    for (const [id, item] of this.items) {
      if ("value" in item && ownerOf(item.value) === owner) {
        this.items.delete(id);
        removed += 1;
      }
    }
    return removed;
  }

  clear(): void {
    this.items.clear();
  }

  get size(): number {
    return this.items.size;
  }
}

export type RegistryOptions_ = RegistryOptions;