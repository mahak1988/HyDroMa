import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserPlus } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import { usePermissions } from "@eco-nojin/frontend-core";
import type { OrganizationRole, UserStatus } from "@eco-nojin/domain-types";
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
import { useSession } from "../../session/DemoSession";
import { identityRepository } from "../../data";
import { apiErrorMessage, useUsers } from "./queries";

const ROLES: OrganizationRole[] = ["owner", "admin", "manager", "member", "viewer"];
const STATUSES: UserStatus[] = ["invited", "active", "suspended"];

const statusTone: Record<UserStatus, "success" | "warning" | "danger"> = {
  active: "success",
  invited: "warning",
  suspended: "danger",
};

export function UsersPage() {
  const { t, format } = useI18n();
  const tr = (key: string) => t(key as TranslationKey);
  const { can } = usePermissions();
  const { activeOrg } = useSession();
  const queryClient = useQueryClient();
  const { push } = useToast();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [history, setHistory] = useState<Array<string | undefined>>([]);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ email: "", role: "member" as OrganizationRole });
  const [inviteError, setInviteError] = useState<string | null>(null);

  const users = useUsers({
    search,
    role: role || undefined,
    status: (status as UserStatus) || "",
    limit: 10,
    cursor,
  });

  const inviteMember = useMutation({
    mutationFn: () => identityRepository.inviteMember(activeOrg.id, { email: invite.email.trim().toLowerCase(), role: invite.role }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
      push({ tone: "success", title: t("people.invited") });
      setInviteOpen(false);
      setInvite({ email: "", role: "member" });
      setInviteError(null);
    },
    onError: (error) => setInviteError(apiErrorMessage(error, tr)),
  });

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
                  window.clearTimeout((window as unknown as { __userSearchTimer?: number }).__userSearchTimer);
                  (window as unknown as { __userSearchTimer?: number }).__userSearchTimer = window.setTimeout(() => {
                    setSearch(value);
                    setCursor(undefined);
                    setHistory([]);
                  }, 250);
                }}
              />
            </Field>
            <Field label={t("people.filterRole")} htmlFor="user-role">
              <Select
                id="user-role"
                value={role}
                onChange={(event) => {
                  setRole(event.target.value);
                  setCursor(undefined);
                  setHistory([]);
                }}
              >
                <option value="">{t("people.allRoles")}</option>
                {ROLES.map((item) => (
                  <option key={item} value={item}>
                    {t(`roles.${item}` as TranslationKey)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("people.filterStatus")} htmlFor="user-status">
              <Select
                id="user-status"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setCursor(undefined);
                  setHistory([]);
                }}
              >
                <option value="">{t("people.allStatuses")}</option>
                {STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {t(`status.${item}` as TranslationKey)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {users.isPending ? (
            <div className="space-y-2" role="status" aria-label={t("common.loading")}>
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : users.isError ? (
            <div role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger-soft-fg">
              {apiErrorMessage(users.error, tr)}
            </div>
          ) : users.data.items.length === 0 ? (
            <EmptyState title={t("people.empty")} body={t("people.emptyBody")} />
          ) : (
            <>
              <Table caption={t("people.title")}>
                <THead>
                  <tr>
                    <Th>{t("fields.name")}</Th>
                    <Th>{t("fields.email")}</Th>
                    <Th>{t("fields.role")}</Th>
                    <Th>{t("fields.status")}</Th>
                    <Th>{t("people.lastActive")}</Th>
                  </tr>
                </THead>
                <TBody>
                  {users.data.items.map((user) => (
                    <Tr key={user.id}>
                      <Td>
                        <Link to={`/users/${user.id}`} className="font-medium text-fg hover:underline">
                          {user.name}
                        </Link>
                      </Td>
                      <Td className="text-2xs text-fg-muted" dir="ltr">
                        {user.email}
                      </Td>
                      <Td>
                        <Badge tone={user.role === "owner" ? "primary" : "neutral"}>
                          {t(`roles.${user.role}` as TranslationKey)}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge tone={statusTone[user.status]} dot>
                          {t(`status.${user.status}` as TranslationKey)}
                        </Badge>
                      </Td>
                      <Td className="text-2xs text-fg-subtle">
                        {user.lastActiveAt ? format.dateTime(user.lastActiveAt) : t("people.neverActive")}
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>

              <div className="flex flex-wrap items-center justify-between gap-2 text-2xs text-fg-subtle">
                <span>
                  {format.number(users.data.total)} · {t("people.title")}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={history.length === 0}
                    onClick={() => {
                      const previous = history[history.length - 1];
                      setHistory((items) => items.slice(0, -1));
                      setCursor(previous);
                    }}
                  >
                    {t("actions.back")}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!users.data.nextCursor}
                    onClick={() => {
                      setHistory((items) => [...items, cursor]);
                      setCursor(users.data.nextCursor ?? undefined);
                    }}
                  >
                    {t("common.next" as TranslationKey)}
                  </Button>
                </div>
              </div>
            </>
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
                inviteMember.mutate();
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
          <Field label={t("fields.email")} htmlFor="invite-user-email" required>
            <Input id="invite-user-email" type="email" dir="ltr" value={invite.email} onChange={(event) => setInvite((c) => ({ ...c, email: event.target.value }))} />
          </Field>
          <Field label={t("fields.role")} htmlFor="invite-user-role">
            <Select id="invite-user-role" value={invite.role} onChange={(event) => setInvite((c) => ({ ...c, role: event.target.value as OrganizationRole }))}>
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