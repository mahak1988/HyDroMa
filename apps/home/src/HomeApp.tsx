import { PRODUCT_APPS } from "@eco-nojin/configuration";
import { useTheme } from "@eco-nojin/frontend-core/theme";
import { useI18n, type TranslationKey } from "@eco-nojin/i18n";
import { Icon, type IconName } from "@eco-nojin/icons";

/**
 * The unified entry point.
 *
 * Every tile is driven by `@eco-nojin/configuration` — the same registry the dev
 * server, the production host and the in-app switcher read. There is exactly one
 * place to add an application.
 */
const CARD_ICON: Record<string, IconName> = {
  portal: "land",
  console: "chart",
  "scientific-workspace": "water",
  marketplace: "market",
  tourism: "tourism",
  brand: "model",
  platform: "services",
};

const TITLE_KEYS: Record<string, TranslationKey> = {
  portal: "apps.portal.title",
  console: "apps.console.title",
  "scientific-workspace": "apps.science.title",
  marketplace: "apps.market.title",
  tourism: "apps.tourism.title",
  brand: "apps.brand.title",
  platform: "apps.platform.title",
};

const BODY_KEYS: Record<string, TranslationKey> = {
  portal: "apps.portal.body",
  console: "apps.console.body",
  "scientific-workspace": "apps.science.body",
  marketplace: "apps.market.body",
  tourism: "apps.tourism.body",
  brand: "apps.brand.body",
  platform: "apps.platform.body",
};

export function HomeApp() {
  const { t, locale, setLocale, locales } = useI18n();
  const { mode, setMode } = useTheme();

  return (
    <>
      <a className="skip-link" href="#apps">
        {t("common.skipToContent")}
      </a>

      <div className="home">
        <header className="home__bar">
          <div className="home__brand">
            <span className="home__mark" aria-hidden="true">
              <Icon name="water" size={22} />
            </span>
            <span>
              <strong>{t("common.appName")}</strong>
              <small>{t("apps.home.title")}</small>
            </span>
          </div>

          <div className="home__controls">
            <div className="home__seg" role="group" aria-label={t("common.language")}>
              {locales
                .filter((item) => item.enabled)
                .map((item) => (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => setLocale(item.code)}
                    aria-pressed={item.code === locale}
                    className="home__segBtn"
                  >
                    {item.nativeName}
                  </button>
                ))}
            </div>

            <div className="home__seg" role="group" aria-label={t("common.theme")}>
              {(["light", "dark", "system"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMode(option)}
                  aria-pressed={mode === option}
                  className="home__segBtn"
                >
                  {t(`common.${option}` as TranslationKey)}
                </button>
              ))}
            </div>
          </div>
        </header>

        <main>
          <section className="home__hero">
            <h1>{t("apps.home.title")}</h1>
            <p className="home__lede">{t("apps.home.body")}</p>
          </section>

          <section id="apps" aria-label={t("switcher.label")}>
            <ul className="home__grid">
              {PRODUCT_APPS.map((app) => (
                <li key={app.id} className={`home__card home__card--${app.accent}`}>
                  <a className="home__cardLink" href={app.path}>
                    <span className="home__icon" aria-hidden="true">
                      <Icon name={CARD_ICON[app.id] ?? "model"} size={24} />
                    </span>
                    <h2>{t(TITLE_KEYS[app.id] ?? "apps.home.title")}</h2>
                    <p>{t(BODY_KEYS[app.id] ?? "apps.home.body")}</p>
                    <span className="home__enter">
                      {t("apps.home.enter")}
                      <span aria-hidden="true"> ←</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <p className="home__note">{t("apps.home.note")}</p>
        </main>

        <footer className="home__footer">
          <span>{t("common.appName")}</span>
          <span aria-hidden="true">·</span>
          <span>v0.1.0</span>
        </footer>
      </div>
    </>
  );
}