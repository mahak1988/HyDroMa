import { useState } from "react";
import { Button, DataTable, EmptyState, Field, Input, type DataTableColumn } from "./index";

export type ResourceField = {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea";
  required?: boolean;
};

export type ResourceTableProps<T extends { id: string }> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyBody?: string;
  getRowId?: (row: T) => string;
};

export function ResourceTable<T extends { id: string }>(props: ResourceTableProps<T>) {
  return (
    <DataTable
      columns={props.columns}
      rows={props.rows}
      getRowId={props.getRowId ?? ((row) => row.id)}
      loading={props.loading}
      empty={<EmptyState title={props.emptyTitle ?? "No records"} body={props.emptyBody ?? "Create the first record."} />}
    />
  );
}

export type ResourceFormProps = {
  fields: ResourceField[];
  initialValues?: Record<string, unknown>;
  submitLabel?: string;
  onSubmit: (values: Record<string, string>) => void | Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
};

export function ResourceForm(props: ResourceFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of props.fields) init[f.key] = String(props.initialValues?.[f.key] ?? "");
    return init;
  });
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    for (const f of props.fields) {
      if (f.required && !values[f.key]?.trim()) {
        setError(`${f.label} is required`);
        return;
      }
    }
    setError(null);
    await props.onSubmit(values);
  };

  return (
    <form className="space-y-4" onSubmit={submit}>
      {props.fields.map((f) => (
        <Field key={f.key} label={f.label} htmlFor={`rf-${f.key}`} required={f.required}>
          {f.type === "textarea" ? (
            <textarea
              id={`rf-${f.key}`}
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              className="w-full rounded-md border border-border bg-surface p-2 text-sm"
              rows={4}
            />
          ) : (
            <Input
              id={`rf-${f.key}`}
              type={f.type === "number" ? "number" : "text"}
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
            />
          )}
        </Field>
      ))}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="submit" variant="primary" loading={props.loading}>
          {props.submitLabel ?? "Save"}
        </Button>
        {props.onCancel ? (
          <Button type="button" variant="ghost" onClick={props.onCancel}>
            Cancel
          </Button>
        ) : null}
      </div>
    </form>
  );
}