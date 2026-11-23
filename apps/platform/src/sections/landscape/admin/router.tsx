import { Route, Routes } from "react-router-dom";
import "./styles/index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "@eco-nojin/frontend-core";
import { ConsoleSessionProvider } from "./session/Session";
import { ShellErrorBoundary } from "./app/ShellErrorBoundary";
import { AppShell } from "./app/layouts/AppShell";
import { HomePage } from "./pages/HomePage";
import { ComponentsPage } from "./pages/ComponentsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SecurityPage } from "./pages/SecurityPage";
import { SettingsPage } from "./pages/SettingsPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { OrganizationsPage } from "./features/identity/OrganizationsPage";
import { OrganizationDetailPage } from "./features/identity/OrganizationDetailPage";
import { UsersPage } from "./features/identity/UsersPage";
import { UserDetailPage } from "./features/identity/UserDetailPage";

/**
 * Administration section (lazy, internal to the platform SPA), mounted at
 * `/landscape/admin/*`. It reuses the console shell, identity features and real
 * session — the root RealSessionProvider is reused, never duplicated.
 */
export default function AdminSectionRouter() {
  return (
    <QueryClientProvider client={createQueryClient()}>
      <ConsoleSessionProvider embedded>
        <ShellErrorBoundary>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="components" element={<ComponentsPage />} />
              <Route
                path="organizations"
                handle={{ permissions: "org.read" }}
                element={<OrganizationsPage />}
              />
              <Route
                path="organizations/:id"
                handle={{ permissions: "org.read" }}
                element={<OrganizationDetailPage />}
              />
              <Route path="users" handle={{ permissions: "users.read" }} element={<UsersPage />} />
              <Route path="users/:id" handle={{ permissions: "users.read" }} element={<UserDetailPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="security" element={<SecurityPage />} />
              <Route
                path="settings"
                handle={{ permissions: "org.update", redirectTo: "/landscape/admin" }}
                element={<SettingsPage />}
              />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </ShellErrorBoundary>
      </ConsoleSessionProvider>
    </QueryClientProvider>
  );
}