// Phase 1: apps.sections.* keys for ALL locales in the shared catalog.
import { readdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";

const translations = {
  en: { label: "Applications", short: "Apps" },
  fa: { label: "اپلیکیشنها", short: "اپها" },
  ar: { label: "التطبيقات", short: "التطبيقات" },
  ja: { label: "アプリケーション", short: "アプリ" },
  tr: { label: "Uygulamalar", short: "Uyg." },
  it: { label: "Applicazioni", short: "App" },
  id: { label: "Aplikasi", short: "Apl." },
  de: { label: "Anwendungen", short: "Apps" },
  es: { label: "Aplicaciones", short: "Apps" },
  fr: { label: "Applications", short: "Apps" },
  hi: { label: "ऐप्स", short: "ऐप्स" },
  ko: { label: "애플리케이션", short: "앱" },
  pt: { label: "Aplicações", short: "Apps" },
  ru: { label: "Приложения", short: "Прил." },
  zh: { label: "应用", short: "应用" },
};

const dir = "packages/i18n/src/catalogs";
for (const file of readdirSync(dir)) {
  if (!file.endsWith(".ts") || file === "index.ts" || file === "types.ts") continue;
  const locale = file.replace(".ts", "");
  const value = translations[locale];
  if (!value) {
    console.log("no translation for", locale, "- skipping (add manually)");
    continue;
  }
  const path = `${dir}/${file}`;
  let s = readFileSync(path, "utf8");
  if (s.includes("sections: { label:")) {
    console.log(locale, "already has sections");
    continue;
  }
  const anchor = "  apps: {\n";
  const index = s.indexOf(anchor);
  if (index < 0) throw new Error("apps anchor not found in " + path);
  s = s.slice(0, index + anchor.length) + `    sections: { label: ${JSON.stringify(value.label)}, short: ${JSON.stringify(value.short)} },\n` + s.slice(index + anchor.length);
  writeFileSync(path, s);
  console.log(locale, "updated");
}
unlinkSync(new URL(import.meta.url));
