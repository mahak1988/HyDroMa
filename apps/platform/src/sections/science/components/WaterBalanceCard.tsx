import { useMemo } from "react";
import { computeWaterBalance } from "@eco-nojin/scientific";
import { useI18n, type TranslationKey } from "@eco-nojin/i18n";
import { Badge, Card, CardBody, CardHeader } from "@eco-nojin/ui";
import { useWorkspace } from "../app/WorkspaceContext";

/**
 * The first real scientific model in the product surface.
 *
 * It calls `@eco-nojin/scientific` — the same contract a future Python engine must
 * satisfy — and shows the result *with* its units, provenance and validation
 * state. The inputs are demo values for the selected study area, which is why the
 * card carries a NOT_VALIDATED badge and never claims a measurement.
 */
const DEMO_INPUTS = {
  periodDays: 30,
  precipitation: 120,
  irrigation: 45,
  runoff: 18,
  evapotranspiration: 130,
  deepPercolation: 6,
  initialStorage: 90,
};

export function WaterBalanceCard() {
  const { t, format } = useI18n();
  const { area } = useWorkspace();

  const result = useMemo(
    () => computeWaterBalance({ ...DEMO_INPUTS, areaHa: area.areaHa }),
    [area.areaHa],
  );

  if (!result.ok) {
    return (
      <Card className="mt-4">
        <CardHeader title={t("hydro.balance.title")} />
        <CardBody>
          <p className="text-sm text-danger">{result.errors.map((error) => `${error.field}:${error.code}`).join(", ")}</p>
        </CardBody>
      </Card>
    );
  }

  const { result: values, equation, model } = result;
  const tone = values.status === "surplus" ? "success" : values.status === "deficit" ? "danger" : "neutral";

  return (
    <Card className="mt-4">
      <CardHeader
        title={t("hydro.balance.title")}
        action={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone="warning" dot>
              {t("hydro.balance.notValidated")}
            </Badge>
            <Badge tone={tone}>{t(`hydro.balance.${values.status}` as TranslationKey)}</Badge>
          </span>
        }
      />
      <CardBody>
        <p className="text-2xs text-fg-subtle">{t("hydro.balance.subtitle")}</p>
        <p className="mt-3 font-mono text-xs text-fg-muted" dir="ltr">
          {equation.substitution}
        </p>

        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-2xs text-fg-subtle">{t("hydro.balance.storageChange")}</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {format.number(values.storageChangeMm)} mm
            </dd>
          </div>
          <div>
            <dt className="text-2xs text-fg-subtle">{t("hydro.balance.volume")}</dt>
            <dd className="text-lg font-semibold tabular-nums">
              {values.storageChangeM3 === null ? "—" : `${format.number(values.storageChangeM3)} m³`}
            </dd>
          </div>
          <div>
            <dt className="text-2xs text-fg-subtle">{t("hydro.balance.equation")}</dt>
            <dd className="font-mono text-xs" dir="ltr">
              {equation.formulaDisplay}
            </dd>
          </div>
        </dl>

        <p className="mt-4 text-2xs text-fg-subtle">
          {model.id} · v{model.version} · {model.validation.scientificValidation}
        </p>
      </CardBody>
    </Card>
  );
}