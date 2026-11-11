# Criteria Map

**Owner:** testing agent. **Covers:** all 130 criteria in `TEST-PLAN.md` (verified by script against the plan's IDs after the 2026-11-03 decisions: the seven new criteria GEN-23, GEN-24, VAR-09, LIF-23, HST-13, CAD-09, CAD-10 are mapped). Nothing here is marked passing: the app does not exist.

Fixtures are in `testing/fixtures/`, indexed in `testing/fixtures/README.md`. Gap references (G-nn) are in `testing/GAPS.md`.

## Key

| Mark | Meaning |
|---|---|
| **Y** | Mechanically checkable as written |
| **P** | Partly: a mechanical check exists but leaves a judgement or an unbounded absence unproven |
| **N** | Not automatable. Manual only |
| **X** | Blocked by a defect in the documents. Cannot be written until the gap is resolved |

Levels follow `TEST-PLAN.md` §10. Two levels are added: **Simulation** (multi-day, see `SIMULATIONS.md`) and **Static lint** (build-time corpus checks). "Clock" and "history snapshot" are test-time setups, not files.

## Totals

Y 112 · P 15 · N 3 · X 0 · total 130

## Not mechanically checkable, and why

| ID | Why |
|---|---|
| GEN-16 (P) | Control absence is mechanical. "Says why" is copy; assert a reason string is present, a human judges it reads as a reason. "Single recipe" is ambiguous: G-22. |
| LIF-02 (P) | A proof of absence over "any entry path". Mitigate by exhaustive route and control enumeration, but it can never be proven complete. |
| LIF-18 (P) | Geometric check at the tested viewports only. |
| LIF-11 (P) | Three zones can be asserted structurally and by computed-style difference; whether they read as distinct is a human call. |
| VAR-06 (P) | No numeric threshold for "substantially exceed 6": G-24. |
| HST-12 (P) | Scan for quantity/portion/serves-N patterns. Cannot prove every cue absent. Whitelist GEN-02 label. |
| HST-09 (P) | Absence over an open vocabulary: scan strings for streak, %, missed, adherence, "you haven't". |
| HST-05 (P) | Reload with persisted IndexedDB is mechanical. "App update" needs two real builds and a service-worker swap: do it manually on each release. |
| CAD-01 (P) | Still partly: no background job (ARCHITECTURE §3.5), so unprompted generation is observable only on open or navigation after the moment. G-18 open. |
| DSH-03 (P) | Absence of spinner, "coming soon", empty headings is mechanical; "feels complete" is a human judgement already assigned to manual in §10. |
| DSH-05 (P) | Differential check that every rendered quantity, ingredient and step string exists in the data. A negative over open text; cannot detect a hallucinated paraphrase. |
| DSH-07 (P) | Sweep all routes and deep links for Have/Buy strings and controls. |
| NAV-01 (P) | Three tabs is mechanical. "Anywhere including deep links" is absence over routes: enumerate /pantry, /grocery and variants. |
| OFF-03 (P) | Absence of strings like "offline", "no connection". |
| OFF-04 (N) | Standalone mode, storage eviction and install flows differ on real devices. Emulation cannot prove iOS. |
| LEG-05 (P) | A proxy exists (greyscale render, lightness delta between paired states) but "meaningful" is a judgement. |
| LEG-06 (N) | Brightness cannot be simulated. Proxy: canvas/surface contrast is 1.23:1 light and 1.13:1 dark; no threshold is set: G-30. |
| LEG-08 (N) | Proxy only: browser text zoom 200% plus overlap/clip detection. |

## Blocked by the documents (X)

Five criteria were blocked in the first issue (GEN-19, HST-08, DSH-11, NAV-05, LEG-09). All five are unblocked by `DECISIONS.md` and `DESIGN.md` 2026-11-03; none remains blocked.


## Every criterion

| ID | T | Level | Fixture | Check | Req | Notes |
|---|---|---|---|---|---|---|
| GEN-01 | H | Integration | sim-rich, snack1, snack2; book for the left-out position | Y | §3 | Decided (D2): 28 slots, but a main-meal position with no in-season candidate is left out and a slot is empty only if it has no candidate at all (then Add to a meal). Assert 28 on the rich corpus; assert 27 dishes-of-4 shortfall exactly per GEN-23 on the sasam case. |
| GEN-02 | H | Integration + E2E | book | Y | §3.1 | Structure is unit-checkable; the label wording is unspecified, assert the words lunch and dinner are both present. Note HST-12 forbids portion cues: whitelist "serves both" in that scan. |
| GEN-03 | H | Unit | sim-rich; book | Y | §3.3 | Needs the position-to-role mapping, which the documents never state: G-03, G-04. Fixture supplies a four-position reading. |
| GEN-04 | H | Unit | book | Y | §3 | Which sections are breakfast-capable is never enumerated (REQUIREMENTS §3 names them in prose): G-06. Fixture uses sections 17-20. |
| GEN-05 | H | Unit | snack1 | Y | §3.2 | Assert every Snack 1 id is in snack1.library.json and none is a book id. |
| GEN-06 | H | Unit | book, snack2 | Y | §3.2 | Negative list is snack2.pools.json derivedPool.mustNeverAppear. Section-proxy vs slots field: G-05. |
| GEN-07 | B | Unit + Integration | book; sim-rich with snack2 pool pressure | Y | §3.2 | Dual-slot breakfast records exist so the collision has something to prevent. |
| GEN-08 | B | Unit | book | Y | §4.1 | Small corpus on purpose: pools of 1-3 force fallback. Fallback relaxes the window only, never season (GEN-19, GEN-23). Tie-break and never-served ordering still unspecified: G-12. |
| GEN-09 | N | Integration (network interception) | any | Y | §4.2 | Network is interceptable. "No model call" is only proven insofar as a model would use the network or be a named import; a local model is invisible to the test. |
| GEN-10 | B | Unit | sim-rich; history snapshots (test-time) | Y | §4.2 | Inputs are under-stated: settings, corpus and windows are hidden inputs, and the seed origin is undefined: G-14, G-15. |
| GEN-11 | H | Integration | any | Y | §4.2 | "Retrievable" does not say by whom (UI, store, export). Test at the store: G-14. |
| GEN-12 | H | Unit | sim-rich | Y | §4.5 | "The week differs" is not guaranteed: Snack 1 is seed-independent under an exact cycle, and tiny pools can collide. Assert seed changed and at least one non-Snack-1 slot differs on the rich corpus: G-23. |
| GEN-14 | H | Unit | book (saar pool 3, sweet in snack2 only); sim-rich | Y | §4.5 | Assert candidate set for the replacement has identical role. Swap on role-less Snack entries is undefined: G-21. |
| GEN-15 | N | Integration | sim-rich | Y | §4.5 | Deep-compare all 27 other slots, plus the week seed and the unedited weeks. |
| GEN-16 | B | Unit + E2E | book (role "side" holds one recipe) | P | §4.5 | Control absence is mechanical. "Says why" is copy; assert a reason string is present, a human judges it reads as a reason. "Single recipe" is ambiguous: G-22. |
| GEN-17 | B | Unit | sim-rich; history snapshots (test-time) | Y | §4.1, §4.5 | Inclusive window (VAR-09): a swap may not reach for a dish served within D+N. |
| GEN-18 | B | Unit | book (colocasia patholi, mango/pineapple sasam); snack1 | Y | §4.7 | Season is taken from each day's own date (GEN-24). |
| GEN-19 | N | Unit | book (sasam: every recipe seasonal) | Y | §4.7, arch §3.2 | Unblocked by D2. Assert no out-of-season dish is ever placed, with the setting on, when the repeat window empties the pool. The empty-by-season case is GEN-23. |
| GEN-20 | B | Unit | book | Y | §4.7 | Run with the setting both on and off. |
| GEN-21 | B | Unit | book, snack1 | Y | §4.7 | Unit is trivial. E2E needs a settings UI that is not specified: G-27. |
| GEN-22 | H | Integration | any | Y | §4.7 | Byte-compare stored weeks before and after the toggle. |
| GEN-23 | B | Unit | book (composition override: fourth position = sasam only); breakfast pool restricted to syn-colocasia-patholi | Y | §4.7, arch §3.2 | Model: November, 28 of 28 sasam positions left out, 3 dishes per day, 0 out-of-season placed; May: 4 per day; seasons OFF: 4 per day. Breakfast with only a Jun-Sep dish in November: empty, and the screen offers Add to a meal. |
| GEN-24 | B | Unit | book (sasam-only position; weeks of 2027-03-29 and 2027-07-26) | Y | arch §3.2 | Model: Mar 29 week uses mango sasam only on Apr 1 and Apr 3; Jul 26 week leaves Aug 1 out. Zero dishes out of season on their own date. |
| LIF-01 | H | Unit | clock | Y | §4.3 | Monday-Sunday by local date. Timezone and DST unspecified: G-29. |
| LIF-02 | N | E2E | any | P | §4.5 | A proof of absence over "any entry path". Mitigate by exhaustive route and control enumeration, but it can never be proven complete. |
| LIF-19 | H | E2E | any, clock | Y | §4.5.1 | Every day after today in the current week and all of next week (today is NOT included: DECISIONS swap rule). |
| LIF-20 | N | E2E | any, clock | Y | §4.5.1 | Today, passed days of the current week, and every day of a past week. |
| LIF-21 | B | Integration | clock | Y | §4.5.1 | Drive the clock across Sun 23:59:59 to Mon 00:00:00. See SIM-LIF04. |
| LIF-22 | B | E2E | any | Y | §4.5, design §4 | Exact string "Swap with a different dish"; assert the word "regenerate" appears on no dish-level control. |
| LIF-23 | N | E2E | any, clock | Y | §4.5.2, design §2.8 | Exact inert text Today's plan is fixed. Swap works from tomorrow.; the picker lists no slot for today. Not focusable, not a button. |
| LIF-03 | H | Integration | any | Y | §4.5 | Byte-identical current week: serialise before and after. |
| LIF-04 | B | Integration (clock-controlled) | clock | Y | §4.5 | Specified in SIMULATIONS.md SIM-LIF04. |
| LIF-05 | B | Integration | clock | Y | arch §3.4 | Includes the passed-days case and a past week: no swap, assign or cooked mark. |
| LIF-06 | H | E2E | any | Y | §4.5 | Decided Q9: cooked marks on today and passed days only, never days ahead, never next week. Add checks: future day of the current week refuses the mark. |
| LIF-07 | H | Integration | clock | Y | §4.3 | Mon-Thu of the current week. |
| LIF-08 | N | Integration | any | Y | §4.5 | History records against the current week unchanged after a next-week regenerate. |
| LIF-09 | B | E2E (per TEST-PLAN §10) | any | Y | design §3.2.1 | Assert both weeks' action blocks occupy the same DOM region/role and neither is empty. |
| LIF-17 | H | E2E | any | Y | design §3.2.2 | Segmented control with exactly two options; one week rendered. Contradicts DESIGN §3.2 "next week above this week": G-20. |
| LIF-18 | N | E2E | any | P | design §3.2.2 | Geometric check at the tested viewports only. |
| LIF-10 | N | E2E | any | Y | design §3.2.1 | No regenerate control, enabled or disabled, in the DOM of the current week. |
| LIF-11 | B | E2E | any, clock | P | design §3.2.1 | Three zones can be asserted structurally and by computed-style difference; whether they read as distinct is a human call. |
| LIF-12 | H | E2E | any | Y | design §3.2.1 | DESIGN §3.2.1 gives the exact copy; assert it verbatim. |
| LIF-12b | B | E2E | any, clock | Y | design §3.2.1 | Same copy on every day Mon-Sun, before and after next week is viewed. |
| LIF-13 | B | E2E | clock | Y | design §3.2.1 | Next week absent in store, tap through, week appears. |
| LIF-14 | N | E2E | any | Y | §4.3 | No spinner, skeleton, aria-busy or progressbar during the transition. |
| LIF-15 | B | Unit | history snapshot | Y | §4.2, §4.3 | Identical to CAD-04: duplicate. Conditional on identical history, which later generation does not have by design. |
| LIF-16 | B | Integration | clock | Y | §4.3 | Viewed flag persisted; Friday 18:00 notice suppressed. |
| VAR-01 | H | Simulation | sim-rich | Y | §4.1 | SIM-01. Needs >=22 recipes per position: G-25. |
| VAR-02 | H | Simulation | sim-rich | Y | §4.1 | SIM-02. |
| VAR-03 | B | Simulation | snack1 | Y | §3.2, §4.7 | Now decidable (inclusive window). Still only observable in a constant-pool stretch (Aug 1 to Feb 28; Apr 1 to Jun 30), not in one month: G-11 narrowed, still open. |
| VAR-07 | B | Simulation | snack1 | Y | §4.7 | SIM-03b. Only Apr to Jun has no exclusions (SNACK-LIBRARY §3 still states otherwise: G-01 open). |
| VAR-08 | B | Simulation | snack1 | Y | §4.7 | SIM-03a. Six exclusions hold Aug to Feb (G-01 open). |
| VAR-09 | B | Simulation | sim-rich, snack1 | Y | arch §3.2 | SIM-01..03. Main-meal minimum gap 22, breakfast 8, Snack 2 15, Snack 1 repeats at exactly the pool size. |
| VAR-04 | B | Simulation | snack1 | P | §3.2 | Reworded 2026-11-03: Snack 1 must show zero same-family adjacencies over seeds 1 to 20. Needs the Snack 1 cycle order built once per pool (D5); other slots stay best-effort and are not asserted. Not met by the current generator or reference model until D5 is built. |
| VAR-05 | H | Simulation | sim-rich, snack2 | Y | §4.1 | SIM-05. |
| VAR-06 | B | Simulation | sim-rich | P | §1 | No numeric threshold for "substantially exceed 6": G-24. |
| HST-01 | H | Integration | any | Y | §4.1.1 | Decided D3: a mark from a plan row sets that row's day; a Search mark sets today. See HST-13. |
| HST-02 | H | E2E | any | Y | §4.1.1 | One tap on, one tap off, assert no dialog element. |
| HST-03 | B | Integration | clock | Y | §4.1.1 | Run two weeks with zero marks. |
| HST-04 | B | Integration | history snapshots | Y | §4.1.1 | Timing of the implicit record for days not yet passed is still undefined: G-17 (first launch part resolved by Q5, CAD-09). |
| HST-07 | H | E2E | book | Y | §4.1.1 | Decided D3: recorded as served today, no slot. |
| HST-10 | H | E2E | any | Y | design §4 | Same control, same behaviour, three screens. |
| HST-11 | B | E2E | any | Y | design §4 | Tap the tick; state flips; no extra element added. |
| HST-12 | N | E2E | any | P | design §6 | Scan for quantity/portion/serves-N patterns. Cannot prove every cue absent. Whitelist GEN-02 label. |
| HST-13 | B | Integration + E2E | book | Y | §4.1.1 | Search mark: lastServed = today, no slot field, and no control to choose another day. |
| HST-08 | B | Integration | any | Y | §4.1.1 | Unblocked by D3: a Search mark cancels no planned dish. Assert the planned dish's last-served date is unchanged. |
| HST-09 | N | E2E | any | P | §4.6 | Absence over an open vocabulary: scan strings for streak, %, missed, adherence, "you haven't". |
| HST-05 | N | Integration + Manual | any | P | arch §4 | Reload with persisted IndexedDB is mechanical. "App update" needs two real builds and a service-worker swap: do it manually on each release. |
| HST-06 | N | Static lint (build time) | retired ids in recipes.book meta | Y | arch §4 | Needs a retired-id registry that ARCHITECTURE.md does not define: G-31. |
| ASN-01 | H | E2E (per §10) | book | Y | §4.5.1 | Search to picker to assigned slot. |
| ASN-02 | H | Integration | any | Y | §4.5.1 |  |
| ASN-03 | H | E2E | any | Y | design §3.3 | Picker rows show current dish per slot. |
| ASN-04 | B | E2E | any, clock | Y | §4.5.2 | Today and past days not offered (picker lists no slot for today: LIF-23). |
| ASN-05 | N | Integration + E2E | book (sweet into saar position) | Y | §4.5.1 | Assert no modal, alert, toast or confirm. The sweet is syn-appe-sweet. |
| ASN-06 | N | Integration | book (mango sasam, November) | Y | §4.7 |  |
| ASN-07 | N | Integration | history snapshot | Y | §4.5.1 |  |
| ASN-08 | B | Integration | clock | Y | §4.5.2 | Days after today and all of next week; the picker reaches next week through the same switcher (Q7). |
| ASN-09 | N | Unit | any | Y | arch §3.2 | Assert stored week seed unchanged after assignDish. |
| ASN-10 | B | E2E | any | Y | §4.5 | Confirmation is mandatory per DESIGN §4 even without edits; this criterion only tests the with-edits case: G-23. |
| CAD-01 | H | E2E (per §10) | clock | P | §4.3 | Still partly: no background job (ARCHITECTURE §3.5), so unprompted generation is observable only on open or navigation after the moment. G-18 open. |
| CAD-02 | H | E2E | clock | Y | §4.3 | No dialog role, no focus trap, no blocking overlay. |
| CAD-03 | B | Integration | clock | Y | §4.3 | Open Sunday, week exists. |
| CAD-04 | B | Unit | history snapshot | Y | §4.2, §4.3 | Duplicate of LIF-15. |
| CAD-05 | H | Integration | any | Y | §4.3 |  |
| CAD-06 | H | Integration | clock | Y | §4.3 | Where the user sets it is unspecified: G-27. |
| CAD-07 | N | Integration | any | Y | §4.3 |  |
| CAD-08 | B | E2E | empty storage | Y | design §3.1 | First open generates a week with no empty state. Which week: CAD-09. |
| CAD-09 | B | E2E | empty storage, clock set to a Wednesday | Y | design §3.2.4 | Decided Q5: current week from today onward; earlier days empty and add nothing to history. Assert servingHistory is empty after first launch for the passed days. Copy "planned and shopped for" is known-inaccurate here and accepted (Q6). |
| CAD-10 | B | E2E | clock, restart | Y | design §3.7, LIF-16 | Dismiss is a 56px button; state survives a restart (noticeDismissed on the week); viewing next week also hides it (LIF-16). |
| DSH-01 | H | E2E | book | Y | §5 | Snack entries have no page (DSH-08): "always" is too strong, still open: G-21. |
| DSH-02 | B | E2E | book (syn-tomato-saar) | Y | §5 | Assert no element, not an empty one; and no "null" or duplicated English. |
| DSH-03 | B | E2E + Manual (per §10) | book (syn-ridge-gourd-sambar) | P | §5, design §3.3 | Absence of spinner, "coming soon", empty headings is mechanical; "feels complete" is a human judgement already assigned to manual in §10. |
| DSH-04 | H | Unit + E2E | book (syn-dalithoy), glossary | Y | §5.1 | Expect 3 shown, 5 behind show all. |
| DSH-05 | N | Unit | book, fully-extracted | P | §5.2 | Differential check that every rendered quantity, ingredient and step string exists in the data. A negative over open text; cannot detect a hallucinated paraphrase. |
| DSH-06 | B | E2E | book (syn-brinjal-masala-curry) | Y | §5.2 | Tamarind deliberately absent from the glossary. What `item` holds when unresolved is unspecified: G-31. |
| DSH-07 | N | E2E | any | P | §8 | Sweep all routes and deep links for Have/Buy strings and controls. |
| DSH-08 | B | E2E | snack1 | Y | library §3 | Components shown, no page element. |
| DSH-09 | B | E2E | any, clock | Y | design §3.3 | Only for a day after today. Origin must not leak (NAV-03). |
| DSH-10 | N | E2E | book | Y | design §3.3 |  |
| DSH-11 | B | E2E | any, clock | Y | design §3.3 | Unblocked by DESIGN §2.8: the inert reason block takes the control's place for a role with one recipe, today, and a passed day. Assert the block is text, not focusable. |
| SRC-01 | H | E2E | book | Y | §7 |  |
| SRC-02 | H | E2E | book (dalithoy, brinjal), glossary | Y | §7 | Whether the query matches Kannada ingredient names or glossary ids is unspecified: G-34. |
| SRC-03 | H | E2E | book | Y | §7 | "nir dose" must find Neer dosai. |
| SRC-04 | H | E2E | any | Y | §7 | Per-keystroke results; no submit element needed. |
| SRC-05 | H | E2E | book | Y | §7 |  |
| SRC-06 | B | E2E | book | Y | §7 | "Full pool" does not say whether Snack 1 and 2 entries are in it: G-34. |
| SRC-07 | B | E2E | book (Tomāto, Nīr dōse) | Y | §7 |  |
| SRC-08 | N | E2E | book | Y | §5.2 | 22 of 24 are unextracted in the base fixture. |
| SRC-09 | N | E2E | book and fully-extracted | Y | §5.2 | 2 of 24 and 24 of 24. |
| SRC-10 | B | E2E | fully-extracted | Y | §5.2 | Both disappear at 24 of 24. |
| SRC-11 | N | E2E | any | Y | §7 | Assert the query and the searched fields are named. |
| NAV-01 | H | E2E | any | P | §7 | Three tabs is mechanical. "Anywhere including deep links" is absence over routes: enumerate /pantry, /grocery and variants. |
| NAV-02 | H | E2E | any | Y | §4.4 |  |
| NAV-03 | N | E2E (per §10) | book | Y | design §4 | Scripted sequence: search, chip, open dish, back, open another dish, back. |
| NAV-04 | H | E2E | any | Y | design §4 |  |
| NAV-05 | N | E2E | any | Y | §4.5.2 | Rewritten per D4: swap exists on days after today and all of next week; no Regenerate on the current week. Previously contradicted the rest of the plan. |
| NAV-06 | H | E2E | any | Y | §4.5 | Today's slots offer the cooked control; assert days ahead and next week do not (Q9). |
| OFF-01 | H | E2E (per §10) | any | Y | §11 | Precondition: service worker installed by a prior online load. Run with network disabled. |
| OFF-02 | N | E2E | any | Y | §11, arch §4 | Needs fault injection for tier 2/3 fetch failure: no fixture file is absent by design, so remove one at test time. |
| OFF-03 | N | E2E | any | P | §11 | Absence of strings like "offline", "no connection". |
| OFF-04 | H | Manual (per §10) | real iOS and Android devices | N | §11 | Standalone mode, storage eviction and install flows differ on real devices. Emulation cannot prove iOS. |
| LEG-01 | B | Unit (token arithmetic) | tokens from DESIGN §2.2 and §2.6 | Y | design §2.2 | Test the permitted-ground table in DESIGN §2.2.1: fg.subtle and action.primary on surface only in light; every dark pair on all three grounds. All pass as redocumented. |
| LEG-02 | N | E2E (computed styles) | any | Y | design §2.3 | Walk every text node; computed font-size >= 15. |
| LEG-03 | B | E2E (bounding boxes) | any | Y | design §2.4 | Rows, buttons and filter chips >= 56; icon-only >= 48. |
| LEG-04 | N | E2E (computed styles) | any | Y | design §2.5 | No opacity < 1 on text or its ancestors; no alpha channel in text colour. |
| LEG-05 | N | E2E + review | any | P | design §2.5 | A proxy exists (greyscale render, lightness delta between paired states) but "meaningful" is a judgement. |
| LEG-06 | B | Manual (per §10) | device, bright light | N | design §2.5 | Brightness cannot be simulated. Proxy: canvas/surface contrast is 1.23:1 light and 1.13:1 dark; no threshold is set: G-30. |
| LEG-07 | B | E2E (computed styles) | any | Y | design §2.2 | Reworded 2026-11-03 to cover fg.subtle and action.primary on canvas and sunken (G-35 resolved). |
| LEG-08 | B | Manual (per §10) | device, largest OS text size | N | design §2.3 | Proxy only: browser text zoom 200% plus overlap/clip detection. |
| LEG-09 | B | Unit (token arithmetic) | tokens from DESIGN §2.6 | Y | design §2.6 | Unblocked: dark tokens now complete (fg.subtle equals fg.muted in dark). |

## Reverse map: requirement to criteria

The hard constraint is that every requirement traces to at least one criterion. "Untested" items are collected in `GAPS.md` (G-33). Updated after the 2026-11-03 decisions.

| `REQUIREMENTS.md` | Criteria | Untested part |
|---|---|---|
| §1, §2 Problem, premise | none (framing) | n/a |
| §3 The day | GEN-01 to GEN-07 | Dish counts (main "3-5", breakfast "1-2 plus accompaniment", Snack 2 "1-2") still unpinned (G-04) |
| §3.1 Cooked once | GEN-02 | n/a |
| §3.2 Snack slots | GEN-05, GEN-06, GEN-07, VAR-03, VAR-04 | Same-day Snack 1 / Snack 2 duplicates (G-08) |
| §3.3 Role composition | GEN-03, GEN-23 | Role taxonomy never enumerated (G-03) |
| §4.1 Variety | VAR-01 to VAR-06, VAR-09, GEN-08, GEN-17 | "N tunable without a rebuild" has no criterion (G-26) |
| §4.1.1 Cooked marker | HST-01 to HST-04, HST-07, HST-08, HST-10, HST-11, HST-13 | n/a (D3 resolved the slot question) |
| §4.2 Seeded | GEN-09 to GEN-12, CAD-04, LIF-15 | Seed derivation, hidden inputs (G-14, G-15) |
| §4.3 Cadence | CAD-01 to CAD-10, LIF-07, LIF-13 to LIF-16 | Long absence and skipped weeks (G-17) |
| §4.4 Today first | NAV-02 | n/a |
| §4.5 Two verbs | GEN-12, GEN-14 to GEN-17, LIF-02 to LIF-06, LIF-19 to LIF-23, ASN-10, NAV-05 | Regenerate-always-confirms only tested with slot edits (G-23) |
| §4.5.1 Choosing a dish | ASN-01 to ASN-09, DSH-10 | n/a |
| §4.5.2 What stays fixed | LIF-19 to LIF-23, LIF-05, LIF-06, NAV-06, ASN-04, ASN-08, HST-13 | n/a (future-days-only swap and today-only Search marks are now both criteria) |
| §4.6 Suggestion | HST-07, HST-08, HST-09 | n/a |
| §4.7 Seasonality | GEN-18 to GEN-24, VAR-03, VAR-07, VAR-08, ASN-06 | Tag density "30 to 50 of about 400" is corpus lint, no criterion (G-31) |
| §5 Recipe depth | DSH-01 to DSH-03, DSH-06, DSH-08 | Tier 3 method rendering, `variations`, `needsReview`: no criterion (G-33) |
| §5.1 Ingredient display | DSH-04 | n/a |
| §5.2 Honesty | DSH-05, DSH-06, SRC-08 to SRC-10 | n/a |
| §6 Data work | none | Printed-vs-PDF page offset, glossary extraction, verbatim `qtyText`: no criterion (G-31) |
| §7 Screens | SRC-01 to SRC-11, NAV-01 to NAV-04, NAV-06 | Search scope (G-34) |
| §8 Not in v1 | DSH-07, NAV-01 | n/a |
| §9 Next version | none | NAV-05 was stale and is now rewritten (G-19 resolved) |
| §10 Open questions | none by design | n/a |
| §11 Stack | OFF-01 to OFF-04, GEN-09 | n/a |
| `DESIGN.md` §2 | LEG-01 to LEG-09 | LEG-06 still has no threshold (G-30) |
| `DESIGN.md` §3.2.4, §3.7 | CAD-09, CAD-10 | n/a |
