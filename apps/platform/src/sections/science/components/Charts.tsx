/**
 * Deprecated local re-export.
 *
 * The chart primitives moved to `packages/ui` so every app shares one
 * implementation. This module remains only so that existing imports keep
 * resolving; new code should import from `@eco-nojin/ui` directly.
 */
export { BarChart, LineChart, Panel, Sparkline } from "@eco-nojin/ui";