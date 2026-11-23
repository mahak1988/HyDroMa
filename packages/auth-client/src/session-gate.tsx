/**
 * Session gate: renders children only when the real session is authenticated.
 *
 * While the session is loading it shows a plain pending state; when signed out
 * it shows the AuthPanel (real sign-in / registration / invite acceptance).
 * Every workspace that requires an account wraps its content in this gate, so
 * "no demo session" is enforced structurally.
 */
import type { ReactNode } from "react";
import { AuthPanel, type AuthPanelLabels } from "./auth-panel";
import { useRealSession } from "./real-session";

export function SessionGate({
  labels,
  loadingLabel,
  children,
}: {
  labels: AuthPanelLabels;
  loadingLabel: string;
  children: ReactNode;
}) {
  const { status } = useRealSession();

  if (status === "loading") {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center text-sm opacity-80">
        {loadingLabel}
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <AuthPanel labels={labels} />
      </div>
    );
  }

  return <>{children}</>;
}
