# Keyboard & Screen-Reader Test

**Date:** 2026-11-17.

## Keyboard (executed)

| Test | Result |
|---|---|
| Tab order | skip-link -> theme buttons -> nav links -> theme-bar buttons -> locale buttons; hidden panels no longer tabbable |
| Shift+Tab | wraps correctly |
| Focus visibility | all focusable elements show a visible outline (2px accent) — 0 without indicator |
| Focus order logical | yes |
| Keyboard trap | none |
| Skip navigation | added (Skip to main content) |
| Arrow keys in tabs | demo tablist supports Left/Right/Up/Down/Home/End (roving tabindex) |
| Escape | no crash / no unexpected state |

**Before fix:** the 6 form inputs were unlabeled, and the demo forms in the components panel could be reached even when it was not the visible panel. Fixed: all inputs labeled; inactive panels are truly hidden so only the active panel's controls are tabbable.

## Screen reader

**Status: NOT_TESTED.**

No screen reader (NVDA, JAWS, VoiceOver, TalkBack) is available in this environment. Per mission rules, **ARIA code review is not equivalent to a screen-reader test**, so this is reported honestly as NOT_TESTED.

### Static ARIA/structure review (not a substitute)

| Item | Status |
|---|---|
| Heading hierarchy | h1 -> h2 -> h3, no skipped levels |
| Landmarks | header, nav (aria-label="Sections"), main, footer |
| Button names | all buttons have text |
| Input labels | all inputs/selects/textareas have label-for or aria-label (was 6 unlabeled) |
| Form error association | email input has aria-describedby + aria-invalid |
| Tab roles | demo tablist has role=tablist / role=tab / aria-selected |
| Alert announcements | alerts present but no role="alert"/aria-live (static review note) |
| Table headers | th used |
| SVG accessibility | all 9 logos have descriptive alt + internal title/desc |

### Recommended follow-up (owner action, not applied)

Add role="alert"/aria-live="polite" to the alert components, and run a real screen-reader pass before claiming WCAG screen-reader conformance.

## Verdict

Keyboard **PASS**. Screen reader **NOT_TESTED** (tool unavailable).