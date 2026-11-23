import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  BrainCircuit,
  Compass,
  Droplets,
  Globe2,
  House,
  Leaf,
  Map as MapIcon,
  Satellite,
  ShieldCheck,
  Sprout,
  Store,
  Sun,
  Tent,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";
import { Registry } from "@eco-nojin/frontend-core";
import type { Block, IconName } from "../content/types";

/**
 * Block renderer registry.
 *
 * A new page-block kind is added by registering a renderer, not by editing an
 * if/else chain in `Sections`. That keeps the public site's content model open
 * for extension (metrics, CTA, future gallery/comparison blocks) while the
 * renderer stays a closed, typed set.
 */
type BlockRenderer = {
  kind: Block["kind"];
  owner: string;
  render: (block: Block) => ReactNode;
};

export const blockRegistry = new Registry<BlockRenderer>({ onDuplicate: "error", name: "portal-blocks" });

const ICONS: Record<IconName, ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>> = {
  water: Droplets,
  soil: MapIcon,
  leaf: Leaf,
  sun: Sun,
  satellite: Satellite,
  map: MapIcon,
  chart: BarChart3,
  shield: ShieldCheck,
  store: Store,
  tent: Tent,
  users: Users,
  village: House,
  compass: Compass,
  brain: BrainCircuit,
  globe: Globe2,
  sprout: Sprout,
};

function register(renderer: BlockRenderer): void {
  blockRegistry.registerValue(renderer.kind, renderer);
}

register({
  kind: "paragraph",
  owner: "portal",
  render: (block) =>
    block.kind === "paragraph" ? (
      <section className="max-w-3xl">
        <h2 className="display text-2xl text-fg sm:text-3xl">{block.title}</h2>
        <p className="lead mt-3">{block.body}</p>
      </section>
    ) : null,
});

register({
  kind: "features",
  owner: "portal",
  render: (block) =>
    block.kind === "features" ? (
      <section>
        <div className="max-w-3xl">
          <h2 className="display text-2xl text-fg sm:text-3xl">{block.title}</h2>
          {block.body ? <p className="lead mt-3">{block.body}</p> : null}
        </div>
        <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {block.items.map((item) => {
            const Icon = item.icon ? ICONS[item.icon] : Sprout;
            return (
              <li key={item.title} className="card-lift rounded-lg border border-border bg-surface p-5 shadow-e1">
                <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary-soft-fg">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <h3 className="mt-3 text-sm font-semibold text-fg">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{item.body}</p>
              </li>
            );
          })}
        </ul>
      </section>
    ) : null,
});

register({
  kind: "bullets",
  owner: "portal",
  render: (block) =>
    block.kind === "bullets" ? (
      <section>
        <h2 className="display text-2xl text-fg sm:text-3xl">{block.title}</h2>
        <ul className="mt-5 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {block.items.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-fg-muted">
              <span aria-hidden="true" className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    ) : null,
});

register({
  kind: "metrics",
  owner: "portal",
  render: (block) =>
    block.kind === "metrics" ? (
      <section className="rounded-xl border border-border bg-surface-2 px-5 py-6">
        <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          {block.items.map((item) => (
            <div key={item.label}>
              <dt className="sr-only">{item.label}</dt>
              <dd>
                <span className="numeric block text-3xl font-semibold tracking-tight text-fg">{item.value}</span>
                <span className="mt-1 block text-2xs text-fg-muted">{item.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    ) : null,
});

register({
  kind: "cta",
  owner: "portal",
  render: (block) =>
    block.kind === "cta" ? (
      <section className="relative overflow-hidden rounded-xl border border-primary/25 bg-primary-soft px-6 py-8 sm:px-10">
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="display text-2xl text-primary-soft-fg">{block.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-primary-soft-fg/90">{block.body}</p>
          </div>
          <Link
            to={block.to}
            className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-fg shadow-e1 transition-colors hover:bg-primary-hover"
          >
            {block.action}
          </Link>
        </div>
        <div
          aria-hidden="true"
          className="absolute -bottom-16 size-56 rounded-full bg-primary/10"
          style={{ insetInlineEnd: "-2.5rem" }}
        />
      </section>
    ) : null,
});

export function Sections({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-14 sm:space-y-16">
      {blocks.map((block, index) => {
        const renderer = blockRegistry.get(block.kind);
        if (!renderer) {
          if (import.meta.env.DEV) {
            console.warn(`No renderer registered for portal block "${block.kind}"`);
          }
          return null;
        }
        return <div key={`${block.kind}-${index}`}>{renderer.render(block)}</div>;
      })}
    </div>
  );
}