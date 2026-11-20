import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { EmptyState, Input, Select } from "@eco-nojin/ui";
import { useTourism } from "../content";
import { ALL_STAY_KINDS, DESTINATIONS, STAYS, destinationById } from "../data/tourism";
import { PageHeader, StayCard } from "../components/Cards";

export function StaysPage() {
  const c = useTourism();
  const { locale } = useI18n();
  const [params, setParams] = useSearchParams();
  const destination = params.get("destination") ?? "";
  const kind = params.get("kind") ?? "";
  const q = params.get("q") ?? "";

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return STAYS.filter((stay) => {
      if (destination && stay.destinationRef !== destination) return false;
      if (kind && stay.kind !== kind) return false;
      if (!needle) return true;
      const place = stay.destinationRef ? destinationById(stay.destinationRef) : undefined;
      const haystack = [stay.name.en, stay.name.fa, stay.name.ar, stay.summary.en, stay.summary.fa, stay.summary.ar, place?.name.en ?? "", place?.region ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [destination, kind, q]);

  return (
    <div>
      <PageHeader eyebrow={c.ui.brand} title={c.stays.title} subtitle={c.stays.subtitle} />

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_14rem_14rem]">
        <div>
          <label className="sr-only" htmlFor="stay-q">{c.destinations.searchPlaceholder}</label>
          <Input id="stay-q" type="search" value={q} onChange={(event) => update("q", event.target.value)} placeholder={c.destinations.searchPlaceholder} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-fg" htmlFor="stay-kind">{c.destinations.filterKind}</label>
          <Select id="stay-kind" value={kind} onChange={(event) => update("kind", event.target.value)}>
            <option value="">{c.ui.all}</option>
            {ALL_STAY_KINDS.map((item) => (
              <option key={item} value={item}>{c.stays.kinds[item]}</option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-fg" htmlFor="stay-destination">{c.destinations.title}</label>
          <Select id="stay-destination" value={destination} onChange={(event) => update("destination", event.target.value)}>
            <option value="">{c.ui.all}</option>
            {DESTINATIONS.map((item) => (
              <option key={item.id} value={item.id}>{item.name[locale === "fa" ? "fa" : locale === "ar" ? "ar" : "en"]}</option>
            ))}
          </Select>
        </div>
      </div>

      <p className="mt-3 text-2xs text-fg-subtle">{results.length} {c.ui.results}</p>

      {results.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title={c.stays.empty}
            body={c.stays.emptyBody}
            action={
              <button type="button" onClick={() => setParams(new URLSearchParams(), { replace: true })} className="text-sm font-medium text-primary hover:underline">
                {c.ui.clear}
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((stay) => (
            <StayCard key={stay.id} stay={stay} />
          ))}
        </div>
      )}
    </div>
  );
}