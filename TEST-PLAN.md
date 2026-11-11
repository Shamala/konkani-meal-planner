# Konkani Meal Planner — Test Plan

**Owner:** Shamala
**Last updated:** 2026-11-02 (legibility pass — AAA contrast, 15px floor)
**Covers:** v1 only. §9 (next version) is out of scope.

Replaces the pantry-first plan in `archive/`.

---

## 1. How to read this

| Column | Meaning |
|---|---|
| **ID** | Stable. Never renumber; retire instead |
| **T** | H = happy path, B = boundary, N = negative |
| **Criterion** | What must be observably true |
| **Req** | The `REQUIREMENTS.md` section verified |

The highest-value cases are **GEN-10** (determinism), **HST-04** (history drift) and
**DSH-03** (tier 1 is not an error state). Those three are where this product fails
quietly rather than loudly.

**LIF-\* is the newest group** and the one most likely to be got wrong in a first
implementation, because freezing the current week is a rule a developer has to be told
rather than one they would infer.

---

## 2. Generation

| ID | T | Criterion | Req |
|---|---|---|---|
| GEN-01 | H | A generated week has 7 days × 4 slots. No slot is empty unless no candidate exists for it at all; a main-meal position with no in-season candidate is left out, not filled out of season | §3 |
| GEN-02 | H | Exactly one main meal per day, labelled as serving both lunch and dinner | §3.1 |
| GEN-03 | H | The main meal is composed by role — a saar, a curry, a rice or roti, a side — not four of one role | §3.3 |
| GEN-04 | H | Breakfast draws only from the book's breakfast-capable sections | §3 |
| GEN-05 | H | Snack 1 draws only from the authored 60, never from the book | §3.2 |
| GEN-06 | H | Snack 2 draws from kid-friendly book sections or authored additions, never from masala curries or pickles | §3.2 |
| GEN-07 | B | Breakfast and Snack 2 never carry the same dish on the same day | §3.2 |
| GEN-08 | B | Where a repeat window empties a pool, the oldest-served candidate returns. Generation never fails and never leaves a gap | §4.1 |
| GEN-09 | N | No network request and no model call occurs during generation | §4.2 |
| GEN-10 | B | **Determinism.** The same serving history, seed and week start reproduce an identical week, slot for slot | §4.2 |
| GEN-11 | H | The seed is stored with the week and is retrievable | §4.2 |
| GEN-12 | H | Regenerate advances the seed, so the week differs | §4.5 |
| GEN-14 | H | **Swap** replaces one dish with another of the same role. A saar never becomes a sweet | §4.5 |
| GEN-15 | N | A swap changes exactly one dish. Every other slot in the week is untouched | §4.5 |
| GEN-16 | B | Where a role holds a single recipe, swap is unavailable and says why. No control that does nothing | §4.5 |
| GEN-17 | B | A swap respects the repeat window — it does not reach for something cooked last week | §4.1, §4.5 |
| GEN-18 | B | With seasonality **on**, out-of-season dishes are never generated for the month being planned | §4.7 |
| GEN-19 | N | **The season filter is never relaxed by the fallback.** Running short of candidates gives way on the repeat window only, never on season. A position with no in-season candidate is left out (GEN-23) | §4.7, arch §3.2 |
| GEN-20 | B | A recipe with no `season` is available all year, whatever the setting | §4.7 |
| GEN-21 | B | With seasonality **off**, the season step does not run and tagged dishes generate in any month | §4.7 |
| GEN-22 | H | Toggling the setting changes only future generations. Existing weeks are untouched | §4.7 |
| GEN-23 | B | **A main-meal position with no in-season candidate is left out of that day.** The day shows one dish fewer; no out-of-season dish fills it. The slot is empty only if it has no candidate at all, and then offers *Add to a meal* | §4.7, arch §3.2 |
| GEN-24 | B | Season is evaluated on each day's own date: in a week that straddles two months, each day uses its own month | arch §3.2 |

---

## 3. Week lifecycle

The rule that most needs testing, because it is counterintuitive: **the current week is
frozen; regenerate and swap apply to next week only.**

| ID | T | Criterion | Req |
|---|---|---|---|
| LIF-01 | H | A week runs Monday to Sunday | §4.3 |
| LIF-02 | N | **No regenerate control exists on the current week**, from any screen or entry path | §4.5 |
| LIF-19 | H | Swap **is** available on every day after today in the current week, and on all of next week | §4.5.1 |
| LIF-20 | N | Swap is **not** available on today or on a day already passed | §4.5.1 |
| LIF-21 | B | At the Monday boundary a week loses regenerate and keeps swap | §4.5.1 |
| LIF-22 | B | The dish-level control is labelled **Swap with a different dish**. It is never called "regenerate", which would read as remaking the same dish | §4.5, design §4 |
| LIF-23 | N | **Swap and Add to a meal are not offered for today.** The Dish screen shows the inert reason *Today's plan is fixed. Swap works from tomorrow.* and the picker lists no slot for today | §4.5.2, design §2.8 |
| LIF-03 | H | Regenerate on next week replaces it and leaves the current week byte-identical | §4.5 |
| LIF-04 | B | At the Monday boundary, next week becomes current and can no longer be regenerated | §4.5 |
| LIF-05 | B | A past week is immutable and retained. Neither regenerate nor cooked marking applies | arch §3.4 |
| LIF-06 | H | Cooked marking is available on the current week and not on next week | §4.5 |
| LIF-07 | H | Next week can be generated on demand before Friday, for someone planning early | §4.3 |
| LIF-08 | N | Regenerating next week never alters any serving history recorded against the current week | §4.5 |
| LIF-09 | B | The current week carries its explanatory line with an inline **Plan next week** affordance, in the same position next week carries Regenerate. No empty action slot on either | design §3.2.1 |
| LIF-17 | H | The Week screen carries a *This week · Next week* switcher and shows one week at a time | design §3.2.2 |
| LIF-18 | N | The two weeks are never rendered side by side as peers | design §3.2.2 |
| LIF-10 | N | No disabled or greyed regenerate control appears on the current week | design §3.2.1 |
| LIF-11 | B | The current week renders its three zones distinctly — passed, today, still to come | design §3.2.1 |
| LIF-12 | H | The current week states why it is fixed, in terms of shopping, not of rules | design §3.2.1 |
| LIF-12b | B | That copy is constant — unchanged by whether next week has been viewed, and unchanged through the week | design §3.2.1 |
| LIF-13 | B | **Next week →** on the current week generates next week where it does not yet exist, rather than failing or showing an empty screen | design §3.2.1 |
| LIF-14 | N | On-demand generation shows no spinner, skeleton or progress state | §4.3 |
| LIF-15 | B | A week generated on demand is identical to one the deadline would have produced, given the same history and seed | §4.2, §4.3 |
| LIF-16 | B | Where next week has already been viewed, the Friday notice does not appear | §4.3 |

---

## 4. Variety and history

| ID | T | Criterion | Req |
|---|---|---|---|
| VAR-01 | H | A main-meal dish served within 21 days is not selected again | §4.1 |
| VAR-02 | H | A breakfast dish served within 7 days is not selected again | §4.1 |
| VAR-03 | B | **Snack 1 runs an exact cycle over its available pool:** across N consecutive days, where N is the entries in season that month, each appears exactly once, under the inclusive window (VAR-09) | §3.2, §4.7 |
| VAR-07 | B | With no seasonal exclusions the Snack 1 cycle is the full 60 | §4.7 |
| VAR-08 | B | In a month excluding 6 entries, the cycle is 54 and no excluded entry appears | §4.7 |
| VAR-09 | B | **The repeat window is inclusive.** A dish served on day D is excluded through D + N and may return on D + N + 1 (a main-meal dish on day 22, not 21) | arch §3.2 |
| VAR-04 | B | Snack 1 never places the same family on consecutive days across a full cycle (zero adjacencies, over seeds 1 to 20). Other slots avoid adjacent families on a best-effort basis and are not tested for zero | §3.2 |
| VAR-05 | H | A Snack 2 dish served within 14 days is not selected again | §4.1 |
| VAR-06 | B | Over 8 weeks of generation, distinct main-meal dishes substantially exceed 6 — the pre-app baseline | §1 |
| HST-01 | H | Marking a dish cooked sets its last-served date to that day | §4.1.1 |
| HST-02 | H | Marking is one tap and reversible by a second tap. No dialog | §4.1.1 |
| HST-03 | B | Nothing requires marking. An entirely unmarked week still generates the next one | §4.1.1 |
| HST-04 | B | **An unmarked slot falls back to assuming the plan was followed** — its dish counts as served | §4.1.1 |
| HST-07 | H | A dish reached through Search can be marked cooked, including one in no plan at all | §4.1.1 |
| HST-10 | H | The cooked control is present on Today, on the Week screen and on Dish — the same control and behaviour in all three | design §4 |
| HST-11 | B | On the Week screen the tick itself toggles. No separate control is added | design §4 |
| HST-12 | N | No portion or serving-size cue appears on the main meal | design §6 |
| HST-13 | B | A dish marked cooked from Search is recorded as served today, with no slot, and cannot be marked for any other day | §4.1.1 |
| HST-08 | B | **A dish marked cooked from Search is recorded as served today, with no slot, and cancels no planned dish's record** | §4.1.1 |
| HST-09 | N | Nothing in the interface shows adherence, streaks or a missed meal | §4.6 |
| HST-05 | N | Serving history survives a cold restart and an app update | arch §4 |
| HST-06 | N | A retired recipe id is never reissued, so history is never misattributed | arch §4 |

---

## 5. Changing a slot by hand

`REQUIREMENTS.md` §4.5.1. **The rules bind the generator, not the user** — this group
exists mostly to stop a well-meaning implementation adding validation that should not be
there.

| ID | T | Criterion | Req |
|---|---|---|---|
| ASN-01 | H | Any dish found through Search can be assigned to a slot | §4.5.1 |
| ASN-02 | H | Assignment replaces whatever was in the slot | §4.5.1 |
| ASN-03 | H | The picker shows each slot's current dish, so the user sees what is being replaced | design §3.3 |
| ASN-04 | B | Today and past days are not offered in the picker | §4.5.2 |
| ASN-05 | N | **A dish whose role does not match the slot is assigned without warning, confirmation or refusal** | §4.5.1 |
| ASN-06 | N | An out-of-season dish can be assigned even with seasonality on | §4.7 |
| ASN-07 | N | A dish cooked yesterday can be assigned, repeat window notwithstanding | §4.5.1 |
| ASN-08 | B | Assignment reaches any day after today and all of next week — the same span as swap | §4.5.2 |
| ASN-09 | N | Assignment does not advance or alter the week seed | arch §3.2 |
| ASN-10 | B | A week-level regenerate of next week discards slot edits made to it, confirming first | §4.5 |

---

## 6. Weekly cadence

| ID | T | Criterion | Req |
|---|---|---|---|
| CAD-01 | H | At the configured moment (Friday 18:00 default), next week's plan exists without the user asking | §4.3 |
| CAD-02 | H | Next week appears as a notice, never as a modal or a blocking step | §4.3 |
| CAD-03 | B | If the app is not opened on Friday, the upcoming week is generated on next open | §4.3 |
| CAD-04 | B | A late generation produces the same week a punctual one would, given the same seed | §4.2, §4.3 |
| CAD-05 | H | The current week stays visible and unchanged while next week exists | §4.3 |
| CAD-06 | H | Generation day and time are configurable; Friday evening is a default, not a constant | §4.3 |
| CAD-07 | N | Generating next week does not alter this week's cooked marks or dishes | §4.3 |
| CAD-08 | B | Opening the app for the first time generates a week immediately rather than showing an empty state | design §3.1 |
| CAD-09 | B | A first launch mid-week generates the current week from today onward; earlier days are passed, empty, and add nothing to history | design §3.2.4 |
| CAD-10 | B | **Dismiss** hides the next-week notice for that week, and the choice survives a restart. Viewing next week hides it without a dismiss | design §3.7, LIF-16 |

---

## 7. Dish, search, navigation

### 7.1 Dish

| ID | T | Criterion | Req |
|---|---|---|---|
| DSH-01 | H | Name, Kannada name where the glossary gives one, role and page number always render | §5 |
| DSH-02 | B | A recipe with no Kannada name omits the field. Never blank, never "null", never the English name twice | §5 |
| DSH-03 | B | **A tier-1 dish shows its page number calmly and completely.** No spinner, no "coming soon", no greyed-out empty sections | §5, design §3.3 |
| DSH-04 | H | Where ingredients exist, major ones show by default with the seasoning stoplist behind *show all* | §5.1 |
| DSH-05 | N | No quantity, ingredient or step is ever invented | §5.2 |
| DSH-06 | B | An ingredient that resolves to no glossary id still renders its verbatim text, with no guessed category | §5.2 |
| DSH-07 | N | No Have / Buy marker appears anywhere, from any entry path | §8 |
| DSH-08 | B | A Snack 1 entry shows its components and no page number, because none exists | library §3 |
| DSH-09 | B | **Swap with a different dish** appears only when the dish was opened from a plan, for a day after today | design §3.3 |
| DSH-10 | N | A dish opened from Search shows **Add to a meal** in that position, not swap | design §3.3 |
| DSH-11 | B | The Dish screen's action position is never empty — one of the two actions is always present | design §3.3 |

### 7.2 Search

| ID | T | Criterion | Req |
|---|---|---|---|
| SRC-01 | H | A dish-name query returns that dish | §7 |
| SRC-02 | H | An ingredient query returns extracted dishes listing it | §7 |
| SRC-03 | H | A transliterated Kannada name returns its dish | §7 |
| SRC-04 | H | Results update as characters are typed, with no submit step | §7 |
| SRC-05 | H | A role chip narrows to that role | §7 |
| SRC-06 | B | An empty query shows the full pool — the browse case | §7 |
| SRC-07 | B | Case- and diacritic-insensitive matching | §7 |
| SRC-08 | N | Results split into extracted and unextracted groups, the latter matched on name only and headed as such | §5.2 |
| SRC-09 | N | A coverage line states how many recipes had ingredients searched, out of the total | §5.2 |
| SRC-10 | B | Both the second group and the coverage line disappear once extraction is complete | §5.2 |
| SRC-11 | N | A query matching nothing names what was searched. Never a blank panel | §7 |

### 7.3 Navigation

| ID | T | Criterion | Req |
|---|---|---|---|
| NAV-01 | H | Exactly three tabs: Today, Week, Search. No Pantry, no Grocery, anywhere including deep links | §7 |
| NAV-02 | H | Today is the landing screen | §4.4 |
| NAV-03 | N | **State leak.** Dish returns to its origin with search query and chip intact, carrying nothing from a previous visit | design §4 |
| NAV-04 | H | Tab switching preserves scroll position, query text and active chip | design §4 |
| NAV-05 | N | Swap exists in v1 on days after today and all of next week; no control offers Regenerate on the current week | §4.5.2 |
| NAV-06 | H | Today's slots each offer the cooked control; next week's do not | §4.5 |

### 7.4 Offline

| ID | T | Criterion | Req |
|---|---|---|---|
| OFF-01 | H | With the network disabled, a cold start reaches full function | §11 |
| OFF-02 | N | No screen issues a network request after first load, except tier 2/3 fetches which fail gracefully to the page number | §11, arch §4 |
| OFF-03 | N | No "no connection" error state exists in the UI | §11 |
| OFF-04 | H | Installed to the home screen on iOS and Android, behaviour matches the browser tab | §11 |

---

## 8. Closed questions

**OPEN-1 — what happens to cooked marks when a week is regenerated? Closed 2026-11-02.**

The question is void. Regenerate applies only to next week, and cooked marks exist only
on the current week, so the two can never meet. No reconciliation rule is needed.

This is a better answer than the one originally recommended here ("regenerate from today
forward"), which would have required reconciliation logic to handle a case that the week
lifecycle now makes unreachable. Recorded because the reasoning is worth keeping: a
constraint that removes a problem beats a rule that manages it.

---

## 9. Legibility

`DESIGN.md` §2. The audience includes older readers using this in a kitchen, often at
arm's length, so the bar is **WCAG AAA (7:1) for text**, not AA.

| ID | T | Criterion | Req |
|---|---|---|---|
| LEG-01 | B | **Every text pair clears 7:1.** `fg.default`, `fg.muted` and `fg.subtle` on each surface they are used on | design §2.2 |
| LEG-02 | N | **Nothing renders below 15px**, counts, labels and page numbers included | design §2.3 |
| LEG-03 | B | Every row, button and filter chip is at least 56px tall; icon-only targets at least 48px | design §2.4 |
| LEG-04 | N | **Opacity is never used to de-emphasise text.** Lower emphasis comes from a lighter token that still clears 7:1 | design §2.5 |
| LEG-05 | N | No pair is distinguished by hue alone — anything meaningful also differs in lightness or weight | design §2.5 |
| LEG-06 | B | Card separation survives at full brightness outdoors: surfaces differ by more than a hairline border | design §2.5 |
| LEG-07 | B | `fg.subtle` and `action.primary` appear as text only on `bg.surface`, never on `bg.canvas` or `bg.sunken`, where they fall below 7:1 | design §2.2 |
| LEG-08 | B | At the OS's largest text setting the layout reflows without clipping or overlap | design §2.3 |
| LEG-09 | B | Dark mode holds the same 7:1 floor | design §2.6 |

**LEG-02 and LEG-04 are the two that were actually violated** before this pass: the old
scale bottomed out at 10px, and the Snack 2 card sat at 72% opacity.

---

## 10. Test architecture

No code until ordered. Intended shape:

| Level | Covers |
|---|---|
| **Unit** | Slot and role filtering, repeat-window exclusion, the season step on and off, the seeded pick, Snack 1 cycle maths, stoplist filtering, glossary resolution |
| **Integration** | History → generation → week structure; cadence check on open; cooked mark → history → next generation |
| **E2E** | NAV-03 state leak, DSH-03 tier-1 presentation, CAD-01 unprompted generation, OFF-01 cold offline start, LIF-02 and LIF-09 current-week freeze, ASN-01 search through to an assigned slot |
| **Manual** | Home-screen install on both platforms; whether a tier-1 dish *feels* complete rather than broken; LEG-06 and LEG-08 — brightness and OS text size cannot be checked in code |

**LIF-04 needs a clock-controlled test.** The Monday transition is driven by date
comparison on open, so it is tested by advancing a controllable date, not by waiting.

**VAR-03 needs a 60-day simulation**, not a live test — drive generation across 60
synthetic days and assert the cycle. The same approach covers VAR-01, VAR-02 and
VAR-06, which are all multi-week properties that no single-run test can see.

**Fixture requirement.** A small corpus of roughly 20 book recipes spanning 8 roles and
all four slots, including one tier-1-only, one with no Kannada name, one with an
unresolved ingredient, and one role holding a single recipe. Plus the full 60-entry
Snack 1 library, which is small enough to use whole and is the only way to test VAR-03
honestly.

---

## 11. Traceability

| Requirement | Tests |
|---|---|
| §3 The day | GEN-01 … GEN-07 |
| §3.1 Main meal cooked once | GEN-02 |
| §3.2 Snack slots | GEN-05, GEN-06, GEN-07, VAR-03, VAR-04 |
| §3.3 Composition by role | GEN-03 |
| §4.1 Variety | VAR-01 … VAR-06, VAR-09, GEN-08 |
| §4.1.1 Cooked marker | HST-01 … HST-04, HST-07, HST-08, HST-13 |
| §4.2 Seeded | GEN-09 … GEN-11, CAD-04 |
| §4.3 Weekly cadence | CAD-01 … CAD-10 |
| §4.5 Regenerate, both scopes | GEN-12, GEN-14 … GEN-17, LIF-01 … LIF-09, LIF-19 … LIF-23, NAV-05, NAV-06, DSH-09, DSH-10 |
| §4.5.1 Choosing a dish yourself | ASN-01 … ASN-10, DSH-10, DSH-11 |
| §4.7 Seasonality | GEN-18 … GEN-24, VAR-03, VAR-07, VAR-08, ASN-06 |
| §4.6 Plan is a suggestion | HST-07, HST-08, HST-09 |
| §5 Recipe depth | DSH-01 … DSH-06 |
| §7 Screens | SRC-01 … SRC-11, NAV-01, NAV-02 |
| §8 Not in v1 | DSH-07, NAV-01 |
| Others not previously indexed | DSH-08, HST-05, HST-06, HST-10 … HST-12, LIF-10 … LIF-18, NAV-03, NAV-04 |
| §11 Stack | OFF-01 … OFF-04 |
| `DESIGN.md` §2 Visual system | LEG-01 … LEG-09 |

**Uncovered by design:** §9 (next version), §10 (open questions), §12 (documents).
