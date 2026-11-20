import { Link } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { Button, Card, CardBody } from "@eco-nojin/ui";
import { useMarketSession } from "../session/MarketSession";

/**
 * Seller sign-in gate. Rendered inside `MarketLayout`, so it must not wrap
 * itself in the layout again.
 *
 * There is no identity service yet, so this page is honest about it: it offers
 * a demo sign-in that unlocks `/seller`. When the real OIDC adapter lands, this
 * becomes a redirect and nothing else changes.
 */
export function SellerSignInPage() {
  const { t } = useI18n();
  const { signInAsSeller } = useMarketSession();

  return (
    <div className="mx-auto max-w-md py-10">
      <Card>
        <CardBody className="space-y-4">
          <h1 className="text-lg font-semibold text-fg">{t("market.sellerSignInTitle")}</h1>
          <p className="text-xs text-fg-muted">{t("market.sellerSignInBody")}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={signInAsSeller}>
              {t("market.sellerSignInDemo")}
            </Button>
            <Link to="/">
              <Button variant="ghost">{t("common.backHome")}</Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}