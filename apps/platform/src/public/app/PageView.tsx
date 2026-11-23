import { Link } from "react-router-dom";
import { useI18n } from "@eco-nojin/i18n";
import { usePageMeta } from "./meta";
import { useSite } from "../content/useContent";
import type { PageKey } from "../content/types";
import { Sections } from "../components/Sections";
import { LandscapeArt, TopoPattern } from "../components/Artwork";
import { ContactForm } from "../components/ContactForm";

export function PageView({ pageKey, path }: { pageKey: PageKey; path: string }) {
  const site = useSite();
  const { locale } = useI18n();
  const page = site.pages[pageKey];
  usePageMeta({ title: page.title, description: page.description, path, locale });

  return (
    <article>
      <header className="relative overflow-hidden">
        <TopoPattern />
        <div className="relative z-10 grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-[1.15fr_1fr] lg:py-16">
          <div className="min-w-0">
            <p className="inline-flex items-center rounded-pill border border-primary/25 bg-primary-soft px-3 py-1 text-2xs font-medium uppercase tracking-wide text-primary-soft-fg">
              {page.eyebrow}
            </p>
            <h1 className="display mt-4 text-3xl text-fg sm:text-4xl lg:text-5xl">{page.title}</h1>
            <p className="lead mt-4">{page.lead}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/contact"
                className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-fg shadow-e1 transition-colors hover:bg-primary-hover"
              >
                {site.ui.contactCta}
              </Link>
              <a href="#content" className="inline-flex h-10 items-center rounded-md border border-border-strong bg-surface px-4 text-sm text-fg hover:bg-surface-2">
                ↓
              </a>
            </div>
          </div>
          {pageKey === "home" ? (
            <div className="relative">
              <LandscapeArt className="w-full rounded-2xl border border-border shadow-e3" />
            </div>
          ) : (
            <div aria-hidden="true" className="hidden justify-self-end lg:block">
              <LandscapeArt className="w-[26rem] rounded-2xl border border-border opacity-90 shadow-e2" />
            </div>
          )}
        </div>
      </header>

      <div id="content" className="pt-6">
        <Sections blocks={page.blocks} />
        {pageKey === "contact" ? (
          <div className="mt-14">
            <ContactForm />
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function NotFoundPage() {
  const site = useSite();
  usePageMeta({
    title: site.ui.notFoundTitle,
    description: site.ui.notFoundBody,
    path: "/404",
    locale: site.locale,
  });
  return (
    <div className="mx-auto max-w-lg py-24 text-center">
      <p className="text-4xl font-semibold text-fg">404</p>
      <h1 className="mt-2 text-xl font-semibold text-fg">{site.ui.notFoundTitle}</h1>
      <p className="mt-2 text-sm text-fg-muted">{site.ui.notFoundBody}</p>
      <a href="/" className="mt-6 inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-fg">
        {site.ui.backHome}
      </a>
    </div>
  );
}