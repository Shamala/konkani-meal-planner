# Decisions log

Made by the product architect on 2026-11-03, on the owner's instruction to "take your best decisions". The owner may overturn any entry. Each says what changed in the documents.

## Testing blockers

| # | Question | Decision | Reason |
|---|---|---|---|
| D1 | Repeat-window edge (G-09) | **Inclusive.** A dish served on day D is excluded through D+N and can return on D+N+1. Main meal returns after 22 days. | The only reading under which Snack 1's exact cycle holds. A day longer is harmless. |
| D2 | Season vs "never fail" (G-02) | **Season wins, completeness gives.** A main-meal position with no in-season recipe is left out; the day shows one dish fewer. A slot is empty only if no candidate exists, and then offers *Add to a meal*. | The user picked seasonality to avoid out-of-season suggestions. A shorter menu is better than a wrong one. |
| D3 | Cooked from Search (G-16) | **Records the dish as served today.** No slot, no cancellation of planned dishes, today only. | Avoids guessing which of several main-meal dishes was replaced. Errs toward repeating less. |
| D4 | Swap in v1 (G-19) | **In v1.** NAV-05 rewritten; DESIGN §5 and ARCHITECTURE §7 already corrected. | Requirements and four other criteria already say so. |

## Swap rule

**Confirmed by the owner: future days only.** Swap and add-to-a-meal work on every day after today and all of next week. Today and past days accept neither. Cooked marks exist only on today and past days, so a swap and a cooked mark can never meet. The "Already cooked" inert case is no longer needed; on today the inert reason is that today's plan is fixed. This supersedes the earlier "today and ahead" reach.

## Design questions

| # | Question | Decision |
|---|---|---|
| Q1 | Appearance override in Settings | **No.** Follow the device setting. Settings holds the schedule and seasonality only. |
| Q2 | Next-week notice dismissible | **Yes**, with a 56px Dismiss button; it also disappears once next week is viewed. |
| Q3 | Chip height | **56px**, matching the button floor, for older users. |
| Q4 | Day-row tick marks | **The main meal only.** |
| Q5 | Mid-week first launch | The current week is generated **from today onward**. Earlier days show as empty and are not history. |
| Q6 | "Shopped for" copy | **Unchanged**, per the owner's instruction that current-week copy stays constant. Known inaccuracy on first launch, accepted. |
| Q7 | Picker offers next week | **Yes**, through the same This week / Next week switcher. |
| Q8 | Settings button placement | **Today screen only.** |
| Q9 | Mark cooked on days ahead | **Never.** Today and passed days only; Search-marking is today only. |

## Other

- Perishable tiering: not part of the product.
- Season month is taken from each day's own date (the engine currently uses the Monday's month; needs a small change when code resumes).
- Tech stack confirmed: Vite, React, TypeScript, Dexie, PWA plugin.

## Documents changed

`REQUIREMENTS.md` §4.1.1, §4.5.2, §4.7; `ARCHITECTURE.md` §2.3, §2.4, §3.2, §3.4, §7 and the `weeks` store (`noticeDismissed`); `TEST-PLAN.md` (new GEN-23, GEN-24, VAR-09, LIF-23, HST-13, CAD-09, CAD-10; edits to GEN-01, GEN-19, VAR-03, HST-08, LIF-19, LIF-20, ASN-04, ASN-08, DSH-09, NAV-05, LEG-03; the missing index rows added; now 130 criteria); `DESIGN.md` (decisions applied, open section cleared); `README.md`; `app/COMPONENTS.md` (reconciled with `DESIGN.md`, 32 components).

## Not yet propagated

- `testing/CRITERIA-MAP.md`, `SIMULATIONS.md` and `GAPS.md` still describe 123 criteria and the pre-decision rules. The seven new criteria are unmapped, and the four blockers in `GAPS.md` are now decided.
- `app/README.md` open questions Q6, Q7, Q8, Q10, Q11 are answered above.
- The code still allows swap on today, uses the Monday's month for season, suppresses the implicit record on an off-plan mark, and drops a cooked mark on swap. All four need changing when code resumes.
- The nine v3 mocks and the Add-to-a-meal flow are stale (see `app/COMPONENTS.md` §6).

## D5 Snack 1 adjacency (2026-11-03)

Snack 1 never places the same family on consecutive days: the cycle order is built once per pool, with family spacing, not drawn day by day. Other slots avoid adjacent families on a best-effort basis. VAR-04 is reworded to match (zero adjacencies for Snack 1 over seeds 1 to 20).
**Why:** the day-by-day draw broke adjacency in 5 to 15 of 20 seeds; a fixed cycle order can guarantee it.
**How to apply:** ARCHITECTURE §3.2 needs a line for the Snack 1 cycle order; the generator is not yet changed (code paused).

Also fixed the same day: LEG-07 now covers `action.primary` and `bg.sunken`; SNACK-LIBRARY §3 month counts corrected (G-01).

## Main-meal composition (owner, 2026-11-11)

Source: the owner, in conversation. Supersedes the single four-position reading used by the fixtures and `defaultShape`.

| # | Question | Decision | Reason |
|---|---|---|---|
| D5 | What is a main meal? | **Two meal types, not one fixed shape.** **(A) Plain-rice meal:** plain rice, plus a saar, sambar or masala curry, plus optionally a sauteed vegetable. The vegetable side is **not mandatory**. **(B) Standalone rice dish:** one dish from *Rice Dishes* (section 14), which needs no saar or curry beside it. | A flavoured rice is a complete meal in this cuisine. Forcing a saar and curry onto it, or leaving a saar meal without rice, is culturally wrong. |
| D5a | Is plain rice a recipe? | **No.** The book's index has no plain-rice entry. It is a fixed, implicit part of type A, not a catalogued dish and not a repeat-avoided position. | Nothing to extract, and nothing to avoid repeating. |
| D5b | How is the type chosen per day? | **About once a week** a standalone rice dish replaces the plain-rice meal (owner, 2026-11-11): roughly 1 type B day and 6 type A days per week. Still open: which day, and whether the choice is seeded like every other generator decision (recommend yes, so a regenerate with the same seed is reproducible). | At about 3 uses in a 22-day window, 18 rice dishes is ample. |

**Consequences**

- G-03 (position-to-role mapping) and G-04 (dish counts) are no longer "one table, four positions". The mapping is *per meal type*.
- `DayShape` in `app/src/engine/generate.ts` is a flat list of positions per slot and cannot express "type A or type B". Supporting it is an **engine change**, not configuration. Not made: it needs an explicit order to write code (`CLAUDE.md`).
- `REQUIREMENTS.md` §3.3 still reads "a saar, a curry, a rice or roti, a side" and must be rewritten by the owner or on instruction. `REQUIREMENTS.md` wins, so this log is not authoritative until then.

## Soups and desserts (owner, 2026-11-11)

| # | Question | Decision | Reason |
|---|---|---|---|
| D5b | Is the meal type seeded? | **Yes**, like every other generator decision. One day per week, `standaloneDayOffset(seed, weekStart)`. Built and tested in the engine (`app/src/engine/generate.ts`). `DayPlan.mealType` records which kind a day is. | Reproducible regenerate; swap never changes the type. |
| D6 | Soups | **Not main dishes. Counted as snacks (Snack 2).** In the corpus the four soups carry `slots: ['snack2']` and no `main`: Mixed veg. soup (p.12), Mushroom soup (p.13), Potato soup (p.11, 12), Tomato soup (p.12). No engine change; this is corpus data. It adds a handful of items to Snack 2's section proxy, which `SNACK-LIBRARY.md` §2.1 does not yet list. | Soups are not a meal's liquid dish. |
| D7 | Dessert | **Not part of the main meal.** *Pongal, sakkarai* (p.71) is a dessert: excluded from the standalone rice pool. An **optional dessert on alternating Saturdays** is wanted, not mandatory, **deferred to Phase 3** of the release plan. | Keeps v1 scope; a dessert is a different decision from a meal. |

**Pool check after D5 to D7** (from `extraction/index.tier1.json`): liquid dish 33 (sections 2, 3, 4 minus four soups), curry 44, vegetable side 22, standalone rice 17 (section 14 minus Pongal, sakkarai). All cover their expected uses in a 22-day window with room to spare, except the vegetable side, which is optional.

**D5c (open): is the sauteed-vegetable side optional in v1?** The engine fills every position in the shape. The real-corpus test always includes it (22 candidates, enough). Making it optional needs seeded omission in the engine. See `extraction/ROLE-MAP.md` open item 4.

**D8 (confirmed by the owner, 2026-11-11): season tags.** 12 recipes carry a season in `extraction/recipes.tier1.json`, from their names only; the months are confirmed. Still open: the untagged candidates listed in `extraction/ROLE-MAP.md` open item 1. A test (`app/src/engine/corpus.test.ts`) checks that tagged dishes are never generated out of season.
