import type { ReactNode } from "react";
import { Skeleton, Table, TBody, Td, Th, THead, Tr } from "./data-display";

function SortArrow({ direction }: { direction: "asc" | "desc" | "none" }) {
  if (direction === "none") {
    return (
      <svg viewBox="0 0 12 12" aria-hidden="true" className="size-3 text-fg-subtle" fill="none" stroke="currentColor" strokeWidth="1.4">
        <path d="M4 4.5 6 2.5l2 2M4 7.5 6 9.5l2-2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 12 12"
      aria-hidden="true"
      className="size-3 rtl-flip"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
    >
      {direction === "asc" ? (
        <path d="M6 9.5V2.5M3.5 5 6 2.5 8.5 5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M6 2.5v7M3.5 7 6 9.5 8.5 7" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );
}

/**
 * DataTable — the one list primitive for the product.
 *
 * Design rules (borrowed from the mature admin upstreams, re-implemented here):
 *  - the table owns no state: sort/page/filters live in the URL and arrive as props;
 *  - columns are declarative descriptors, so a screen never hand-writes `<th>` order;
 *  - a `sortKey` column renders a real button with `aria-sort`, keyboard reachable;
 *  - `rowHref` makes a row navigable while keeping text selection and copy working.
 */
export type DataTableColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  /** Present when the column can be sorted; the value is the URL sort key. */
  sortKey?: string;
  className?: string;
  /** Hide on narrow viewports (pass a Tailwind responsive class). */
  hideBelow?: "sm" | "md" | "lg";
};

export type DataTableSort = { key: string; direction: "asc" | "desc" } | null;

export type DataTableProps<T> = {
  columns: readonly DataTableColumn<T>[];
  rows: readonly T[];
  getRowId: (row: T) => string;
  caption?: string;
  sort?: DataTableSort;
  onSortChange?: (key: string) => void;
  onRowClick?: (row: T) => void;
  rowHref?: (row: T) => string | undefined;
  loading?: boolean;
  loadingRows?: number;
  empty?: ReactNode;
  footer?: ReactNode;
};

function hideClass(hideBelow: DataTableColumn<unknown>["hideBelow"]): string {
  if (hideBelow === "sm") return "hidden sm:table-cell";
  if (hideBelow === "md") return "hidden md:table-cell";
  if (hideBelow === "lg") return "hidden lg:table-cell";
  return "";
}

function ariaSortFor(sort: DataTableSort, column: DataTableColumn<unknown>): "ascending" | "descending" | "none" | undefined {
  if (!column.sortKey || !sort || sort.key !== column.sortKey) return undefined;
  return sort.direction === "asc" ? "ascending" : "descending";
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  caption,
  sort = null,
  onSortChange,
  onRowClick,
  rowHref,
  loading = false,
  loadingRows = 4,
  empty,
  footer,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-2" role="status" aria-busy="true">
        {Array.from({ length: loadingRows }, (_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return <>{empty ?? null}</>;
  }

  return (
    <div className="space-y-3">
      <Table caption={caption}>
        <THead>
          <tr>
            {columns.map((column) => {
              const active = Boolean(column.sortKey && sort && sort.key === column.sortKey);
              const ariaSort = ariaSortFor(sort, column as DataTableColumn<unknown>);
              return (
                <Th
                  key={column.id}
                  className={`${hideClass(column.hideBelow)} ${column.className ?? ""}`}
                  aria-sort={ariaSort}
                >
                  {column.sortKey && onSortChange ? (
                    <button
                      type="button"
                      onClick={() => onSortChange(column.sortKey!)}
                      className="inline-flex items-center gap-1 rounded px-1 py-0.5 hover:text-fg focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring/40"
                    >
                      <span>{column.header}</span>
                      <SortArrow
                        direction={active ? (sort?.direction ?? "asc") : "none"}
                      />
                    </button>
                  ) : (
                    column.header
                  )}
                </Th>
              );
            })}
          </tr>
        </THead>
        <TBody>
          {rows.map((row) => {
            const href = rowHref?.(row);
            const content = columns.map((column) => (
              <Td key={column.id} className={`${hideClass(column.hideBelow)} ${column.className ?? ""}`}>
                {column.cell(row)}
              </Td>
            ));
            return (
              <Tr
                key={getRowId(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={href ? { cursor: "pointer" } : undefined}
              >
                {content}
              </Tr>
            );
          })}
        </TBody>
      </Table>
      {footer}
    </div>
  );
}

/**
 * URL-bound wrapper: reads the validated table state, reports changes back as
 * URLSearchParams. Keeps `DataTable` itself pure and reusable.
 */
export function useTableSortLabels(sort: DataTableSort, labels: { ascending: string; descending: string }): string {
  if (!sort) return labels.ascending;
  return sort.direction === "asc" ? labels.ascending : labels.descending;
}