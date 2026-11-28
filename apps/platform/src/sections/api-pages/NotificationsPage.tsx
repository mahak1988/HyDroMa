import { useI18n } from "@eco-nojin/i18n";
import { Badge, Button, Card, CardBody, CardHeader } from "@eco-nojin/ui";
import { ApiBoundary, ApiEmpty } from "../../components/ApiState";
import { useMarkNotificationsSeen, useNotifications } from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };

const L = {
  eyebrow: { fa: "دادهٔ واقعی از API", en: "Live data from the API", ar: "بيانات حية من الـ API" },
  title: { fa: "مرکز اعلان‌ها", en: "Notifications", ar: "الإشعارات" },
  markSeen: { fa: "علامت‌گذاری به‌عنوان خوانده‌شده", en: "Mark all as read", ar: "تعليم الكل كمقروء" },
  unread: { fa: "خوانده‌نشده", en: "unread", ar: "غير مقروء" },
  source: { fa: "منشأ: گزارش ممیزی سازمان", en: "Source: organization audit log", ar: "المصدر: سجل تدقيق المؤسسة" },
};

/** Real notification centre backed by the audit-derived notifications endpoint. */
export function NotificationsPage() {
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const query = useNotifications();
  const markSeen = useMarkNotificationsSeen();

  return (
    <div className="pl-stack">
      <header className="pl-pageHead">
        <div>
          <p className="pl-eyebrow">{l(L.eyebrow)}</p>
          <h1>{l(L.title)}</h1>
        </div>
        <div className="pl-pageActions">
          <Button
            variant="secondary"
            size="sm"
            disabled={markSeen.isPending || (query.data?.unread ?? 0) === 0}
            onClick={() => markSeen.mutate()}
          >
            {l(L.markSeen)}
          </Button>
        </div>
      </header>

      <ApiBoundary state={query}>
        {(query.data?.items.length ?? 0) === 0 ? (
          <ApiEmpty />
        ) : (
          <Card>
            <CardHeader
              title={l(L.title)}
              subtitle={`${query.data!.unread} ${l(L.unread)} · ${l(L.source)}`}
            />
            <CardBody className="!p-0">
              <ul className="pl-list pl-list--rows">
                {query.data!.items.map((item) => (
                  <li key={item.id}>
                    <span className="pl-dot" aria-hidden="true" />
                    <span className="pl-listTitle">{item.action}</span>
                    <span className="pl-listMeta">
                      {item.entity} · {item.at}
                    </span>
                    {item.unread ? <Badge tone="info">{l(L.unread)}</Badge> : null}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        )}
      </ApiBoundary>
    </div>
  );
}