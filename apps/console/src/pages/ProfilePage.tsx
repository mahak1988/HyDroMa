import { Link } from "react-router-dom";
import { appPath } from "@eco-nojin/configuration";
import { ROLE_DEFINITIONS, ROLE_PERMISSIONS, type OrganizationRole } from "@eco-nojin/domain-types";
import { useI18n, type TranslationKey } from "@eco-nojin/i18n";
import { Badge, Button, Card, CardBody, CardHeader } from "@eco-nojin/ui";
import { formatJalali } from "@eco-nojin/utilities";
import { PageHeader } from "../app/layouts/PageHeader";
import { useSession } from "../session/DemoSession";

const ROLE_TONE: Record<OrganizationRole, "primary" | "info" | "neutral" | "warning" | "success"> = {
  owner: "primary",
  admin: "info",
  manager: "warning",
  member: "neutral",
  viewer: "neutral",
};

const STATUS_TONE: Record<string, "success" | "danger" | "warning"> = {
  active: "success",
  suspended: "danger",
  invited: "warning",
};

function initials(name: string): string {
  return name
    .split(/\s+/u)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join("");
}

/**
 * Identity page #2 of the 120-page map.
 *
 * It reads the same demo session the shell uses; when an identity provider lands
 * (D-04) only the session source changes. Dates use the vendored Jalaali
 * converter so Persian users see the Persian calendar, not a Gregorian string.
 */
export function ProfilePage() {
  const { t, locale } = useI18n();
  const { user, memberships, activeOrg, role } = useSession();

  const roleLabel = (value: OrganizationRole): string => {
    const definition = ROLE_DEFINITIONS.find((item) => item.key === value);
    return definition ? t(definition.labelKey as TranslationKey) : value;
  };

  return (
    <div>
      <PageHeader
        title={t("profile.title")}
        subtitle={t("profile.subtitle")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="warning" dot>
              {t("profile.demoNote")}
            </Badge>
            <Link to="/security">
              <Button variant="secondary" size="sm">
                {t("profile.openSecurity")}
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={t("profile.identity")} subtitle={user.email} />
          <CardBody>
            <div className="flex flex-wrap items-start gap-5">
              <span
                aria-hidden="true"
                className="grid size-16 shrink-0 place-items-center rounded-xl bg-primary text-xl font-semibold text-primary-fg"
              >
                {initials(user.name)}
              </span>
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <p className="text-lg font-semibold text-fg">{user.name}</p>
                  <p className="text-2xs text-fg-muted">{t("profile.subtitle")}</p>
                </div>
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-2xs text-fg-subtle">{t("people.status")}</dt>
                    <dd className="mt-1">
                      <Badge tone={STATUS_TONE[user.status] ?? "neutral"} dot>
                        {t(`status.${user.status}` as TranslationKey)}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-2xs text-fg-subtle">{t("profile.activeOrg")}</dt>
                    <dd className="mt-1 text-sm">{activeOrg.name}</dd>
                  </div>
                  <div>
                    <dt className="text-2xs text-fg-subtle">{t("profile.memberSince")}</dt>
                    <dd className="mt-1 text-sm">{formatJalali(user.createdAt, locale)}</dd>
                  </div>
                  <div>
                    <dt className="text-2xs text-fg-subtle">{t("profile.lastActive")}</dt>
                    <dd className="mt-1 text-sm">
                      {user.lastActiveAt ? formatJalali(user.lastActiveAt, locale) : "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t("profile.roles")} subtitle={roleLabel(role)} />
          <CardBody>
            <ul className="space-y-2">
              {ROLE_DEFINITIONS.map((definition) => {
                const active = definition.key === role;
                const count = ROLE_PERMISSIONS[definition.key].length;
                return (
                  <li
                    key={definition.key}
                    className={`flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-xs ${
                      active ? "border-primary/40 bg-primary-soft" : "border-border"
                    }`}
                  >
                    <span className={active ? "font-semibold text-primary-soft-fg" : "text-fg"}>
                      {t(definition.labelKey as TranslationKey)}
                    </span>
                    <Badge tone={ROLE_TONE[definition.key]}>
                      {count} {t("profile.permissions")}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title={t("profile.memberships")} subtitle={`${memberships.length}`} />
          <CardBody className="!p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-2 text-start">
                    <th className="px-4 py-2 text-start font-medium text-fg-subtle">{t("nav.organizations")}</th>
                    <th className="px-4 py-2 text-start font-medium text-fg-subtle">{t("people.role")}</th>
                    <th className="px-4 py-2 text-start font-medium text-fg-subtle">{t("profile.country")}</th>
                    <th className="px-4 py-2 text-start font-medium text-fg-subtle">{t("profile.memberSince")}</th>
                  </tr>
                </thead>
                <tbody>
                  {memberships.map(({ organization, membership }) => (
                    <tr key={organization.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <span className="font-medium text-fg">{organization.name}</span>
                        {organization.id === activeOrg.id ? (
                          <Badge tone="success">{t("profile.activeOrg")}</Badge>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={ROLE_TONE[membership.role]}>{roleLabel(membership.role)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-fg-muted">{organization.country}</td>
                      <td className="px-4 py-3 text-fg-muted">{formatJalali(organization.createdAt, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title={t("profile.preferences")} subtitle={t("profile.openFinance")} />
          <CardBody className="flex flex-wrap items-center gap-3">
            <Link to="/security" className="rounded-md border border-border px-3 py-2 text-xs text-fg hover:bg-surface-2">
              {t("profile.openSecurity")} ←
            </Link>
            <a
              href={appPath("platform") + "finance/"}
              className="rounded-md border border-border px-3 py-2 text-xs text-fg hover:bg-surface-2"
            >
              {t("profile.openFinance")} ←
            </a>
            <a
              href={appPath("platform") + "landscapes/economy"}
              className="rounded-md border border-border px-3 py-2 text-xs text-fg hover:bg-surface-2"
            >
              {t("profile.economy")} ←
            </a>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
