import { Link } from "react-router-dom";
import { ArrowLeft, Boxes, FileCheck2, Languages, Layers } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import { Badge, Card, CardBody, CardHeader } from "@eco-nojin/ui";
import { PageHeader } from "../app/layouts/PageHeader";
import { DemoFixtures } from "../permissions/fixture";

type Pillar = {
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  icon: typeof Layers;
};

const pillars: Pillar[] = [
  { titleKey: "home.foundation", bodyKey: "home.foundationBody", icon: Layers },
  { titleKey: "home.independence", bodyKey: "home.independenceBody", icon: Boxes },
  { titleKey: "home.contracts", bodyKey: "home.contractsBody", icon: FileCheck2 },
  { titleKey: "home.rtl", bodyKey: "home.rtlBody", icon: Languages },
];

export function HomePage() {
  const { t, format, locale, tp } = useI18n();
  const unread = DemoFixtures.notifications.filter((item) => !item.read).length;

  return (
    <div>
      <PageHeader
        title={t("home.title")}
        subtitle={t("home.subtitle")}
        actions={
          <Link
            to="/components"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-fg shadow-e1 transition-colors hover:bg-primary-hover"
          >
            <ArrowLeft className="size-4 rtl-flip" aria-hidden="true" />
            {t("home.cta")}
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Badge tone="primary">{t("common.workspace")}</Badge>
        <Badge tone="neutral">
          <span dir="ltr">{locale}</span>
        </Badge>
        <Badge tone="neutral">
          {t("common.version")} <span className="numeric">{DemoFixtures.version}</span>
        </Badge>
        <Badge tone="warning">{t("common.demoNote")}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {pillars.map((pillar) => (
          <Card key={pillar.titleKey}>
            <CardBody className="space-y-2">
              <span className="grid size-9 place-items-center rounded-lg bg-primary-soft text-primary-soft-fg">
                <pillar.icon className="size-4" aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold text-fg">{t(pillar.titleKey)}</p>
              <p className="text-xs leading-relaxed text-fg-muted">{t(pillar.bodyKey)}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="mt-4">
        <CardHeader
          title={t("common.notifications")}
          subtitle={t("notifications.subtitle")}
          action={
            <Link
              to="/notifications"
              className="rounded-md px-2 py-1 text-2xs font-medium text-primary hover:underline"
            >
              {t("common.notifications")}
            </Link>
          }
        />
        <CardBody className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md bg-surface-2 p-3">
            <p className="text-2xs text-fg-subtle">{t("settings.locale")}</p>
            <p className="mt-1 text-sm font-medium text-fg">
              <span dir="ltr">{locale}</span> · {format.date(new Date())}
            </p>
          </div>
          <div className="rounded-md bg-surface-2 p-3">
            <p className="text-2xs text-fg-subtle">{t("common.notifications")}</p>
            <p className="mt-1 text-sm font-medium text-fg">
              {tp("plural.notifications", unread)}
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}