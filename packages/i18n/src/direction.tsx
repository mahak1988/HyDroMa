import { createContext, useContext, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { languageDirection, type LocaleDirection } from "./registry";

/**
 * Direction provider — one place that decides reading direction for a subtree.
 *
 * The I18nProvider already writes `dir` on <html> (which CSS logical properties
 * and `rtl-flip` depend on). This provider adds the *programmatic* half: any
 * component that must branch on direction (map controls, chart axes, drag
 * handles, arrow-key navigation) reads it from context instead of re-deriving it
 * from the DOM, and any subtree that must not follow the document (an embedded
 * always-LTR map canvas) can pin its own direction.
 */
type DirectionValue = {
  direction: LocaleDirection;
  isRtl: boolean;
};

const DirectionContext = createContext<DirectionValue>({ direction: "ltr", isRtl: false });

export function DirectionProvider({
  children,
  direction,
  /** When set, mirror the document only if it matches this locale's direction. */
  locale,
}: {
  children: ReactNode;
  direction?: LocaleDirection;
  locale?: string | null;
}) {
  const resolved = useMemo<DirectionValue>(() => {
    const value = direction ?? languageDirection(locale ?? undefined);
    return { direction: value, isRtl: value === "rtl" };
  }, [direction, locale]);

  useEffect(() => {
    if (direction) return;
    if (typeof document === "undefined") return;
    document.documentElement.dir = resolved.direction;
  }, [direction, resolved.direction]);

  return <DirectionContext.Provider value={resolved}>{children}</DirectionContext.Provider>;
}

export function useDirection(): DirectionValue {
  return useContext(DirectionContext);
}

/** Convenience for one-off mirroring decisions outside React. */
export function mirrorClass(isRtl: boolean, ltr: string, rtl: string): string {
  return isRtl ? rtl : ltr;
}

export type { DirectionValue };