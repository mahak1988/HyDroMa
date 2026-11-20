import { Link } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { Button, Card, CardBody } from "@eco-nojin/ui";

/**
 * Real 404. Previously an unknown path silently rendered the home page, which
 * makes a broken link indistinguishable from a valid one.
 */
export function NotFoundPage() {
  const { t } = useI18n();
  return (
    <Card>
      <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
        <p className="text-5xl font-semibold tracking-tight text-fg-subtle">404</p>
        <h1 className="text-lg font-semibold text-fg">{t("common.notFoundTitle")}</h1>
        <p className="max-w-sm text-xs text-fg-muted">{t("common.notFoundBody")}</p>
        <Link to="/">
          <Button variant="primary">{t("common.backHome")}</Button>
        </Link>
      </CardBody>
    </Card>
  );
}