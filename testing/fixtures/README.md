# Fixtures

Plain JSON, no runner assumed. Every file's `_meta` block states its provenance. **Anything with `SYNTHETIC` in the filename is invented** and must never be shown to a user as book content.

| File | Real or synthetic | Records | For |
|---|---|---|---|
| `snack1.library.json` | **Real.** Verbatim from `SNACK-LIBRARY.md` §1, all 60 entries with season tags, plus a derived `seasonPools` block (in-season count, window, exclusions per month) | 60 | GEN-05, VAR-03, VAR-04, VAR-07, VAR-08, DSH-08 |
| `snack2.pools.json` | **Real.** Verbatim section proxy and the 12 authored additions from `SNACK-LIBRARY.md` §2 | 12 + 9 sections in, 5 out | GEN-06, VAR-05 |
| `recipes.book.SYNTHETIC.json` | **Almost entirely invented.** One real dish and page (Kokum saar, page 9, confirmed against the recipe page). All other pages are placeholders | 24 | GEN-*, DSH-*, SRC-*, ASN-*, season criteria |
| `recipes.book.SYNTHETIC.fully-extracted.json` | Synthetic variant: every record carries ingredients | 24 | SRC-09, SRC-10 |
| `recipes.sim-rich.SYNTHETIC.json` | 100% synthetic, pages are 0 | 152 | VAR-01, VAR-02, VAR-05, VAR-06 |
| `glossary.SYNTHETIC.json` | Synthetic | 10 | DSH-04, DSH-06, SRC-02 |

## Why two recipe corpora

`recipes.book.SYNTHETIC.json` has pools of 1 to 3 recipes per role, on purpose: it exercises fallback, the single-recipe role and the all-seasonal role. It **cannot** show the repeat windows holding, because a 21-day window needs at least 22 candidates per position. `recipes.sim-rich.SYNTHETIC.json` has 30 per position for exactly that. Never load both together.

## Designated special cases (recipes.book.SYNTHETIC.json)

| Case | Record | Criteria |
|---|---|---|
| Tier 1 only | `syn-ridge-gourd-sambar` (and 20 more) | DSH-03 |
| No Kannada name | `syn-tomato-saar` (field absent) | DSH-02 |
| Unresolved ingredient | `syn-brinjal-masala-curry`, ingredient 4 | DSH-06 |
| Role with exactly one recipe | role `side`: `syn-cucumber-tambuli` | GEN-16 |
| Role entirely seasonal | role `sasam`: both records seasonal | GEN-19 vs GEN-08 collision (G-02) |
| Seasonal breakfast-slot dish | `syn-colocasia-patholi` (Jun-Sep) | GEN-18 |
| Excluded from Snack 2 by section | `syn-brinjal-masala-curry`, `syn-lime-pickle` | GEN-06 |
| Stoplist-heavy tier 2 | `syn-dalithoy` (5 of 8 on stoplist, 3 shown) | DSH-04 |
| Diacritics | `syn-tomato-saar`, `syn-neer-dosai` | SRC-07 |
| Dual-slot (breakfast and Snack 2) | 7 breakfast-family records | GEN-07 |

## Pool arithmetic of the small corpus

| Slot or position | Pool | In November | Window | Verdict |
|---|---|---|---|---|
| Main: saar | 3 | 3 | 21 d | fallback from day 4 |
| Main: curry (masala-curry + sambar) | 4 | 4 | 21 d | fallback from day 5 |
| Main: rice or roti | 4 | 4 | 21 d | fallback |
| Main: side (side + sasam + pickle) | 4 | 2 | 21 d | fallback; Nov leaves cucumber tambuli and lime pickle |
| Breakfast | 7 | 6 | 7 d | fallback every day in November |
| Snack 2 | 21 | 20 | 14 d | holds in isolation; shared history with breakfast erodes it (G-28) |
| Snack 1 | 60 | 54 | pool minus 1 | exact cycle |

## Test-time setups for the 2026-11-03 criteria (no new files)

| Criterion | Setup on existing fixtures |
|---|---|
| GEN-23 | Override the composition to four positions: `[saar]`, `[masala-curry, sambar]`, `[rice, roti]`, `[sasam]`. The fourth position is wholly seasonal (Mar to Jul), so in November it must be left out and the day shows 3 dishes. Seasons OFF and May give 4. For the slot-empty case keep only `syn-colocasia-patholi` in the breakfast pool (Jun to Sep) |
| GEN-24 | Same sasam-only position; weeks starting Mon 2027-03-29 and Mon 2027-07-26. Mango sasam (Apr to Jul) is eligible Apr 1 to 4 and not Mar 29 to 31; Aug 1 has no in-season sasam |
| VAR-09 | `recipes.sim-rich.SYNTHETIC.json`; main-meal minimum gap 22 |
| LIF-23 | Clock only |
| HST-13 | Any dish from `recipes.book.SYNTHETIC.json` reached through Search |
| CAD-09 | Empty storage, clock set to a Wednesday |
| CAD-10 | Clock and a restart |

## Known fixture limits

- Position-to-role mapping (`_meta.mainMealComposition`) is this fixture's reading; the documents do not give one (G-03, still open). Its fourth position unions side, sasam and pickle; GEN-23 overrides it as above.
- `item` on an unresolved ingredient holds the verbatim text; `ARCHITECTURE.md` §2.2 does not say what it holds (G-31).
- The retired-id list in `_meta.retiredIds` is invented. No registry exists in the architecture (G-31).
- Nothing here has been run against the app.
