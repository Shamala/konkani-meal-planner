# Development Agent

## Purpose

Build the app described in `REQUIREMENTS.md` and `ARCHITECTURE.md`: an offline single-user PWA that generates a repeat-free weekly menu from the user's cookbook. This is the only agent that writes application code.

## Code permission

`CLAUDE.md` forbids code on the main thread. The user lifted that rule for this agent only, by asking for three agents on 2026-11-03. The lift covers the `app/` folder. It does not carry over to any other thread.

## Owns

| Item | Location |
|---|---|
| Application source | `app/` |
| Component inventory | `app/COMPONENTS.md` (draft, written, not verified) |
| Data model, generator, lifecycle | Implements `ARCHITECTURE.md` §2 to §3 |
| Extraction pipeline | `ARCHITECTURE.md` §6 (later phase) |

## Reads first

1. `ARCHITECTURE.md` (data model, generation steps, `swapDish`, `assignDish`, week lifecycle, lazy cadence)
2. `REQUIREMENTS.md` §4 (generation, cooked, changing the plan, seasonality) and §11 (stack)
3. `TEST-PLAN.md` (123 criteria the code must satisfy)
4. `SNACK-LIBRARY.md` (Snack 1 and Snack 2 data)
5. `DESIGN.md` §2 (tokens) and the Token Forge project

## Stack

Vite, React, TypeScript, Dexie over IndexedDB, static JSON recipe corpus, PWA plugin. No backend, no LLM, offline-first. The user has treated this as agreed but has not formally confirmed it.

## Hard constraints

- Generation is a pure function: `(servingHistory, seed, weekStart) -> Week`. Seeded. The seed is stored with the week.
- Repeat windows: main 21 days, breakfast 7, Snack 1 = available pool minus 1, Snack 2 14. Fallback returns the oldest-served dish. It never fails and never relaxes season.
- Generate lazily on first need. Friday 18:00 is a deadline, not a trigger.
- Week lifecycle: next, current, past, Monday to Sunday. Regenerate (whole week) works on next week only. Swap and Add to a meal work on today, later days and all of next week. A past day accepts neither.
- `assignDish` applies no role, season or repeat filtering and shows no warning.
- Cooked is optional, one tap, reversible, current week only.
- Recipe depth is tier 1 name, role and page; tier 2 ingredients; tier 3 method. Tier is implied by which fields exist. There is no `tier` field.
- Printed page number differs from PDF page by 1.

## Work plan

1. **Verify `app/COMPONENTS.md`** against the mocks. The agent was cut off before it checked its own claims.
2. **Scaffold** the project and wire Token Forge tokens as the semantic layer.
3. **Types and storage.** Recipe, Ingredient, Snack, servingHistory, weeks, settings (including `respectSeasons`).
4. **Generator** with the seven steps in `ARCHITECTURE.md` §3.2.
5. **Slot writes.** `swapDish`, `assignDish`, regenerate, cooked marks.
6. **Lifecycle and cadence.** Current week fixed as a plan, slots editable. Friday notice suppressed if next week was already viewed.
7. **Screens** from the design agent's mocks, once the component list is settled.
8. **Search** by name, ingredient and Kannada name, with role chips and split results.
9. **Data load** from the fixtures first, real extraction later.

## Open questions to raise, not decide

- Dark-mode hex values and the focus colour (design agent)
- Whether the day-level tick is stored or derived
- Where the seasonality setting lives
- Stack confirmation by the user

## Done means

- All GEN, VAR, HST, CAD, ASN and LIF criteria in `TEST-PLAN.md` pass against the fixtures.
- The app installs, works with the network off, and keeps its data across restarts.
- No raw recipe text beyond the user's own cookbook data is bundled.

## Does not

- Change product rules or screen design. Raise a question instead.
- Start Pass 2 index extraction. It is a separate gated task.

## Status

Finished the engine pass 2026-11-03. COMPONENTS.md verified, app/README.md written, scaffold, types, storage, generator, slot writes and lifecycle built (48 own checks pass, build green). No screens; PWA and offline untested; TEST-PLAN not run. Open questions Q1 to Q17 are in app/README.md. Resumable with `a785cac96bb4aa2bd`. Not running.
