# Gaps and Contradictions

**Owner:** testing agent, for the product owner. **Updated 2026-11-03** against `DECISIONS.md`: 7 gaps resolved, 5 partly or mostly resolved, 22 still open, 2 new. The original finding text is kept under each status line as the record of what was decided and why. **Status:** delivered, nothing applied. No requirement or design document has been edited; every item below is a proposal for the owner to accept, change or reject.

Severity: **Blocker** = a criterion cannot be written or cannot pass as the documents stand. **High** = two plausible implementations both satisfy the text and behave differently. **Medium** = ambiguity that costs a test its precision. **Low** = tidiness.

Evidence tagged *model* comes from `testing/simulations/reference-model.py` (a reading of the rules, not the app). *Fixture* means a case in `testing/fixtures/`.

## Summary

| ID | Status | Severity (original) | One line |
|---|---|---|---|
| G-01 | Resolved | High | `SNACK-LIBRARY.md` §3 states the wrong months for the Snack 1 pool sizes |
| G-02 | Resolved | **Blocker** | GEN-01 / GEN-08 vs GEN-19: a role with no in-season recipe cannot be filled |
| G-03 | Open | High | Role taxonomy and the main-meal position-to-role mapping are never stated |
| G-04 | Open | Medium | Dish counts (3-5 main, 1-2 snacks, "accompaniment") are untested and unmodelled |
| G-05 | Open | High | `slots` field and the section proxy are two sources of truth; roti sits in both |
| G-06 | Open | Medium | Sections absent from every list have undefined slot eligibility |
| G-07 | Open | Low | Snack 1 entry 41 has an empty season cell |
| G-08 | Open | Low | Authored Snack 2 additions duplicate Snack 1 entries; no same-day rule |
| G-09 | Resolved | **Blocker** | The repeat window's edge is undefined, and Snack 1 exactness depends on it |
| G-10 | Open | High | Pure-function inputs omit dishes placed earlier in the same generation |
| G-11 | Partly resolved | High | Which month governs a week; VAR-03 is unobservable inside one month |
| G-12 | Open | Medium | Fallback tie-break and the ordering of never-served dishes |
| G-13 | Resolved | High | VAR-03 (exact cycle) vs VAR-04 (no consecutive family): priority unstated |
| G-14 | Open | High | Where the first week seed comes from; what "advance" means |
| G-15 | Open | High | Determinism claim hides inputs and needs a history snapshot |
| G-16 | Resolved | **Blocker** | Off-plan marking has no slot; HST-08 cannot be implemented as written |
| G-17 | Partly resolved | High | Implicit-record timing, first launch and long absence |
| G-18 | Open | High | CAD-01 "unprompted at 18:00" vs "no background job" |
| G-19 | Resolved | **Blocker** | NAV-05 contradicts swap being in v1; other stale references |
| G-20 | Resolved | Medium | `DESIGN.md` §3.2 vs §3.2.2 on how the two weeks are shown |
| G-21 | Partly resolved | High | DSH-11 vs DSH-09; DSH-01 vs DSH-08; swap on role-less snacks |
| G-22 | Open | Medium | "A role holding a single recipe" is undefined |
| G-23 | Open | Medium | GEN-12 "the week differs" is not guaranteed; regenerate confirm coverage |
| G-24 | Open | Medium | VAR-06 has no threshold |
| G-25 | Open | High | Windows need 22+ recipes per main-meal position to hold at all |
| G-26 | Open | Medium | Repeat windows: fixed, tunable, or next version? Four documents disagree |
| G-27 | Resolved | High | No home for the seasonality toggle or the schedule setting |
| G-28 | Open | Medium | Serving history shared across slots |
| G-29 | Open | High | Timezone, DST and clock changes at the Monday boundary |
| G-30 | Mostly resolved | High | The "every pair clears 7:1" claim is false; dark tokens incomplete |
| G-31 | Open | Medium | No corpus-level criteria; id registry and unresolved `item` undefined |
| G-32 | Mostly resolved | Low | 18 criteria missing from the §11 traceability table; duplicates |
| G-33 | Open | Medium | Requirements with no criterion |
| G-34 | Open | Medium | Search scope: Snack entries and ingredient matching |
| G-35 | Resolved (new) | Medium | LEG-07 names only `fg.subtle`; DESIGN §2.2.1 restricts `action.primary` too |
| G-36 | Resolved (new) | Medium | VAR-04 text is absolute; ARCHITECTURE makes the family rule best-effort |

---

## G-01 Snack 1 pool sizes by month are stated wrongly

**Source.** `SNACK-LIBRARY.md` §3: "The cycle is however many are in season that month, 60 from July to February, 54 outside it."
**Finding.** Computed from the six tags in the same document (7 and 21 Mar-Jun; 24 and 27 Mar-Jun; 31 Mar-Jul; 32 Apr-Jul), the pool is **54 from Aug to Feb, 56 in Jul, 59 in Mar, and 60 only in Apr-Jun.** The sentence has the seasons inverted. `fixtures/snack1.library.json` `seasonPools` has the derived table. This also fixes VAR-07 (no exclusions) to Apr-Jun only and VAR-08 (six excluded, 54) to Aug-Feb. Entries marked "Mar-Jul" for pineapple mean March has one exclusion (mango), hence 59, a value no document mentions.
**Proposal.** Correct §3. Keep the derived table in the fixture as the test oracle. Confirm the Mar-Jul / Apr-Jul tags are intended.
**Criteria.** VAR-03, VAR-07, VAR-08.

## G-02 A role with no in-season recipe cannot be filled (Blocker)

> **Resolved.** D2 (DECISIONS.md): season wins, completeness gives. A main-meal position with no in-season candidate is left out; a slot is empty only if it has no candidate at all and then offers Add to a meal. TEST-PLAN GEN-01 and GEN-19 rewritten, GEN-23 added; `ARCHITECTURE.md` §3.2 updated. Tested by SIM-07. Not adopted from my proposal: the corpus lint and next-role substitution. The lint (G-31) is still worth having to catch an all-seasonal composition role early.

**Sources.** `TEST-PLAN.md` GEN-01 ("No slot is empty"), GEN-08 ("Generation never fails and never leaves a gap"), GEN-19 ("season filter is never relaxed by the fallback"); `ARCHITECTURE.md` §3.2 step 7 ("only the repeat window gives way").
**Finding.** Step 7 fires only when the *repeat window* empties the pool. If step 3 (season) empties it first, there is nothing to fall back to, and step 7 is forbidden from relaxing step 3. *Fixture:* role `sasam` has two recipes, both seasonal (Mar-Jul and Apr-Jul). *Model:* in November a position of `sasam` alone is **UNFILLABLE on 28 of 28 days**. A real version of this arises for any role that is mostly seasonal: a "mango" role, a "jackfruit" role.
**Proposal (recommended).** Three layers, cheapest first: (1) a build-time corpus lint requiring every composition role to hold at least one all-year recipe; (2) at generation, if a position has no candidate, deterministically fill it from the next role in its position's role list (see G-03); (3) if still empty, omit the position and relax GEN-01 from "no empty slot" to "no empty slot, though a composition position may be omitted". Never relax season. Owner decides between (2) and (3).
**Criteria.** GEN-01, GEN-08, GEN-19 (x until ruled).

## G-03 Role taxonomy and position mapping are never stated

**Sources.** `REQUIREMENTS.md` §3.3 ("a role from the book's 30 section headings"); GEN-03; `SNACK-LIBRARY.md` §2.1 lists 14 of the 30 sections.
**Finding.** The 30 headings appear nowhere. "Composed by role: a saar, a curry, a rice or roti, a side" does not say which sections form each position, whether "curry" includes sambar and kolambu, or whether breakfast has a role at all. *Fixture* uses 14 invented role slugs and a four-position reading.
**Proposal.** Add the 30 headings to `ARCHITECTURE.md` §2.1 and a table `position -> [sections]`. Pass 2 is the natural moment; the headings are known from the book's contents page.
**Criteria.** GEN-03, GEN-14, GEN-16.

## G-04 Dish counts are not pinned

**Sources.** `REQUIREMENTS.md` §3 table: Breakfast "1-2 plus an accompaniment", Main "3-5", Snack 2 "1-2".
**Finding.** GEN-03 implies four main-meal dishes; the schema has no accompaniment concept; "a week is 28 slots" (GEN-01) treats a slot as one thing. Slot count vs dish count is never reconciled, and no criterion asserts counts.
**Proposal.** State per slot the exact count generated in v1 (suggest 1 breakfast dish, 4 main positions, 1 Snack 1, 1 Snack 2) and demote "1-2", "3-5" and "accompaniment" to a stated future direction. Then add one criterion for the counts.

## G-05 `slots` field vs section proxy; roti is in both

**Sources.** `ARCHITECTURE.md` §2.1 (`slots` per recipe), §3.2 step 1 (filters on `slots`); §2.3 and `SNACK-LIBRARY.md` §2.1 (Snack 2 eligibility by section, "not hand-tagged per recipe").
**Finding.** Two mechanisms define Snack 2 eligibility. Section 21 "Bhakri, Roti and Cutlets" is *in* the Snack 2 list while roti is also a main-meal role, so one section legitimately serves two slots. If `slots` wins, the "mechanical, no per-recipe judgement" claim fails. If the proxy wins, `slots` is redundant for Snack 2.
**Proposal.** Make `slots` for Snack 2 *derived* from section at load time, not stored, and keep `slots` stored only for breakfast and main. State that a section may map to more than one slot.
**Criteria.** GEN-04, GEN-06.

## G-06 Sections in no list

**Finding.** Snack 2 names 14 sections; breakfast names 4 in prose (§3); the other 30 headings are unclassified. Nothing says whether an unlisted section (for example rice) is in or out of Snack 2.
**Proposal.** One table, all 30 sections, columns: breakfast / main (which position) / Snack 2. Unlisted means excluded.

## G-07 Snack 1 entry 41 has an empty season cell

**Source.** `SNACK-LIBRARY.md` §1.4, row 41 ends `| |`; every other untagged row has no trailing cell. The section header says Season is a column for 1.1 to 1.4 only, not 1.5 and 1.6.
**Finding.** Read as untagged (all year). It is probably a formatting slip, but a typed tag could have been lost.
**Proposal.** Confirm "Raw papaya salad" is all year. `fixtures/snack1.library.json` assumes so and says so. Also confirm "Tender coconut", "Sweet corn chaat" and "Pomegranate" should be all year; the document itself says the months "want checking".

## G-08 Cross-slot duplicates on one day

**Finding.** Snack 2 authored additions overlap Snack 1 entries: *Roasted makhana* (S1 #54, S2), *Corn chaat* / *Sweet corn chaat* (S2, S1 #39), *Roasted chickpeas* / *Roasted chana* (S2, S1 #53), *Dahi poha* beside the curd family. They have different ids, so history does not link them. GEN-07 forbids only breakfast = Snack 2. The Snack 2 authored entries also carry no `family`, so VAR-04 does not apply to them.
**Proposal.** Either dedupe the two libraries, or extend the same-day collision rule to Snack 1 vs Snack 2 by name. A new criterion is needed in either case.

## G-09 The repeat-window edge is undefined (Blocker)

> **Resolved.** D1: inclusive window. Excluded through D+N, back on D+N+1 (main meal day 22). VAR-09 added; `ARCHITECTURE.md` §3.2 states it. Matches my proposal exactly. Reference model now defaults to it; SIM-03 is exact under it.

**Sources.** `REQUIREMENTS.md` §4.1 ("served within the last N days is excluded"), VAR-01 ("within 21 days"), `ARCHITECTURE.md` §3.3 (Snack 1 window = pool - 1).
**Finding.** "Within N days" does not say whether a dish served on day D can reappear on day D+N. *Model:* the **exclusive** reading makes Snack 1 *not* an exact cycle (a dish served on day 1 is allowed on day 54 while a never-served entry is still waiting; offsets 0 and 54 fail). Only the **inclusive** reading (excluded through D+N, first allowed D+N+1) gives VAR-03. The two readings also move the main-meal minimum gap between 21 and 22 days and the minimum pool from 21 to 22. The brief names this boundary ("day 20 vs 21") as the one that matters most, and it cannot be tested.
**Proposal.** Rule: *a dish is excluded when the target date minus its last-served date is less than or equal to N.* Equivalently, first allowed on D+N+1. Then main meal minimum gap is 22 days, breakfast 8, Snack 2 15, and Snack 1 with window pool-1 repeats at exactly pool days. State it once in `ARCHITECTURE.md` §3.3.
**Criteria.** VAR-01, VAR-02, VAR-03, VAR-05, GEN-17.

## G-10 Dishes placed earlier in the same generation

**Source.** `ARCHITECTURE.md` §3.1 (pure function of `servingHistory`, `seed`, `weekStart`).
**Finding.** A week is generated in one pass from stored history. If history is not updated in-memory as each day is placed, Monday's saar is still "fresh" for Tuesday's pick and the week can repeat itself. Also: when next week is generated on Friday, Saturday and Sunday of the current week have not happened. Do their implicit records count (HST-04)?
**Proposal.** State that generation maintains a working copy of history updated as each slot is filled, and that implicit records for the remaining days of the current week count at generation time. Add a criterion: no dish appears twice within one generated week unless the fallback fires.
**Criteria.** GEN-10, VAR-01, HST-04.

## G-11 Which month governs; VAR-03 is unobservable inside one month

> **Partly resolved.** Month basis resolved: season uses each day's own date (GEN-24, `ARCHITECTURE.md` §3.2). Still open: VAR-03's text ("N = entries in season that month") is unobservable inside one month; restate over constant-pool stretches.

**Sources.** `REQUIREMENTS.md` §4.7 ("the week being planned"), `ARCHITECTURE.md` §3.2 step 3 ("the month of the week being planned"), VAR-03 ("N, where N is the entries in season that month").
**Finding.** A Monday-Sunday week can straddle two months. *Model, week of 2027-03-29:* by day, mango sasam (Apr-Jul) is used on Apr 1 and Apr 3; by week-start month it never is. The reverse straddle serves an out-of-season dish after its season ends. Separately, N is 54 to 60 and no month has more than 31 days, so VAR-03 as written can never be checked in a single month. It is only checkable in a constant-pool stretch (Aug 1 to Feb 28, Apr 1 to Jun 30). And Snack 1's window "recomputed per month" has no rule for entries in flight at a boundary.
**Proposal.** Decide per day: season is tested against the date the dish will be cooked. Snack 1's window uses that day's month pool. Restate VAR-03 as "within any stretch where the pool is constant, each entry appears exactly once per cycle", and keep VAR-07 and VAR-08 as its two named instances.
**Criteria.** GEN-18, VAR-03, VAR-07, VAR-08.

## G-12 Fallback tie-break and never-served ordering

**Source.** GEN-08, `ARCHITECTURE.md` §3.2 step 7 ("oldest-served").
**Finding.** Two candidates with the same last-served date, or several never served, have no defined order. Because GEN-10 demands determinism, an unstated tie-break is a hidden source of nondeterminism across implementations. Is a never-served dish older than any served one?
**Proposal.** Never-served ranks oldest; ties break by recipe id ascending. State it.

## G-13 VAR-03 vs VAR-04: no stated priority

> **Resolved.** `ARCHITECTURE.md` §3.2 priority rule: season, then repeat window, then family adjacency, which is best-effort. VAR-03 is strict and VAR-04 is best-effort. See new G-36: the VAR-04 criterion text still says absolute.

**Source.** VAR-03, VAR-04, `SNACK-LIBRARY.md` §1 "rotation rule".
**Finding.** With window = pool - 1, the exact cycle leaves one eligible dish per day after the first pass, so the family rule can only act during the first pass. A greedy pick can be forced into same-family adjacency. *Model (inclusive reading):* seeds with at least one violation, out of 20: 7 (Aug-Feb), 5 (Apr-Jun), 12 (Feb-Aug), 4 (seasons off); worst seed 7 violations. The cycle repeats in identical order, so a violation recurs every cycle. This is a priority problem, not an impossibility: a constructive ordering would satisfy both.
**Proposal.** Rule: VAR-03 wins over VAR-04 only if no ordering satisfies both; the generator builds the cycle order once per pool by a seeded constructive shuffle that avoids adjacent families, including across the wrap. Add the wrap-around adjacency to VAR-04.
**Criteria.** VAR-03, VAR-04.

## G-14 Seed origin and "advance"

**Source.** `REQUIREMENTS.md` §4.2, GEN-11, GEN-12.
**Finding.** "No randomness" yet every week needs a first seed. If it is chosen by clock or `Math.random`, CAD-04 and LIF-15 ("a late generation produces the same week") cannot hold. "Advances the seed" does not say by how much or whether a regenerated week can return to a previous seed.
**Proposal.** First seed is a pure function of `weekStart` (for example the ISO week number). Regenerate increments a stored counter; seed = f(weekStart, counter). Both stored.

## G-15 Determinism hides inputs and needs a history snapshot

**Sources.** `ARCHITECTURE.md` §3.1 ("the same three inputs always give the same week"), README principle 7 ("reproduced exactly from a bug report").
**Finding.** Output also depends on the corpus version, `settings.respectSeasons`, the window values and the snack library. And `servingHistory` is mutated after generation, so the history *at generation time* is not recoverable from the stored week. A bug report with only the seed does not reproduce the week.
**Proposal.** Store with each week: seed, counter, corpus version and a compact snapshot of the settings. For history, store the minimal last-served map used (a few hundred ids) or accept that reproduction is "from the seed and a history export". State which. Fix §3.1's signature accordingly.
**Criteria.** GEN-10, GEN-11, LIF-15, CAD-04.

## G-16 Off-plan marking has no slot (Blocker)

> **Resolved.** D3 and Q9: a Search mark records the dish as served today, with no slot and no cancellation of planned dishes, today only; cooked marks exist on today and passed days only, never days ahead. HST-08 rewritten, HST-13 added. Different from my proposal (slot matching), simpler, and it dissolves the four-dishes question. Cost: the planned dish a user replaced is still counted as served by the implicit record, which errs toward repeating less.

**Sources.** `REQUIREMENTS.md` §4.1.1; HST-07, HST-08; `DESIGN.md` §3.3 (the Dish screen has a cooked control and nothing that picks a slot).
**Finding.** HST-08 says marking an off-plan dish "for a slot" cancels the implicit record "for that slot". A dish reached from Search belongs to no plan and no slot, and the Dish screen asks for none. So the app cannot know whose implicit record to cancel. Related: (a) the main meal holds four dishes, so one off-plan curry cancels which of four? (b) which date does a mark set when made for a passed day (HST-01 says "that day")? (c) `REQUIREMENTS.md` §4.5.2 says cooked is "today only" for today-and-ahead and "yes" for passed days; no criterion tests either edge.
**Proposal.** On marking an off-plan dish, match it to the day's slot by the slot field it is eligible for; if it matches several (breakfast and Snack 2), ask once (a two-option choice, not a dialog chain); for the main meal, cancel the implicit record of the same-role position only. Date: the mark sets lastServed to *today* unless made from a passed day's row, when it sets that day. Add criteria for "future days refuse cooked" and "passed days accept it".
**Criteria.** HST-01, HST-07, HST-08 (x), LIF-06.

## G-17 Implicit-record timing, first launch, long absence

> **Partly resolved.** First launch resolved by Q5 (current week from today onward; earlier days empty, not history; CAD-09). Still open: when a planned dish counts as served (HST-04), and a long absence with skipped weeks.

**Source.** HST-04, CAD-08, CAD-03.
**Finding.** (a) Does a planned dish count as served at generation, at the start of its day, or only once its day has passed? (b) CAD-08: first launch on a Wednesday generates "a week". Which one, and do Monday and Tuesday, which were never lived, count as served? (c) The app is unopened for 17 days: which weeks exist, what is current, are skipped weeks in history?
**Proposal.** (a) A planned dish counts as served at the end of its day (past days only) for the *current* week and as planned-but-not-served for next week; generation still treats upcoming dishes as in-window (G-10). (b) First launch generates the current week from today forward, with earlier days empty and uncounted, plus next week on demand. (c) On open after a gap, the current week is the week containing today, generated if absent; skipped weeks are not backfilled and contribute no history.

## G-18 CAD-01 vs "no background job"

**Source.** CAD-01 ("at the configured moment, next week's plan exists without the user asking"), `ARCHITECTURE.md` §3.5 (check runs on open and on navigation; no timer).
**Finding.** If the app is open and idle across Friday 18:00, no check runs, so the plan does not exist at 18:00. CAD-01 is then observable only as "the week exists when the app is next opened at or after 18:00", which is CAD-03. As written, CAD-01 and CAD-03 collapse into one.
**Proposal.** Reword CAD-01: "When the app is opened or navigated after the configured moment, next week exists and the notice is shown." Optionally add a timer while foregrounded, then CAD-01 can stay unprompted.

## G-19 Stale and contradictory references (Blocker for NAV-05)

> **Resolved.** D4: swap is in v1. NAV-05 rewritten; README now says 130 criteria; the §9.1 and "next version" references in `DESIGN.md` and `ARCHITECTURE.md` are gone. Verified by reading the current documents.

| Where | Problem |
|---|---|
| NAV-05 | "No swap control exists anywhere in v1" contradicts GEN-14 to GEN-17, LIF-19 to LIF-22, DSH-09. Cites §9.1, which does not exist |
| `DESIGN.md` §5 | "no per-dish swap (next version, §9.1)" |
| `ARCHITECTURE.md` §7 | "Swap machinery | Next version" |
| `REQUIREMENTS.md` §9 | Says swap is now in v1, yet is the only place the numbered "§9.1" could point |
| `README.md` | "116 acceptance criteria"; `TEST-PLAN.md` has 123 |
| `TEST-PLAN.md` §11 | NAV-05 mapped to §8 and §9.1 |

**Proposal.** Retire NAV-05 (the plan's own rule: "retire instead of renumber"). Replace with "No per-dish control exists other than Swap with a different dish and Add to a meal". Correct the three stale lines and the criterion count.

## G-20 `DESIGN.md` §3.2 vs §3.2.2

> **Resolved.** `DESIGN.md` no longer contains the "next week appears above this week" text; §3.2.2 (switcher) stands.

**Finding.** §3.2 says from Friday "next week appears above this week ... Two weeks visible at once is the point". §3.2.2 rejects exactly that and chooses a switcher. LIF-17 and LIF-18 follow §3.2.2. A developer reading §3.2 first builds the wrong thing.
**Proposal.** Delete the two sentences in §3.2 or mark them superseded.

## G-21 Dish screen action slot and role-less snacks

> **Partly resolved.** (a) resolved: `DESIGN.md` §2.8 inert reason block takes the control's place for a single-recipe role, today and a passed day, so the action slot is never empty (DSH-11). Still open: (b) DSH-01 "always" vs DSH-08, (c) swap on role-less Snack entries.

**Finding.** (a) DSH-11 says one of Swap / Add to a meal is always present. A dish opened from a **past day** of the current week has no swap (LIF-20) and is not from Search, so the slot is empty. (b) DSH-01 says page "always" renders; DSH-08 says Snack 1 has none. (c) Swap is defined as "another of the same role", but Snack 1 and the authored Snack 2 entries have no role; and for Snack 1 the window leaves only one eligible entry, which is the one already there.
**Proposal.** (a) On a past-day dish the position shows a calm static line ("Passed") rather than a control; restate DSH-11 as "never an empty slot", counting that line. (b) Reword DSH-01 for book recipes only. (c) State that swap on Snack 1 picks the next entry in the stored cycle order and on authored Snack 2 uses the family-less pool, or declare swap unavailable for both with a reason, as for GEN-16.
**Criteria.** DSH-01, DSH-09, DSH-11 (x), GEN-14.

## G-22 "A role holding a single recipe"

**Finding.** Counted in the corpus, or after season, window and slot filters? A two-recipe role with one out of season is effectively single. *Fixture:* `side` is single by corpus count; `sasam` is effectively zero in November.
**Proposal.** Swap is unavailable when fewer than one *other* candidate survives steps 1-3 (role, slot, season), ignoring the repeat window (the fallback covers it). The reason text should say which.

## G-23 GEN-12 and the regenerate confirmation

**Finding.** "Regenerate advances the seed, so the week differs" is not guaranteed: Snack 1 is seed-independent under an exact cycle, and tiny pools can produce an identical week by chance. And DESIGN §4 says regenerate always confirms, but only ASN-10 tests a confirmation, and only when slot edits exist.
**Proposal.** GEN-12: "the stored seed changes, and at least one main-meal slot differs on a corpus with pools of 10 or more". Add: regenerate shows a confirmation whether or not slots were edited.

## G-24 VAR-06 threshold

**Finding.** "Substantially exceed 6" has no number, and "6" is ambiguous (six dishes in total, or six main meals). *Model (rich corpus):* 119 of 120 distinct main-meal dishes in 8 weeks, so any plausible threshold passes on synthetic data and says nothing about the book.
**Proposal.** Owner picks a number; suggest at least 30 distinct main-meal dishes in 8 weeks, plus no repeated complete main meal. Re-run on the real corpus after Pass 2.

## G-25 Pool size needed for the windows to hold

**Finding.** *Model:* the 21-day main-meal window needs 21 recipes in each composition position (22 inclusive) or the fallback becomes the normal path; breakfast needs 7 (8). The book's saars, rasams and soups, sides and sasams may be smaller than that. This is not a document error; it is the largest unmeasured risk to the product's only job.
**Proposal.** Add a Pass 2 report: recipes per position per slot. Where a position has fewer than 22, either shorten that role's window or merge adjacent roles into one position. Decide before launch, not after.

## G-26 Are the windows tunable?

| Source | Says |
|---|---|
| `REQUIREMENTS.md` §4.1 | N "should be tunable without a rebuild" |
| `ARCHITECTURE.md` §2.4 | `settings` holds repeat windows |
| `ARCHITECTURE.md` §3.3 | "fixed in v1 and configurable later" |
| `REQUIREMENTS.md` §9 | Per-slot tuning is next version |
| `DESIGN.md` §5 | No settings beyond the generation schedule |

**Proposal.** Fixed in v1, defined in code constants, but read through one function so the test suite can inject values. Delete "without a rebuild" from §4.1.

## G-27 No home for the settings

> **Resolved.** Q8: a Settings button on the Today screen only (`DESIGN.md` §3.5), not a tab. Holds the schedule and seasonality. NAV-01 stands.

**Source.** `DESIGN.md` §6 (open), §5, NAV-01 ("exactly three tabs").
**Finding.** CAD-06 and GEN-21/22 need a settings UI. None is specified and there are only three tabs, so these cannot be driven end to end.
**Proposal.** A gear in the Week and Today headers opening a sheet with two items: generation day and time; respect seasons. It is not a tab, so NAV-01 stands.

## G-28 Serving history shared across slots

**Source.** `ARCHITECTURE.md` §2.4 (`servingHistory` keyed by recipe id).
**Finding.** A dish served at breakfast counts as served for Snack 2 and vice versa. *Model, small corpus:* Snack 2 falls back on 165 of 182 days (inclusive reading) against 0 (exclusive). Possibly intended; undocumented.
**Proposal.** State it. If intended, size the Snack 2 pool as breakfast plus Snack 2 combined.

## G-29 Timezone, DST and clock changes

**Source.** `ARCHITECTURE.md` §3.4 ("date comparison on app open"), LIF-01, LIF-04.
**Finding.** "Monday" is relative to which timezone? What happens when the device clock moves backwards (a past week becomes current)? A US user (the doc mentions one) crosses DST.
**Proposal.** Use the device's local calendar date. Never let the current week index decrease: if the computed week is earlier than the highest week seen, keep the highest. SIM-LIF04 runs three timezones to verify.

## G-30 Legibility claims vs the tokens

> **Mostly resolved.** `DESIGN.md` §2.2 recomputed and now marks failing pairs; §2.2.1 adds a permitted-ground table (fg.subtle and action.primary on surface only); status.success dropped; dark tokens complete incl. sunken (§2.6); LEG-03 now includes chips. Still open: LEG-06 has no threshold (canvas vs surface 1.23:1 light, 1.13:1 dark). See new G-35 for LEG-07 wording.

See Appendix A. Summary: three text pairs fail 7:1 although `DESIGN.md` §2.1 says every pair clears it; the documented ratios are up to 12 percent off the computed ones; dark mode has no `fg.subtle`, status or border tokens, so LEG-09 cannot be completed; LEG-06 has no threshold and canvas versus surface is 1.23:1 light, 1.13:1 dark.

## G-31 Corpus-level rules have no criteria; undefined schema corners

**Finding.** Nothing tests: tag density (30 to 50 of about 400); that ids are unique and never reused (HST-06 needs a retired-id registry that `ARCHITECTURE.md` §4 does not define); that pages fall in 6-165 and are printed, not PDF; that every ingredient `item` is a glossary id or flagged `unresolved`. What `item` holds for an unresolved ingredient is not stated (the fixture stores the verbatim text).
**Proposal.** A "Corpus lint" level run at build: unique ids, retired-id registry file, pages in range, slots valid, season months 1-12, every composition role has an all-year recipe (G-02), unresolved items carry their text. Add a short criterion group COR-01 to COR-06. Spot-check a sample of pages against the physical book by hand.

## G-32 Traceability table and duplicates

> **Mostly resolved.** The missing index rows were added; one remains, LIF-12b, which my range check does not find. The duplicate pairs (CAD-04 and LIF-15, LIF-04 and LIF-21) remain.

**Finding.** These 18 criteria are absent from `TEST-PLAN.md` §11: DSH-08, HST-05, HST-06, HST-10, HST-11, HST-12, LIF-10 to LIF-18 (including LIF-12b), NAV-03, NAV-04. CAD-04 and LIF-15 are the same criterion. LIF-04 and LIF-21 overlap. VAR-07 and VAR-08 are instances of VAR-03. GEN-13 is retired.
**Proposal.** Add the 18 to §11 (most trace to `DESIGN.md`). Merge or cross-reference the duplicates; do not renumber.

## G-33 Requirements with no criterion

From the reverse map in `CRITERIA-MAP.md`: dish counts (G-04); repeat-window tunability (G-26); tier-3 method and `variations` display; `needsReview`; "mark cooked: today only"; seasonal-tag density (G-31); the printed-versus-PDF page rule (G-31); Search over Snack entries (G-34).
**Proposal.** Add criteria, or declare these out of v1 test scope in `TEST-PLAN.md` §11's "Uncovered by design" line.

## G-34 Search scope

**Source.** SRC-02, SRC-06, `REQUIREMENTS.md` §7.
**Finding.** "The whole pool": does it include the 60 Snack 1 entries and the 12 authored Snack 2 additions? DSH-08 shows a Snack 1 dish, and a user could plausibly search "sprouts". And for SRC-02, does an ingredient query match Kannada ingredient names ("togari bele") or only the glossary's English name?
**Proposal.** Include both snack libraries by name and components. Match ingredients on English and Kannada glossary names; unresolved ingredients match on their verbatim text.

---

## G-35 LEG-07 covers one of two surface-only tokens (new)

**Sources.** LEG-07 ("`fg.subtle` appears only on `bg.surface`"), `DESIGN.md` §2.2.1.
**Finding.** §2.2.1 makes both `fg.subtle` and `action.primary` (as text, link or page number) surface-only in light, and bars both from `bg.sunken` as well as `bg.canvas`. LEG-07 mentions one token and one ground. A build can satisfy LEG-07 and still put a link on a sunken group at 6.9:1.
**Proposal.** Reword LEG-07 as the §2.2.1 table: for each token, only the listed grounds. The criteria map already tests it that way.

## G-36 VAR-04 is absolute; the architecture makes it best-effort (new)

**Sources.** VAR-04 ("does not place the same family on consecutive days"), `ARCHITECTURE.md` §3.2 ("the last is best-effort").
**Finding.** Under the decided priority the family rule yields to the window. *Model, inclusive window:* seeds with at least one same-family adjacency out of 20: 8 (Aug to Feb), 5 (Apr to Jun), 15 (Feb to Aug), 5 (seasons off); worst seed 6. A test written to VAR-04 as worded fails on those seeds.
**Proposal.** Reword VAR-04: "Snack 1 avoids the same family on consecutive days where the window allows; where it cannot, the window wins." Or build the cycle once per pool by a seeded constructive ordering so the count is zero, and keep the criterion absolute. Owner chooses.

## Appendix A: `TEST-PLAN.md` §9 against the final tokens

> **Superseded 2026-11-03 for the light and dark pair tables:** `DESIGN.md` §2.2, §2.2.1 and §2.6 now state the failing pairs, restrict them by ground, drop `status.success` and complete the dark set. The tables below are my original computation, kept because they agree with the corrected design. Items 1 to 4 of Findings are resolved; item 6 (LEG-06 threshold) is open.

All ratios computed from the hex values in `DESIGN.md` §2.2 and §2.6 with the WCAG relative-luminance formula. "Documented" is the figure in the design table.

### Light

| Pair | Computed on canvas | on surface | on sunken | Documented | 7:1? |
|---|---|---|---|---|---|
| `fg.default` | 14.48 | 17.85 | 16.30 | 12.9 / 16.3 | Pass |
| `fg.muted` | 8.40 | 10.35 | 9.45 | 7.8 / 9.9 | Pass |
| `fg.subtle` | **6.15** | 7.58 | **6.92** | 6.0 / 7.6 | Surface only. **Fails on sunken**, and DESIGN states it is "never on canvas" but says nothing of sunken |
| `action.primary` (as text or link) | **6.15** | 7.58 | **6.92** | 6.0 / 7.6 | Fails on canvas and sunken. Passes as a filled button with `fg.onAccent` (7.58) |
| `status.success` (as text) | **4.07** | **5.02** | **4.58** | 4.9 | Fails everywhere if used as text. Fine only as a non-text indicator, which needs 3:1 |
| `border.strong` | 3.86 | 4.76 | 4.34 | 4.8 | Passes the 3:1 UI rule |

### Dark

| Pair | canvas | surface | sunken | 7:1? |
|---|---|---|---|---|
| `fg.default` | 19.28 | 17.06 | 13.98 | Pass |
| `fg.muted` | 13.59 | 12.02 | 9.85 | Pass |
| `action.primary` | 13.64 | 12.07 | 9.89 | Pass |
| `fg.onAccent` on `action.primary` | 13.64 | | | Pass |
| `fg.subtle`, `status.*`, `border.*` | not defined | | | LEG-09 cannot check what is not defined |

### Card separation (LEG-06)

| Mode | Surface vs canvas | Note |
|---|---|---|
| Light | 1.23:1 | Better than the old mint (4 percent lightness) but still weak in glare |
| Dark | 1.13:1 | Weaker still; `bg.sunken` vs surface is the only stronger step |

### Findings

1. **`DESIGN.md` §2.1 "Every pair below clears 7:1" is false** for `fg.subtle` on `bg.sunken` (6.92), `action.primary` as text on canvas or sunken (6.15, 6.92) and `status.success` as text (4.07 to 5.02).
2. The documented ratios are not the computed ones (for example `fg.default` on canvas 12.9 vs 14.48). Direction is mostly conservative, so no test is endangered, but the table cannot be quoted.
3. LEG-01 lists only `fg.*`; it should list every text-bearing token, including `action.primary` and `status.*` used as text.
4. LEG-07 forbids `fg.subtle` on canvas but not on sunken, where it also falls below 7:1.
5. LEG-02 holds: the type scale floors at 15px. LEG-03 holds: 56px rows, 48px icon targets.
6. LEG-06 has no measurable threshold. Proposal: surface-to-canvas at least 1.2:1 in both modes plus a 1px or heavier border not relied on, and a manual outdoor check, which is already §10's manual item.

**Proposal.** Either darken `fg.subtle` and `action.primary` (as text) by one step (gray.700 and teal.900 fall comfortably above 7:1), or restrict them in writing to surface only. Add dark `fg.subtle`, `status.*` and `border.*`. Restate LEG-01 as a pair table and make it a unit test over the token file.

---

## Update 2026-11-11: owner's composition ruling (see `DECISIONS.md` D5)

**G-03.** Not one table of four positions, but one per meal type. Type A (plain rice with saar/sambar/curry, vegetable side optional) and type B (standalone rice dish). Position-to-section mapping still open: which of sections 2, 3, 4 form the "liquid" position, and which of 7, 8, 10, 11, 12 the "curry" position. Section 2 contains four soups (tomato, potato, mushroom, mixed vegetable) that are not obviously a saar.
**G-04.** Type A has 2 required dishes (liquid plus curry) and 1 optional (vegetable side); type B has 1. Dish count now varies by day, so GEN-03 and the "28 slots" reading need restating.
**G-25.** Largely relieved. Counts from `extraction/index.tier1.json`: liquid candidates (sections 2, 3, 4) 37, or 33 without the four soups; curry candidates (sections 8, 10) 44; vegetable side (section 7, sauteed vegetables) 22; rice dishes (section 14) 18, or 17 without the dessert Pongal, sakkarai (D7). With D5b (type B about once a week), a 22-day window holds about 19 type A uses and about 3 type B uses. Rice needs about 4 of its 18 candidates: fine. Liquid and curry exceed 19: fine. **The vegetable side is the tightest at 22 against about 19 uses, and it is optional, so omitting it on some days relieves it.** Soups and the dessert are now settled (D6, D7). Remaining: the engine can express the two meal types (done) but the real corpus still needs its `slots` and roles set.

**G-25 measured (2026-11-11).** `app/src/engine/corpus.test.ts` runs 52 weeks on the real tier-1 corpus (`extraction/recipes.tier1.json`): no position unfillable and no main-meal dish repeating inside the 21-day window. Pools: liquid 33, curry 48, vegetable side 22, rice 17. **G-25 is closed for the main meal.** Breakfast (46 candidates) and Snack 2 were exercised but not asserted on. See `extraction/ROLE-MAP.md`.
