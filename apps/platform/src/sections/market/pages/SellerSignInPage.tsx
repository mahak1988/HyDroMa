import { Link } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { Button, Card, CardBody } from "@eco-nojin/ui";
import { AuthPanel } from "@eco-nojin/auth-client";
import { useMarketSession } from "../session/MarketSession";
import { marketPath } from "../lib/paths";

/**
 * Seller sign-in gate. Rendered inside `MarketLayout`, so it must not wrap
 * itself in the layout.
 *
 * Sign-in is real: the panel talks to the Eco Nojin API. Seller access unlocks
 * only when the signed-in user's organization is a registered seller — the
 * server re-checks every request.
 */
export function SellerSignInPage() {
  const { t } = useI18n();
  const { isSeller, displayName, session } = useMarketSession();

  return (
    <div className="mx-auto max-w-md py-10">
      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-lg font-semibold text-fg">{t("market.sellerSignInTitle")}</h2>
          {session.status === "authenticated" ? (
            isSeller ? (
              <p className="text-xs text-fg-muted">{t("market.sellerSignInBody")}</p>
            ) : (
              <p className="text-xs text-fg-muted">{t("market.sellerRequired")}</p>
            )
          ) : (
            <AuthPanel
              labels={{
                loginTitle: t("auth.loginTitle"),
                registerTitle: t("auth.registerTitle"),
                inviteTitle: t("auth.inviteTitle"),
                email: t("auth.email"),
                password: t("auth.password"),
                name: t("auth.name"),
                organizationName: t("auth.organizationName"),
                organizationOptional: t("auth.organizationOptional"),
                inviteToken: t("auth.inviteToken"),
                submitLogin: t("auth.submitLogin"),
                submitRegister: t("auth.submitRegister"),
                submitInvite: t("auth.submitInvite"),
                switchToRegister: t("auth.switchToRegister"),
                switchToLogin: t("auth.switchToLogin"),
                switchToInvite: t("auth.switchToInvite"),
                submitting: t("auth.submitting"),
                passwordHint: t("auth.passwordHint"),
                modeLogin: t("auth.modeLogin"),
                modeRegister: t("auth.modeRegister"),
                modeInvite: t("auth.modeInvite"),
              }}
            />
          )}
          {session.status === "authenticated" ? (
            <p className="text-xs text-fg-muted">
              {t("auth.signedInAs", { name: displayName })}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <Link to={marketPath("/")}>
              <Button variant="ghost">{t("common.backHome")}</Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
