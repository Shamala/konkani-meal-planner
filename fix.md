# Fix list

Open items found while building Phase 1. Add new ones at the bottom.

| # | Item | Where | Status |
|---|------|-------|--------|
| 1 | Untagged season candidates (alambe, tender thur, tender cucumber, tender shoots, gooseberry) need owner confirmation | `extraction/ROLE-MAP.md` | ✅ Decided (2026-11-15): not seasonal, stay untagged |
| 2 | Glossary is unproofread and Kannada only | `extraction/glossary.tier1.json` | Open |
| 3 | No source for dish Kannada names | `ROLE-MAP.md` | ✅ Decided (2026-11-15): show English or the book's own name |
| 4 | Two-page dishes need `alsoOnPages` in the Recipe type and on the Dish screen | `app/src/model/types.ts` | ✅ Done (2026-11-12): `alsoOnPages` is in `app/src/ui/corpus.ts`, shown on `Dish.tsx`, covered by `ui.test.ts` |
| 5 | "Horse gram upkari" p.8 may be a pointer, not a recipe | corpus | ✅ Decided (2026-11-15): it is a recipe; may point to another page |
| 6 | Optional vegetable side: engine always fills it (D5c) | `DECISIONS.md` | ✅ Decided (2026-11-13): always included in v1, no engine change. `REQUIREMENTS.md` §3.3 still to be updated |
| 7 | GitHub Actions warn that Node 20 actions are deprecated | `.github/workflows/pages.yml` | ✅ Edited (2026-11-12), unconfirmed until next CI run: checkout v7, setup-node v7, upload-pages-artifact v5, deploy-pages v5. Each action's `action.yml` at that release declares node24 (checked via `gh api`; upload-pages-artifact is composite). Deprecation warning is only confirmed gone after the next push to main runs the workflow |
| 8 | Offline use after first load not tested on the live site | live URL | Not verified. Cannot be tested locally; the build does produce a service worker precaching 7 entries (2026-11-12), but that is not evidence for the live site. Owner: load the live URL once, go offline, reload |
| 9 | `canEditSlot` is `date >= today`, so swap and assign are allowed on today. Must be after today (LIF-20, LIF-23) | `app/src/engine/lifecycle.ts:38` | ✅ Fixed (2026-11-15): `date > today`; tests updated |
| 10 | Season month taken from the week's Monday, not each day's date (DECISIONS "Other") | `generate.ts:86`, `slotWrites.ts:110` | ✅ Fixed (2026-11-15): month taken per day; corpus test now asserts each day's own month |
| 11 | An off-plan mark suppresses the planned dishes' implicit record. D3 and HST-08 say it must cancel none | `app/src/engine/history.ts:24` | ✅ Fixed (2026-11-15): off-plan mark no longer suppresses planned records; test reversed |
| 12 | Swap writes `cooked: false`, so it would drop a cooked mark. Moot once #9 is fixed, because swap then never reaches a day with marks | `slotWrites.ts:135` | ✅ Moot after #9: swap never reaches a day that can hold a cooked mark |
| 13 | Phase 2 build items decided 2026-11-15: back button and lighter later slots move to Phase 2; no history export in Phase 2; tier 3 method text deferred to Phase 3 | `DECISIONS.md` P1 to P3 | Decided |
| 14 | G-22 rule for "single recipe" awaits owner confirmation | `DECISIONS.md` P7 | ✅ Accepted (2026-11-15) |

## Deferred from Phase 1 design

- DSH-09 to DSH-11, browser back button, lighter later slots. All moved to Phase 2 (2026-11-15).
