import { Button } from "./button";

/**
 * Offset pagination. The component never owns state: it renders `page` and
 * reports intent through `onPageChange`, so the URL stays the source of truth.
 */
export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  labels,
  className,
}: {
  page: number;
  pageCount: number;
  total?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  labels: { previous: string; next: string; page: string; of: string; total?: string };
  className?: string;
}) {
  const safePageCount = Math.max(1, pageCount);
  const rangeStart = total === undefined || total === 0 ? 0 : (page - 1) * (pageSize ?? 0) + 1;
  const rangeEnd = total === undefined || pageSize === undefined ? undefined : Math.min(page * pageSize, total);

  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 text-2xs text-fg-subtle ${className ?? ""}`}>
      <span className="numeric">
        {rangeEnd === undefined
          ? `${labels.page} ${page} ${labels.of} ${safePageCount}`
          : `${rangeStart}–${rangeEnd} ${labels.of} ${total}`}
      </span>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          {labels.previous}
        </Button>
        <span aria-current="page" className="numeric px-1 font-medium text-fg">
          {page} / {safePageCount}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= safePageCount}
          onClick={() => onPageChange(Math.min(safePageCount, page + 1))}
        >
          {labels.next}
        </Button>
      </div>
    </div>
  );
}

/** Page-size selector that persists nothing by itself; callers persist. */
export function PageSizeSelect({
  value,
  options,
  onChange,
  label,
}: {
  value: number;
  options: readonly number[];
  onChange: (size: number) => void;
  label: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-2xs text-fg-muted">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="rounded-md border border-border-strong bg-surface px-2 py-1 text-2xs text-fg"
      >
        {options.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </label>
  );
}