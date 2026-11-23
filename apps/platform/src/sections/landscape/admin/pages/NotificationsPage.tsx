import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import { Badge, Button, Card, CardBody, CardHeader, Skeleton } from "@eco-nojin/ui";
import { PageHeader } from "../app/layouts/PageHeader";
import { useNotifications } from "../hooks/useConsoleData";

/**
 * Real notifications: the audit log of the caller's organizations, served by
 * the API. Marking all seen persists server-side (notification_state), so the
 * unread state survives reloads and devices.
 */
export function NotificationsPage() {
  const { t, format } = useI18n();
  const query = useNotifications();
  const items = query.data?.items ?? [];
  const unread = query.data?.unread ?? 0;

  return (
    <div>
      <PageHeader
        title={t("notifications.title")}
        subtitle={t("notifications.subtitle")}
        actions={
          <Button
            variant="secondary"
            onClick={() => query.markAllSeen.mutate()}
            disabled={unread === 0 || query.markAllSeen.isPending}
            icon={<CheckCheck className="size-4" aria-hidden="true" />}
          >
            {t("notifications.markAll")}
          </Button>
        }
      />

      <Card>
        <CardHeader
          title={t("notifications.title")}
          subtitle={t("notifications.subtitle")}
          action={
            <Badge tone={unread > 0 ? "primary" : "neutral"}>
              {format.number(unread)} {t("notifications.unread")}
            </Badge>
          }
        />
        <CardBody>
          {query.isPending ? (
            <div className="space-y-3" role="status" aria-label={t("common.loading")}>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : query.isError ? (
            <div role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger-soft-fg">
              {t("common.errorTitle")} — {t("common.retry")}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Inbox className="size-6 text-fg-subtle" aria-hidden="true" />
              <p className="text-sm font-medium text-fg">{t("notifications.empty")}</p>
              <p className="text-xs text-fg-muted">{t("notifications.emptyBody")}</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id} className="flex items-start gap-3 py-3">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 grid size-8 place-items-center rounded-full ${
                      item.unread ? "bg-primary-soft text-primary-soft-fg" : "bg-surface-2 text-fg-subtle"
                    }`}
                  >
                    <Bell className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fg" dir="ltr">
                      {item.action}
                    </p>
                    <p className="text-xs text-fg-muted">
                      {item.entity ?? ""}
                      {item.entityId ? ` · ${item.entityId}` : ""}
                    </p>
                    <p className="mt-0.5 text-2xs text-fg-subtle">{format.dateTime(item.at)}</p>
                  </div>
                  {item.unread ? (
                    <Badge tone="primary" dot>
                      {t("notifications.unread")}
                    </Badge>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
