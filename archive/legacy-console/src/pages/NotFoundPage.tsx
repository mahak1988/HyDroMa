import { useNavigate } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { Button, Card, CardBody } from "@eco-nojin/ui";

export function NotFoundPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-lg">
      <Card>
        <CardBody className="space-y-4 py-10 text-center">
          <p className="text-4xl font-semibold text-fg">404</p>
          <h1 className="text-lg font-semibold text-fg">{t("common.notFoundTitle")}</h1>
          <p className="text-sm text-fg-muted">{t("common.notFoundBody")}</p>
          <Button variant="primary" onClick={() => navigate("/")}>
            {t("common.backHome")}
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}