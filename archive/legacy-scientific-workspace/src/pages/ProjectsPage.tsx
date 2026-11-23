import { useEffect, useState } from "react";
import { FolderPlus, Trash2 } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import type { TranslationKey } from "@eco-nojin/i18n";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Checkbox,
  Dialog,
  EmptyState,
  Field,
  Input,
  Select,
  Table,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  useToast,
} from "@eco-nojin/ui";
import { PageLead } from "../components/Cards";
import { useWorkspace } from "../app/WorkspaceContext";
import { INDICATORS, STUDY_AREAS, SCENARIOS, indicatorById } from "../data/indicators";

const STORAGE_KEY = "eco.hydro.studies";

type Study = {
  id: string;
  name: string;
  areaId: string;
  indicatorIds: string[];
  scenarioId: string;
  createdAt: string;
};

function load(): Study[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Study[]) : [];
  } catch {
    return [];
  }
}

export function ProjectsPage() {
  const { t, format } = useI18n();
  const { area } = useWorkspace();
  const { push } = useToast();
  const [studies, setStudies] = useState<Study[]>([]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [form, setForm] = useState({ name: "", areaId: area.id, scenarioId: "baseline", indicatorIds: ["ndvi", "soilMoisture"] });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setStudies(load()), []);

  const persist = (next: Study[]) => {
    setStudies(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // storage may be blocked; state still works for this session
    }
  };

  const create = () => {
    if (form.name.trim().length < 2) {
      setError(t("validation.nameTooShort"));
      return;
    }
    if (form.indicatorIds.length === 0) {
      setError(t("hydro.form.selectAtLeast"));
      return;
    }
    const study: Study = {
      id: `study-${Date.now()}`,
      name: form.name.trim(),
      areaId: form.areaId,
      scenarioId: form.scenarioId,
      indicatorIds: form.indicatorIds,
      createdAt: new Date().toISOString(),
    };
    persist([study, ...studies]);
    push({ tone: "success", title: t("hydro.projects.saved") });
    setOpen(false);
    setError(null);
    setForm({ name: "", areaId: area.id, scenarioId: "baseline", indicatorIds: ["ndvi", "soilMoisture"] });
  };

  const toggleCompare = (id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : current.length >= 2 ? [current[1] ?? id, id] : [...current, id],
    );
  };

  const compared = selected.map((id) => studies.find((study) => study.id === id)).filter((item): item is Study => Boolean(item));

  return (
    <div>
      <PageLead
        title={t("hydro.projects.title")}
        subtitle={t("hydro.projects.subtitle")}
        aside={
          <Button variant="primary" icon={<FolderPlus className="size-4" aria-hidden="true" />} onClick={() => setOpen(true)}>
            {t("hydro.projects.create")}
          </Button>
        }
      />

      <Alert tone="info" title={t("hydro.statusDemo")}>
        {t("hydro.projects.demoNote")}
      </Alert>

      <Card className="mt-4">
        <CardHeader title={t("hydro.projects.title")} subtitle={t("hydro.projects.subtitle")} />
        <CardBody>
          {studies.length === 0 ? (
            <EmptyState title={t("hydro.projects.empty")} body={t("hydro.projects.emptyBody")} />
          ) : (
            <Table caption={t("hydro.projects.title")}>
              <THead>
                <tr>
                  <Th><span className="sr-only">{t("hydro.projects.compare")}</span></Th>
                  <Th>{t("hydro.form.name")}</Th>
                  <Th>{t("hydro.form.landscape")}</Th>
                  <Th>{t("hydro.form.indicators")}</Th>
                  <Th>{t("hydro.form.scenario")}</Th>
                  <Th>{t("hydro.updated")}</Th>
                  <Th><span className="sr-only">{t("hydro.projects.delete")}</span></Th>
                </tr>
              </THead>
              <TBody>
                {studies.map((study) => (
                  <Tr key={study.id}>
                    <Td>
                      <Checkbox
                        label=""
                        aria-label={`${t("hydro.projects.compare")} ${study.name}`}
                        checked={selected.includes(study.id)}
                        onChange={() => toggleCompare(study.id)}
                      />
                    </Td>
                    <Td className="font-medium text-fg">{study.name}</Td>
                    <Td>
                      <Badge tone="neutral">
                        {t(STUDY_AREAS.find((item) => item.id === study.areaId)?.nameKey as TranslationKey) ?? study.areaId}
                      </Badge>
                    </Td>
                    <Td className="text-2xs text-fg-muted">
                      {study.indicatorIds.map((id) => t(indicatorById(id)?.labelKey as TranslationKey)).join(" · ")}
                    </Td>
                    <Td>
                      <Badge tone="primary">{t(SCENARIOS.find((item) => item.id === study.scenarioId)?.labelKey as TranslationKey)}</Badge>
                    </Td>
                    <Td className="text-2xs text-fg-subtle">{format.date(study.createdAt)}</Td>
                    <Td>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`${t("hydro.projects.delete")} ${study.name}`}
                        icon={<Trash2 className="size-3.5" aria-hidden="true" />}
                        onClick={() => persist(studies.filter((item) => item.id !== study.id))}
                      />
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {compared.length === 2 ? (
        <Card className="mt-4">
          <CardHeader title={t("hydro.projects.compareTitle")} subtitle={t("hydro.statusDemo")} />
          <CardBody>
            <Table caption={t("hydro.projects.compareTitle")}>
              <THead>
                <tr>
                  <Th>{t("hydro.dashboard.indicatorsTitle")}</Th>
                  {compared.map((study) => (
                    <Th key={study.id}>{study.name}</Th>
                  ))}
                  <Th>{t("hydro.simulation.delta")}</Th>
                </tr>
              </THead>
              <TBody>
                {[...new Set(compared.flatMap((study) => study.indicatorIds))].map((indicatorId) => {
                  const indicator = indicatorById(indicatorId);
                  if (!indicator) return null;
                  const values = compared.map((study) => (study.indicatorIds.includes(indicatorId) ? indicator.value : null));
                  const delta = values[0] != null && values[1] != null ? values[1] - values[0] : null;
                  return (
                    <Tr key={indicatorId}>
                      <Td className="text-fg">{t(indicator.labelKey as TranslationKey)}</Td>
                      {values.map((value, index) => (
                        <Td key={index} className="numeric">
                          {value ?? "—"} <span className="text-2xs text-fg-subtle">{t(`hydro.units.${indicator.unit}` as TranslationKey)}</span>
                        </Td>
                      ))}
                      <Td className="numeric text-fg-muted">{delta == null ? "—" : delta.toFixed(indicator.decimals)}</Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
          </CardBody>
        </Card>
      ) : null}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={t("hydro.projects.create")}
        description={t("hydro.projects.demoNote")}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              {t("hydro.form.cancel")}
            </Button>
            <Button variant="primary" onClick={create}>
              {t("hydro.form.create")}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error ? (
            <div role="alert" className="rounded-md border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger-soft-fg">
              {error}
            </div>
          ) : null}
          <Field label={t("hydro.form.name")} htmlFor="study-name" required>
            <Input id="study-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("hydro.form.landscape")} htmlFor="study-area">
              <Select id="study-area" value={form.areaId} onChange={(event) => setForm((current) => ({ ...current, areaId: event.target.value }))}>
                {STUDY_AREAS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {t(item.nameKey as TranslationKey)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("hydro.form.scenario")} htmlFor="study-scenario">
              <Select id="study-scenario" value={form.scenarioId} onChange={(event) => setForm((current) => ({ ...current, scenarioId: event.target.value }))}>
                {SCENARIOS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {t(item.labelKey as TranslationKey)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <fieldset className="space-y-2">
            <legend className="text-xs font-medium text-fg">{t("hydro.form.indicators")}</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {INDICATORS.slice(0, 8).map((indicator) => (
                <Checkbox
                  key={indicator.id}
                  label={t(indicator.labelKey as TranslationKey)}
                  checked={form.indicatorIds.includes(indicator.id)}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      indicatorIds: event.target.checked
                        ? [...current.indicatorIds, indicator.id]
                        : current.indicatorIds.filter((id) => id !== indicator.id),
                    }))
                  }
                />
              ))}
            </div>
          </fieldset>
        </div>
      </Dialog>
    </div>
  );
}