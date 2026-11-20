# Fix list

Open items found while building Phases 1 and 2. Add new ones at the bottom.

| # | Item | Where | Status |
|---|------|-------|--------|
| 1 | Untagged season candidates (alambe, tender thur, tender cucumber, tender shoots, gooseberry) need owner confirmation | `extraction/ROLE-MAP.md` | ✅ Decided (2026-11-15): not seasonal, stay untagged |
| 2 | Glossary is unproofread and Kannada only | `extraction/glossary.tier1.json` | Open |
| 3 | No source for dish Kannada names | `ROLE-MAP.md` | ✅ Decided (2026-11-15): show English or the book's own name |
| 4 | Two-page dishes need `alsoOnPages` in the Recipe type and on the Dish screen | `app/src/model/types.ts` | ✅ Done (2026-11-12): `alsoOnPages` is in `app/src/ui/corpus.ts`, shown on `Dish.tsx`, covered by `ui.test.ts` |
| 5 | "Horse gram upkari" p.8 may be a pointer, not a recipe | corpus | ✅ Decided (2026-11-15): it is a recipe; may point to another page |
| 6 | Optional vegetable side: engine always fills it (D5c) | `DECISIONS.md` | ✅ Decided (2026-11-13): always included in v1, no engine change. `REQUIREMENTS.md` §3.3 updated 2026-11-15 |
| 7 | GitHub Actions warn that Node 20 actions are deprecated | `.github/workflows/pages.yml` | ✅ Confirmed (2026-11-16): the deploy run after the Phase 2 merge shows no Node 20 warning |
| 8 | Offline use after first load not tested on the live site | live URL | Not verified. Cannot be tested locally; the build does produce a service worker precaching 7 entries (2026-11-12), but that is not evidence for the live site. Owner: load the live URL once, go offline, reload |
| 9 | `canEditSlot` is `date >= today`, so swap and assign are allowed on today. Must be after today (LIF-20, LIF-23) | `app/src/engine/lifecycle.ts:38` | ✅ Fixed (2026-11-15): `date > today`; tests updated |
| 10 | Season month taken from the week's Monday, not each day's date (DECISIONS "Other") | `generate.ts:86`, `slotWrites.ts:110` | ✅ Fixed (2026-11-15): month taken per day; corpus test now asserts each day's own month |
| 11 | An off-plan mark suppresses the planned dishes' implicit record. D3 and HST-08 say it must cancel none | `app/src/engine/history.ts:24` | ✅ Fixed (2026-11-15): off-plan mark no longer suppresses planned records; test reversed |
| 12 | Swap writes `cooked: false`, so it would drop a cooked mark. Moot once #9 is fixed, because swap then never reaches a day with marks | `slotWrites.ts:135` | ✅ Moot after #9: swap never reaches a day that can hold a cooked mark |
| 13 | Phase 2 build items decided 2026-11-15: back button and lighter later slots move to Phase 2; no history export in Phase 2; tier 3 method text deferred to Phase 3 | `DECISIONS.md` P1 to P3 | Decided |
| 14 | G-22 rule for "single recipe" awaits owner confirmation | `DECISIONS.md` P7 | ✅ Accepted (2026-11-15) |
| 15 | Week screen has no *This week · Next week* switcher and no next-week view; current week has no **Plan next week** link (LIF-09, LIF-13, LIF-17, LIF-18). Next-week planning on demand already exists in the session | `app/src/ui/screens/Week.tsx` | ✅ Built (2026-11-16): switcher, next-week draft view, inline **Plan next week** |
| 16 | Swap is not offered on next week until #15 exists (LIF-19) | `Week.tsx`, `Dish.tsx` | ✅ Built (2026-11-16): swap works on next week from the Dish screen |
| 17 | Regenerate next week with confirm sheet C26 is not built (LIF-03, LIF-08, ASN-10, G-23 behaviour in `DECISIONS.md` P8) | Week, next week | ✅ Built (2026-11-16): bottom sheet, focus on Keep this plan, Escape keeps, counts dishes you chose |
| 18 | Friday next-week notice C27 on Today, with Dismiss that survives restart, hidden once next week is viewed (CAD-02, CAD-10, LIF-16) | `Today.tsx` | ✅ Built (2026-11-16): notice with See next week and Dismiss; dismissal stored on the week and survives restart |
| 19 | Ingredient search, extracted and unextracted result groups, coverage line (SRC-02, SRC-08 to SRC-10). Search is still name only | `Search.tsx` | ✅ Built (2026-11-16): ingredient search, name-only group and coverage line. **Nothing to search yet: 0 of 416 recipes have ingredients** (Pass 3 has not started). Glossary proofread (#2) still open |
| 20 | Ingredients (tier 2) on the Dish screen: major ones first, seasoning stoplist behind *show all* (DSH-04 to DSH-06). Method text stays out until Phase 3 (`DECISIONS.md` P1) | `Dish.tsx` | ✅ Built (2026-11-16): ingredients with seasoning stoplist behind *show all*; unit tested only, since no recipe has data to display. Method text stays out (P1) |
| 21 | Browser back button does not step back from Dish or the picker | `app/src/App.tsx` | ✅ Built (2026-11-16): browser back leaves Dish and Settings. Back from the Add to a meal picker leaves the whole Dish screen |
| 22 | Lighter later slots on Today (weight and size, never opacity) | `Today.tsx` | ✅ Built (2026-11-16): Snack 1 and Snack 2 cards lighter by size and weight |
| 23 | Ask the browser for persistent storage at first launch and state the history-loss risk in the README (`DECISIONS.md` P3) | `session.tsx`, `README.md` | ✅ Built (2026-11-16): storage persistence requested at first launch. README risk note written (2026-11-20) |
| 24 | Add to a meal picker uses buttons for the This week / Next week switch. `COMPONENTS.md` C12 says links; reconcile spec or build | `AddToMeal.tsx`, `app/COMPONENTS.md` | ✅ Spec reconciled (2026-11-20): the picker switch changes content in place, so buttons are right; `COMPONENTS.md` C12 now says so |
| 25 | Test gaps: no test for the single-recipe swap reason or the "no other dish" reason; no test for the Add to a meal screen flow beyond `pickerDays`; no automated end-to-end test | `app/src/ui/ui.test.ts` | Partly done (2026-11-16): added tests for notice dismissal, chosen-dish count, week range, ingredient split and search. Still no test for the single-recipe reason or an end-to-end run |
| 26 | Deploy warnings, none blocking: npm warns `glob@11.1.0` is deprecated; `ubuntu-latest` migrates to Ubuntu 26; `deploy-pages` shows a punycode deprecation (upstream action) | `.github/workflows/pages.yml`, `package-lock.json` | Open, low. Re-check at the next dependency update |
| 27 | Test docs still describe 123 criteria and pre-decision rules; seven newer criteria unmapped; Add to a meal mocks stale; release plan exit line omits ASN and CAD; Phase 1 design says Settings is out | `testing/CRITERIA-MAP.md`, `GAPS.md`, `app/COMPONENTS.md` §6, `RELEASE-PLAN.md`, `PHASE-1-DESIGN.md` | ✅ Done (2026-11-20): `CRITERIA-MAP.md` already maps all 130 criteria; `RELEASE-PLAN.md` exit line adds ASN and CAD; `PHASE-1-DESIGN.md` and `GAPS.md` annotated; Add to a meal mocks already listed in `COMPONENTS.md` §6 |
| 28 | Install and offline use not tested on one iOS and one Android device (Phase 1 exit criterion) | real devices | Not verified, owner to test |

## Deferred from Phase 1 design

- DSH-09 to DSH-11, browser back button, lighter later slots. All moved to Phase 2 (2026-11-15).
