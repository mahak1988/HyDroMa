import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import { usePermissions } from "@eco-nojin/frontend-core";
import { organizationCreateSchema, type OrganizationCreateInput } from "@eco-nojin/validation";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Dialog,
  EmptyState,
  Field,
  Input,
  Select,
  Skeleton,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  useToast,
} from "@eco-nojin/ui";
import { PageHeader } from "../../app/layouts/PageHeader";
import { identityRepository } from "../../data";
import { apiErrorMessage, useOrganizations } from "./queries";
import { adminPath } from "../../lib/paths";

type FormState = { name: string; slug: string; country: string; kind: OrganizationCreateInput["kind"] };

const EMPTY: FormState = { name: "", slug: "", country: "IR", kind: "community" };

function slugify(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export function OrganizationsPage() {
  const { t, format } = useI18n();
  const tr = (key: string) => t(key as TranslationKey);
  const { can } = usePermissions();

  const queryClient = useQueryClient();
  const { push } = useToast();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const organizations = useOrganizations();

  const mutation = useMutation({
    mutationFn: (input: OrganizationCreateInput) => identityRepository.createOrganization(input),
    onSuccess: async (org) => {
      await queryClient.invalidateQueries({ queryKey: ["organizations"] });
      push({ tone: "success", title: tr("orgs.created") });
      setOpen(false);
      setForm(EMPTY);
      setErrors({});
      navigate(adminPath(`/organizations/${org.id}`));
    },
    onError: (error) => setFormError(apiErrorMessage(error, tr)),
  });

  useEffect(() => {
    if (!open) setFormError(null);
  }, [open]);

  const submit = () => {
    const parsed = organizationCreateSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "name");
        next[field] ??= tr(issue.message);
      }
      setErrors(next);
      return;
    }
    setErrors({});
    mutation.mutate(parsed.data);
  };

  return (
    <div>
      <PageHeader
        title={t("orgs.title")}
        subtitle={t("orgs.subtitle")}
        actions={
          <>
            <Badge tone="success">{t("common.liveApi")}</Badge>
            {can("org.update") ? (
              <Button variant="primary" icon={<Plus className="size-4" aria-hidden="true" />} onClick={() => setOpen(true)}>
                {t("orgs.new")}
              </Button>
            ) : null}
          </>
        }
      />

      <Card>
        <CardHeader title={t("orgs.title")} subtitle={t("orgs.subtitle")} />
        <CardBody>
          {organizations.isPending ? (
            <div className="space-y-2" role="status" aria-label={t("common.loading")}>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : organizations.isError ? (
            <div role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger-soft-fg">
              {apiErrorMessage(organizations.error, tr)}
            </div>
          ) : organizations.data.items.length === 0 ? (
            <EmptyState title={t("orgs.empty")} body={t("orgs.emptyBody")} />
          ) : (
            <Table caption={t("orgs.title")}>
              <THead>
                <tr>
                  <Th>{t("fields.name")}</Th>
                  <Th>{t("fields.country")}</Th>
                  <Th>{t("fields.kind")}</Th>
                  <Th>{t("orgs.createdAt")}</Th>
                </tr>
              </THead>
              <TBody>
                {organizations.data.items.map((org) => (
                  <Tr key={org.id}>
                    <Td>
                      <Link to={adminPath(`/organizations/${org.id}`)} className="flex items-center gap-2 font-medium text-fg hover:underline">
                        <Building2 className="size-4 text-fg-subtle" aria-hidden="true" />
                        {org.name}
                      </Link>
                      <span className="text-2xs text-fg-subtle" dir="ltr">
                        {org.slug}
                      </span>
                    </Td>
                    <Td className="text-fg-muted" dir="ltr">
                      {org.country}
                    </Td>
                    <Td>
                      <Badge tone="neutral">{t(`orgs.kinds.${org.kind}` as TranslationKey)}</Badge>
                    </Td>
                    <Td className="text-2xs text-fg-subtle">{format.date(org.createdAt)}</Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("orgs.createTitle")}
        description={t("orgs.createBody")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={mutation.isPending}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" loading={mutation.isPending} onClick={submit}>
              {t("actions.create")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError ? (
            <div role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger-soft-fg">
              {formError}
            </div>
          ) : null}
          <Field label={t("fields.name")} htmlFor="org-name" required error={errors.name}>
            <Input
              id="org-name"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                  slug: current.slug || slugify(event.target.value),
                }))
              }
            />
          </Field>
          <Field label={t("fields.slug")} htmlFor="org-slug" required error={errors.slug} hint="karaj-watershed">
            <Input id="org-slug" dir="ltr" value={form.slug} onChange={(event) => setForm((c) => ({ ...c, slug: slugify(event.target.value) }))} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fields.country")} htmlFor="org-country" required error={errors.country}>
              <Input id="org-country" dir="ltr" maxLength={2} value={form.country} onChange={(event) => setForm((c) => ({ ...c, country: event.target.value.toUpperCase() }))} />
            </Field>
            <Field label={t("fields.kind")} htmlFor="org-kind">
              <Select id="org-kind" value={form.kind} onChange={(event) => setForm((c) => ({ ...c, kind: event.target.value as FormState["kind"] }))}>
                <option value="community">{t("orgs.kinds.community")}</option>
                <option value="region">{t("orgs.kinds.region")}</option>
                <option value="business">{t("orgs.kinds.business")}</option>
                <option value="research">{t("orgs.kinds.research")}</option>
                <option value="platform">{t("orgs.kinds.platform")}</option>
              </Select>
            </Field>
          </div>
        </div>
      </Dialog>
    </div>
  );
}