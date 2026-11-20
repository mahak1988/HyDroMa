import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "./maplibre-gl-worker.mjs?url";

let configured = false;

/**
 * Point MapLibre at the bundled worker asset.
 *
 * The worker is an unmodified MapLibre build artefact (BSD-3-Clause, see
 * NOTICE.md). Importing it with `?url` lets Vite emit it as a hashed asset, so
 * no app needs a duplicated copy in `public/`.
 */
export function configureSpatialWorker(): void {
  if (configured) return;
  setWorkerUrl(workerUrl);
  configured = true;
}

export function spatialWorkerUrl(): string {
  return workerUrl;
}