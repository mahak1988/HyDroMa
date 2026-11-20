/**
 * Motion helpers.
 *
 * Two rules from the design system apply to every animation:
 *   1. respect `prefers-reduced-motion` — no exceptions;
 *   2. never animate layout properties — only transform and opacity.
 *
 * These helpers are DOM-only (no React) so any surface can use them and they can
 * be tested without a component tree.
 */

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export type ParallaxOptions = {
  /** Maximum translation in px. */
  max?: number;
  /** Called on every frame with the current offset (negative = scrolled past). */
  onUpdate?: (offset: number) => void;
};

/**
 * Attach a scroll-linked parallax to an element. Returns a cleanup function.
 * Under reduced motion it does nothing and returns a no-op.
 */
export function createParallax(element: HTMLElement | null, options: ParallaxOptions = {}): () => void {
  const { max = 80, onUpdate } = options;
  if (!element || prefersReducedMotion()) return () => {};

  let frame = 0;
  const update = (): void => {
    frame = 0;
    const rect = element.getBoundingClientRect();
    const scrolled = Math.max(-rect.top, 0);
    const offset = -Math.min(scrolled * 0.15, max);
    onUpdate?.(offset);
    element.style.setProperty("--parallax-y", `${offset.toFixed(1)}px`);
  };
  const schedule = (): void => {
    if (frame === 0) frame = window.requestAnimationFrame(update);
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  update();

  return () => {
    if (frame !== 0) window.cancelAnimationFrame(frame);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    element.style.removeProperty("--parallax-y");
  };
}

/**
 * Reveal elements once they enter the viewport. Without IntersectionObserver
 * everything is revealed immediately, so content is never hidden by a failure.
 */
export function revealOnScroll(elements: Iterable<HTMLElement>, className = "is-revealed"): () => void {
  const list = Array.from(elements);
  if (list.length === 0) return () => {};

  if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
    for (const element of list) element.classList.add(className);
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add(className);
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.15 },
  );

  for (const element of list) observer.observe(element);
  return () => observer.disconnect();
}