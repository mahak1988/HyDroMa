import { useEffect } from "react";

const SITE_URL = (import.meta.env.VITE_SITE_URL as string | undefined) ?? "https://eco-nojin.example";

function setMeta(selector: string, attrs: Record<string, string>): void {
  let element = document.head.querySelector<HTMLMetaElement | HTMLLinkElement>(selector);
  if (!element) {
    element = document.createElement(selector.startsWith("link") ? "link" : "meta");
    for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
    document.head.appendChild(element);
  }
  for (const [name, value] of Object.entries(attrs)) {
    if (name !== "content" && name !== "href") element.setAttribute(name, value);
  }
}

/** Per-page SEO metadata, applied in the browser and captured by the static prerender. */
export function usePageMeta(input: { title: string; description: string; path: string; locale: string }) {
  useEffect(() => {
    const canonical = new URL(input.path === "/" ? "/" : input.path, SITE_URL).toString();
    document.title = `${input.title} · Eco Nojin`;

    const ensure = (attrs: Record<string, string>) => {
      const selector = `meta[${Object.keys(attrs)[0]}="${Object.values(attrs)[0]}"]`;
      setMeta(selector, attrs);
      const element = document.head.querySelector(selector);
      if (element && attrs.content !== undefined) element.setAttribute("content", attrs.content);
    };

    ensure({ name: "description", content: input.description });
    ensure({ property: "og:title", content: `${input.title} · Eco Nojin` });
    ensure({ property: "og:description", content: input.description });
    ensure({ property: "og:type", content: "website" });
    ensure({ property: "og:url", content: canonical });
    ensure({ property: "og:locale", content: input.locale });
    ensure({ name: "twitter:card", content: "summary_large_image" });
    ensure({ name: "twitter:title", content: `${input.title} · Eco Nojin` });
    ensure({ name: "twitter:description", content: input.description });

    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = canonical;
  }, [input.description, input.locale, input.path, input.title]);
}