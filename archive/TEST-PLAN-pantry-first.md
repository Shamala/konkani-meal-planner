# Pantry Meal Planner — Test Plan and QA Criteria

**Owner:** Shamala
**Last updated:** 2026-10-30
**Status:** the seven blocking ambiguities were resolved on 2026-10-30 and written into `REQUIREMENTS.md`. §6 records them.
**Covers:** Phase 1 only (`REQUIREMENTS.md` §3). Phase 2 onward is out of scope here.

---

## 1. Purpose and how to read this

Every Phase 1 requirement is mapped to explicit, checkable criteria. Test IDs are
stable — cite them in bug reports and in commit messages rather than restating the
behaviour.

| Column | Meaning |
|---|---|
| **ID** | Stable identifier. Never renumber; retire instead. |
| **Type** | H = happy path, B = boundary, N = negative |
| **Criterion** | What must be observably true. Not "works correctly." |
| **Req** | The `REQUIREMENTS.md` section being verified |

**§6 records the fourteen points where the requirements did not determine the
behaviour.** Seven blocked implementation; all seven are now decided and the criteria
below test the decided behaviour. The remaining seven keep their stated defaults.

Nothing here is automatable yet — these are acceptance criteria, not test code. The
unit/integration/E2E split is in §7.

---

## 2. Pantry entry

Requirement: `REQUIREMENTS.md` §3.3

| ID | Type | Criterion | Req |
|---|---|---|---|
| PAN-01 | H | All eight glossary categories render, in the §3.3 order, each offering little / some / plenty | §3.3 |
| PAN-02 | H | Selecting an amount marks that category set; the counter and progress indicator both increment | §3.3 |
| PAN-03 | H | Tapping the already-selected amount clears it; the category returns to unset and the counter decrements | §3.3 |
| PAN-04 | B | With exactly 2 categories set, generation is available | §3.3 |
| PAN-05 | B | With exactly 1 category set, an inline explanation states what is needed. The control is never present-but-dead | §3.3 |
| PAN-06 | B | With 0 categories set, same as PAN-05, and Search remains fully reachable | §3.3, §3.6 |
| PAN-07 | B | With all 8 set, generation proceeds and no category is silently ignored | §3.3 |
| PAN-08 | N | Clearing a category so the count drops from 2 to 1 restores the PAN-05 state immediately, without navigation | §3.3 |
| PAN-09 | H | Pantry remains editable after a week exists — the screen is not locked | §3.3 |
| PAN-09b | B | Editing the pantry never alters an existing week. A notice appears on Menu offering regeneration | §3.3 |
| PAN-09c | B | The notice shows on Menu only, never on Pantry during editing, and clears on regenerate | §3.3 |
| PAN-10 | B | Amount is treated as presence only: a category set to "little" and the same set to "plenty" yield the same candidate recipe set | §5 |

**PAN-10 is the one most likely to be got wrong.** "Little / some / plenty" is a
presence signal and nothing more. If the three values ever produce different menus,
that is a defect, not a feature.

---

## 3. Generation

Requirement: `REQUIREMENTS.md` §3.4, §3.1, §3.2

| ID | Type | Criterion | Req |
|---|---|---|---|
| GEN-01 | H | A generated week is 7 days × 4 slots. No slot is absent | §3.1 |
| GEN-02 | H | Slot sizes fall in the §3.1 bands: breakfast 2–4, lunch 4–8, tea 1–2, dinner 3–6 | §3.1 |
| GEN-03 | H | Every dish in a slot carries a role drawn from the book's 30 section headings | §3.2 |
| GEN-04 | H | A lunch contains the composition §3.2 describes — a saar, a plain curry, a rice or roti, a side — not four dishes of one role | §3.2 |
| GEN-05 | B | No dish whose `primaryCategory` is Leafy vegetables appears on days 4–7 | §3.4 |
| GEN-05b | B | No dish whose `primaryCategory` is Other vegetables, Roots and tubers or Fruits appears on days 6–7 | §3.4 |
| GEN-05c | N | Tier is judged on `primaryCategory` alone. A dish using curry leaves as a seasoning is **not** treated as leafy | §3.4 |
| GEN-06 | B | At the 2-category minimum, all 28 slots are filled. Dishes with no pantry match carry the *needs shopping* marker | §3.4 |
| GEN-06b | B | A slot is never shortened below its §3.1 band because of a missing pantry match | §3.1, §3.4 |
| GEN-06c | H | The Menu screen states the week's total count of *needs shopping* dishes | §3.4 |
| GEN-07 | H | Regeneration replaces the whole week | §3.4 |
| GEN-08 | B | Regeneration may legitimately repeat dishes from the previous week. Repeat-avoidance is Phase 4 — this is not a defect | §2 |
| GEN-09 | B | Regeneration clears every swap | §3.4 |
| GEN-09b | B | With swaps present, regeneration confirms first and names the number to be lost. With none, it proceeds without a prompt | §3.4 |
| GEN-09c | H | Regeneration advances the seed, so the week differs | §3.4 |
| GEN-09d | B | The same pantry state and the same seed reproduce an identical week, slot for slot | §5 |
| GEN-09e | H | The seed is stored with the week and is retrievable for a bug report | §3.4 |
| GEN-10 | N | No LLM call, and no network request of any kind, occurs during generation | §5 |
| GEN-11 | N | Only the balanced pattern is generated. No diabetic or vegan path is reachable in Phase 1 | §3.4 |
| GEN-12 | N | Where no recipe matches at all, the failure is explained in terms of what to add, never a blank week or a spinner | §3.4 |

---

## 4. Swap

Requirement: `REQUIREMENTS.md` §3.2, §3.4

| ID | Type | Criterion | Req |
|---|---|---|---|
| SWP-01 | H | A swapped dish is replaced by one of the **same role**. A saar never becomes a sweet | §3.2 |
| SWP-02 | H | A swap survives navigating away and back | §3.4 |
| SWP-03 | H | A swap changes exactly one dish. The other dishes in that slot, and every other day, are untouched | §3.4 |
| SWP-04 | B | Where a role has exactly 2 candidates, repeated swaps alternate between them | §3.2 |
| SWP-05 | B | Where a role holds a single recipe in total, swap is unavailable and states why. No control that does nothing | §3.2 |
| SWP-06 | B | The swap pool is pantry-matching recipes of that role. Below 3 candidates it extends to the full role pool | §3.2 |
| SWP-06b | B | A dish swapped in from the extension carries the *needs shopping* marker, exactly as a generated one does | §3.2, §3.4 |
| SWP-07 | H | Opening the swapped-in dish shows its own ingredients and its own Have / Buy state, not the replaced dish's | §3.5 |
| SWP-08 | N | A swap is never silently reverted by navigation, tab switching, or reopening the day | §3.4 |

---

## 5. Recipe detail, search, navigation

### 5.1 Recipe detail — `REQUIREMENTS.md` §3.5

| ID | Type | Criterion | Req |
|---|---|---|---|
| REC-01 | H | Opened from the generated week, every ingredient carries a Have or Buy marker | §3.5 |
| REC-02 | H | Opened from search, ingredients render plain **and** the note states the pantry was not compared | §3.5 |
| REC-03 | N | **State leak.** The same recipe opened from the week and then from search shows markers the first time and none the second. The reverse order also holds | §3.5 |
| REC-04 | B | A recipe with no glossary Kannada name omits the field. It never renders blank, "null", or the English name twice | §3.5 |
| REC-05 | N | A recipe not yet extracted says so plainly. No quantity, ingredient or step is ever invented | §3.5 |
| REC-06 | B | An unextracted recipe opened from the week shows no Have / Buy markers. The *not extracted* notice replaces the ingredient list entirely | §3.5 |
| REC-07 | B | An ingredient that resolves to no glossary id renders its verbatim `qtyText`, carries no Have / Buy marker, and is never assigned a guessed category | §6.3 |
| REC-08 | H | Variations the book states in prose appear; a recipe without them omits the section rather than showing an empty heading | §3.5 |

### 5.2 Search and browse — `REQUIREMENTS.md` §3.6

| ID | Type | Criterion | Req |
|---|---|---|---|
| SRC-01 | H | A dish-name query returns that dish | §3.6 |
| SRC-02 | H | An ingredient query returns every dish listing it | §3.6 |
| SRC-03 | H | A transliterated Kannada glossary name returns the dish carrying it | §3.6 |
| SRC-04 | H | Filtering is live — results update as characters are typed, with no submit step | §3.6 |
| SRC-05 | H | A role chip narrows results to that role | §3.6 |
| SRC-06 | B | An empty query shows the full pool — this is the browse case | §3.6 |
| SRC-07 | B | One role chip plus one text query narrows on both. Multiple stacked facets remain Phase 5 | §3.6 |
| SRC-08 | B | Matching is case- and diacritic-insensitive. "Sannan", "sannan" and a diacritic-bearing transliteration all match | §3.6 |
| SRC-09 | N | A query matching nothing shows an empty state naming what was searched. Never a blank panel | §3.6 |
| SRC-10 | N | Results split into two groups: extracted (matched on name, ingredients, Kannada name) and unextracted (**name only**), the latter headed with a statement that ingredients were not searched | §3.6 |
| SRC-10b | N | A coverage line states how many recipes had ingredients searched, out of the total | §3.6 |
| SRC-10c | B | Once every recipe is extracted, the second group and the coverage line disappear | §3.6 |
| SRC-11 | H | Search is reachable on first launch with zero pantry data | §3.6 |

### 5.3 Navigation — `REQUIREMENTS.md` §3.7

| ID | Type | Criterion | Req |
|---|---|---|---|
| NAV-01 | H | Exactly three tabs: Pantry, Menu, Search. No Grocery entry point anywhere, including deep links | §3.7 |
| NAV-02 | B | The Menu tab with no week yet generated shows a state that routes to Pantry, not an error | §3.7 |
| NAV-03 | H | Back from recipe detail returns to the screen it was opened from — day view or search results, with the query intact | §3.5 |
| NAV-04 | H | Switching tabs and returning preserves scroll position, query text and active chip | §3.7 |

### 5.4 Offline and data — `REQUIREMENTS.md` §5

| ID | Type | Criterion | Req |
|---|---|---|---|
| OFF-01 | H | With the network disabled, a cold start reaches full function: pantry, generation, detail, search | §5 |
| OFF-02 | N | No screen issues a network request after first load | §5 |
| OFF-03 | N | No "no connection" error state exists anywhere in the UI | §5 |
| OFF-04 | B | Pantry state, the generated week, its seed and its swaps all survive a cold restart | §5 |
| OFF-05 | N | Installed to the home screen on both iOS and Android, behaviour matches the browser tab | §5 |

---

## 6. Ambiguities surfaced

Writing the above produced fourteen points the requirements do not settle. **Seven
block implementation** — a developer cannot write the function without a decision.
The rest shape tests but have a safe default.

### 6.1 Blocking — all resolved 2026-10-30

| ID | Question | Decision | Rationale |
|---|---|---|---|
| **AMB-01** | Pantry edited after a week exists | **Stale notice on Menu.** Never auto-recompute | Silent recomputation would discard swaps and change a week the user is mid-way through reading. Editing is multi-tap, so prompting on each tap would nag |
| **AMB-03** | "Favour perishables earlier" — measurable how? | **Tiered day limits on `primaryCategory`.** Leafy → days 1–3; other vegetables, roots, fruits → days 1–5; the rest unrestricted | A hard constraint is testable where a preference is not. Judging on the *defining* ingredient avoids curry leaves making every dish leafy |
| **AMB-04** | Required role has no pantry match | **Relax and mark.** Fall back to the full role pool, mark the dish *needs shopping* | Role composition is what makes a meal culturally right, so keep it. The marker stays honest and is what Phase 2's list will read. Also rescues the two-category minimum |
| **AMB-05** | Regeneration vs existing swaps | **Clears them**, confirming first and naming the count | A positional swap re-applied to a regenerated week lands on an unrelated dish |
| **AMB-06** | "Deterministic" vs Regenerate | **Pure function of pantry plus explicit seed.** Regenerate advances the seed | Resolves the contradiction without weakening either. Unit tests pin a seed, and a stored seed makes any reported week reproducible |
| **AMB-08** | Must a swapped-in dish match the pantry? | **Pantry-matching first; below 3 candidates, extend to the full role pool** with the same *needs shopping* marker | Same mechanism as AMB-04. One concept to learn, not two. Below three candidates swapping stops being useful |
| **AMB-14** | Ingredient search over a partly extracted corpus | **Two result groups** — extracted matched fully, unextracted matched on name only — plus a coverage line | Excluding unextracted recipes would hide dishes the user knows are in the book. The Pass 2 index gives every name, so name matching costs nothing |

**Knock-on effects.** AMB-03 adds `primaryCategory` to the recipe schema
(`REQUIREMENTS.md` §6.3). AMB-04 and AMB-08 add a *needs shopping* marker to generated
dishes. AMB-06 means the stored week carries its seed. All three are recorded in
`REQUIREMENTS.md`.

### 6.2 Shapes tests, has a safe default

| ID | Question | Suggested default |
|---|---|---|
| **AMB-02** | Does pantry state survive app restart? Unstated anywhere | Yes — persist both pantry and current week. Offline-first implies it |
| **AMB-07** | Swap where the role has only one candidate | Disable with a reason, rather than a control that does nothing |
| **AMB-09** | Unextracted recipe opened from the week — what do Have / Buy markers show? | No markers; the "not extracted" notice replaces the ingredient list entirely |
| **AMB-10** | An ingredient that does not resolve to a glossary id | Render the verbatim `qtyText`, omit the Have / Buy marker, never guess the category |
| **AMB-11** | Empty search query — full pool or nothing? | Full pool. §3.6 is titled "search **and browse**"; browse is the empty-query case |
| **AMB-12** | Role chip + text query is stacked filtering, listed as Phase 5 | Allow one chip plus one query in Phase 1. Phase 5 means *multiple* stacked facets |
| **AMB-13** | Case and diacritic handling in search | Case-insensitive and diacritic-insensitive. Transliterations vary and users will not type diacritics |

### 6.3 Also worth confirming

The **two-category minimum** (§3.3) was questioned here because two categories cannot
fill 28 slots from pantry matches alone. AMB-04's resolution settles it: generation
relaxes to the full role pool and marks the shortfall, so two categories yield a
complete, heavily marked week rather than a failure. The minimum stands.

---

## 7. Test architecture

No code to be written until ordered. This is the intended shape.

| Level | Covers | Notes |
|---|---|---|
| **Unit** | Role matching, pantry-to-candidate filtering, swap pool derivation, search tokenisation, glossary id resolution | Pure functions over fixture data. Fastest place to pin AMB-03 through AMB-08 once decided |
| **Integration** | Pantry state → generation → week structure; swap applied → detail view reflects it; origin tracking for REC-03 | Needs a seeded recipe fixture, not the real corpus |
| **E2E** | PAN-05, REC-03, NAV-02, NAV-03, OFF-01 | The state-leak and empty-state cases are the ones only E2E catches |
| **Manual** | OFF-05 home-screen install on both platforms; readability of extracted recipes against the scanned page | Install behaviour differs enough between iOS and Android to warrant it |

**Fixture requirement.** Integration and unit tests need a small hand-built recipe
set — roughly 12 recipes spanning 6 roles, including one unextracted, one with no
Kannada name, one with an unresolved ingredient, and one role holding a single
candidate. Built to exercise the boundary cases above, not drawn from the real corpus.

---

## 8. Traceability

| Requirement | Tests |
|---|---|
| §3.1 A day is four slots | GEN-01, GEN-02 |
| §3.2 Dishes have roles | GEN-03, GEN-04, SWP-01, SWP-04, SWP-05, SWP-06 |
| §3.3 Pantry entry | PAN-01 … PAN-10, GEN-06, NAV-02 |
| §3.4 Generation | GEN-05 … GEN-12, SWP-02, SWP-03, SWP-08 |
| §3.5 Recipe detail | REC-01 … REC-08, SWP-07, NAV-03 |
| §3.6 Search and browse | SRC-01 … SRC-11, PAN-06 |
| §3.7 Navigation | NAV-01 … NAV-04 |
| §5 Standing decisions | PAN-10, GEN-10, GEN-11, OFF-01 … OFF-05 |
| §6 Recipe data | REC-05, REC-07, SRC-10 |

**Uncovered by design:** §4 (Phase 2 grocery), §7 (stack, no behaviour to verify).
