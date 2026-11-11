# Phase 1 Design — Read and record

Status: proposed 2026-11-11. Product rules: `REQUIREMENTS.md`. Visuals: `DESIGN.md`. This
document only says how Phase 1 is built on top of what already exists.

## 1. Business objective

Replace the daily "what do I cook?" decision. Success: on a cold start the user sees today's
four slots within one screen load, can tick a dish cooked in one tap, and can read the book
page for any dish. No empty state, no onboarding, no network.

## 2. Scope

**In:** Today, Week (current week, read-only except the cooked tick), Dish (tier 1 and
Snack 1 variants), Search (name and Kannada name only), tab shell, first-launch generation,
corpus Pass 2.

**Out (Phase 2):** week switcher, next-week notice, swap, regenerate, Add to a meal,
ingredient and method display, Settings.

**Consequence to flag:** Settings is a pushed screen reached from Today, so its header button
is omitted in Phase 1 rather than shown inert. Schedule defaults (Friday 18:00) apply.

## 3. Screens and components

| Screen | Components (`app/COMPONENTS.md`) | Notes |
|---|---|---|
| Shell | C1 Tab bar | Exactly three tabs, Today is the landing tab (NAV-01, NAV-02). Tab switch keeps scroll, query and chip (NAV-04) |
| Today | C2, C7, C9 Slot card, C10 Dish row, C11 Cooked tick | Main meal dominant; later slots lighter by weight and size, never opacity |
| Week | C2, C13 Day row, C14 Frozen-week block, C11 | Current week only. Frozen block explains why it is fixed (LIF-12). Tick is the control on a day row |
| Dish | C3, C4, C5, C16 Page-number block, C20 | Tier 1: page shown large and calm (DSH-03). Snack 1 shows components, no page (DSH-08). Origin-aware back link (NAV-03) |
| Search | C22 Search field, C23 Filter chip, C7, C8, C30 Zero results | Name and Kannada only. Coverage line states ingredients searched in 0 recipes. No Add to a meal yet; Dish from Search shows the inert reason block (C31) in the action slot, so it is never empty (DSH-11) |

Build order: tokens and C1 to C11 first, then screens in the order Today, Dish, Week, Search.

## 4. Data and state flow

| Step | Source |
|---|---|
| Boot | `openApp(db, config, now)` returns `{weeks, history, settings}`; it folds past weeks and generates the current week on first launch (CAD-08, CAD-09) |
| Read in UI | A single session promise read with `use()` under Suspense. No loading spinner is shown for generation |
| Engine config | `index` from the static corpus plus `defaultShape`, built once at module load |
| "Now" | One injected clock value passed in. The engine never reads a clock |

**Corpus gate.** Until Pass 2 lands, the app runs on the synthetic fixture and a banner-free
dev build only. Real release needs `recipes.json` with printed page numbers (not PDF numbers).

## 5. Mutations (Phase 1 has one)

| Action | Engine call | `useActionState` returns | UI |
|---|---|---|---|
| Toggle cooked | `setCooked` for plan dishes, `setOffPlanCooked` for dishes reached from Search | Updated week, or a `Refusal` (for example a day not markable) | `useOptimistic` flips the tick at once and reverts on refusal; the Refusal reason is shown as a short line, never an alert dialog |

The action persists inside the same call, so a reload always shows the tick. Cooked is
idempotent: repeating it undoes it.

## 6. Edge cases

| Case | Expected |
|---|---|
| First launch mid-week | Week generated from today onward; passed days empty, no marks, no history (CAD-09) |
| Main-meal position with no in-season recipe | Day shows one dish fewer (decision D2); no placeholder |
| Recipe with no Kannada name | Field omitted, never blank (DSH-02) |
| Snack 1 entry | Components text, no page number |
| Dish reached from Search | Cooked tick present; swap and Add to a meal absent; reason block in the action slot |
| Back from Dish | Returns to origin with search text and chip intact |
| Week boundary crossed while app is open | State recomputed on next open or focus, not on a timer |
| IndexedDB unavailable | Out of scope in v1; call it out as a known risk |

## 7. Testing matrix

| Requirement | Level | Check |
|---|---|---|
| NAV-01, NAV-02 | E2E | Three tabs only; cold start lands on Today |
| NAV-03, NAV-04 | E2E | No state leak between Dish visits; tabs keep scroll and query |
| CAD-08, CAD-09 | Integration | Empty DB opens with a week; mid-week start leaves earlier days empty and out of history |
| NAV-06, LIF-06 | Unit and UI | Cooked offered on current week only |
| Cooked action | Unit | Success, refusal, optimistic revert, persisted after reload |
| DSH-01, 02, 03, 05, 07, 08, 11 | Component | Tier-1 Dish renders calmly; nothing invented; no Have/Buy; action slot never empty |
| LIF-02, LIF-10, LIF-11, LIF-12 | Component | No regenerate or disabled control on current week; three zones; frozen copy |
| OFF-01, OFF-02 | E2E | Network off, full function, no requests after load |
| Accessibility | Manual and automated | 3px focus ring, 48px targets, 7:1 contrast |

## 8. Documentation updates

- `app/README.md`: replace "No screens exist" with Phase 1 status.
- `DECISIONS.md`: add the Phase 1 scope cut (Search by name only; Settings deferred) and the
  `useActionState` + `useOptimistic` convention as an ADR.
- `testing/CRITERIA-MAP.md`: mark which criteria Phase 1 covers.
- `README.md`: add `RELEASE-PLAN.md` to the reading order.

## 9. Open questions

1. Router or lifted state for origin-aware back (NAV-03)? Recommend a router; decide before Dish is built.
2. ~~Internal milestone or public release?~~ **Decided 2026-11-11: public release.** See section 10.
3. Who builds the twenty new components, Token Forge or in-repo?

## 10. What "public release" adds to Phase 1

Decided 2026-11-11. These move into Phase 1 from Phase 3 or from "later".

| Requirement | Why now |
|---|---|
| **Real corpus only.** No synthetic data reachable in the production build | `SYNTHETIC` fixtures must never show as book content (`testing/fixtures/README.md`) |
| **Installable PWA** on iOS and Android, full offline cold start (OFF-01 to OFF-04) | Public users install from the home screen; offline is a premise |
| **Raster icons** and manifest (open question Q12) | Placeholder SVG will not install cleanly on iOS |
| **Dark palette and 7:1 contrast pass** for the three Phase 1 screens | Cannot be retrofitted for people already using it |
| **Copyright posture.** Tier 1 holds names, Kannada names and page numbers only: facts. No method prose ships in Phase 1 | Method text is the author's; rewrite before it is ever shown (REQUIREMENTS §6) |
| **Static hosting, HTTPS, cache versioning** | Service worker updates must not strand users on an old corpus; recipe ids are never reused |
| **Data-loss stance.** IndexedDB eviction can erase serving history; state this in docs and treat export as a Phase 2 candidate | Public users, unlike one owner, will hit it |
| **Release checklist** run end to end on one iOS and one Android device | Replaces "works on my machine" |

Cost: Phase 1 is now the largest phase. Phase 3 shrinks to Settings and the remaining gaps.
