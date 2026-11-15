# Fix list

Open items found while building Phase 1. Add new ones at the bottom.

| # | Item | Where | Status |
|---|------|-------|--------|
| 1 | Untagged season candidates (alambe, tender thur, tender cucumber, tender shoots, gooseberry) need owner confirmation | `extraction/ROLE-MAP.md` | Open |
| 2 | Glossary is unproofread and Kannada only | `extraction/glossary.tier1.json` | Open |
| 3 | No source for dish Kannada names | `ROLE-MAP.md` | Open |
| 4 | Two-page dishes need `alsoOnPages` in the Recipe type and on the Dish screen | `app/src/model/types.ts` | ✅ Done (2026-11-12): `alsoOnPages` is in `app/src/ui/corpus.ts`, shown on `Dish.tsx`, covered by `ui.test.ts` |
| 5 | "Horse gram upkari" p.8 may be a pointer, not a recipe | corpus | Open |
| 6 | Optional vegetable side: engine always fills it (D5c) | `DECISIONS.md` | ✅ Decided (2026-11-13): always included in v1, no engine change. `REQUIREMENTS.md` §3.3 still to be updated |
| 7 | GitHub Actions warn that Node 20 actions are deprecated | `.github/workflows/pages.yml` | ✅ Edited (2026-11-12), unconfirmed until next CI run: checkout v7, setup-node v7, upload-pages-artifact v5, deploy-pages v5. Each action's `action.yml` at that release declares node24 (checked via `gh api`; upload-pages-artifact is composite). Deprecation warning is only confirmed gone after the next push to main runs the workflow |
| 8 | Offline use after first load not tested on the live site | live URL | Not verified. Cannot be tested locally; the build does produce a service worker precaching 7 entries (2026-11-12), but that is not evidence for the live site. Owner: load the live URL once, go offline, reload |

## Deferred from Phase 1 design

- DSH-09 to DSH-11, browser back button, lighter later slots.
