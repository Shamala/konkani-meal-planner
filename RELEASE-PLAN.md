# Release Plan — three phases

Status: proposed 2026-11-11. `REQUIREMENTS.md` wins any disagreement with this document.

## Where the project actually is

| Done | Not done |
|---|---|
| Types, storage (Dexie), generator, slot writes, week lifecycle, 48 engine/storage checks | **Every screen.** `App.tsx` is a placeholder |
| React 19.3, Vite, PWA plugin pinned | **The real recipe corpus.** Pass 2 extraction (`ARCHITECTURE.md` §6) is unstarted; everything runs on synthetic fixtures |
| Design, 32-component inventory (`app/COMPONENTS.md`), 130 acceptance criteria | Component build (20 are new to Token Forge, 12 are variants) |

So the plan is **UI over a finished engine**, with the corpus as a parallel data track that gates shipping.

## Architecture rule for all phases

Engine stays pure and framework-free. React 19 sits on top:

| Concern | React 19 mechanism |
|---|---|
| Open app, load session | `openApp()` promise read with `use()` inside Suspense |
| Every user mutation (cooked, swap, assign, regenerate, settings) | `useActionState`: the action calls the engine write, persists, and **returns** the new state or the engine's `Refusal`. Refusals are returned values, never thrown |
| Instant feedback on tick and swap | `useOptimistic`, reverting automatically if the action returns a refusal |
| Slow regenerate | `useTransition` (no spinner is a requirement, LIF-14, so the transition only keeps the UI responsive) |
| Submit buttons | form `action=` plus `useFormStatus` |
| Navigation origin, search state | Plain router or lifted state; must pass NAV-03 (no state leak) |

No global store. No server. No model call.

## Phase 1 — Read and record (public release)

Goal: open the app, see today's plan, tick what was cooked, look up a page number.

- Tab shell with all three tabs (NAV-01 requires exactly three, so Search ships now)
- Today, Week (current week only), Dish (tier 1), Search by dish name and Kannada name only
- First-launch generation (CAD-08, CAD-09)
- Cooked toggle everywhere a dish appears
- Corpus Pass 1 + 2 delivered (ship gate)
- Public-release items moved here: installable PWA, offline cold start, raster icons, dark palette and contrast pass, hosting and cache versioning (see `PHASE-1-DESIGN.md` §10)

Detail: `PHASE-1-DESIGN.md`.

## Phase 2 — Control the plan

Goal: next week, swap, regenerate, search.

- Week switcher, Friday notice banner (C12, C27), next-week generation on demand
- Swap with a different dish; inert reason blocks (C31)
- Regenerate next week with confirm sheet (C26)
- Search upgrade: ingredient search with coverage line, Add to a meal picker (C24, C25)
- Tier 2 ingredients and tier 3 method display, with seasoning stoplist

## Phase 3 — Settings, polish, ship

- Settings screen: generation day and time (C28, C29)
- Optional dessert on alternating Saturdays (DECISIONS.md D7); needs a design and a requirements entry first
- Contrast and keyboard audit of the Phase 2 screens; dark palette for them
- Content rewrite of method prose before tier 3 is shown
- Resolve open gaps G-22, G-23, G-25 from `testing/GAPS.md`
- Lazy tier 2/3 extraction continues after release; it is not a ship gate

## Parallel data track (not a phase)

| Pass | Needed by |
|---|---|
| 1 Glossary | Phase 2 (search, ingredient ids) |
| 2 Index to `recipes.json`, tier 1 | **Phase 1 ship** |
| 3 Tier 2/3 per recipe | Never blocking |

## Exit criteria

| Phase | Done when |
|---|---|
| 1 | Phase 1 test matrix green; real corpus loaded, no synthetic data in the build; installs and runs offline on one iOS and one Android device |
| 2 | LIF, DSH-09 to DSH-11, SRC and NAV-03 criteria green |
| 3 | Full 130-criterion suite green, accessibility audit passed |

## Changes from the first draft of this plan

The first sketch put "preferences" in Phase 3 and "offline" in Phase 2. The existing design
fixes Settings to two schedule fields and makes offline a day-one property, so both were
corrected here.
