import { useI18n } from "@eco-nojin/i18n";
import { Badge, Button, Card, CardBody, CardHeader, Input } from "@eco-nojin/ui";
import { formatJalali } from "@eco-nojin/utilities";
import { PageHeader } from "../app/layouts/PageHeader";

/**
 * Identity page #5 of the 120-page map.
 *
 * Everything here is intentionally read-only: no identity provider is connected
 * (owner decision D-04), so the page must not pretend that a password can be
 * changed or a session revoked. Each blocked action explains why.
 */
const SESSIONS = [
  {
    id: "s-1",
    device: "Chrome · Windows",
    location: "تهران، ایران",
    lastSeen: "2026-11-20T06:10:00.000Z",
    current: true,
  },
  {
    id: "s-2",
    device: "Safari · iPhone",
    location: "کرج، ایران",
    lastSeen: "2026-11-18T14:32:00.000Z",
    current: false,
  },
];

const AUDIT = [
  { id: "a-1", at: "2026-11-20T06:10:00.000Z", action: "ورود موفق", source: "Chrome · Windows" },
  { id: "a-2", at: "2026-11-19T09:04:00.000Z", action: "تغییر نقش کاربر", source: "usr-nadia" },
  { id: "a-3", at: "2026-11-17T18:41:00.000Z", action: "درخواست عضویت در گروه منظر", source: "usr-omid" },
];

/** Time only: the date is already shown in the Persian calendar. */
function timeOnly(value: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === "fa" ? "fa-IR" : locale === "ar" ? "ar-EG" : "en-US", {
    timeStyle: "short",
  }).format(new Date(value));
}

export function SecurityPage() {
  const { t, locale } = useI18n();

  return (
    <div>
      <PageHeader
        title={t("security.title")}
        subtitle={t("security.subtitle")}
        actions={
          <Badge tone="warning" dot>
            {t("profile.demoNote")}
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title={t("security.password")} subtitle={t("security.passwordBody")} />
          <CardBody className="space-y-4">
            <label className="block space-y-1">
              <span className="text-2xs text-fg-subtle">{t("security.password")}</span>
              <Input id="current-password" type="password" value="••••••••" disabled readOnly />
            </label>
            <label className="block space-y-1">
              <span className="text-2xs text-fg-subtle">{t("security.newPassword")}</span>
              <Input id="new-password" type="password" value="" disabled readOnly />
            </label>
            <Button variant="secondary" size="sm" disabled>
              {t("security.change")}
            </Button>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title={t("security.twoFactor")}
            subtitle={t("security.twoFactorBody")}
            action={<Badge tone="neutral">{t("security.disabled")}</Badge>}
          />
          <CardBody>
            <Button variant="secondary" size="sm" disabled>
              {t("security.enable")}
            </Button>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title={t("security.sessions")} subtitle={`${SESSIONS.length}`} />
          <CardBody className="!p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface-2">
                    <th className="px-4 py-2 text-start font-medium text-fg-subtle">{t("security.sessionDevice")}</th>
                    <th className="px-4 py-2 text-start font-medium text-fg-subtle">{t("profile.country")}</th>
                    <th className="px-4 py-2 text-start font-medium text-fg-subtle">{t("security.sessionLastSeen")}</th>
                    <th className="px-4 py-2 text-start font-medium text-fg-subtle" aria-label={t("security.revoke")} />
                  </tr>
                </thead>
                <tbody>
                  {SESSIONS.map((session) => (
                    <tr key={session.id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <span className="font-medium text-fg" dir="ltr">
                          {session.device}
                        </span>
                        {session.current ? <Badge tone="success">{t("security.current")}</Badge> : null}
                      </td>
                      <td className="px-4 py-3 text-fg-muted">{session.location}</td>
                      <td className="px-4 py-3 text-fg-muted">
                        {formatJalali(session.lastSeen, locale)} · {timeOnly(session.lastSeen, locale)}
                      </td>
                      <td className="px-4 py-3 text-end">
                        <Button variant="ghost" size="sm" disabled>
                          {t("security.revoke")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title={t("security.audit")} subtitle={t("security.auditBody")} />
          <CardBody>
            <ol className="space-y-3">
              {AUDIT.map((event) => (
                <li key={event.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs">
                  <span className="w-40 shrink-0 text-fg-muted">
                    {formatJalali(event.at, locale)} · {timeOnly(event.at, locale)}
                  </span>
                  <span className="font-medium text-fg">{event.action}</span>
                  <span className="text-fg-subtle" dir="ltr">
                    {event.source}
                  </span>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
