# Font & License Audit — 6 Families, 36 Files

**Date:** 2026-11-17. No font downloaded, replaced, or added. Reference unchanged.

## Families present

| Family | Files | Declared weights | Variable? | Notes |
|---|---|---|---|---|
| Vazirmatn | 3 | 300,400,500,600,700,800 | Yes (wght) | Persian + Latin |
| Estedad | 4 | 300,400,500,600,700,800 | Yes (wght) | Persian |
| Fraunces | 3 | 400,500,600,700 | Yes (opsz,wght) | Display serif; opsz auto = font-size |
| Manrope | 6 | 400,500,600,700,800 | Yes (wght 200-800) | All files internally named "Manrope ExtraLight" |
| DM Sans | 2 | 400,500,600,700,800 | Yes (wght 100-1000) | Internally "DM Sans 9pt" |
| IBM Plex Mono | 18 | 400,500,600 | No (static) | Regular/Medium/SemiBold x unicode-range subsets |

- **36 files, 36 unique content hashes** (no duplicates).
- **All 112 @font-face rules load without error** (forced document.fonts load of every face: 0 errors, 0 still-unloaded).
- Files are **variable fonts**; declaring 6 weights per family is legitimate (the browser instances wght), **not** faux-bold synthesis. No improper weight simulation detected.

## Referenced but NOT bundled (fallback only)

| Token | Value | Bundled? | Actual fallback |
|---|---|---|---|
| --font-en | **Inter** | No | Segoe UI / system-ui / sans-serif |
| --font-mono | **JetBrains Mono** | No | Consolas / monospace |

- The typography page shows "JetBrains Mono — 0x0B5563" but JetBrains Mono is not present; it renders in Consolas/monospace.
- **Source Serif 4, IBM Plex Sans, IBM Plex Sans Arabic**: **not referenced** in CSS/HTML at all — documentation-only mentions. Confirmed absent and unused.

## License

- **No LICENSE / OFL / COPYING file exists anywhere in the repo.** (0 files.)
- Each font embeds its license URL in the name table:
  - IBM Plex Mono -> http://scripts.sil.org/OFL
  - Fraunces -> https://scripts.sil.org/OFL
  - Vazirmatn -> https://scripts.sil.org/OFL
  - Estedad -> https://openfontlicense.org
  - DM Sans 9pt -> https://scripts.sil.org/OFL
  - Manrope ExtraLight -> https://openfontlicense.org
- **All six are SIL Open Font License 1.1 (OFL).** Commercial use is permitted; fonts may not be sold on their own; no per-seat commercial license is required. **This is a license identification from embedded metadata, not legal advice.**

## Finding

**Missing license files.** The fonts are OFL (permissive) but the repo ships no license text. Recommendation: add the OFL 1.1 text and/or each font's OFL file alongside assets/fonts/ before any external distribution. This is a documentation/compliance gap, not a usage blocker.

## Verdict

Font loading **PASS**. Weight integrity **PASS**. License documentation **FAIL (missing files)** — flagged for owner action.