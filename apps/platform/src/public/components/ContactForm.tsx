import { useRef, useState } from "react";
import { Alert, Button, Field, Input, Textarea } from "@eco-nojin/ui";
import { useSite } from "../content/useContent";

type Errors = { name?: string; email?: string; message?: string };

/**
 * Accessible contact form. There is no contact service in this environment, so a
 * valid submission explains that delivery is unavailable instead of pretending to succeed.
 */
export function ContactForm() {
  const site = useSite();
  const [values, setValues] = useState({ name: "", email: "", org: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  const validate = (): boolean => {
    const next: Errors = {};
    if (values.name.trim().length < 2) next.name = site.ui.formValidation;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email.trim())) next.email = site.ui.formValidation;
    if (values.message.trim().length < 10) next.message = site.ui.formValidation;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = () => {
    if (!validate()) return;
    setSubmitted(true);
    requestAnimationFrame(() => statusRef.current?.focus());
  };

  return (
    <form
      className="max-w-2xl space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={site.ui.formName} htmlFor="contact-name" required error={errors.name}>
          <Input
            id="contact-name"
            autoComplete="name"
            value={values.name}
            onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
          />
        </Field>
        <Field label={site.ui.formEmail} htmlFor="contact-email" required error={errors.email}>
          <Input
            id="contact-email"
            type="email"
            dir="ltr"
            autoComplete="email"
            value={values.email}
            onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
          />
        </Field>
      </div>
      <Field label={site.ui.formOrg} htmlFor="contact-org">
        <Input
          id="contact-org"
          autoComplete="organization"
          value={values.org}
          onChange={(event) => setValues((current) => ({ ...current, org: event.target.value }))}
        />
      </Field>
      <Field label={site.ui.formMessage} htmlFor="contact-message" required error={errors.message}>
        <Textarea
          id="contact-message"
          rows={5}
          value={values.message}
          onChange={(event) => setValues((current) => ({ ...current, message: event.target.value }))}
        />
      </Field>

      <Button type="submit" variant="primary">
        {site.ui.formSubmit}
      </Button>

      {submitted ? (
        <div ref={statusRef} tabIndex={-1} aria-live="polite">
          <Alert tone="warning" title={site.ui.formUnavailableTitle}>
            {site.ui.formUnavailableBody}
          </Alert>
        </div>
      ) : (
        <Alert tone="info" title={site.ui.statusTitle}>
          {site.ui.statusBody}
        </Alert>
      )}
    </form>
  );
}