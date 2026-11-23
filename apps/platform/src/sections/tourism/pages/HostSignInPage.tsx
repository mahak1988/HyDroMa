import { Link } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { Button, Card, CardBody } from "@eco-nojin/ui";
import { AuthPanel, type AuthPanelLabels } from "@eco-nojin/auth-client";
import { useTourism } from "../content";
import { useTourismSession } from "../session/TourismSession";
import { tourismPath } from "../lib/paths";

/**
 * Host sign-in. Rendered inside `TourismLayout`, so it must not wrap itself in
 * the layout.
 *
 * Sign-in is real: the panel talks to the Eco Nojin API through the shared
 * auth catalog strings. Host access unlocks only when the signed-in user's
 * active organization is a registered business — the server re-checks.
 */
export function HostSignInPage() {
  const { t } = useI18n();
  const c = useTourism();
  const { session, displayName, isHost } = useTourismSession();

  const labels: AuthPanelLabels = {
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
  };

  return (
    <div className="mx-auto max-w-md py-10">
      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-lg font-semibold text-fg">{c.host.title}</h2>
          {session.status === "authenticated" ? (
            isHost ? (
              <p className="text-xs text-fg-muted">
                {t("auth.signedInAs", { name: displayName })}
              </p>
            ) : (
              <p className="text-xs text-fg-muted">{c.host.demoNote}</p>
            )
          ) : (
            <AuthPanel labels={labels} />
          )}
          <div className="flex flex-wrap items-center gap-2">
            <Link to={tourismPath("/")}>
              <Button variant="ghost">{c.ui.backHome}</Button>
            </Link>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
