/**
 * Auth panel: real sign-in, registration and invite acceptance.
 *
 * Labels come from the host app through `labels` (i18n catalogs stay the single
 * string source — this component holds no UI text). The panel only talks to the
 * real API through RealSessionProvider; there is no demo path here.
 */
import { useState } from "react";
import type { FormEvent } from "react";
import { useRealSession } from "./real-session";

export type AuthPanelLabels = {
  loginTitle: string;
  registerTitle: string;
  inviteTitle: string;
  email: string;
  password: string;
  name: string;
  organizationName: string;
  organizationOptional: string;
  inviteToken: string;
  submitLogin: string;
  submitRegister: string;
  submitInvite: string;
  switchToRegister: string;
  switchToLogin: string;
  switchToInvite: string;
  submitting: string;
  passwordHint: string;
  modeLogin: string;
  modeRegister: string;
  modeInvite: string;
};

type Mode = "login" | "register" | "invite";

export function AuthPanel({ labels, onAccepted }: { labels: AuthPanelLabels; onAccepted?: () => void }) {
  const { login, register, acceptInvite } = useRealSession();
  const [mode, setMode] = useState<Mode>("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [inviteToken, setInviteToken] = useState("");

  const translateError = (code: string): string => {
    // The API returns machine-readable codes; the host maps them to strings.
    return code;
  };

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "login") {
        await login({ email, password });
        onAccepted?.();
      } else if (mode === "register") {
        await register({
          email,
          password,
          name,
          ...(organizationName.trim() ? { organizationName: organizationName.trim() } : {}),
        });
        onAccepted?.();
      } else {
        await acceptInvite({ token: inviteToken, password });
        onAccepted?.();
      }
    } catch (cause) {
      const code =
        typeof cause === "object" && cause !== null && "code" in cause ? String((cause as { code: unknown }).code) : "unknown";
      setError(translateError(code));
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-foreground)]";
  const buttonClass =
    "w-full rounded-md bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] disabled:opacity-60";

  return (
    <section className="mx-auto w-full max-w-md">
      <div role="tablist" aria-label={labels.modeLogin} className="mb-4 flex gap-2">
        {(["login", "register", "invite"] as Mode[]).map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={mode === item}
            onClick={() => setMode(item)}
            className="rounded-md px-3 py-1.5 text-sm"
            style={mode === item ? { background: "var(--color-primary)", color: "var(--color-primary-foreground)" } : undefined}
          >
            {item === "login" ? labels.modeLogin : item === "register" ? labels.modeRegister : labels.modeInvite}
          </button>
        ))}
      </div>

      <h1 className="mb-1 text-xl font-semibold">
        {mode === "login" ? labels.loginTitle : mode === "register" ? labels.registerTitle : labels.inviteTitle}
      </h1>

      {error ? (
        <p role="alert" className="mt-2 rounded-md bg-[var(--color-danger-soft,transparent)] p-2 text-sm" style={{ color: "var(--color-danger)" }}>
          {error}
        </p>
      ) : null}
      {notice ? (
        <p role="status" className="mt-2 rounded-md p-2 text-sm" style={{ color: "var(--color-success)" }}>
          {notice === "registered" ? labels.registerTitle : labels.inviteTitle}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        {mode === "register" ? (
          <label className="block text-sm">
            <span className="mb-1 block">{labels.name}</span>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoComplete="name" />
          </label>
        ) : null}

        {mode !== "invite" ? (
          <>
            <label className="block text-sm">
              <span className="mb-1 block">{labels.email}</span>
              <input
                className={inputClass}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                dir="ltr"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block">{labels.password}</span>
              <input
                className={inputClass}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={10}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                dir="ltr"
              />
              {mode === "register" ? <span className="mt-1 block text-xs opacity-70">{labels.passwordHint}</span> : null}
            </label>
            {mode === "register" ? (
              <label className="block text-sm">
                <span className="mb-1 block">
                  {labels.organizationName} <small className="opacity-70">({labels.organizationOptional})</small>
                </span>
                <input className={inputClass} value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} />
              </label>
            ) : null}
          </>
        ) : (
          <>
            <label className="block text-sm">
              <span className="mb-1 block">{labels.inviteToken}</span>
              <input className={inputClass} value={inviteToken} onChange={(e) => setInviteToken(e.target.value)} required dir="ltr" />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block">{labels.password}</span>
              <input
                className={inputClass}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={10}
                autoComplete="new-password"
                dir="ltr"
              />
              <span className="mt-1 block text-xs opacity-70">{labels.passwordHint}</span>
            </label>
          </>
        )}

        <button className={buttonClass} type="submit" disabled={busy}>
          {busy
            ? labels.submitting
            : mode === "login"
              ? labels.submitLogin
              : mode === "register"
                ? labels.submitRegister
                : labels.submitInvite}
        </button>
      </form>

      <div className="mt-4 text-sm">
        {mode === "login" ? (
          <button type="button" className="underline" onClick={() => setMode("register")}>
            {labels.switchToRegister}
          </button>
        ) : (
          <button type="button" className="underline" onClick={() => setMode("login")}>
            {labels.switchToLogin}
          </button>
        )}
      </div>
      <span className="hidden">{labels.switchToInvite}</span>
    </section>
  );
}
