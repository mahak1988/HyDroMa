import { useI18n } from "@eco-nojin/i18n";

import { useHydromaModels } from "../services/useHydromaModels";

/**
 * Read-only HyDroMA model discovery view. Distinguishes:
 *  - loading (contacting the service),
 *  - ready (real models with maturity + scientific status),
 *  - empty (service responded, no models),
 *  - unavailable (service unreachable / network / timeout),
 *  - error (invalid response).
 * Demo data is never shown here; this view is only real service data.
 */
export function ModelsPage() {
  const { t } = useI18n();
  const state = useHydromaModels();

  if (state.status === "loading") {
    return <LoadingState label={t("common.loading")} />;
  }
  if (state.status === "unavailable") {
    return <Notice tone="warning" title={t("hydroma.serviceUnavailable")} body={t("hydroma.serviceUnavailableBody")} />;
  }
  if (state.status === "error") {
    return <Notice tone="warning" title={t("hydroma.invalidResponse")} body={t("hydroma.serviceUnavailableBody")} />;
  }
  if (state.status === "empty") {
    return <Notice tone="neutral" title={t("common.emptyTitle")} body={t("hydroma.noModels")} />;
  }

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-fg">{t("hydroma.models")}</h1>
        <p className="text-xs text-fg-muted">{state.source}</p>
      </header>
      <ul className="grid gap-3 sm:grid-cols-2">
        {state.models.map((model) => (
          <li key={`${model.id}@${model.version}`} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-fg">{model.title ?? model.id}</span>
              <span className="numeric text-2xs text-fg-subtle">{model.version}</span>
            </div>
            <dl className="mt-2 space-y-1 text-2xs text-fg-muted">
              <div className="flex gap-2">
                <dt className="text-fg-subtle">{t("hydroma.maturity")}:</dt>
                <dd className="numeric">{model.maturity ?? "-"}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-fg-subtle">{t("hydroma.scientificStatus")}:</dt>
                <dd className="numeric">{model.scientific_status ?? "NOT_VALIDATED"}</dd>
              </div>
              {model.units && model.units.length > 0 ? (
                <div className="flex gap-2">
                  <dt className="text-fg-subtle">{t("hydroma.units")}:</dt>
                  <dd className="numeric">{model.units.join(", ")}</dd>
                </div>
              ) : null}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LoadingState({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-2 text-sm text-fg-muted">
      <span className="size-4 animate-spin rounded-full border-2 border-border border-t-primary" aria-hidden="true" />
      {label}
    </div>
  );
}

function Notice({ tone, title, body }: { tone: "warning" | "neutral"; title: string; body: string }) {
  const cls = tone === "warning" ? "border-warning-soft bg-warning-soft/40 text-warning-soft-fg" : "border-border bg-surface-2 text-fg-muted";
  return (
    <div className={`rounded-lg border p-4 text-sm ${cls}`}>
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-2xs">{body}</p>
    </div>
  );
}