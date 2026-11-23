import type { ReactNode } from "react";

/**
 * Module registry (Phase 2, pattern from directus modules/index.ts).
 *
 * An app registers modules with a `preRegisterCheck(user, permissions)` gate;
 * only modules passing the gate contribute routes/nav. The shell never imports
 * app code; apps push modules in.
 */
export type ModuleDescriptor = {
  id: string;
  label: string;
  /** Routes contributed by this module (path + element). */
  routes: Array<{ path: string; element: ReactNode }>;
  /** Nav items contributed by this module. */
  navItems?: Array<{ to: string; label: string; icon?: ReactNode; permission?: string }>;
  /** Permission gate evaluated before registration. */
  preRegisterCheck?: (ctx: { permissions: Record<string, boolean> }) => boolean;
};

export type ModuleRegistry = {
  register: (module: ModuleDescriptor, ctx?: { permissions: Record<string, boolean> }) => boolean;
  list: () => ModuleDescriptor[];
  routes: () => ModuleDescriptor["routes"];
  navItems: () => NonNullable<ModuleDescriptor["navItems"]>;
  clear: () => void;
};

export function createModuleRegistry(): ModuleRegistry {
  const modules: ModuleDescriptor[] = [];
  return {
    register: (module, ctx) => {
      if (module.preRegisterCheck && !module.preRegisterCheck({ permissions: ctx?.permissions ?? {} })) return false;
      modules.push(module);
      return true;
    },
    list: () => [...modules],
    routes: () => modules.flatMap((m) => m.routes),
    navItems: () => modules.flatMap((m) => m.navItems ?? []),
    clear: () => {
      modules.length = 0;
    },
  };
}