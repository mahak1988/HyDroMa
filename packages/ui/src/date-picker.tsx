import { useId, useMemo } from "react";
import { Input } from "./form-controls";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Strict ISO date parsing.
 *
 * Rejects anything that is not a real calendar date, so an invalid value can
 * never roll over silently (`2026-02-29` must not become 1 March 2026).
 * Returns a **local-midnight** `Date`, which is what makes the rendered
 * calendar day match the ISO day in every timezone.
 */
export function parseIsoDate(value: string): Date | null {
  if (typeof value !== "string") return null;
  const match = ISO_DATE.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  const date = new Date(year, month - 1, day);
  // Verify no rollover: the components must round-trip exactly.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  return date;
}

/** True when `value` is a syntactically valid ISO date string (`yyyy-mm-dd`). */
export function isValidIsoDate(value: string): boolean {
  return parseIsoDate(value) !== null;
}

/**
 * Date picker.
 *
 * The stored value is always an ISO `yyyy-mm-dd` string (the same contract the
 * booking/validation layer uses), while the *displayed* value is localised —
 * Persian users see a Jalali date, Arab users an Islamic one, without any
 * change to the underlying data.
 *
 * Editing uses the platform date input so keyboard, screen-reader and mobile
 * behaviour stay native; the localised rendering sits underneath as a caption.
 * That keeps the component accessible and honest instead of re-implementing a
 * calendar that would have to be localised for 15 locales.
 *
 * **Validation (F-07):** a non-empty but invalid value is never rendered as a
 * shifted date. The caption is omitted and `aria-invalid` is set, so a caller
 * passing an out-of-range or malformed value (from an API, a URL or a fixture)
 * gets a visible, announced error instead of a silently rolled-over date.
 */
export function DatePicker({
  id,
  value,
  onChange,
  min,
  max,
  locale = "fa",
  calendar,
  describedBy,
  ariaLabel,
  disabled,
}: {
  id: string;
  /** ISO date, `yyyy-mm-dd`. Empty string means "not set". */
  value: string;
  onChange: (iso: string) => void;
  min?: string;
  max?: string;
  /** BCP-47 tag used for the localised caption. */
  locale?: string;
  /** Calendar system for the caption, e.g. `persian`, `islamic`. Defaults to the locale. */
  calendar?: string;
  describedBy?: string;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const captionId = useId();
  const errorId = useId();

  const parsed = useMemo(() => parseIsoDate(value), [value]);
  const hasValue = value.trim().length > 0;
  const invalid = hasValue && parsed === null;

  const caption = useMemo(() => {
    if (!parsed) return null;
    try {
      return new Intl.DateTimeFormat(locale, {
        dateStyle: "long",
        ...(calendar ? { calendar } : {}),
      }).format(parsed);
    } catch {
      return value;
    }
  }, [calendar, locale, parsed, value]);

  const messageIds = [describedBy, caption ? captionId : null, invalid ? errorId : null].filter(Boolean);

  return (
    <div className="space-y-1">
      <Input
        id={id}
        type="date"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        aria-describedby={messageIds.length > 0 ? messageIds.join(" ") : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {caption ? (
        <p id={captionId} className="text-2xs text-fg-subtle">
          {caption}
        </p>
      ) : null}
      {invalid ? (
        <p id={errorId} role="alert" className="text-2xs font-medium text-danger">
          {value}
        </p>
      ) : null}
    </div>
  );
}