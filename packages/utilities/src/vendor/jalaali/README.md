# jalaali-js (vendored)

| | |
|---|---|
| Upstream | https://github.com/jalaali/jalaali-js |
| Licence | MIT (see `LICENSE`) |
| Copyright | © 2020 Behrang Norouzinia |
| Retrieved | 2026-11-20 |
| Files | `jalaali.ts` (ported from `index.js`) |

## Why vendored instead of a dependency

The conversion is ~180 lines of arithmetic with no runtime dependencies, and the
project already ships a typed utilities package. Vendoring keeps the supply chain
small, makes the algorithm auditable, and avoids a package that is only a few
functions.

## What changed

- CommonJS → ES module with named exports.
- Types added; the arithmetic is untouched.
- Verified against ICU (`Intl.DateTimeFormat` with `ca-persian`) for 400+ dates in
  `packages/utilities/tests/jalali.test.ts`.

## Maintenance

If the upstream algorithm changes, replace `jalaali.ts` wholesale and keep the
header. Do not “improve” the arithmetic locally: the test compares it to ICU, and a
local tweak would silently diverge from both.
