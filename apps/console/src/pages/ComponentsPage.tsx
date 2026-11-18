import { useState } from "react";
import { Plus, Save } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Dialog,
  Field,
  Input,
  Select,
  Skeleton,
  Table,
  Tabs,
  TBody,
  Td,
  Th,
  THead,
  Tooltip,
  Tr,
  useToast,
} from "@eco-nojin/ui";
import { PageHeader } from "../app/layouts/PageHeader";

const rows = [
  { id: "LND-001", name: "Karaj watershed", statusKey: "components.statusActive" as const },
  { id: "LND-002", name: "Taleghan rangeland", statusKey: "components.statusReview" as const },
  { id: "LND-003", name: "Kondar village", statusKey: "components.statusActive" as const },
];

export function ComponentsPage() {
  const { t } = useI18n();
  const { push } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checked, setChecked] = useState(true);

  return (
    <div>
      <PageHeader title={t("components.title")} subtitle={t("components.subtitle")} />

      <div className="space-y-4">
        <Card>
          <CardHeader title={t("components.buttons")} />
          <CardBody className="flex flex-wrap items-center gap-3">
            <Button variant="primary" icon={<Plus className="size-4" aria-hidden="true" />}>
              {t("common.save")}
            </Button>
            <Button variant="secondary" icon={<Save className="size-4" aria-hidden="true" />}>
              {t("common.save")}
            </Button>
            <Button variant="ghost">{t("common.cancel")}</Button>
            <Button variant="danger">{t("common.close")}</Button>
            <Button variant="primary" loading>
              {t("common.loading")}
            </Button>
            <Button variant="secondary" disabled>
              {t("common.save")}
            </Button>
            <Tooltip label={t("common.search")}>
              <Button variant="ghost" aria-label={t("common.search")}>
                ?
              </Button>
            </Tooltip>
          </CardBody>
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title={t("components.formControls")} />
            <CardBody className="space-y-4">
              <Field label={t("settings.locale")} htmlFor="demo-input">
                <Input id="demo-input" defaultValue="Karaj" />
              </Field>
              <Field label={t("common.search")} htmlFor="demo-select" hint={t("common.searchPlaceholder")}>
                <Select id="demo-select" defaultValue="fa">
                  <option value="fa">فارسی</option>
                  <option value="en">English</option>
                </Select>
              </Field>
              <Checkbox
                label={t("notifications.markAll")}
                checked={checked}
                onChange={(event) => setChecked(event.target.checked)}
              />
              <Alert tone="warning" title={t("common.demoNote")} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t("components.dataDisplay")} />
            <CardBody className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="primary">{t("home.foundation")}</Badge>
                <Badge tone="success" dot>
                  {t("common.settings")}
                </Badge>
                <Badge tone="warning">{t("common.theme")}</Badge>
                <Badge tone="neutral">v0.1.0</Badge>
              </div>
              <div className="flex items-center gap-3">
                <Avatar name="Nadia Rahimi" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
              <Tabs
                label={t("components.dataDisplay")}
                items={[
                  {
                    id: "one",
                    label: t("common.save"),
                    content: <p className="text-sm text-fg-muted">{t("home.contractsBody")}</p>,
                  },
                  {
                    id: "two",
                    label: t("common.settings"),
                    content: <p className="text-sm text-fg-muted">{t("home.independenceBody")}</p>,
                  },
                ]}
              />
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader
            title={t("components.dataDisplay")}
            action={
              <Button variant="secondary" onClick={() => setDialogOpen(true)}>
                {t("common.openMenu")}
              </Button>
            }
          />
          <CardBody>
            <Table caption={t("components.dataDisplay")}>
              <THead>
                <tr>
                  <Th>{t("common.version")}</Th>
                  <Th>{t("settings.locale")}</Th>
                  <Th>{t("common.settings")}</Th>
                </tr>
              </THead>
              <TBody>
                {rows.map((row) => (
                  <Tr key={row.id}>
                    <Td className="text-2xs text-fg-subtle" dir="ltr">
                      {row.id}
                    </Td>
                    <Td className="font-medium text-fg">{row.name}</Td>
                    <Td>
                      <Badge tone={row.statusKey === "components.statusActive" ? "success" : "warning"} dot>
                        {t(row.statusKey)}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          </CardBody>
        </Card>
      </div>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={t("common.settings")}
        description={t("common.demoNote")}
        footer={<Button variant="primary" onClick={() => setDialogOpen(false)}>{t("common.close")}</Button>}
      >
        <p className="text-sm text-fg-muted">{t("settings.note")}</p>
        <div className="mt-3">
          <Button
            variant="secondary"
            onClick={() => {
              setDialogOpen(false);
              push({ title: t("common.save"), description: t("common.demoNote"), tone: "success" });
            }}
          >
            {t("common.save")}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}