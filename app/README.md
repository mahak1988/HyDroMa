# Eco Nojin — Web Front-end

Public website front-end for the Eco Nojin ecosystem (Eco Nojin · HyDroMA · Nojin Marketplace).
Zero runtime dependencies, fully offline, reproducible build. Reuses the **Eco Nojin Design System v2**
(`../brand/eco-nojin-design-system-v2`) for tokens, themes and components.

## Run

```bash
npm run dev       # build + serve at http://localhost:4173
npm run build     # build into ./dist only
npm run preview   # serve the existing ./dist
npm test          # node --test (i18n + structure + build integrity)
```

No `npm install` is required — there are no dependencies. Node 20+ only.

## Temporary architecture decision (recorded, reversible)

Framework/rendering selection is owner decision `AUDIT-MISS-01` / `B1` and is still **OPEN**.
To deliver runnable software without pre-empting that decision, this foundation uses the
**lowest-risk, reversible** path:

- plain **HTML + CSS + ES modules** (no framework, no bundler, no lock-in);
- a **zero-dependency Node build** (`build.mjs`) that assembles `./dist`;
- a **zero-dependency static server** (`serve.mjs`).

This can be replaced by any ratified framework later; nothing here is a final identity or
architecture decision. No colour, font or theme value is invented — all come from the
Design System tokens. See `../../DEVELOPMENT-FOUNDATION-REPORT.md` for the framework evaluation.

## Structure

```
app/
  build.mjs          zero-dep build -> dist/
  serve.mjs          zero-dep static server
  src/
    index.html       public home page (fa / RTL default, en / LTR ready)
    styles/home.css  page styles (tokens only)
    js/i18n.js       fa/en dictionaries + resolver (unit-tested)
    js/theme.js      theme A/B selection
    js/main.js       interactions (nav, theme, language, reveal, back-to-top)
  tests/             node --test suites
```

Design-system CSS, fonts and logos are copied from `../brand` at build time — never edited.

## Status (honest)

| Item | Status |
|---|---|
| Public home page (`PUB-01`) | `IMPLEMENTED` + `UNIT_TESTED` (26 tests) |
| Interactions | theme A/B, fa/en + RTL/LTR, mobile menu, scroll reveal, back-to-top |
| Build | reproducible, offline, no external requests |
| Scientific results | not in scope on this page; HyDroMA states shown as *unvalidated* |

No financial feature, token, wallet, carbon credit or operational API is active.
No Git, no remote, no deploy.