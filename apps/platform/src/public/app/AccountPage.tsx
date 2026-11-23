import { useMemo } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@eco-nojin/frontend-core";
import { ConsoleSessionProvider } from "../../sections/landscape/admin/session/Session";
import { ProfilePage } from "../../sections/landscape/admin/pages/ProfilePage";
import { SecurityPage } from "../../sections/landscape/admin/pages/SecurityPage";

/**
 * Public-core account pages (`/profile`, `/security`).
 *
 * They reuse the real console pages and session; the platform root already owns
 * the RealSessionProvider and locale/theme, so only the query client is added.
 */
export function AccountPage({ kind }: { kind: "profile" | "security" }) {
  const queryClient = useMemo(() => createQueryClient(), []);
  return (
    <QueryClientProvider client={queryClient}>
      <ConsoleSessionProvider embedded>
        {kind === "profile" ? <ProfilePage /> : <SecurityPage />}
      </ConsoleSessionProvider>
    </QueryClientProvider>
  );
}