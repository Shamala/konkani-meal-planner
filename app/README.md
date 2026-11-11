# Konkani Meal Planner — app

Single-user offline PWA. Vite + React + TypeScript, Dexie over IndexedDB, static JSON corpus,
PWA via `vite-plugin-pwa`. No backend, no network at runtime, no model call anywhere.

**Status (2026-11-11):** Phase 1 is built: Today, Week (current week), Dish and Search screens in
`src/ui/`, over the engine and storage. It runs on the real tier-1 corpus in `../extraction/`
(416 dishes, names and printed pages; no ingredients or methods yet). Swap, regenerate, next week
and Settings are Phase 2 and 3 (`../RELEASE-PLAN.md`). Engine checks still use a small synthetic
fixture; `src/engine/corpus.test.ts` and `src/ui/ui.test.ts` use the real corpus.

Product rules live in `../REQUIREMENTS.md` and win any disagreement. This folder implements
`../ARCHITECTURE.md` sections 2 to 3.

## Setup and commands

Developed and tested on Node 26 with npm 11; no other version has been tried. All dependency versions are pinned exactly
(`.npmrc` sets `save-exact`).

| Command | Does |
|---|---|
| `npm install` | Installs dependencies |
| `npm run typecheck` | `tsc --noEmit` (strict, `noUncheckedIndexedAccess`) |
| `npm test` | Runs the engine and storage checks once (vitest, fake-indexeddb) |
| `npm run build` | Typechecks, then builds `dist/` with the service worker and manifest |
| `npm run preview` | Serves `dist/` locally to try the PWA (the service worker is production-only) |
| `npm run dev` | Vite dev server. Nothing is left running by the build or test commands |

## Structure

```
app/
  COMPONENTS.md          Component inventory to request from Token Forge (verified against the mocks)
  index.html, vite.config.ts, tsconfig.json, package.json
  public/icon.svg        Placeholder icon (no raster icons yet, see open question Q12)
  src/
    main.tsx, App.tsx    Placeholder shell
    styles/tokens.css    Token Forge semantic layer; only the values DESIGN.md actually gives
    model/
      types.ts           Recipe, Ingredient, Snack1Entry, Snack2Entry, Week, ServingHistory, Settings
      dates.ts           Calendar maths on ISO date strings in UTC; never reads a clock
    data/
      snack1.json        The 60 Snack 1 entries, generated from ../SNACK-LIBRARY.md (6 seasonal)
      snack2.json        The 12 authored Snack 2 additions, generated the same way
      snacks.ts          Typed exports of the two
    engine/              Pure. No I/O, no clock, no Math.random, no network
      prng.ts            Stateless seeded hash; every decision hashes its own coordinates
      catalog.ts         Index + validation of the corpus; section-proxy slot helper
      select.ts          The seven filter steps for one position in one slot
      generate.ts        makeGenerator(env) -> (servingHistory, seed, weekStart) => Week
      history.ts         Implicit/explicit serving records; overlay of a week onto history
      slotWrites.ts      swapDish, assignDish, regenerateWeek, setCooked, setOffPlanCooked
      lifecycle.ts       next/current/past, who may do what, deadline, reconcile-on-open
      fixtures.ts        SYNTHETIC corpus for the checks only
      engine.test.ts     43 checks
    storage/
      db.ts              Dexie: servingHistory, weeks, settings
      session.ts         openApp(): one transaction that folds, creates and persists
      storage.test.ts    5 checks against fake-indexeddb
```

There is deliberately no `app/tests/` folder: that name is reserved for the testing agent's
suite. Checks here are co-located `*.test.ts` files beside the code they cover.

## How the engine is meant to be called

The signature in `ARCHITECTURE.md` 3.1 is `(servingHistory, seed, weekStart) => Week`. Catalog,
settings and the shape of a day are configuration, not per-call inputs, so they are closed over:

```
const generate = makeGenerator({ index: buildIndex(catalog), settings, shape });
const week     = generate(history, seed, weekStart);   // same three inputs, same week, always
```

The caller reads the clock **once**, on open, and passes `{ date, time }` down. Nothing under
`src/engine/` or `src/model/` reads a clock. On open the app calls `openApp(db, cfg, now)`;
navigating into next week calls it again with `{ needNextWeek: true }`.

Slot writes are immutable and return `{ ok: true, week } | { ok: false, reason }`. `reason` is
a closed set (`past-day`, `single-recipe-in-role`, ...), so a screen can say why a control is
unavailable instead of rendering one that does nothing.

### Rules that are easy to get wrong, and where they live

| Rule | Where | Checked by |
|---|---|---|
| Season (step 3) is never relaxed by the fallback; only the repeat window gives way | `select.ts`, fallback block | `seasons`, `fallback` |
| With `respectSeasons` off the season step does not run at all | `select.ts`, step 3 | `seasons: off` |
| Snack 1 window is the available pool minus one, per month | `select.ts`, `windowFor` | `Snack 1: exact cycle` |
| `assignDish` applies no role, season or repeat filtering | `slotWrites.ts` | `assignDish: any dish` |
| Regenerate: next week only. Swap/assign: today and ahead. Past day: none | `lifecycle.ts` | `lifecycle`, `slot writes` |
| Breakfast and Snack 2 never share a dish on a day (also in swap) | `generate.ts`, `slotWrites.ts` | `breakfast and Snack 2` |
| A swap advances a per-slot counter, never the week seed | `slotWrites.ts` | `swapDish: same role` |

The repeat-window boundary is **inclusive**: a dish served 21 days ago is still excluded, so the
earliest return is on day 22. This is the only reading under which Snack 1's "window 59,
repeats after 60 days" holds, and it is applied uniformly. See Q7.

## Verification status

Verified (automated, against the synthetic corpus): determinism and purity, slot sources,
all four repeat windows, Snack 1 exact cycle in both the 54 and 60 case, season on/off and the
fallback never relaxing it, swap and assign semantics, regenerate, the lifecycle gates, the
deadline and lazy generation, idempotent reconcile, folding into history once, and persistence
across a simulated restart.

**Not verified:** anything that needs a browser (service worker, offline, installability); the
real `TEST-PLAN.md` suite (the testing agent's, not yet runnable against this code); behaviour
on the real corpus; any UI. `npm run build` succeeds and emits `sw.js` and a manifest, but the
PWA has not been loaded in a browser.

## Open questions

Raised, not decided. Numbers match the comments in the code.

| # | Question | What the code does meanwhile |
|---|---|---|
| Q1 | The 30 `role` values are never enumerated, and nothing maps roles to main-meal positions | `Role` is an open string; the day's shape (positions and the roles each accepts) is supplied by the caller |
| Q2 | `Variation` is named in `ARCHITECTURE.md` 2.1 but never defined | `{ text: string }` |
| Q3 | `ARCHITECTURE.md` 2.3 gives Snack 1 entries no `season`, but `REQUIREMENTS.md` 4.7 and `SNACK-LIBRARY.md` tag six of them | `season?: number[]` added to Snack entries |
| Q4 | How many dishes per slot? Docs say breakfast 1-2 plus an accompaniment, main 3-5, Snack 2 1-2; the mocks show main = 3, breakfast = 2 | One position per slot except main, via the day shape |
| Q5 | Swap "another of the same role": the role of the dish being replaced, or of the position? They differ once a dish has been hand-assigned off-role | Main: role of the dish being replaced. Other slots: the position's roles, if any |
| Q6 | Season is "the month of the week being planned", but a week can straddle two months | Month of the Monday |
| Q7 | Is "within N days" inclusive? | Inclusive both ways (see above) |
| Q8 | **Perishable tiering was in the task brief but is not in `ARCHITECTURE.md`, `REQUIREMENTS.md` or the recipe schema.** It exists only in `archive/` (pantry-first, superseded) and needs a `primaryCategory` field the schema lacks | **Not implemented** |
| Q9 | Serving history: the store holds finished weeks; the current week is overlaid live. A week gets a one-way `folded` flag when it becomes past, so unmarking a dish stays reversible | As described. The alternative is a mutable ledger that cannot undo cleanly |
| Q10 | Swapping or assigning over a dish already marked cooked drops that mark and with it the recorded serving | Allowed; the new dish starts uncooked |
| Q11 | Is the day-level tick on Week stored or derived, and what does it mean with four slots? | Not built; marks are per dish only |
| Q12 | Dark values for five tokens, the focus colour and the hover colour are undefined; the seasonality setting has no home; no raster PWA icons | Left unset in `tokens.css`; setting is in `Settings` with no UI |
| Q13 | Stack is treated as agreed but unconfirmed by the user | Built on it |
| Q14 | `SNACK-LIBRARY.md` section 3 says the Snack 1 cycle is "60 from July to February, 54 outside it". From its own tags it is 54 Aug-Feb, 59 Mar, 60 Apr-Jun, 56 Jul | Code follows the tags. (The testing agent found the same, its gap G-01) |
| Q15 | First launch mid-week generates all seven days, including ones already gone | Yes, a full week |
| Q16 | History is per id, not per slot, so a dish served as Snack 2 yesterday is inside breakfast's window | Per id |
| Q17 | When the only non-recent candidate is today's breakfast, Snack 2 must give way somewhere | Collision is honoured in the fallback too; relaxed only if nothing else exists |

## Findings about the architecture

- **A fixed Snack 1 window of 59 does not starve the pool.** `ARCHITECTURE.md` 3.3 says it would.
  With 54 in season it empties step 4 every day and the oldest-served fallback reproduces the
  same exact cycle. The P-1 window is still right, but for a different reason: it keeps Snack 1
  on the normal path instead of the fallback every single day. An ad-hoc mutation check (not part of the suite) confirmed the
  two are indistinguishable from outside.
- **The oldest-served fallback is deterministic, so Snack 1 order locks after the first cycle.**
  That is inherent in an exact cycle and matches "repeats after 60 days".
- **`ARCHITECTURE.md` 3.4 says Mark cooked is "Yes" for the current week while
  `REQUIREMENTS.md` 4.5.2 says "today only" for future days.** Implemented as: today and days
  already passed, never future days (`canMarkCooked`).
