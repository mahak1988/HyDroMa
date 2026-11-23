import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import { usePermissions } from "@eco-nojin/frontend-core";
import type { OrganizationRole, UserStatus } from "@eco-nojin/domain-types";
import { userUpdateSchema, type UserUpdateInput } from "@eco-nojin/validation";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  Input,
  Select,
  Skeleton,
  useToast,
} from "@eco-nojin/ui";
import { PageHeader } from "../../app/layouts/PageHeader";
import { useSession } from "../../session/Session";
import { identityRepository } from "../../data";
import { apiErrorMessage, isNotFound, useUser } from "./queries";

const ROLES: OrganizationRole[] = ["owner", "admin", "manager", "member", "viewer"];

const statusTone: Record<UserStatus, "success" | "warning" | "danger"> = {
  active: "success",
  invited: "warning",
  suspended: "danger",
};

export function UserDetailPage() {
  const { id = "" } = useParams();
  const { t, format } = useI18n();
  const tr = (key: string) => t(key as TranslationKey);
  const { can } = usePermissions();
  const { activeOrg, user: sessionUser } = useSession();
  const queryClient = useQueryClient();
  const { push } = useToast();

  const user = useUser(id);
  const [form, setForm] = useState<UserUpdateInput>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user.data) {
      setForm({
        name: user.data.name,
        email: user.data.email,
        phone: user.data.phone ?? undefined,
        role: user.data.role,
      });
    }
  }, [user.data]);

  const save = useMutation({
    mutationFn: (input: UserUpdateInput) => identityRepository.updateUser(activeOrg.id, id, input),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user", activeOrg.id, id] });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      push({ tone: "success", title: t("people.updated") });
    },
    onError: (error) => setErrors({ email: apiErrorMessage(error, tr) }),
  });

  const setStatus = useMutation({
    mutationFn: (status: UserStatus) => identityRepository.setUserStatus(activeOrg.id, id, status),
    onSuccess: async (_data, status) => {
      await queryClient.invalidateQueries({ queryKey: ["user", activeOrg.id, id] });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      push({ tone: "success", title: status === "active" ? t("people.activated") : t("people.deactivated") });
    },
    onError: (error) => push({ tone: "danger", title: apiErrorMessage(error, tr) }),
  });

  if (user.isPending) {
    return (
      <Card>
        <CardBody className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardBody>
      </Card>
    );
  }

  if (isNotFound(user.error) || !user.data) {
    return (
      <Card>
        <CardBody className="space-y-3 py-10 text-center">
          <h1 className="text-lg font-semibold text-fg">{t("people.notFound")}</h1>
          <p className="text-sm text-fg-muted">{t("people.notFoundBody")}</p>
          <Link to="/users" className="text-sm font-medium text-primary hover:underline">
            {t("actions.back")}
          </Link>
        </CardBody>
      </Card>
    );
  }

  const person = user.data;
  const isSelf = person.id === sessionUser.id;

  const submit = () => {
    const parsed = userUpdateSchema.safeParse(form);
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
        title={person.name}
        subtitle={`${activeOrg.name} · ${t(`roles.${person.role}` as TranslationKey)}`}
        actions={
          <Link
            to="/users"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-border-strong bg-surface px-3 text-sm text-fg hover:bg-surface-2"
          >
            <ArrowLeft className="size-4 rtl-flip" aria-hidden="true" />
            {t("actions.back")}
          </Link>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={statusTone[person.status]} dot>
          {t(`status.${person.status}` as TranslationKey)}
        </Badge>
        <Badge tone="neutral">
          {t("people.created")}: {format.date(person.createdAt)}
        </Badge>
        {isSelf ? <Badge tone="info">{tr("common.demoUser")}</Badge> : null}
      </div>

      <Card>
        <CardHeader title={t("people.editTitle")} subtitle={t("people.subtitle")} />
        <CardBody>
          <fieldset disabled={!can("users.write")} className="grid gap-4 sm:grid-cols-2">
            <Field label={t("fields.name")} htmlFor="person-name" required error={errors.name}>
              <Input id="person-name" value={form.name ?? ""} onChange={(event) => setForm((c) => ({ ...c, name: event.target.value }))} />
            </Field>
            <Field label={t("fields.email")} htmlFor="person-email" required error={errors.email}>
              <Input id="person-email" type="email" dir="ltr" value={form.email ?? ""} onChange={(event) => setForm((c) => ({ ...c, email: event.target.value }))} />
            </Field>
            <Field label={t("fields.phone")} htmlFor="person-phone" error={errors.phone}>
              <Input id="person-phone" dir="ltr" value={form.phone ?? ""} onChange={(event) => setForm((c) => ({ ...c, phone: event.target.value }))} />
            </Field>
            <Field label={t("fields.role")} htmlFor="person-role">
              <Select
                id="person-role"
                value={form.role ?? person.role}
                onChange={(event) => setForm((c) => ({ ...c, role: event.target.value as OrganizationRole }))}
              >
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {t(`roles.${role}` as TranslationKey)}
                  </option>
                ))}
              </Select>
            </Field>
          </fieldset>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-2xs text-fg-subtle">
              <ShieldCheck className="size-4" aria-hidden="true" />
              {t("people.lastActive")}:{" "}
              {person.lastActiveAt ? format.dateTime(person.lastActiveAt) : t("people.neverActive")}
            </div>
            <div className="flex flex-wrap gap-2">
              {can("users.deactivate") && !isSelf ? (
                <Button
                  variant={person.status === "active" ? "danger" : "secondary"}
                  loading={setStatus.isPending}
                  onClick={() => setStatus.mutate(person.status === "active" ? "suspended" : "active")}
                >
                  {person.status === "active" ? t("actions.deactivate") : t("actions.activate")}
                </Button>
              ) : null}
              {can("users.write") ? (
                <Button variant="primary" loading={save.isPending} onClick={submit}>
                  {t("actions.save")}
                </Button>
              ) : null}
            </div>
          </div>
        </CardBody>
      </Card>

      {!can("users.write") ? (
        <Alert tone="info" title={tr("errorCodes.forbidden")} />
      ) : null}
    </div>
  );
}