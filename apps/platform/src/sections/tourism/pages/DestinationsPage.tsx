import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { EmptyState, Input, Select } from "@eco-nojin/ui";
import { useTourism } from "../content";
import { ALL_KINDS, DESTINATIONS } from "../data/tourism";
import type { DestinationKind } from "@eco-nojin/domain-types";
import { DestinationCard, PageHeader } from "../components/Cards";

export function DestinationsPage() {
  const c = useTourism();
  const { locale } = useI18n();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const kind = params.get("kind") ?? "";

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return DESTINATIONS.filter((destination) => {
      if (kind && destination.kind !== kind) return false;
      if (!needle) return true;
      const haystack = [
        destination.name.en,
        destination.name.fa,
        destination.name.ar,
        destination.summary.en,
        destination.summary.fa,
        destination.summary.ar,
        destination.region,
        destination.country,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [kind, q]);

  return (
    <div>
      <PageHeader eyebrow={c.ui.brand} title={c.destinations.title} subtitle={c.destinations.subtitle} />

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_16rem]">
        <div>
          <label className="sr-only" htmlFor="dest-q">
            {c.destinations.searchPlaceholder}
          </label>
          <Input
            id="dest-q"
            type="search"
            value={q}
            onChange={(event) => update("q", event.target.value)}
            placeholder={c.destinations.searchPlaceholder}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-fg" htmlFor="dest-kind">
            {c.destinations.filterKind}
          </label>
          <Select id="dest-kind" value={kind} onChange={(event) => update("kind", event.target.value)}>
            <option value="">{c.ui.all}</option>
            {ALL_KINDS.map((item: DestinationKind) => (
              <option key={item} value={item}>
                {c.destinations.kinds[item]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <p className="mt-3 text-2xs text-fg-subtle">
        {results.length} {c.ui.results} · {locale.toUpperCase()}
      </p>

      {results.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            title={c.destinations.empty}
            body={c.destinations.emptyBody}
            action={
              <button type="button" onClick={() => setParams(new URLSearchParams(), { replace: true })} className="text-sm font-medium text-primary hover:underline">
                {c.ui.clear}
              </button>
            }
          />
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((destination) => (
            <DestinationCard key={destination.id} destination={destination} />
          ))}
        </div>
      )}
    </div>
  );
}