# Phase 2 Design — Control the plan

Status: draft 2026-11-13, branch `phase-2`. Product rules: `REQUIREMENTS.md` (wins on conflict). Visuals: `DESIGN.md`. Component specs: `app/COMPONENTS.md`. Scope source: `RELEASE-PLAN.md`. This document says what Phase 2 adds on top of Phase 1 and lists every acceptance criterion in one place (section 6).

## 1. Business objective & impact

Phase 1 answers "what do I cook today?". Phase 2 answers "that is not what I want, or not what I can get". The user can plan ahead, replace a dish, and choose a dish themselves. Without it, a plan the user dislikes can only be ignored (REQUIREMENTS §4.6).

Success: the user can see next week, replace any dish on a day after today in two taps, assign a dish found in Search to a slot, and regenerate next week, with no confusion about what is fixed and what is not.

## 2. Product requirements & scope

**In**

| # | Feature | Rule (REQUIREMENTS) |
|---|---|---|
| 1 | Week switcher (*This week · Next week*), one week shown at a time | §4.3, design §3.2.2 |
| 2 | Next-week notice on Today (Friday 18:00 default), dismissable, hidden once next week is viewed | §4.3, CAD-10, LIF-16 |
| 3 | Next-week generation on demand, no spinner, same result as the deadline would give | LIF-07, LIF-13 to LIF-15 |
| 4 | **Swap with a different dish**: days after today, and all of next week. Inert reason block where unavailable | §4.5, §4.5.2 |
| 5 | **Regenerate next week** with confirm sheet (names how many chosen dishes will be replaced). Never on the current week | §4.5, C26 |
| 6 | **Add to a meal**: from a Search result's Dish screen, pick day then slot, replaces the slot, no confirmation, no role check | §4.5.1 |
| 7 | Search upgrade: ingredient search, extracted vs unextracted groups, coverage line | §5.2, §7 |
| 8 | Dish screen shows ingredients (major first, seasoning stoplist behind *show all*) and method where extracted | §5.1 |

**Out (Phase 3):** dessert on alternating Saturdays, full contrast and keyboard audit, dark palette for Phase 2 screens, method-prose rewrite.

**Already done early:** Settings screen (was Phase 3 in the release plan).

**Non-functional:** engine stays pure; refusals are returned values, never thrown; no network, no model call; offline unchanged; every new control meets the 56px target and has no disabled state (the control is absent or replaced by C31).

## 3. Architectural & design blueprint

**The engine already has the writes.** `swapDish`, `assignDish`, `regenerateWeek`, `canRegenerate`, `canEditSlot`, `swapAvailability`, `fridayNoticeVisible` and `markViewed` exist and are covered by the 48 engine checks. Phase 2 is UI, session wiring and data, not new engine rules.

| Area | Work |
|---|---|
| Session layer | Add actions for swap, assign, regenerate, view-next-week, dismiss notice. Each persists and returns the new week or the engine's `Refusal` (RELEASE-PLAN architecture rule) |
| Components new to the build | C12 Week switcher, C24 Day accordion, C25 Slot picker row, C26 Regenerate confirm sheet, C27 Next-week notice, C31 Inert reason block; C20 and C21 action buttons on Dish |
| Screens changed | Today (notice), Week (switcher, next week, Regenerate), Dish (action slot), Search (ingredients, groups, coverage), new AddToMeal picker |
| Data | Glossary Pass 1 (ingredient ids). Tier 2/3 recipe content where extracted. Both feed Search and Dish |
| State | Origin-aware back and search state must still pass NAV-03 with the new picker flow |

**Dish action slot rule (DSH-09 to DSH-11):** exactly one of three things is always in the slot: Swap (opened from a plan, day after today), Add to a meal (opened from Search), or an inert reason (today, past day, single-recipe role).

## 4. Dependencies, risks and open points

| # | Item | Effect | Action |
|---|---|---|---|
| 1 | **Glossary unproofread, Kannada only** (`fix.md` #2) | Ingredient search quality and ingredient ids | Proofread before SRC-02 can pass. Still open |
| 2 | Release plan conflict on tier 3 method text | Resolved | **Decided 2026-11-15 (P1):** Phase 2 shows tier 2 only; method text after the Phase 3 rewrite |
| 3 | Tier 2/3 content does not exist for most recipes (Pass 3 is never blocking) | Most dishes show tier 1 only; extracted/unextracted groups must work | SRC-08 to SRC-10 and DSH-03 cover it |
| 4 | **G-22** "a role holding a single recipe" | Needed for the swap inert reason | **Accepted 2026-11-15 (P7):** no other dish after role, slot and season filters |
| 5 | **G-23** regenerate may not change the week | Resolved | **Decided (P8):** always confirms; seed changes; main meal differs where pools have 10 or more |
| 6 | Four code behaviours still to change, **all confirmed present 2026-11-15** (`fix.md` #9 to #12): swap allowed on today, season uses Monday's month, off-plan mark suppresses implicit record, swap drops a cooked mark | Violates LIF-20, LIF-23, D3, HST-08 | Fix first when code resumes; needs an explicit order |
| 7 | Add-to-a-meal mocks are stale (`COMPONENTS.md` §6) | Picker needs fresh visuals | Design pass before build |
| 8 | REQUIREMENTS §3.3 rewrite | Done 2026-11-15 | None |
| 9 | IndexedDB eviction can erase serving history | Public users lose history | **Decided (P3):** no export in Phase 2; request persistent storage and document the risk |
| 10 | Back button and lighter later slots | Now in scope | **Decided (P2):** Phase 2. Needs criteria added to section 6 |

Build order: C31 and Dish action slot, swap, week switcher and next week, Regenerate and C26, Today notice, Add to a meal picker, then Search upgrade and tier 2.

## 5. Testing matrix (by feature)

| Feature | Happy path | Boundary | Negative |
|---|---|---|---|
| Swap | LIF-19, DSH-09 | LIF-21, LIF-22 | LIF-20, LIF-23, NAV-05 |
| Regenerate | LIF-03, LIF-08 | LIF-04, ASN-10 | LIF-02, LIF-10 |
| Next week | LIF-07, LIF-17, CAD-01 | LIF-09, LIF-13, LIF-15, CAD-03, CAD-04 | LIF-14, LIF-18, CAD-02 |
| Notice | CAD-10 | LIF-16 | CAD-02 |
| Add to a meal | ASN-01 to ASN-03, DSH-10 | ASN-04, ASN-08 | ASN-05 to ASN-07, ASN-09 |
| Search | SRC-02 | SRC-10 | SRC-08, SRC-09, SRC-11 |
| Dish | DSH-04 | DSH-06, DSH-11 | DSH-05, DSH-07 |
| Navigation | NAV-04 | | NAV-03 |

## 6. All Phase 2 acceptance criteria in one place

Type: H = happy, B = boundary, N = negative. IDs and wording come from `TEST-PLAN.md`. "New" means not covered by the Phase 1 build. "Regression" means it passes today and must keep passing.

**Week lifecycle**

| ID | T | Criterion | Status |
|---|---|---|---|
| LIF-02 | N | No regenerate control on the current week, from any entry path | Regression |
| LIF-03 | H | Regenerate next week replaces it; current week byte-identical | New |
| LIF-04 | B | At Monday boundary next week becomes current, no longer regenerable | New |
| LIF-07 | H | Next week can be generated on demand before Friday | New |
| LIF-08 | N | Regenerating never alters serving history of the current week | New |
| LIF-09 | B | Current week shows its explanatory line with inline **Plan next week**; no empty action slot | New |
| LIF-10 | N | No disabled or greyed regenerate on the current week | Regression |
| LIF-13 | B | **Next week →** generates next week if missing | New |
| LIF-14 | N | On-demand generation shows no spinner, skeleton or progress | New |
| LIF-15 | B | On-demand week equals the deadline week for the same history and seed | New |
| LIF-16 | B | Friday notice not shown once next week has been viewed | New |
| LIF-17 | H | Week screen has a *This week · Next week* switcher, one week at a time | New |
| LIF-18 | N | Two weeks never rendered side by side | New |
| LIF-19 | H | Swap available after today and on all of next week | New |
| LIF-20 | N | Swap not available today or on past days | New |
| LIF-21 | B | At Monday boundary a week loses regenerate, keeps swap | New |
| LIF-22 | B | Control labelled **Swap with a different dish**, never "regenerate" | New |
| LIF-23 | N | Today shows inert reason *Today's plan is fixed. Swap works from tomorrow.*; picker lists no slot for today | New |

**Assignment (Add to a meal)**

| ID | T | Criterion | Status |
|---|---|---|---|
| ASN-01 | H | Any dish found in Search can be assigned to a slot | New |
| ASN-02 | H | Assignment replaces what was in the slot | New |
| ASN-03 | H | Picker shows each slot's current dish | New |
| ASN-04 | B | Today and past days not offered | New |
| ASN-05 | N | Role mismatch assigned with no warning, confirmation or refusal | New |
| ASN-06 | N | Out-of-season dish can be assigned with seasonality on | New |
| ASN-07 | N | A dish cooked yesterday can be assigned despite the repeat window | New |
| ASN-08 | B | Reaches any day after today and all of next week | New |
| ASN-09 | N | Assignment does not alter the week seed | New |
| ASN-10 | B | Regenerating next week discards slot edits, confirming first | New |

**Dish screen**

| ID | T | Criterion | Status |
|---|---|---|---|
| DSH-04 | H | Major ingredients shown by default, seasoning stoplist behind *show all* | New |
| DSH-05 | N | No quantity, ingredient or step is ever invented | New |
| DSH-06 | B | Unresolved ingredient renders its verbatim text, no guessed category | New |
| DSH-07 | N | No Have / Buy marker anywhere | Regression |
| DSH-09 | B | Swap appears only when opened from a plan, for a day after today | New |
| DSH-10 | N | From Search the same position shows **Add to a meal** | New |
| DSH-11 | B | Action position never empty | New |

**Search**

| ID | T | Criterion | Status |
|---|---|---|---|
| SRC-02 | H | Ingredient query returns extracted dishes listing it | New |
| SRC-08 | N | Results split into extracted and unextracted groups; the latter headed as name-only | New |
| SRC-09 | N | Coverage line: recipes with ingredients searched, out of total | Changes from "0 recipes" |
| SRC-10 | B | Second group and coverage line disappear when extraction is complete | New |

**Notice and cadence**

| ID | T | Criterion | Status |
|---|---|---|---|
| CAD-01 | H | At the configured moment next week's plan exists | New |
| CAD-02 | N | Next week appears as a notice, never a modal | New |
| CAD-03 | B | If not opened on Friday, generated on next open | New |
| CAD-04 | B | Late generation equals punctual generation for the same seed | New |
| CAD-05 | H | Current week unchanged while next week exists | New |
| CAD-10 | B | **Dismiss** hides the notice for that week and survives restart | New |

**Navigation**

| ID | T | Criterion | Status |
|---|---|---|---|
| NAV-03 | N | No state leak: Dish returns to origin with query and chip intact; the picker adds a new origin to cover | Regression, widened |
| NAV-05 | N | Swap on days after today and next week; no Regenerate on the current week | New |

Exit criteria (RELEASE-PLAN): LIF, DSH-09 to DSH-11, SRC and NAV-03 green. The ASN and CAD criteria above are included because Phase 2 ships Add to a meal and the notice; the release plan's exit line does not name them and should be updated.

## 7. Documentation updates

| Document | Change |
|---|---|
| `RELEASE-PLAN.md` | Add ASN and CAD to the Phase 2 exit line; resolve the tier 3 conflict (item 2); move Settings to "done" |
| `REQUIREMENTS.md` §3.3 | D5 meal types and D5c |
| `PHASE-1-DESIGN.md` | Settings is built; mark Phase 2 hand-offs |
| `testing/CRITERIA-MAP.md`, `GAPS.md` | Still describe 123 criteria (DECISIONS "Not yet propagated"); map the seven new ones; close G-22, G-23 |
| `app/COMPONENTS.md` §6 | Replace stale Add-to-a-meal mocks |
| `fix.md` | Add Phase 2 open items |
| `README.md` | Phase status |
