import { Link } from "react-router-dom";
import { Compass, ShieldAlert, ShieldCheck } from "lucide-react";
import { useI18n } from "@eco-nojin/i18n";
import { Badge, Card, CardBody, EmptyState } from "@eco-nojin/ui";
import { useTourism } from "../content";
import { pick } from "../lib/text";
import { NOMADIC_COMMUNITIES } from "../data/tourism";
import { PageHeader, SectionTitle } from "../components/Cards";
import { SceneArt } from "../components/SceneArt";

export function NomadicPage() {
  const { locale } = useI18n();
  const c = useTourism();

  return (
    <div>
      <PageHeader eyebrow={c.ui.brand} title={c.nomadic.title} subtitle={c.nomadic.subtitle} />

      <div className="mt-5 rounded-lg border border-border bg-surface p-4">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-fg">{c.nomadic.consentTitle}</p>
            <p className="mt-1 text-xs leading-relaxed text-fg-muted">{c.nomadic.consentBody}</p>
          </div>
        </div>
      </div>

      {NOMADIC_COMMUNITIES.length === 0 ? (
        <div className="mt-5">
          <EmptyState title={c.nomadic.empty} body={c.nomadic.emptyBody} />
        </div>
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {NOMADIC_COMMUNITIES.map((community) => (
            <Card key={community.id} as="article" className="h-full">
              <CardBody className="flex h-full flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base font-semibold text-fg">{pick(community.name, locale)}</h2>
                  <Badge tone={community.consent.published ? "success" : "danger"}>
                    {community.consent.published ? (
                      <span className="inline-flex items-center gap-1"><ShieldCheck className="size-3" aria-hidden="true" />{c.nomadic.consentGranted}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1"><ShieldAlert className="size-3" aria-hidden="true" />{c.nomadic.consentWithheld}</span>
                    )}
                  </Badge>
                </div>
                <p className="text-xs leading-relaxed text-fg-muted">{pick(community.summary, locale)}</p>
                <div className="flex flex-wrap gap-2 text-2xs text-fg-subtle">
                  <span className="rounded-pill bg-surface-2 px-2 py-0.5">{community.zones.length} {c.nomadic.zonesTitle}</span>
                  <span className="rounded-pill bg-surface-2 px-2 py-0.5">{community.routes.length} {c.nomadic.routesTitle}</span>
                  <span className="rounded-pill bg-surface-2 px-2 py-0.5">{community.camps.length} {c.nomadic.campsTitle}</span>
                </div>
                <p className="text-2xs text-fg-subtle">{pick(community.consent.note, locale)}</p>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <SceneArt seed={community.artworkSeed} variant="nomadic" className="h-24 w-40 rounded-md" label={pick(community.name, locale)} />
                  <Link
                    to={`/nomadic/${community.slug}`}
                    className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-fg hover:bg-primary-hover"
                  >
                    <Compass className="size-3.5" aria-hidden="true" />
                    {c.nomadic.openDetail}
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <section className="mt-8">
        <SectionTitle title={c.home.nomadicTitle} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            c.nomadic.zonesTitle,
            c.nomadic.routesTitle,
            c.nomadic.campsTitle,
            c.nomadic.consentTitle,
          ].map((label) => (
            <div key={label} className="rounded-md border border-border bg-surface px-3 py-2 text-xs text-fg-muted">
              {label}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}