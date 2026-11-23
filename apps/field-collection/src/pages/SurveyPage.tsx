import { useState } from "react";
import { useI18n } from "@eco-nojin/i18n";
import { useObservations } from "../store/observations";
import { Button, Input } from "@eco-nojin/ui";

export function SurveyPage() {
  const { t } = useI18n();
  const { submit } = useObservations();
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const submitForm = (event: React.FormEvent) => {
    event.preventDefault();
    if (name.trim().length === 0) {
      setError(t("apps.field.surveyTitle" as never) + " required");
      setSavedId(null);
      return;
    }
    const obs = submit(name, note);
    setError(null);
    setSavedId(obs.id);
  };

  return (
    <form className="space-y-4 max-w-md" onSubmit={submitForm}>
      <h1 className="text-xl font-semibold text-fg">{t("apps.field.surveyTitle" as never)}</h1>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("apps.field.surveyTitle" as never)} aria-label={t("apps.field.surveyTitle" as never)} />
      <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Notes" className="w-full rounded-md border border-border bg-surface p-2 text-sm" rows={4} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {savedId ? <p className="text-sm text-success">{t("apps.field.surveySave" as never)} — {savedId}</p> : null}
      <Button type="submit">{t("apps.field.surveySave" as never)}</Button>
    </form>
  );
}