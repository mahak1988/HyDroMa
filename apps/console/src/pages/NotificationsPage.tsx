import { useState } from "react";
import { Bell, CheckCheck, Inbox } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Card, CardBody, CardHeader, Skeleton } from "@eco-nojin/ui";
import { PageHeader } from "../app/layouts/PageHeader";
import { fetchNotifications, type DemoNotification } from "../services/demo-notifications";

export function NotificationsPage() {
  const { t, format } = useI18n();
  const [readIds, setReadIds] = useState<string[]>([]);
  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: ({ signal }) => fetchNotifications(signal),
  });

  const items = query.data ?? [];
  const isRead = (item: DemoNotification) => item.read || readIds.includes(item.id);
  const unread = items.filter((item) => !isRead(item)).length;

  const markAll = () => setReadIds(items.map((item) => item.id));

  return (
    <div>
      <PageHeader
        title={t("notifications.title")}
        subtitle={t("notifications.subtitle")}
        actions={
          <Button variant="secondary" onClick={markAll} disabled={unread === 0} icon={<CheckCheck className="size-4" aria-hidden="true" />}>
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
              {items.map((item: DemoNotification) => (
                <li key={item.id} className="flex items-start gap-3 py-3">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 grid size-8 place-items-center rounded-full ${
                      item.read ? "bg-surface-2 text-fg-subtle" : "bg-primary-soft text-primary-soft-fg"
                    }`}
                  >
                    <Bell className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-fg">{t(item.titleKey)}</p>
                    <p className="text-xs text-fg-muted">{t(item.bodyKey)}</p>
                    <p className="mt-0.5 text-2xs text-fg-subtle">{format.dateTime(item.time)}</p>
                  </div>
                  {isRead(item) ? null : (
                    <Badge tone="primary" dot>
                      {t("notifications.unread")}
                    </Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}