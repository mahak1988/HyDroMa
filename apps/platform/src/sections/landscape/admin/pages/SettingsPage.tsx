import { useI18n } from "@eco-nojin/i18n";
import { useTheme } from "@eco-nojin/frontend-core";
import type { ThemeMode } from "@eco-nojin/frontend-core";
import { Can, usePermissions } from "@eco-nojin/frontend-core";
import { Badge, Button, Card, CardBody, CardHeader, Field, Radio, Select, Switch } from "@eco-nojin/ui";
import { useState } from "react";
import { PageHeader } from "../app/layouts/PageHeader";

export function SettingsPage() {
  const { t, locale, locales, setLocale, format } = useI18n();
  const { mode, setMode } = useTheme();
  const { isFixture } = usePermissions();
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");

  const themeOptions: Array<{ value: ThemeMode; label: string }> = [
    { value: "light", label: t("common.light") },
    { value: "dark", label: t("common.dark") },
    { value: "system", label: t("common.system") },
  ];

  return (
    <div>
      <PageHeader
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
        actions={<Badge tone="warning">{t("common.demoNote")}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={t("settings.appearance")} subtitle={t("settings.appearanceBody")} />
          <CardBody className="space-y-5">
            <fieldset className="space-y-2">
              <legend className="text-xs font-medium text-fg">{t("common.theme")}</legend>
              <div className="flex flex-wrap gap-4">
                {themeOptions.map((option) => (
                  <Radio
                    key={option.value}
                    name="theme"
                    value={option.value}
                    label={option.label}
                    checked={mode === option.value}
                    onChange={() => setMode(option.value)}
                  />
                ))}
              </div>
            </fieldset>

            <div className="flex items-start justify-between gap-4 border-t border-border pt-4">
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-fg">{t("settings.density")}</p>
                <p className="text-2xs text-fg-muted">
                  {density === "compact" ? t("settings.compact") : t("settings.comfortable")}
                </p>
              </div>
              <Switch
                checked={density === "compact"}
                onCheckedChange={(value) => setDensity(value ? "compact" : "comfortable")}
                label={t("settings.density")}
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t("common.language")} subtitle={t("settings.languageBody")} />
          <CardBody className="space-y-4">
            <Field label={t("settings.locale")} htmlFor="settings-locale">
              <Select
                id="settings-locale"
                value={locale}
                onChange={(event) => setLocale(event.target.value as typeof locale)}
              >
                {locales.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.nativeName} — {item.englishName}
                  </option>
                ))}
              </Select>
            </Field>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-md bg-surface-2 p-3">
                <dt className="text-2xs text-fg-subtle">{t("settings.timezone")}</dt>
                <dd className="mt-1 font-medium text-fg" dir="ltr">
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </dd>
              </div>
              <div className="rounded-md bg-surface-2 p-3">
                <dt className="text-2xs text-fg-subtle">{t("settings.calendar")}</dt>
                <dd className="mt-1 font-medium text-fg">{format.date(new Date())}</dd>
              </div>
            </dl>

            <p className="text-2xs text-fg-subtle">{t("settings.note")}</p>

            <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
              <Can
                permission="console.export"
                fallback={<Badge tone="neutral">{t("common.settings")}: console.export</Badge>}
              >
                <Button variant="secondary" icon={<span aria-hidden="true">⤓</span>}>
                  {t("common.save")}
                </Button>
              </Can>
              {isFixture ? <Badge tone="info">permission fixture</Badge> : null}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}