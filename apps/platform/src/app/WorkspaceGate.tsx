import type { ReactNode } from "react";
import { SessionGate, type AuthPanelLabels } from "@eco-nojin/auth-client";
import { useI18n } from "@eco-nojin/i18n";

/**
 * Session gate for the specialised workspace (`/platform/*`).
 *
 * The architecture (AD-003) defines the workspace as an authenticated surface.
 * This gate fails closed: a guest sees the real sign-in panel instead of the
 * workspace, and the session cookie remains the single authority. It does not
 * create a second session mechanism and does not change backend semantics.
 *
 * It renders `children` directly when authenticated so the workspace keeps its
 * own single header/main/footer landmarks.
 */
export function WorkspaceGate({ children }: { children: ReactNode }) {
  const { t } = useI18n();

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
    <SessionGate labels={labels} loadingLabel={t("common.loading")}>
      {children}
    </SessionGate>
  );
}