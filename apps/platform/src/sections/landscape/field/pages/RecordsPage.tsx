import { useObservations } from "../store/observations";
import { useI18n } from "@eco-nojin/i18n";
import { Button } from "@eco-nojin/ui";

export function RecordsPage() {
  const { t } = useI18n();
  const { observations, retry, remove } = useObservations();
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-fg">{t("apps.field.recordsTitle" as never)}</h1>
      {observations.length === 0 ? (
        <p className="text-sm text-fg-muted">{t("common.emptyTitle" as never)}</p>
      ) : (
        <ul className="space-y-2">
          {observations.map((o) => (
            <li key={o.id} className="rounded-md border border-border bg-surface p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium">{o.siteName}</span>
                <span className="text-xs text-fg-muted">{o.status}</span>
              </div>
              {o.notes ? <p className="mt-1 text-xs text-fg-muted">{o.notes}</p> : null}
              <div className="mt-2 flex gap-2">
                {o.status !== "synced" ? <Button size="sm" variant="ghost" onClick={() => retry(o.id)}>Retry</Button> : null}
                <Button size="sm" variant="ghost" onClick={() => remove(o.id)}>Remove</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}