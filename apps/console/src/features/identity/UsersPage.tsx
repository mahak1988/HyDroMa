import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import { useFormState, usePermissions } from "@eco-nojin/frontend-core";
import type { OrganizationRole, UserStatus } from "@eco-nojin/domain-types";
import { invitationCreateSchema, roleSchema, userStatusSchema, validateWithSchema } from "@eco-nojin/validation";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  DataTable,
  Dialog,
  EmptyState,
  Field,
  FormAlert,
  Input,
  Select,
  useToast,
  type DataTableColumn,
} from "@eco-nojin/ui";
import { PageHeader } from "../../app/layouts/PageHeader";
import { useSession } from "../../session/Session";
import { identityRepository } from "../../data";
import { apiErrorMessage, userInvalidationKeys, useUsers } from "./queries";

const ROLES: OrganizationRole[] = ["owner", "admin", "manager", "member", "viewer"];
const STATUSES: UserStatus[] = ["invited", "active", "suspended"];

const statusTone: Record<UserStatus, "success" | "warning" | "danger"> = {
  active: "success",
  invited: "warning",
  suspended: "danger",
};

type InviteValues = { email: string; role: OrganizationRole };

type UserRow = Awaited<ReturnType<typeof identityRepository.listUsers>>["items"][number];

export function UsersPage() {
  const { t, format } = useI18n();
  const tr = (key: string) => t(key as TranslationKey);
  const { can } = usePermissions();
  const { activeOrg } = useSession();
  const queryClient = useQueryClient();
  const { push } = useToast();

  const [params, setParams] = useSearchParams();
  const search = params.get("q") ?? "";
  const roleParam = params.get("role") ?? "";
  const statusParam = params.get("status") ?? "";
  const cursor = params.get("cursor") ?? undefined;

  // URL values are untrusted input: validate them with the shared schemas and
  // fall back to "all" instead of casting an arbitrary string to a union type.
  const role = roleSchema.safeParse(roleParam).success ? roleParam : "";
  const status = userStatusSchema.safeParse(statusParam).success ? (statusParam as UserStatus) : "";

  const [searchInput, setSearchInput] = useState(search);

  // Keep the URL as the source of truth: the input writes to it, and a refresh
  // or a shared link restores the same view. The functional form avoids reading
  // a stale `params` when two filters change in the same tick.
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const inviteForm = useFormState<InviteValues>({
    initial: { email: "", role: "member" },
    validate: (values) => validateWithSchema(invitationCreateSchema, values, tr("validation.emailInvalid")) as ReturnType<
      typeof validateWithSchema<InviteValues>
    >,
  });

  const users = useUsers({
    search: search || undefined,
    role: role || undefined,
    status: (status as UserStatus) || "",
    limit: 10,
    cursor,
  });

  const updateParam = (key: string, value: string) => {
    setParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (value) next.set(key, value);
        else next.delete(key);
        if (key !== "cursor") next.delete("cursor");
        return next;
      },
      { replace: true },
    );
  };

  const inviteMember = useMutation({
    mutationFn: () => {
      const result = inviteForm.validateAll();
      if (!result.ok || !result.data) throw new Error("validation");
      return identityRepository.inviteMember(activeOrg.id, {
        email: result.data.email,
        role: result.data.role,
      });
    },
    onSuccess: async () => {
      for (const key of userInvalidationKeys(activeOrg.id)) {
        await queryClient.invalidateQueries({ queryKey: key });
      }
      push({ tone: "success", title: t("people.invited") });
      setInviteOpen(false);
      inviteForm.reset({ email: "", role: "member" });
      setInviteError(null);
    },
    onError: (error) => {
      if (error instanceof Error && error.message === "validation") {
        setInviteError(null);
        return;
      }
      setInviteError(apiErrorMessage(error, tr));
    },
  });

  const columns: DataTableColumn<UserRow>[] = [
    {
      id: "name",
      sortKey: "name",
      header: t("fields.name"),
      cell: (user) => (
        <Link to={`/users/${user.id}`} className="font-medium text-fg hover:underline">
          {user.name}
        </Link>
      ),
    },
    {
      id: "email",
      header: t("fields.email"),
      className: "text-2xs text-fg-muted",
      cell: (user) => <span dir="ltr">{user.email}</span>,
    },
    {
      id: "role",
      header: t("fields.role"),
      cell: (user) => (
        <Badge tone={user.role === "owner" ? "primary" : "neutral"}>{t(`roles.${user.role}` as TranslationKey)}</Badge>
      ),
    },
    {
      id: "status",
      header: t("fields.status"),
      cell: (user) => (
        <Badge tone={statusTone[user.status]} dot>
          {t(`status.${user.status}` as TranslationKey)}
        </Badge>
      ),
    },
    {
      id: "lastActiveAt",
      sortKey: "lastActiveAt",
      header: t("people.lastActive"),
      className: "text-2xs text-fg-subtle",
      cell: (user) => (user.lastActiveAt ? format.dateTime(user.lastActiveAt) : t("people.neverActive")),
    },
  ];

  return (
    <div>
      <PageHeader
        title={t("people.title")}
        subtitle={`${t("people.subtitle")} · ${activeOrg.name}`}
        actions={
          can("org.members.invite") ? (
            <Button variant="primary" icon={<UserPlus className="size-4" aria-hidden="true" />} onClick={() => setInviteOpen(true)}>
              {t("people.invite")}
            </Button>
          ) : null
        }
      />

      <Card>
        <CardHeader title={t("people.title")} subtitle={t("people.subtitle")} />
        <CardBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_11rem_11rem_auto]">
            <Field label={t("common.search")} htmlFor="user-search">
              <Input
                id="user-search"
                type="search"
                placeholder={t("people.searchPlaceholder")}
                value={searchInput}
                onChange={(event) => {
                  const value = event.target.value;
                  setSearchInput(value);
                  updateParam("q", value);
                }}
              />
            </Field>
            <Field label={t("people.filterRole")} htmlFor="user-role">
              <Select id="user-role" value={role} onChange={(event) => updateParam("role", event.target.value)}>
                <option value="">{t("people.allRoles")}</option>
                {ROLES.map((item) => (
                  <option key={item} value={item}>
                    {t(`roles.${item}` as TranslationKey)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("people.filterStatus")} htmlFor="user-status">
              <Select id="user-status" value={status} onChange={(event) => updateParam("status", event.target.value)}>
                <option value="">{t("people.allStatuses")}</option>
                {STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {t(`status.${item}` as TranslationKey)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {users.isError ? (
            <div role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger-soft-fg">
              {apiErrorMessage(users.error, tr)}
            </div>
          ) : (
            <DataTable
              columns={columns}
              rows={users.data?.items ?? []}
              getRowId={(user) => user.id}
              caption={t("people.title")}
              loading={users.isPending}
              empty={<EmptyState title={t("people.empty")} body={t("people.emptyBody")} />}
              footer={
                users.data ? (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-fg-subtle">
                      {format.number(users.data.total)} {t("people.title")}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="sm" disabled={!cursor} onClick={() => updateParam("cursor", "")}>
                        {t("actions.back")}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={!users.data.nextCursor}
                        onClick={() => updateParam("cursor", users.data.nextCursor ?? "")}
                      >
                        {t("common.next" as TranslationKey)}
                      </Button>
                    </div>
                  </div>
                ) : null
              }
            />
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
            <Button variant="primary" loading={inviteMember.isPending} onClick={() => inviteMember.mutate()}>
              {t("actions.invite")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {inviteError ? <FormAlert>{inviteError}</FormAlert> : null}
          <Field label={t("fields.email")} htmlFor="invite-user-email" error={inviteForm.errors.email} required>
            <Input
              id="invite-user-email"
              type="email"
              dir="ltr"
              aria-invalid={Boolean(inviteForm.errors.email)}
              value={inviteForm.values.email}
              onChange={(event) => inviteForm.setField("email", event.target.value)}
              onBlur={() => inviteForm.blur("email")}
            />
          </Field>
          <Field label={t("fields.role")} htmlFor="invite-user-role" error={inviteForm.errors.role}>
            <Select
              id="invite-user-role"
              value={inviteForm.values.role}
              onChange={(event) => inviteForm.setField("role", event.target.value as OrganizationRole)}
            >
              {ROLES.map((item) => (
                <option key={item} value={item}>
                  {t(`roles.${item}` as TranslationKey)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Dialog>
    </div>
  );
}