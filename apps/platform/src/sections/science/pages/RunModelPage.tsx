import { useState } from "react";
import { useI18n } from "@eco-nojin/i18n";
import { createHydromaClient } from "@eco-nojin/hydroma-client";
import { Button } from "@eco-nojin/ui";
import { ProvenancePanel } from "../components/ProvenancePanel";
import { HYDROMA_BASE_URL } from "../services/hydromaBaseUrl";

const BASE = HYDROMA_BASE_URL;

export function RunModelPage() {
  const { t } = useI18n();
  const [modelId, setModelId] = useState("");
  const [status, setStatus] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [provenance, setProvenance] = useState<unknown>(null);

  const run = async () => {
    if (!modelId) return;
    setStatus("running");
    setResult("");
    try {
      const client = createHydromaClient({ baseUrl: BASE });
      const run = await client.createRun(modelId, {});
      setStatus(run.status);
      const final = await client.getRun(run.id);
      setResult(JSON.stringify(final.result ?? final, null, 2));
      setProvenance(final.provenance ?? null);
      setStatus(final.status);
    } catch (e) {
      setStatus("error");
      setResult(String(e));
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-fg">{t("hydroma.runModel" as never)}</h1>
      <div className="flex gap-2">
        <input value={modelId} onChange={(e) => setModelId(e.target.value)} placeholder="model id" className="h-9 flex-1 rounded-md border border-border bg-surface px-3 text-sm" />
        <Button onClick={run} disabled={!modelId}>{t("hydroma.run" as never)}</Button>
      </div>
      <p className="text-sm text-fg-muted">Status: {status}</p>
      {result ? <pre className="overflow-auto rounded-md border border-border bg-surface-2 p-3 text-xs">{result}</pre> : null}
      <ProvenancePanel provenance={provenance} />
    </div>
  );
}