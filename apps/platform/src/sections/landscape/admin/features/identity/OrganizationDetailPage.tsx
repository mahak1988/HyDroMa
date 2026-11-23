import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import { usePermissions } from "@eco-nojin/frontend-core";
import type { OrganizationRole, UserStatus } from "@eco-nojin/domain-types";
import {
  organizationUpdateSchema,
  type InvitationCreateInput,
  type OrganizationUpdateInput,
} from "@eco-nojin/validation";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Dialog,
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
import { apiErrorMessage, isNotFound, useMembers, useOrganization } from "./queries";
import { adminPath } from "../../lib/paths";

const ROLES: OrganizationRole[] = ["owner", "admin", "manager", "member", "viewer"];

const statusTone: Record<UserStatus, "success" | "warning" | "danger"> = {
  active: "success",
  invited: "warning",
  suspended: "danger",
};

export function OrganizationDetailPage() {
  const { id = "" } = useParams();
  const { t, format } = useI18n();
  const tr = (key: string) => t(key as TranslationKey);
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const { push } = useToast();

  const org = useOrganization(id);
  const members = useMembers(id);
  const users = useQuery({
    queryKey: ["users", "byOrg", id],
    queryFn: () => identityRepository.listUsers(id, { limit: 100 }),
    enabled: Boolean(id),
  });

  const [form, setForm] = useState<OrganizationUpdateInput>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState<InvitationCreateInput>({ email: "", role: "member" });
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    if (org.data) {
      setForm({ name: org.data.name, slug: org.data.slug, country: org.data.country, kind: org.data.kind });
    }
  }, [org.data]);

  const save = useMutation({
    mutationFn: (input: OrganizationUpdateInput) => identityRepository.updateOrganization(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["organization", id] });
      await queryClient.invalidateQueries({ queryKey: ["organizations"] });
      push({ tone: "success", title: t("orgs.updated") });
    },
    onError: (error) => setErrors({ name: apiErrorMessage(error, tr) }),
  });

  const inviteMember = useMutation({
    mutationFn: (input: InvitationCreateInput) => identityRepository.inviteMember(id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["members", id] });
      await queryClient.invalidateQueries({ queryKey: ["users", "byOrg", id] });
      push({ tone: "success", title: t("people.invited") });
      setInviteOpen(false);
      setInvite({ email: "", role: "member" });
      setInviteError(null);
    },
    onError: (error) => setInviteError(apiErrorMessage(error, tr)),
  });

  const changeRole = useMutation({
    mutationFn: ({ membershipId, role }: { membershipId: string; role: OrganizationRole }) =>
      identityRepository.updateMemberRole(id, membershipId, role),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["members", id] });
      await queryClient.invalidateQueries({ queryKey: ["users", "byOrg", id] });
      push({ tone: "success", title: t("people.updated") });
    },
    onError: (error) => push({ tone: "danger", title: apiErrorMessage(error, tr) }),
  });

  if (org.isPending) {
    return (
      <Card>
        <CardBody className="space-y-2">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-80" />
        </CardBody>
      </Card>
    );
  }

  if (isNotFound(org.error) || !org.data) {
    return (
      <Card>
        <CardBody className="space-y-3 py-10 text-center">
          <h1 className="text-lg font-semibold text-fg">{t("orgs.notFound")}</h1>
          <p className="text-sm text-fg-muted">{t("orgs.notFoundBody")}</p>
          <Link to={adminPath("/organizations")} className="text-sm font-medium text-primary hover:underline">
            {t("actions.back")}
          </Link>
        </CardBody>
      </Card>
    );
  }

  const userById = new Map(users.data?.items.map((user) => [user.id, user]) ?? []);

  const submit = () => {
    const parsed = organizationUpdateSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) next[String(issue.path[0] ?? "name")] ??= tr(issue.message);
      setErrors(next);
      return;
    }
    setErrors({});
    save.mutate(parsed.data);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={org.data.name}
        subtitle={`${org.data.country} · ${t(`orgs.kinds.${org.data.kind}` as TranslationKey)}`}
        actions={
          <>
            <Link
              to={adminPath("/organizations")}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm text-fg hover:bg-surface-2"
            >
              <ArrowLeft className="size-4 rtl-flip" aria-hidden="true" />
              {t("actions.back")}
            </Link>
            {can("org.members.invite") ? (
              <Button variant="primary" icon={<UserPlus className="size-4" aria-hidden="true" />} onClick={() => setInviteOpen(true)}>
                {t("people.invite")}
              </Button>
            ) : null}
          </>
        }
      />

      <Card>
        <CardHeader title={t("orgs.editTitle")} subtitle={`${t("orgs.createdAt")}: ${format.date(org.data.createdAt)}`} />
        <CardBody>
          <fieldset disabled={!can("org.update")} className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fields.name")} htmlFor="edit-name" required error={errors.name}>
              <Input id="edit-name" value={form.name ?? ""} onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))} />
            </Field>
            <Field label={t("fields.slug")} htmlFor="edit-slug" required error={errors.slug}>
              <Input id="edit-slug" dir="ltr" value={form.slug ?? ""} onChange={(event) => setForm((c) => ({ ...c, slug: event.target.value }))} />
            </Field>
            <Field label={t("fields.country")} htmlFor="edit-country" required error={errors.country}>
              <Input id="edit-country" dir="ltr" maxLength={2} value={form.country ?? ""} onChange={(event) => setForm((c) => ({ ...c, country: event.target.value.toUpperCase() }))} />
            </Field>
            <Field label={t("fields.kind")} htmlFor="edit-kind">
              <Select id="edit-kind" value={form.kind ?? "community"} onChange={(event) => setForm((c) => ({ ...c, kind: event.target.value as OrganizationUpdateInput["kind"] }))}>
                <option value="community">{t("orgs.kinds.community")}</option>
                <option value="region">{t("orgs.kinds.region")}</option>
                <option value="business">{t("orgs.kinds.business")}</option>
                <option value="research">{t("orgs.kinds.research")}</option>
                <option value="platform">{t("orgs.kinds.platform")}</option>
              </Select>
            </Field>
          </fieldset>
          {can("org.update") ? (
            <div className="mt-4 flex justify-end">
              <Button variant="primary" loading={save.isPending} onClick={submit}>
                {t("actions.save")}
              </Button>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("orgs.membersTitle")} subtitle={t("orgs.membersSubtitle")} />
        <CardBody>
          {members.isPending ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Table caption={t("orgs.membersTitle")}>
              <THead>
                <tr>
                  <Th>{t("fields.name")}</Th>
                  <Th>{t("fields.email")}</Th>
                  <Th>{t("fields.role")}</Th>
                  <Th>{t("fields.status")}</Th>
                </tr>
              </THead>
              <TBody>
                {members.data?.items.map((member) => {
                  const user = userById.get(member.userId);
                  const status: UserStatus = user?.status ?? "invited";
                  return (
                    <Tr key={member.id}>
                      <Td className="font-medium text-fg">{user?.name ?? member.userId}</Td>
                      <Td className="text-2xs text-fg-muted" dir="ltr">
                        {user?.email ?? "—"}
                      </Td>
                      <Td>
                        {can("org.roles.manage") ? (
                          <Select
                            aria-label={`${t("fields.role")} — ${user?.name ?? member.userId}`}
                            value={member.role}
                            onChange={(event) =>
                              changeRole.mutate({ membershipId: member.id, role: event.target.value as OrganizationRole })
                            }
                          >
                            {ROLES.map((role) => (
                              <option key={role} value={role}>
                                {t(`roles.${role}` as TranslationKey)}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <Badge tone="neutral">{t(`roles.${member.role}` as TranslationKey)}</Badge>
                        )}
                      </Td>
                      <Td>
                        <Badge tone={statusTone[status]} dot>
                          {t(`status.${status}` as TranslationKey)}
                        </Badge>
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Dialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title={t("people.inviteTitle")}
        description={t("people.inviteBody")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setInviteOpen(false)} disabled={inviteMember.isPending}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="primary"
              loading={inviteMember.isPending}
              onClick={() => {
                const email = invite.email.trim().toLowerCase();
                if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
                  setInviteError(t("validation.emailInvalid"));
                  return;
                }
                setInviteError(null);
                inviteMember.mutate({ email, role: invite.role });
              }}
            >
              {t("actions.invite")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {inviteError ? (
            <div role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger-soft-fg">
              {inviteError}
            </div>
          ) : null}
          <Field label={t("fields.email")} htmlFor="invite-email" required>
            <Input
              id="invite-email"
              type="email"
              dir="ltr"
              value={invite.email}
              onChange={(event) => setInvite((c) => ({ ...c, email: event.target.value }))}
            />
          </Field>
          <Field label={t("fields.role")} htmlFor="invite-role">
            <Select id="invite-role" value={invite.role} onChange={(event) => setInvite((c) => ({ ...c, role: event.target.value as OrganizationRole }))}>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {t(`roles.${role}` as TranslationKey)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Dialog>
    </div>
  );
}