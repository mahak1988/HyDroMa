
type ProvenanceData = {
  artifact_hash?: string;
  result_hash?: string;
  input_hash?: string;
  config_hash?: string;
  definition_hash?: string;
  workflow_hash?: string;
  verification_status?: string;
  [key: string]: unknown;
};

export type ProvenancePanelProps = {
  provenance: unknown;
};

export function ProvenancePanel({ provenance }: ProvenancePanelProps) {
  if (!provenance) return null;
  const p = (typeof provenance === "object" && provenance !== null ? provenance : {}) as ProvenanceData;
  const hashKeys = ["artifact_hash", "result_hash", "input_hash", "config_hash", "definition_hash", "workflow_hash"] as const;
  const present = hashKeys.filter((k) => typeof p[k] === "string");
  return (
    <section className="rounded-lg border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold text-fg">Provenance</h2>
      {p.verification_status ? (
        <p className="mt-1 text-xs text-fg-muted">Verification: {String(p.verification_status)}</p>
      ) : null}
      {present.length > 0 ? (
        <dl className="mt-2 space-y-1 text-2xs text-fg-muted">
          {present.map((k) => (
            <div key={k} className="flex gap-2">
              <dt className="text-fg-subtle">{k}:</dt>
              <dd className="numeric break-all">{String(p[k]).slice(0, 16)}…</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <details className="mt-2">
        <summary className="cursor-pointer text-2xs text-fg-subtle">Raw</summary>
        <pre className="mt-1 max-h-48 overflow-auto text-xs text-fg-muted">
          {JSON.stringify(provenance, null, 2)}
        </pre>
      </details>
    </section>
  );
}