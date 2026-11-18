import { DemoFixtures } from "../permissions/fixture";

export type DemoNotification = (typeof DemoFixtures.notifications)[number];

/**
 * Async demo repository. Simulates latency so the shell's loading and error
 * states are exercised by real query lifecycle, without any backend.
 */
export async function fetchNotifications(signal?: AbortSignal): Promise<DemoNotification[]> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  return DemoFixtures.notifications;
}