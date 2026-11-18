import { useRouteError } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { Button, Card, CardBody } from "@eco-nojin/ui";

function describe(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Unknown route error";
}

export function RouteErrorPage() {
  const { t } = useI18n();
  const error = useRouteError();

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardBody className="space-y-4 text-center">
          <h1 className="text-lg font-semibold text-fg">{t("common.errorTitle")}</h1>
          <p className="text-sm text-fg-muted">{t("common.errorBody")}</p>
          <p className="rounded-md bg-surface-2 px-3 py-2 text-2xs text-fg-subtle" dir="ltr">
            {describe(error)}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="primary" onClick={() => window.location.reload()}>
              {t("common.retry")}
            </Button>
            <Button variant="secondary" onClick={() => window.location.assign("/")}>
              {t("common.backHome")}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}