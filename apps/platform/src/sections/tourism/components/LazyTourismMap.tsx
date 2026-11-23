import { lazy, Suspense } from "react";
import { useTourism } from "../content";
import type { ComponentProps } from "react";

const Map = lazy(() => import("./TourismMap").then((module) => ({ default: module.TourismMap })));

/** Lazy wrapper: keeps MapLibre out of the initial bundle. */
export function LazyTourismMap(props: ComponentProps<typeof Map>) {
  const c = useTourism();
  return (
    <Suspense
      fallback={
        <div className="grid h-[480px] w-full place-items-center rounded-lg border border-border bg-surface text-2xs text-fg-subtle" aria-busy="true">
          {c.map.title}…
        </div>
      }
    >
      <Map {...props} />
    </Suspense>
  );
}