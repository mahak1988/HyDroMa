import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthPanel, useRealSession, type AuthPanelLabels } from "@eco-nojin/auth-client";
import { useI18n } from "@eco-nojin/i18n";

/**
 * Real sign-in / registration on the public platform.
 *
 * Replaces the portal's static login page: the panel talks to the Eco Nojin
 * API through the same-origin /api path, and a successful session returns the
 * visitor to where they came from.
 */
export function AuthPage() {
  const { t } = useI18n();
  const { status } = useRealSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "authenticated") navigate("/", { replace: true });
  }, [status, navigate]);

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
    <div className="flex min-h-[60vh] items-center justify-center py-10">
      <AuthPanel labels={labels} />
    </div>
  );
}
