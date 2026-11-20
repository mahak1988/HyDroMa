import { forwardRef, useId } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

const control =
  "w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-fg shadow-e1 transition-colors placeholder:text-fg-subtle hover:border-primary/60 focus-visible:border-primary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-danger aria-[invalid=true]:ring-danger/30";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={`${control} ${className ?? ""}`} {...rest} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={`${control} min-h-24 ${className ?? ""}`} {...rest} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select ref={ref} className={`${control} pe-9 ${className ?? ""}`} {...rest}>
        {children}
      </select>
    );
  },
);

type CheckProps = InputHTMLAttributes<HTMLInputElement> & { label: ReactNode; hint?: string };

export function Checkbox({ label, hint, id, className, ...rest }: CheckProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const hintId = `${inputId}-hint`;
  return (
    <label htmlFor={inputId} className={`flex cursor-pointer items-start gap-2.5 text-sm ${className ?? ""}`}>
      <input
        id={inputId}
        type="checkbox"
        aria-describedby={hint ? hintId : undefined}
        className="mt-0.5 size-4 rounded border-border-strong accent-primary"
        {...rest}
      />
      <span className="min-w-0">
        <span className="block text-fg">{label}</span>
        {hint ? (
          <span id={hintId} className="block text-2xs text-fg-subtle">
            {hint}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export function Radio({ label, hint, id, className, ...rest }: CheckProps) {
  const generated = useId();
  const inputId = id ?? generated;
  const hintId = `${inputId}-hint`;
  return (
    <label htmlFor={inputId} className={`flex cursor-pointer items-start gap-2.5 text-sm ${className ?? ""}`}>
      <input
        id={inputId}
        type="radio"
        aria-describedby={hint ? hintId : undefined}
        className="mt-0.5 size-4 border-border-strong accent-primary"
        {...rest}
      />
      <span className="min-w-0">
        <span className="block text-fg">{label}</span>
        {hint ? (
          <span id={hintId} className="block text-2xs text-fg-subtle">
            {hint}
          </span>
        ) : null}
      </span>
    </label>
  );
}

export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-[var(--duration-fast)] disabled:cursor-not-allowed disabled:opacity-50"
      data-state={checked ? "on" : "off"}
      style={{ background: checked ? "var(--primary)" : "var(--surface-3)" }}
    >
      <span
        aria-hidden="true"
        className="absolute top-0.5 size-4 rounded-full bg-surface shadow-e1 transition-[inset] duration-[var(--duration-base)]"
        style={{ insetInlineStart: checked ? "1.15rem" : "0.15rem" }}
      />
    </button>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const hintId = `${htmlFor}-hint`;
  const errorId = `${htmlFor}-error`;
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <label htmlFor={htmlFor} className="flex items-baseline gap-1 text-xs font-medium text-fg">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>
      <div aria-describedby={error ? errorId : hint ? hintId : undefined}>{children}</div>
      {error ? (
        <p id={errorId} className="text-2xs font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-2xs text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/* --------------------------- Form feedback ---------------------------- */

/**
 * A field-level error message. Rendered next to the control it belongs to so a
 * screen reader announces it as part of the field, and so a 422 from the server
 * can be shown inline instead of as a toast.
 */
export function FormError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="text-2xs font-medium text-danger">
      {children}
    </p>
  );
}

/** Form-level banner for errors that are not tied to a single field. */
export function FormAlert({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger-soft-fg">
      {title ? <p className="font-medium">{title}</p> : null}
      <p>{children}</p>
    </div>
  );
}

/** Label + control + hint/error, without repeating the id wiring in every form. */
export function FormRow<TField extends string>({
  label,
  field,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  field: TField;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby": string | undefined }) => ReactNode;
}) {
  return (
    <Field label={label} htmlFor={field} hint={hint} error={error} required={required}>
      {children({
        id: field,
        "aria-invalid": Boolean(error),
        "aria-describedby": error ? `${field}-error` : hint ? `${field}-hint` : undefined,
      })}
    </Field>
  );
}