import { createModuleRegistry, type ModuleDescriptor } from "@eco-nojin/app-shell";
import { SECTIONS, pagesOf, type SectionId } from "../content/pages";

/**
 * Platform modules (Phase 2 wiring).
 *
 * Each section becomes a module registered through the shared shell's
 * module registry, with a permission gate (`preRegisterCheck`). Routes are
 * still generated from `content/pages.ts` (single source of truth); this
 * registry adds the modular/permission-gated layer on top without changing
 * routing behaviour.
 */
export function buildPlatformModules(): ModuleDescriptor[] {
  return SECTIONS.map((section) => ({
    id: section.id,
    label: section.label.en,
    routes: [],
    navItems: pagesOf(section.id as SectionId)
      .filter((page) => page.path !== "")
      .map((page) => ({ to: `/${page.path}`, label: page.title.en })),
    preRegisterCheck: () => true,
  }));
}

export function createPlatformRegistry() {
  const registry = createModuleRegistry();
  for (const module of buildPlatformModules()) registry.register(module);
  return registry;
}