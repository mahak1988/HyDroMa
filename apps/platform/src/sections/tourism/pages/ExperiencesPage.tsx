import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { EmptyState, Input, Select } from "@eco-nojin/ui";
import { useTourism } from "../content";
import { ALL_EXPERIENCE_TYPES, EXPERIENCES } from "../data/tourism";
import { ExperienceCard, PageHeader } from "../components/Cards";

export function ExperiencesPage() {
  const c = useTourism();
  const { locale } = useI18n();
  const [params, setParams] = useSearchParams();
  const type = params.get("type") ?? "";
  const q = params.get("q") ?? "";

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return EXPERIENCES.filter((experience) => {
      if (type && experience.type !== type) return false;
      if (!needle) return true;
      const haystack = [experience.title.en, experience.title.fa, experience.title.ar, experience.summary.en, experience.summary.fa, experience.summary.ar]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [type, q]);

  return (
    <div>
      <PageHeader eyebrow={c.ui.brand} title={c.experiences.title} subtitle={c.experiences.subtitle} />

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_16rem]">
        <div>
          <label className="sr-only" htmlFor="exp-q">{c.experiences.title}</label>
          <Input id="exp-q" type="search" value={q} onChange={(event) => update("q", event.target.value)} placeholder={c.ui.searchPlaceholder} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-fg" htmlFor="exp-type">{c.destinations.filterKind}</label>
          <Select id="exp-type" value={type} onChange={(event) => update("type", event.target.value)}>
            <option value="">{c.ui.all}</option>
            {ALL_EXPERIENCE_TYPES.map((item) => (
              <option key={item} value={item}>{c.experiences.types[item]}</option>
            ))}
          </Select>
        </div>
      </div>

      <p className="mt-3 text-2xs text-fg-subtle">{results.length} {c.ui.results} · {locale.toUpperCase()}</p>

      {results.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title={c.experiences.empty}
            body={c.experiences.emptyBody}
            action={
              <button type="button" onClick={() => setParams(new URLSearchParams(), { replace: true })} className="text-sm font-medium text-primary hover:underline">
                {c.ui.clear}
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((experience) => (
            <ExperienceCard key={experience.id} experience={experience} />
          ))}
        </div>
      )}
    </div>
  );
}