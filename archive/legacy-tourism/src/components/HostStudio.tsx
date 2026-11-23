import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@eco-nojin/i18n";
import { Badge, Button, Card, CardBody, CardHeader, Field, Input, Select, useToast } from "@eco-nojin/ui";
import type { TourismHost } from "@eco-nojin/domain-types";
import { pick } from "../lib/text";
import { useTourism } from "../content";

type DraftKind = "stay" | "experience" | "event" | "destination";

type Draft = {
  id: string;
  kind: DraftKind;
  title: string;
  capacity: number;
  priceMinor: number;
  createdAt: string;
};

type DocumentRef = { id: string; name: string };

const KINDS: DraftKind[] = ["stay", "experience", "event", "destination"];

function readList<T>(key: string): T[] {
  try {
    const raw = window.localStorage.getItem(key);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, value: T[]): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be blocked; the session still works in memory.
  }
}

/**
 * Host studio: local-only draft editing. It deliberately has no upload, no
 * approval call and no publication: every action is a browser-local demo.
 */
export function HostStudio({ host }: { host: TourismHost }) {
  const c = useTourism();
  const { locale } = useI18n();
  const { push } = useToast();

  const draftKey = `eco.tourism.host.${host.sellerId}.drafts`;
  const docKey = `eco.tourism.host.${host.sellerId}.documents`;
  const profileKey = `eco.tourism.host.${host.sellerId}.profile`;

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [documents, setDocuments] = useState<DocumentRef[]>([]);
  const [kind, setKind] = useState<DraftKind>("stay");
  const [title, setTitle] = useState("");
  const [capacity, setCapacity] = useState("2");
  const [priceMinor, setPriceMinor] = useState("1000000");
  const [documentName, setDocumentName] = useState("");

  useEffect(() => {
    const stored = readList<{ name: string; bio: string }>(profileKey)[0];
    setName(stored?.name || pick(host.name, locale));
    setBio(stored?.bio || pick(host.bio, locale));
    setDrafts(readList<Draft>(draftKey));
    setDocuments(readList<DocumentRef>(docKey));
    // Load once per seller/locale; subsequent edits stay in local state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftKey, docKey, host.sellerId, locale, profileKey]);

  const kindLabel = useMemo(
    () =>
      ({
        stay: c.host.studio.kindStay,
        experience: c.host.studio.kindExperience,
        event: c.host.studio.kindEvent,
        destination: c.host.studio.kindDestination,
      }) satisfies Record<DraftKind, string>,
    [c.host.studio],
  );

  const persistProfile = () => {
    writeList(profileKey, [{ name: name.trim(), bio: bio.trim() }]);
    push({ tone: "success", title: c.host.studio.saved });
  };

  const addDraft = () => {
    const next: Draft = {
      id: `draft_${Date.now().toString(36)}`,
      kind,
      title: title.trim(),
      capacity: Math.max(1, Number(capacity) || 1),
      priceMinor: Math.max(0, Number(priceMinor) || 0),
      createdAt: new Date().toISOString(),
    };
    const updated = [next, ...drafts];
    setDrafts(updated);
    writeList(draftKey, updated);
    setTitle("");
    push({ tone: "success", title: c.host.studio.draftSaved });
  };

  const removeDraft = (id: string) => {
    const updated = drafts.filter((draft) => draft.id !== id);
    setDrafts(updated);
    writeList(draftKey, updated);
  };

  const addDocument = () => {
    if (!documentName.trim()) return;
    const updated = [{ id: `doc_${Date.now().toString(36)}`, name: documentName.trim() }, ...documents];
    setDocuments(updated);
    writeList(docKey, updated);
    setDocumentName("");
  };

  const removeDocument = (id: string) => {
    const updated = documents.filter((item) => item.id !== id);
    setDocuments(updated);
    writeList(docKey, updated);
  };

  return (
    <Card>
      <CardHeader
        title={c.host.studio.title}
        subtitle={c.host.studio.subtitle}
        action={<Badge tone="warning">{c.host.studio.notConnected}</Badge>}
      />
      <CardBody className="space-y-5">
        <section aria-labelledby="studio-profile" className="space-y-3">
          <h3 id="studio-profile" className="text-xs font-semibold text-fg-muted">{c.host.studio.profileTitle}</h3>
          <Field label={c.host.studio.name} htmlFor="studio-name" required>
            <Input id="studio-name" value={name} onChange={(event) => setName(event.target.value)} />
          </Field>
          <Field label={c.host.studio.bio} htmlFor="studio-bio">
            <Input id="studio-bio" value={bio} onChange={(event) => setBio(event.target.value)} />
          </Field>
          <Button size="sm" variant="secondary" onClick={persistProfile} disabled={!name.trim()}>
            {c.host.studio.save}
          </Button>
        </section>

        <section aria-labelledby="studio-draft" className="space-y-3 border-t border-border pt-4">
          <h3 id="studio-draft" className="text-xs font-semibold text-fg-muted">{c.host.studio.draftTitle}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={c.host.studio.kind} htmlFor="studio-kind">
              <Select id="studio-kind" value={kind} onChange={(event) => setKind(event.target.value as DraftKind)}>
                {KINDS.map((item) => (
                  <option key={item} value={item}>{kindLabel[item]}</option>
                ))}
              </Select>
            </Field>
            <Field label={c.host.studio.listingTitle} htmlFor="studio-title" required>
              <Input id="studio-title" value={title} onChange={(event) => setTitle(event.target.value)} />
            </Field>
            <Field label={c.host.studio.capacity} htmlFor="studio-capacity">
              <Input id="studio-capacity" type="number" min={1} value={capacity} onChange={(event) => setCapacity(event.target.value)} />
            </Field>
            <Field label={c.host.studio.price} htmlFor="studio-price">
              <Input id="studio-price" type="number" min={0} step={100000} value={priceMinor} onChange={(event) => setPriceMinor(event.target.value)} />
            </Field>
          </div>
          <Button size="sm" onClick={addDraft} disabled={!title.trim()}>{c.host.studio.addDraft}</Button>

          <div>
            <p className="mb-2 text-2xs uppercase tracking-wide text-fg-subtle">{c.host.studio.drafts}</p>
            {drafts.length === 0 ? (
              <p className="text-xs text-fg-muted">{c.host.studio.emptyDrafts}</p>
            ) : (
              <ul className="space-y-2">
                {drafts.map((draft) => (
                  <li key={draft.id} className="flex items-start justify-between gap-2 rounded-md border border-border px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-fg">{draft.title}</p>
                      <p className="text-2xs text-fg-subtle">
                        {kindLabel[draft.kind]} · {draft.capacity} · {draft.priceMinor}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => removeDraft(draft.id)}>{c.bookings.cancel}</Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section aria-labelledby="studio-docs" className="space-y-3 border-t border-border pt-4">
          <h3 id="studio-docs" className="text-xs font-semibold text-fg-muted">{c.host.studio.documentsTitle}</h3>
          <p className="text-2xs text-fg-subtle">{c.host.studio.documentsNote}</p>
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[200px] flex-1">
              <Field label={c.host.studio.documentName} htmlFor="studio-doc">
                <Input id="studio-doc" value={documentName} onChange={(event) => setDocumentName(event.target.value)} />
              </Field>
            </div>
            <Button size="sm" variant="secondary" onClick={addDocument} disabled={!documentName.trim()}>
              {c.host.studio.addDocument}
            </Button>
          </div>
          {documents.length === 0 ? (
            <p className="text-xs text-fg-muted">{c.host.studio.emptyDocuments}</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {documents.map((item) => (
                <li key={item.id} className="inline-flex items-center gap-1 rounded-pill bg-surface-2 px-2 py-0.5 text-2xs text-fg-muted">
                  {item.name}
                  <button type="button" onClick={() => removeDocument(item.id)} aria-label={c.bookings.cancel} className="ms-1 text-fg-subtle hover:text-fg">×</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </CardBody>
    </Card>
  );
}
