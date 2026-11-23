import { Link } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { fieldPath } from "../lib/paths";

export function HomePage() {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-fg">{t("apps.field.homeTitle" as never)}</h1>
      <p className="text-sm text-fg-muted">{t("apps.field.body" as never)}</p>
      <div className="flex gap-3">
        <Link to={fieldPath("/survey")} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-fg">{t("apps.field.surveyTitle" as never)}</Link>
        <Link to={fieldPath("/map")} className="rounded-md border border-border px-4 py-2 text-sm text-fg">{t("apps.field.mapTitle" as never)}</Link>
      </div>
    </div>
  );
}